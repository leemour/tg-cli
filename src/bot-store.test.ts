import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CliError, captureStreams, memoryKeyring } from "@wirecat/cli-core"
import { BotTokenStore } from "@wirecat/cli-messaging/cli"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TG } from "./app.js"
import type { Environment } from "./commands/context.js"
import { botSessionFile, sessionFile } from "./paths.js"
import { run } from "./program.js"
import type { BotHistoryOptions } from "./telegram/bot-history.js"
import { apiCredentials } from "./telegram/credentials.js"
import { message, scripted } from "./testing/scripted.js"

const CHAT = "-1000000000700"
const TOKEN = "900:synthetic"
const MESSAGES = Array.from({ length: 250 }, (_, index) =>
  message(String(index + 1), {
    chatId: CHAT,
    timestamp: new Date(Date.parse("2026-09-01T00:00:00Z") + index * 60_000).toISOString(),
  }),
)
let keyring: ReturnType<typeof memoryKeyring>
let env: NodeJS.ProcessEnv
let opened: BotHistoryOptions[]
let methods: string[]
const close = vi.fn(async () => {})

const history: NonNullable<Environment["botHistory"]> = async (options) => {
  opened.push(options)
  let start = options.from ? "250" : await options.newest(CHAT)
  return {
    close,
    historyBefore: async (_chat, { limit, before }) => {
      if (start === undefined) throw new CliError("validation_error", "give --from <message link>")
      const older = MESSAGES.filter((one) => Number(one.id) < Number(before ?? Number(start) + 1)).reverse()
      start ??= "250"
      return { items: older.slice(0, Math.min(100, limit)), hasMore: older.length > Math.min(100, limit) }
    },
  }
}

const tg = async (argv: string[], extra: Partial<Environment> = {}) => {
  const streams = captureStreams()
  const code = await run(argv, {
    streams,
    tty: false,
    env,
    keyring,
    botHistory: history,
    botFetch: async (url) => {
      const method = url.split("/").at(-1) ?? ""
      methods.push(method)
      if (method !== "getMe") throw new Error("unexpected Bot API write")
      return new Response(JSON.stringify({ ok: true, result: { id: 900, is_bot: true, first_name: "Synthetic" } }))
    },
    ...extra,
  })
  const out = streams.stdout.join("\n")
  return { code, answer: out ? JSON.parse(out) : undefined, out, err: streams.stderr.join("\n") }
}

beforeEach(() => {
  process.env.MESSAGING_STORE = join(mkdtempSync(join(tmpdir(), "tg-bot-fetch-")), "messages.db")
  env = { ...process.env, TG_API_ID: "1", TG_API_HASH: "synthetic" }
  keyring = memoryKeyring()
  opened = []
  methods = []
  close.mockClear()
  new BotTokenStore({ app: TG, profile: "sales", env, keyring }).write(TOKEN)
})

