import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { CliError, captureStreams, memoryKeyring } from "@wirecat/cli-core"
import { listRuns, runsDirFor, startRun } from "@wirecat/cli-messaging/cli"
import { describe, expect, it } from "vitest"
import { TG } from "./app.js"
import type { Adapter } from "./commands/context.js"
import { run } from "./program.js"
import { scripted } from "./testing/scripted.js"

const BODY = "the door code is 4321"

const tg = async (argv: string[], overrides: Partial<Adapter> = {}) => {
  const streams = captureStreams()
  const code = await run(argv, {
    streams,
    tty: false,
    keyring: memoryKeyring(),
    env: { ...process.env, TG_API_ID: "1", TG_API_HASH: "h" },
    adapter: () => scripted(overrides),
  })
  return { code, stdout: streams.stdout, stderr: streams.stderr }
}

const runsOf = (profile: string) => listRuns(runsDirFor(TG)).filter((one) => one.profile === profile)

const keptFor = (profile: string): string => {
  const dir = runsDirFor(TG)
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"))
    .filter((text) => text.includes(`"profile":"${profile}"`) || text.includes(`"profile": "${profile}"`))
    .join("\n")
}

describe("run records", () => {
  it("**keep a send's ids and never the chat's title or the text**", async () => {
    const { code, stdout } = await tg(["recorded", "messages", "send", "Valencia", BODY, "--record", "--json"])

    expect(code).toBe(0)
    expect(stdout).toHaveLength(1)
    expect(runsOf("recorded")[0]).toMatchObject({ command: "messages send", status: "success", requests: 2 })
    const kept = keptFor("recorded")
    expect(kept).toContain('"operation":"messages.send"')
    expect(kept).toContain('"chat":"-1001234567890"')
    expect(kept).not.toContain("Valencia")
    expect(kept).not.toContain(BODY)
  })

  it("keep a failed read with Telegram's name for the refusal", async () => {
    const { code } = await tg(["failing", "chats", "list"], {
      chats: async () => {
        throw new CliError("provider_error", "Telegram refused: CHAT_ADMIN_REQUIRED", {
          providerError: "CHAT_ADMIN_REQUIRED",
        })
      },
    })

    expect(code).toBe(11)
    expect(runsOf("failing")).toHaveLength(1)
    expect(runsOf("failing")[0]).toMatchObject({
      status: "failed",
      errorCode: "provider_error",
      providerError: "CHAT_ADMIN_REQUIRED",
      keptBecauseFailed: true,
    })
  })

  it("keep a usage error, naming the command and never what was typed", async () => {
    const { code } = await tg(["usage", "messages", "send", "Valencia", BODY, "--no-such-flag"])

    expect(code).not.toBe(0)
    expect(runsOf("usage")).toHaveLength(1)
    expect(runsOf("usage")[0]).toMatchObject({ command: "messages send", errorCode: "validation_error" })
    expect(keptFor("usage")).not.toContain(BODY)
  })

  it("are listed by `tg runs list` without it starting a run of its own", async () => {
    await tg(["listed", "account", "show", "--record"])
    const before = listRuns(runsDirFor(TG)).length

    const { code, stdout } = await tg(["runs", "list", "--json"])

    expect(code).toBe(0)
    expect(JSON.parse(stdout[0] ?? "").items.some((one: { profile: string }) => one.profile === "listed")).toBe(true)
    expect(listRuns(runsDirFor(TG))).toHaveLength(before)
  })
  it("searches partial failure IDs with filters without connecting or recording itself", async () => {
    const dir = runsDirFor(TG)
    const recorded = startRun({
      runsDir: dir,
      profile: "search-fixture",
      command: "messages download",
      cliVersion: TG.version,
    })
    recorded.logger.info({
      event: "response",
      operation: "messages.download",
      errorCode: "rate_limited",
      ids: { message: "50" },
    })
    await recorded.finish("partial", {
      partial: { failed: 1, failures: [{ id: "50", stage: "download", errorCode: "rate_limited" }] },
    })
    const before = listRuns(dir).length
    const { code, stdout, stderr } = await tg([
      "runs",
      "search",
      "50",
      "--status",
      "partial",
      "--error-code",
      "rate_limited",
      "--operation",
      "messages.download",
      "--profile",
      "search-fixture",
      "--since-time",
      "2020-01-01",
      "--limit",
      "1",
      "--page",
      "1",
      "--json",
    ])
    expect(code).toBe(0)
    expect(JSON.parse(stdout[0] ?? "").items).toMatchObject([
      { profile: "search-fixture", status: "partial", partial: { failed: 1 } },
    ])
    expect(stderr).toEqual([])
    expect(listRuns(dir)).toHaveLength(before)
  })
})