describe("tg bot store fetch", () => {
  it("**fetches and resumes without sending**, then answers offline from the bot's copy", async () => {
    const before = await tg(["sales", "bot", "sends", "list", "--json"])
    const first = await tg([
      "sales",
      "bot",
      "store",
      "fetch",
      CHAT,
      "--from",
      "https://t.me/c/700/250",
      "--limit",
      "120",
      "--page-size",
      "100",
      "--pause",
      "1ms",
      "--json",
    ])
    expect(first.code).toBe(0)
    expect(first.answer).toMatchObject({ fetched: 120, complete: false, chat: CHAT })
    expect(opened[0]).toMatchObject({
      from: "https://t.me/c/700/250",
      pauseMs: 1,
      sessionPath: botSessionFile("sales", "900", env),
    })
    expect(opened[0]?.sessionPath).not.toBe(sessionFile("sales", env))
    const second = await tg(["sales", "bot", "store", "fetch", CHAT, "--pause", "1ms", "--json"])
    expect(second.code).toBe(0)
    expect(second.answer).toMatchObject({ complete: true })
    const kept = await tg(["sales", "bot", "messages", "list", CHAT, "--offline", "--limit", "300", "--json"])
    expect(kept.answer.items).toHaveLength(250)
    expect((await tg(["sales", "bot", "sends", "list", "--json"])).answer).toEqual(before.answer)
    expect(methods).toEqual(["getMe"])
    expect(close).toHaveBeenCalledTimes(2)
    expect(opened).toHaveLength(2)
  })

  it("stops at --last and --since-time, and refuses them together or --offline", async () => {
    const args = ["sales", "bot", "store", "fetch", CHAT, "--from", "https://t.me/c/700/250", "--pause", "1ms"]
    expect((await tg([...args, "--last", "30", "--json"])).answer).toMatchObject({ reachedLast: true })
    expect((await tg([...args, "--since-time", MESSAGES[200]?.timestamp ?? "", "--json"])).answer).toMatchObject({
      reachedSince: true,
    })
    expect((await tg([...args, "--last", "30", "--since-time", "1d", "--json"])).code).toBe(2)
    expect((await tg([...args, "--offline", "--json"])).code).toBe(2)
    expect(opened).toHaveLength(2)
  })

  it("uses the existing default app credentials and personal newest, closing that session", async () => {
    delete env.TG_API_ID
    delete env.TG_API_HASH
    apiCredentials({ profile: "default", env, keyring }).write({ id: 1, hash: "synthetic" })
    const personalClose = vi.fn(async () => {})
    const personalHistory = vi.fn(async () => ({
      items: [MESSAGES.at(-1) ?? message("250", { chatId: CHAT })],
      hasMore: false,
    }))
    const adapter = vi.fn(() => scripted({ history: personalHistory, close: personalClose }))
    const result = await tg(["sales", "bot", "store", "fetch", CHAT, "--limit", "1", "--pause", "1ms", "--json"], {
      adapter,
    })
    expect(result.code).toBe(0)
    expect(result.answer.fetched).toBe(1)
    expect(personalHistory).toHaveBeenCalledWith(CHAT, { limit: 1 })
    expect(adapter).toHaveBeenCalledWith({
      credentials: { id: 1, hash: "synthetic" },
      sessionPath: sessionFile("default", env),
    })
    expect(personalClose).toHaveBeenCalledOnce()
  })

  it("asks for a link when neither account knows the newest, and closes the reader on failure", async () => {
    const failed = await tg(["sales", "bot", "store", "fetch", CHAT, "--json"])
    expect(failed.code).toBe(2)
    expect(failed.err).toContain("--from <message link>")
    expect(close).toHaveBeenCalledOnce()
    const personalClose = vi.fn(async () => {})
    const other = await tg(["sales", "bot", "store", "fetch", CHAT, "--json"], {
      adapter: () =>
        scripted({
          history: async () => {
            throw new CliError("permission_error", "not a member")
          },
          close: personalClose,
        }),
    })
    expect(other.code).toBe(2)
    expect(personalClose).toHaveBeenCalledOnce()
  })

  it("needs app credentials only for fetching, and preserves bot-profile credentials when present", async () => {
    delete env.TG_API_ID
    delete env.TG_API_HASH
    expect((await tg(["sales", "bot", "auth", "show", "--json"])).code).toBe(0)
    expect(opened).toEqual([])
    expect((await tg(["sales", "bot", "store", "fetch", CHAT, "--json"])).code).toBe(4)
    apiCredentials({ profile: "sales", env, keyring }).write({ id: 2, hash: "bot-app" })
    await tg(["sales", "bot", "store", "fetch", CHAT, "--from", "https://t.me/c/700/250", "--limit", "1", "--json"])
    expect(opened[0]?.credentials).toEqual({ id: 2, hash: "bot-app" })
  })

  it("closes a history connection that times out while logging in", async () => {
    const result = await tg(["sales", "bot", "store", "fetch", CHAT, "--timeout", "5ms", "--json"], {
      botHistory: async (options) => {
        options.track?.({ close })
        await new Promise<void>((resolve) => options.stop?.addEventListener("abort", () => resolve(), { once: true }))
        throw new CliError("cancelled", "synthetic login stopped")
      },
    })
    expect(result.code).not.toBe(0)
    expect(close).toHaveBeenCalledOnce()
  })
})
