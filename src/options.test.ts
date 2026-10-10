import { mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CliError } from "@wirecat/cli-core"
import type { MessageEvent } from "@wirecat/cli-messaging"
import { describe, expect, it } from "vitest"
import { NO_RESTART_ON } from "./program.js"
import { chat, dialog, message, scripted, tg } from "./testing/scripted.js"
import { VERSION } from "./version.js"

const json = (stdout: string[]) => JSON.parse(stdout[0] ?? "")
const env = (fields: Record<string, string> = {}) => ({ ...process.env, TG_API_ID: "1", TG_API_HASH: "h", ...fields })

describe("the global options", () => {
  it("--version prints the version on stdout and nothing else", async () => {
    const { code, stdout, stderr } = await tg(["--version"])

    expect(code).toBe(0)
    expect(stdout).toEqual([VERSION])
    expect(stderr).toEqual([])
  })

  it("--jsonl prints one JSON object per message, where --json prints one value", async () => {
    const now = new Date().toISOString()
    const unread = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: now }], hasMore: false }),
      history: async () => ({
        items: [message("1", { timestamp: now }), message("2", { timestamp: now })],
        hasMore: false,
      }),
    })
    const lines = await tg(["inbox", "--since-time", "1h", "--jsonl"], { adapter: () => unread })
    const value = await tg(["inbox", "--since-time", "1h", "--json"], { adapter: () => unread })

    expect(lines.stdout.map((line) => JSON.parse(line).id)).toEqual(["1", "2"])
    expect(value.stdout).toHaveLength(1)
  })

  it("--verbose shows the ids a person does not see by default", async () => {
    const plain = await tg(["messages", "list", "Valencia"], { tty: true })
    const verbose = await tg(["messages", "list", "Valencia", "--verbose"], { tty: true })

    expect(plain.stdout.join("\n")).not.toContain(chat.id)
    expect(verbose.stdout.join("\n")).toContain(chat.id)
  })

  it("--quiet turns the diagnostics off", async () => {
    const said = await tg(["quiet", "runs", "list"])
    const quiet = await tg(["quiet", "runs", "list", "--quiet"])

    expect(said.stderr.join("\n")).toContain("nothing recorded")
    expect(quiet.stderr).toEqual([])
  })

  it("--fields keeps only the named fields, and the input and output bounds hold", async () => {
    const projected = await tg(["chats", "list", "--fields", "items.id", "--no-input", "--json"])
    expect(projected.code).toBe(0)
    expect(Object.keys(json(projected.stdout).items[0])).toEqual(["id"])

    const bounded = await tg(["chats", "list", "--max-output-bytes", "10", "--max-input-bytes", "1024", "--json"])
    expect(bounded.code).not.toBe(0)
    expect(bounded.stdout).toEqual([])
  })

  it("--trace shows each request as it happens, on stderr, and keeps stdout to the data", async () => {
    const { code, stdout, stderr } = await tg(["chats", "list", "--trace", "--json"])

    expect(code).toBe(0)
    expect(json(stdout).items).toHaveLength(1)
    expect(stderr.map((line) => JSON.parse(line).event)).toContain("request")
  })

  it("**serve exits 4 on a revoked login**, a code its unit does not restart on", async () => {
    const revoked = scripted({
      watch: async () => {
        throw new CliError("authentication_error", "not logged in, or the session was ended — run `tg session start`")
      },
    })
    const { code, stderr } = await tg(["serve"], { adapter: () => revoked })

    expect(code).toBe(4)
    expect(NO_RESTART_ON).toContain(code)
    expect(stderr.join("\n")).toContain("tg session start")
  })

  it("--timeout ends a watch normally, exit 0", async () => {
    const silent = scripted({
      watch: (_onEvent, signal) => new Promise((resolve) => signal.addEventListener("abort", () => resolve())),
    })
    const { code, stdout } = await tg(["watch", "--jsonl", "--timeout", "20ms"], { adapter: () => silent })

    expect(code).toBe(0)
    expect(stdout).toEqual([])
  })

  it("--no-record keeps no run even of a failure", async () => {
    const failing = scripted({
      me: async () => {
        throw new Error("synthetic failure")
      },
    })
    await tg(["unkept", "account", "show", "--no-record"], { adapter: () => failing })
    await tg(["kept", "account", "show"], { adapter: () => failing })

    const profiles = json((await tg(["runs", "list", "--json"])).stdout).items.map(
      (run: { profile: string }) => run.profile,
    )
    expect(profiles).toContain("kept")
    expect(profiles).not.toContain("unkept")
  })
})

describe("chats list", () => {
  it("--search, --kind and --unread combine over the newest chats", async () => {
    const chats = scripted({
      chats: async () => ({
        items: [
          chat,
          { ...chat, id: "2", title: "Valeting crew", unreadCount: 0 },
          dialog("3", "Valeria", chat.lastMessageAt ?? ""),
        ],
        hasMore: false,
      }),
    })

    const { code, stdout } = await tg(["chats", "list", "--search", "vale", "--kind", "group", "--unread", "--json"], {
      adapter: () => chats,
    })

    expect(code).toBe(0)
    expect(json(stdout).items.map((one: { id: string }) => one.id)).toEqual([chat.id])
  })
})

describe("chats events", () => {
  it("--since-time and --type pass the moment on and keep only the events named", async () => {
    let since = 0
    const events = scripted({
      chatEvents: async (_chat, window) => {
        since = window.since
        return {
          chatId: chat.id,
          since: new Date(window.since).toISOString(),
          more: false,
          events: [
            {
              messageId: "1",
              timestamp: chat.lastMessageAt ?? "",
              event: "join",
              by: { id: "7", name: null },
              people: [],
            },
            {
              messageId: "2",
              timestamp: chat.lastMessageAt ?? "",
              event: "pin",
              by: { id: "7", name: null },
              people: [],
            },
          ],
        }
      },
    })

    const { code, stdout } = await tg(
      ["chats", "events", "Valencia", "--since-time", "2026-09-20T00:00:00Z", "--type", "join", "--json"],
      { adapter: () => events },
    )

    expect(code).toBe(0)
    expect(since).toBe(Date.parse("2026-09-20T00:00:00Z"))
    expect(json(stdout).items.map((one: { event: string }) => one.event)).toEqual(["join"])
  })
})

describe("topics", () => {
  const forum = () => {
    const asked: unknown[] = []
    const adapter = scripted({
      topics: async (_chat, window) => {
        asked.push(window)
        const topic = {
          id: "4",
          title: "Pisos",
          closed: false,
          pinned: false,
          unreadCount: 0,
          lastMessageAt: null,
          createdAt: null,
        }
        return { items: [topic], hasMore: false }
      },
    })
    return { adapter, asked }
  }

  it("list and search page like every listing: --limit, --page, --all", async () => {
    const { adapter, asked } = forum()
    for (const argv of [
      ["topics", "list", "Valencia", "--limit", "2", "--page", "2", "--json"],
      ["topics", "list", "Valencia", "--all", "--json"],
      ["search", "topics", "Valencia", "pisos", "--limit", "2", "--page", "3", "--json"],
      ["search", "topics", "Valencia", "pisos", "--all", "--json"],
    ]) {
      expect((await tg(argv, { adapter: () => adapter })).code).toBe(0)
    }

    expect(asked).toEqual([
      { limit: 2, offset: 2 },
      { offset: 0 },
      { limit: 2, offset: 4, search: "pisos" },
      { offset: 0, search: "pisos" },
    ])
  })
})

describe("messages comments", () => {
  it("pages a post's comments with --limit and --before-id", async () => {
    const asked: unknown[] = []
    const adapter = scripted({
      discussionOf: async () => ({ chatId: "-1002", messageId: "900" }),
      comments: async (_channel, _post, options) => {
        asked.push(options)
        return { items: [message("905", { chatId: "-1002" })], hasMore: true }
      },
    })
    const read = await tg(["messages", "comments", chat.id, "42", "--limit", "1", "--before-id", "950", "--json"], {
      adapter: () => adapter,
    })

    expect(read.code).toBe(0)
    expect(json(read.stdout)).toMatchObject({ discussion: { chatId: "-1002", messageId: "900" }, hasMore: true })
    expect(asked).toEqual([{ limit: 1, before: "950" }])
  })
})

describe("contacts profile", () => {
  const described = scripted({
    profile: async () => ({
      id: "7",
      name: "Zoe",
      usernames: ["zoe"],
      bio: null,
      phone: "0123",
      flags: { bot: false, scam: false },
      seen: "week",
      registered: { at: "2015-07-01T00:00:00.000Z", source: "estimate", precision: "month" },
      chats: [{ id: "7", title: "Zoe", kind: "dialog", lastMessageAt: "2026-09-27T10:00:00.000Z" }],
    }),
  })

  it("shows the phone's last four digits unless --show-phone", async () => {
    const masked = json((await tg(["contacts", "profile", "7", "--json"], { adapter: () => described })).stdout)
    const whole = json(
      (await tg(["contacts", "profile", "7", "--show-phone", "--json"], { adapter: () => described })).stdout,
    )

    expect(masked).toMatchObject({ phone: "***0123", seen: "week", registered: { source: "estimate" } })
    expect(masked.chats).toMatchObject([{ id: "7", theirMessages: 0 }])
    expect(whole.phone).toBe("0123")
  })

  it("lists a name the store saw them with before as an alias", async () => {
    const said = (name: string) =>
      scripted({
        history: async () => ({ items: [message("42", { senderId: "7", senderName: name })], hasMore: false }),
      })
    await tg(["messages", "list", chat.id, "--json"], { adapter: () => said("Zoe Old") })
    await tg(["messages", "list", chat.id, "--json"], { adapter: () => said("Zoe") })

    const shown = json((await tg(["contacts", "profile", "7", "--json"], { adapter: () => described })).stdout)

    expect(shown.aliases).toMatchObject([{ name: "Zoe Old", source: "profile" }])
  })
})

describe("contacts list", () => {
  const people = scripted({
    chats: async () => ({
      items: [dialog("7", "Zoe", "2026-09-27T10:00:00.000Z"), dialog("8", "Ana", "2026-09-20T10:00:00.000Z"), chat],
      hasMore: false,
    }),
  })
  const names = async (...options: string[]) => {
    const { stdout } = await tg(["contacts", "list", "--json", ...options], { adapter: () => people })
    return json(stdout).items.map((person: { name: string }) => person.name)
  }

  it("lists the people of one-to-one chats, newest first or by name", async () => {
    expect(await names()).toEqual(["Zoe", "Ana"])
    expect(await names("--order", "name")).toEqual(["Ana", "Zoe"])
    expect((await tg(["contacts", "list", "--order", "age"], { adapter: () => people })).code).toBe(2)
  })

  it("finds by part of a name, and pages", async () => {
    expect(await names("--search", "zo")).toEqual(["Zoe"])
    expect(await names("--limit", "1", "--page", "2")).toEqual(["Ana"])
    expect(await names("--limit", "1", "--all")).toEqual(["Zoe", "Ana"])
  })
})

describe("messages", () => {
  it("pin --notify tells the chat, a pin without it is quiet", async () => {
    const asked: boolean[] = []
    const adapter = scripted({
      pin: async (_chat, _message, { notify }) => {
        asked.push(notify)
      },
    })

    for (const argv of [["--notify"], []]) {
      expect((await tg(["messages", "pin", "Valencia", "42", ...argv], { adapter: () => adapter })).code).toBe(0)
    }
    expect(asked).toEqual([true, false])
  })

  it("list asks Telegram for that many, older than a message", async () => {
    let asked: unknown
    const adapter = scripted({
      history: async (_chat, window) => {
        asked = window
        return { items: [message("39")], hasMore: true }
      },
    })
    const { code } = await tg(["messages", "list", "Valencia", "--limit", "5", "--before-id", "40"], {
      adapter: () => adapter,
    })

    expect(code).toBe(0)
    expect(asked).toEqual({ limit: 5, before: "40" })
  })

  it("list --after-id reads forward from a message id", async () => {
    let asked: unknown
    const forward = scripted({
      historyAfter: async (_chat, window) => {
        asked = window
        return { items: [message("51")], hasMore: false }
      },
    })

    const { code, stdout } = await tg(["messages", "list", "Valencia", "--after-id", "50", "--json"], {
      adapter: () => forward,
    })

    expect(code).toBe(0)
    expect(asked).toMatchObject({ after: { id: "50" } })
    expect(json(stdout).items.map((one: { id: string }) => one.id)).toEqual(["51"])
  })

  it("list --after-time reads forward from a moment", async () => {
    let asked: unknown
    const forward = scripted({
      historyAfter: async (_chat, window) => {
        asked = window
        return { items: [message("51")], hasMore: false }
      },
    })

    const { code } = await tg(["messages", "list", "Valencia", "--after-time", "2026-09-20T00:00:00Z", "--json"], {
      adapter: () => forward,
    })

    expect(code).toBe(0)
    expect(asked).toMatchObject({ after: { time: Date.parse("2026-09-20T00:00:00Z") } })
  })

  it("list --before-time reads back from a moment", async () => {
    let asked: unknown
    const back = scripted({
      historyBefore: async (_chat, window) => {
        asked = window
        return { items: [message("49")], hasMore: false }
      },
    })

    const { code } = await tg(["messages", "list", "Valencia", "--before-time", "2026-09-27T10:00:00Z", "--json"], {
      adapter: () => back,
    })

    expect(code).toBe(0)
    expect(asked).toMatchObject({ time: Date.parse("2026-09-27T10:00:00Z") })
  })

  it("context asks for that many either side of the message", async () => {
    let asked: unknown
    const adapter = scripted({
      around: async (_chat, id, window) => {
        asked = { id, ...window }
        return [message(id, { anchor: true } as never)]
      },
    })
    await tg(["messages", "context", "Valencia", "42", "--before-n", "2", "--after-n", "3"], { adapter: () => adapter })

    expect(asked).toEqual({ id: "42", before: 2, after: 3 })
  })

  it("contacts context --chat reads one person's newest by sender with --refresh, short unless -v", async () => {
    const said = (id: string) =>
      message(id, { senderId: "778", senderName: "Bea", timestamp: `2026-09-26T10:0${id}:00.000Z` })
    const asked: string[] = []
    const adapter = scripted({
      history: async () => ({ items: [said("1")], hasMore: false }),
      historyFrom: async (reference: string, person: string, { limit }: { limit: number }) => {
        asked.push(`${reference}:${person}:${limit}`)
        return { items: [said("2"), said("3")], hasMore: false }
      },
    } as never)
    await tg(["messages", "list", "Valencia"], { adapter: () => adapter })

    const short = await tg(
      ["contacts", "context", "778", "--chat", "Valencia", "--limit", "2", "--refresh", "--json"],
      {
        adapter: () => adapter,
      },
    )
    const detailed = await tg(["contacts", "context", "778", "--chat", "-1001234567890", "-v", "--json"], {
      adapter: () => adapter,
    })

    expect(short.code, short.stderr.join("")).toBe(0)
    expect(asked).toEqual(["-1001234567890:778:2"])
    expect(JSON.parse(short.stdout[0] ?? "null").chats[0].messages).toEqual([
      { at: "2026-09-26T10:02:00.000Z", text: "synthetic text 2" },
      { at: "2026-09-26T10:03:00.000Z", text: "synthetic text 3" },
    ])
    expect(detailed.code, detailed.stderr.join("")).toBe(0)
    expect(JSON.parse(detailed.stdout[0] ?? "null").chats[0].messages[0]).toHaveProperty("locator")
  })

  it("contacts timeline reads one person's stored messages within --scope, the time range and --limit", async () => {
    const said = (id: string) =>
      message(id, { senderId: "778", senderName: "Bea", timestamp: `2026-09-26T10:0${id}:00.000Z` })
    const adapter = scripted({
      history: async () => ({ items: [said("1"), said("2"), said("3")], hasMore: false }),
    })
    await tg(["messages", "list", "Valencia"], { adapter: () => adapter })

    const found = await tg(
      [
        "contacts",
        "timeline",
        "778",
        "--scope",
        "personal",
        "--since-time",
        "2026-09-26T10:01:30Z",
        "--until-time",
        "2026-09-26T10:05:00Z",
        "--limit",
        "1",
        "--json",
      ],
      { adapter: () => adapter },
    )

    expect(found.code, found.stderr.join("")).toBe(0)
    const timeline = JSON.parse(found.stdout[0] ?? "null")
    expect(timeline.items.map(({ locator }: { locator: string }) => locator)).toEqual([
      "msg:telegram/1/-1001234567890/3",
    ])
    expect(timeline).toMatchObject({ hasMore: true, items: [{ role: "sender", scope: "personal" }] })
  })

  it("download saves the message's file into --output-dir and answers its path", async () => {
    const into = join(mkdtempSync(join(tmpdir(), "tg-download-")), "out")
    const adapter = scripted({
      download: async () => ({
        files: [
          {
            kind: "voice",
            mime: "audio/ogg",
            async *bytes() {
              yield new TextEncoder().encode("opus")
            },
          },
        ],
        skipped: [],
      }),
    })
    const { code, stdout } = await tg(["messages", "download", "Valencia", "42", "--output-dir", into, "--json"], {
      adapter: () => adapter,
    })

    expect(code).toBe(0)
    expect(json(stdout).items).toEqual([{ kind: "voice", path: join(into, "42-1.ogg"), bytes: 4 }])
    expect(readFileSync(join(into, "42-1.ogg"), "utf8")).toBe("opus")
  })

  it("download --all saves every file of the chat and keeps where it got to, for the next run", async () => {
    const into = join(mkdtempSync(join(tmpdir(), "tg-download-")), "out")
    const adapter = scripted({
      history: async () => ({
        items: [
          message("43", { attachments: [{ kind: "photo" }] }),
          message("42", { attachments: [{ kind: "webpage" }] }),
        ],
        hasMore: false,
      }),
      download: async () => ({
        files: [
          {
            kind: "photo",
            async *bytes() {
              yield new TextEncoder().encode("jpeg")
            },
          },
        ],
        skipped: [],
      }),
    })
    const { code, stdout } = await tg(
      ["messages", "download", "Valencia", "--all", "--pause", "1ms", "--output-dir", into, "--json"],
      { adapter: () => adapter },
    )

    expect(code).toBe(0)
    expect(json(stdout)).toMatchObject({ items: [{ path: join(into, "43-1.jpg") }], saved: 1, complete: true })
    expect(readdirSync(into, { withFileTypes: true }).filter((one) => one.name.startsWith(".download-"))).toHaveLength(
      1,
    )
  })

  it("list --transcribe hears the chat's voice messages, and a later list shows them without asking", async () => {
    let asked = 0
    const voiced = scripted({
      history: async () => ({ items: [message("74", { attachments: [{ kind: "voice" }] })], hasMore: false }),
      transcribe: async () => {
        asked++
        return { text: "adiós", pending: false }
      },
    })
    const heard = json(
      (await tg(["messages", "list", "Valencia", "--transcribe", "--json"], { adapter: () => voiced })).stdout,
    )
    const later = json((await tg(["messages", "list", "Valencia", "--json"], { adapter: () => voiced })).stdout)

    expect(heard.items[0].transcript).toBe("adiós")
    expect(later.items[0].transcript).toBe("adiós")
    expect(asked).toBe(1)
  })

  it("list --model hears on this machine, never asks Telegram, and is refused without --transcribe", async () => {
    let asked = 0
    const voiced = scripted({
      history: async () => ({ items: [message("75", { attachments: [{ kind: "voice" }] })], hasMore: false }),
      transcribe: async () => {
        asked++
        return { text: "hola", pending: false }
      },
    })
    const picked = await tg(["messages", "list", "Valencia", "--transcribe", "--model", "gigaam-v3", "--json"], {
      adapter: () => voiced,
    })
    const alone = await tg(["messages", "list", "Valencia", "--model", "gigaam-v3"], { adapter: () => voiced })

    expect(json(picked.stdout).unheard).toMatchObject([{ messageId: "75" }])
    expect(asked).toBe(0)
    expect(alone.code).toBe(2)
  })

  it("list marks the chat read only with --mark-read, up to the newest message shown", async () => {
    const marked: unknown[] = []
    const reading = scripted({
      history: async () => ({ items: [message("76"), message("77")], hasMore: false }),
      markRead: async (chatId, until) => {
        marked.push([chatId, until])
      },
    })
    await tg(["messages", "list", "Valencia", "--json"], { adapter: () => reading })
    expect(marked).toEqual([])

    const { stdout } = await tg(["messages", "list", "Valencia", "--mark-read", "--json"], { adapter: () => reading })

    expect(marked).toEqual([[chat.id, "77"]])
    expect(json(stdout).markedRead).toMatchObject({ until: "77" })
  })

  it("transcribe answers a voice message's text", async () => {
    const adapter = scripted({ transcribe: async () => ({ text: "hola", pending: false }) })
    const { code, stdout } = await tg(["messages", "transcribe", "Valencia", "42", "--json"], {
      adapter: () => adapter,
    })

    expect(code).toBe(0)
    expect(json(stdout)).toEqual({ messageId: "42", text: "hola", pending: false, via: "telegram" })
  })

  it("**models audio list puts Parakeet first**, and transcribe --local or --model names the download instead of connecting", async () => {
    const cache = mkdtempSync(join(tmpdir(), "tg-models-"))
    const environment = {
      env: { ...process.env, TG_API_ID: "1", TG_API_HASH: "h", CLI_COMMON_CACHE_DIR: cache },
      adapter: () => {
        throw new Error("a missing model must not cost a connection")
      },
    }
    const listed = await tg(["models", "audio", "list", "--json"], environment)
    const local = await tg(["messages", "transcribe", "Valencia", "42", "--local"], environment)
    const model = await tg(["messages", "transcribe", "Valencia", "42", "--model", "gigaam-v3"], environment)
    const unknown = await tg(["models", "audio", "download", "whisper"], environment)

    expect(json(listed.stdout).items[0]).toMatchObject({ id: "parakeet-v3", default: true, downloaded: false })
    expect(local.stderr.join("")).toContain("tg models audio download parakeet-v3")
    expect(model.stderr.join("")).toContain("tg models audio download gigaam-v3")
    expect(unknown.stderr.join("")).toContain("whisper")
  })

  it("send --reply-to repeats a send with the --send-id it is given, and answers the message", async () => {
    let asked: unknown
    const adapter = scripted({
      send: async (chatId, text, options) => {
        asked = { chatId, text, ...options }
        return { message: message("43", { text, outgoing: true }), sendId: options.sendId }
      },
    })
    const { code, stdout } = await tg(
      ["messages", "send", "Valencia", "hola", "--reply-to", "42", "--send-id", "987654321", "--json"],
      {
        adapter: () => adapter,
      },
    )

    expect(code).toBe(0)
    expect(asked).toEqual({ chatId: chat.id, text: "hola", sendId: "987654321", replyTo: "42" })
    expect(json(stdout).sendId).toBe("987654321")
  })

  it("send carries --silent, --no-preview and --md to the adapter", async () => {
    let asked: unknown
    const adapter = scripted({
      send: async (_chatId, text, options) => {
        asked = options
        return { message: message("44", { text, outgoing: true }), sendId: options.sendId }
      },
    })
    const argv = ["messages", "send", "Valencia", "**hola**", "--silent", "--no-preview", "--md", "--json"]
    const { code } = await tg(argv, { adapter: () => adapter })

    expect(code).toBe(0)
    expect(asked).toMatchObject({ silent: true, noPreview: true, formatting: [expect.anything()] })
  })

  it("search finds what an earlier read kept, within one chat and up to --limit", async () => {
    const reads = scripted({
      history: async () => ({
        items: [message("61", { text: "piso en Ruzafa" }), message("62", { text: "otro piso" })],
        hasMore: false,
      }),
    })
    await tg(["searching", "messages", "list", "Valencia"], { adapter: () => reads })

    const { code, stdout } = await tg(
      [
        "searching",
        "search",
        "messages",
        "piso",
        "--language",
        "lucene",
        "--timezone",
        "Europe/Madrid",
        "--chat",
        "Valencia",
        "--limit",
        "1",
        "--json",
      ],
      { adapter: () => reads },
    )

    expect(code).toBe(0)
    expect(json(stdout).items).toHaveLength(1)
    expect(json(stdout).items[0].text).toContain("piso")
    expect(json(stdout).query).toMatchObject({ language: "lucene-v1", timezone: "Europe/Madrid" })
    const legacy = await tg(["searching", "search", "messages", "pis", "--language", "legacy", "--json"], {
      adapter: () => reads,
    })
    expect(legacy.code).toBe(0)
    expect(json(legacy.stdout).items).toHaveLength(2)
  })

  it("search --newest --context --source orders by time, shows neighbours and reads only telegram accounts", async () => {
    const reads = scripted({
      history: async () => ({
        items: [
          message("71", { text: "atico en Ruzafa" }),
          message("72", { text: "hola" }),
          message("73", { text: "otro atico" }),
        ],
        hasMore: false,
      }),
    })
    await tg(["searching", "messages", "list", "Valencia"], { adapter: () => reads })

    const argv = ["searching", "search", "messages", "atico", "--newest", "--context", "1", "--source", "telegram"]
    const { code, stdout } = await tg([...argv, "--json"], { adapter: () => reads })

    const { items } = json(stdout)
    expect(code).toBe(0)
    expect(items.map((hit: { id: string }) => hit.id)).toEqual(["73", "71"])
    expect(items[0].context.map((neighbour: { id: string }) => neighbour.id)).toContain("72")
    expect(items.every((hit: { locator: string }) => hit.locator.startsWith("msg:telegram/"))).toBe(true)
  })
})

describe("chats members", () => {
  it("show explains a member list that omits this account while keeping the provider counts", async () => {
    const members = [
      { id: "7", name: "Ana", username: null },
      { id: "8", name: "Eva", username: null },
    ]
    const adapter = scripted({ chat: async () => ({ ...chat, participantsCount: 3, members }) })
    const shown = await tg(["chats", "show", "Valencia", "--json"], { adapter: () => adapter })

    expect(shown.code).toBe(0)
    expect(json(shown.stdout)).toMatchObject({ participantsCount: 3, members })
    expect(shown.stderr.join("\n")).toContain("2 listed members; the chat reports 3 participants")
    expect(shown.stderr.join("\n")).toContain("may omit your account or be partial")
  })

  it("list pages with --limit and --page, and --all asks for everyone", async () => {
    const asked: unknown[] = []
    const adapter = scripted({
      members: async (_chat, window) => {
        asked.push(window)
        return { items: [{ id: "7", name: "Ana", username: null }], hasMore: false, chatId: chat.id }
      },
    })

    const paged = await tg(["chats", "members", "list", "Valencia", "--limit", "5", "--page", "2", "--json"], {
      adapter: () => adapter,
    })
    const all = await tg(["chats", "members", "list", "Valencia", "--all", "--json"], { adapter: () => adapter })

    expect([paged.code, all.code]).toEqual([0, 0])
    expect(asked).toEqual([{ limit: 5, offset: 5 }, { offset: 0 }])
  })
})

describe("inbox", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
  const [earlier, latest] = [ago(120_000), ago(60_000)]
  const unread = scripted({
    chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
    history: async (_chat, { limit }) => ({
      items: [message("70", { timestamp: earlier }), message("71", { timestamp: latest })].slice(-limit),
      hasMore: false,
    }),
  })

  it("--since-time shows what arrived after that time, at most --limit per chat", async () => {
    const { code, stdout } = await tg(["inbox", "--since-time", "1h", "--limit", "1", "--json"], {
      adapter: () => unread,
    })

    expect(code).toBe(0)
    const answer = json(stdout)
    expect(answer.chats.flatMap((one: { messages: unknown[] }) => one.messages)).toHaveLength(1)
  })

  it("--kind keeps those kinds, and --mark-read marks the chats shown read, --no-mark-read never", async () => {
    const marks: string[] = []
    const marking = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
      history: async () => ({ items: [message("71", { timestamp: latest })], hasMore: false }),
      markRead: async (chatId) => {
        marks.push(chatId)
      },
    })
    const other = chat.kind === "channel" ? "dialog" : "channel"

    const none = json(
      (await tg(["inbox", "--since-time", "1h", "--kind", other, "--json"], { adapter: () => marking })).stdout,
    )
    await tg(["inbox", "--since-time", "1h", "--no-mark-read", "--json"], { adapter: () => marking })
    expect(marks).toEqual([])
    const marked = json(
      (await tg(["inbox", "--since-time", "1h", "--mark-read", "--json"], { adapter: () => marking })).stdout,
    )

    expect(none.chats).toEqual([])
    expect(marked.markedRead).toHaveLength(1)
    expect(marks).toEqual([chat.id])
  })

  it("review --new reads each chat once, by --kind, and marks read only when asked", async () => {
    const marks: string[] = []
    const marking = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
      history: async () => ({ items: [message("71", { timestamp: latest })], hasMore: false }),
      markRead: async (chatId) => {
        marks.push(chatId)
      },
    })
    const other = chat.kind === "channel" ? "dialog" : "channel"

    const none = json(
      (await tg(["review", "--new", "--kind", other, "--no-mark-read", "--json"], { adapter: () => marking })).stdout,
    )
    const first = json((await tg(["review", "--new", "--mark-read", "--json"], { adapter: () => marking })).stdout)
    const second = json((await tg(["review", "--new", "--json"], { adapter: () => marking })).stdout)

    expect(none.chats).toEqual([])
    expect(first.chats).toHaveLength(1)
    expect(second.chats).toEqual([])
    expect(marks).toEqual([chat.id])
  })

  it("--transcribe hears the voice messages it shows", async () => {
    const voiced = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
      history: async () => ({
        items: [message("73", { timestamp: latest, attachments: [{ kind: "voice", mime: "audio/ogg" }] })],
        hasMore: false,
      }),
      transcribe: async () => ({ text: "hola", pending: false }),
    })
    const answer = json(
      (await tg(["inbox", "--since-time", "1h", "--transcribe", "--json"], { adapter: () => voiced })).stdout,
    )

    expect(answer.chats[0].messages[0].transcript).toBe("hola")
    expect(answer.unheard).toEqual([])
  })

  it("--model beside --transcribe hears on this machine, never asks Telegram", async () => {
    let asked = 0
    const voiced = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
      history: async () => ({
        items: [message("78", { timestamp: latest, attachments: [{ kind: "voice", mime: "audio/ogg" }] })],
        hasMore: false,
      }),
      transcribe: async () => {
        asked++
        return { text: "hola", pending: false }
      },
    })
    const { stdout } = await tg(["inbox", "--since-time", "1h", "--transcribe", "--model", "gigaam-v3", "--json"], {
      adapter: () => voiced,
    })

    expect(json(stdout).unheard).toMatchObject([{ messageId: "78" }])
    expect(asked).toBe(0)
  })

  it("--all takes in the muted chats it otherwise leaves out", async () => {
    const muted = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest, muted: true }], hasMore: false }),
      history: async () => ({ items: [message("72", { timestamp: latest })], hasMore: false }),
    })
    const quiet = json((await tg(["inbox", "--since-time", "1h", "--json"], { adapter: () => muted })).stdout)
    const all = json((await tg(["inbox", "--since-time", "1h", "--all", "--json"], { adapter: () => muted })).stdout)

    expect([quiet.chats, quiet.quiet]).toEqual([[], 1])
    expect(all.chats).toHaveLength(1)
  })

  it("--new starts the next check where this one ended", async () => {
    const first = json((await tg(["checking", "inbox", "--new", "--json"], { adapter: () => unread })).stdout)
    const second = json((await tg(["checking", "inbox", "--new", "--json"], { adapter: () => unread })).stdout)

    expect(first.until).toBeDefined()
    expect(second.since).toBe(first.until)
  })
})

describe("review", () => {
  const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
  const [asked, latest] = [ago(30), ago(1)]
  const reviewed = scripted({
    chats: async () => ({ items: [{ ...chat, lastMessageAt: latest, muted: true }], hasMore: false }),
    history: async () => ({
      items: [message("80", { timestamp: asked, text: "¿mañana?" }), message("81", { timestamp: latest })],
      hasMore: false,
    }),
    admins: async () => ["5"],
  })

  it("--since-time and --all read every message of a muted chat since then, both sides", async () => {
    const quiet = json((await tg(["review", "--since-time", "2d", "--json"], { adapter: () => reviewed })).stdout)
    const all = json(
      (await tg(["review", "--since-time", "2d", "--all", "--json"], { adapter: () => reviewed })).stdout,
    )

    expect([quiet.chats, quiet.quiet]).toEqual([[], 1])
    expect(all.chats[0].messages.map((one: { id: string }) => one.id)).toEqual(["80", "81"])
  })

  it("--chat and --unanswered keep one chat's questions that its admins left open", async () => {
    const { code, stdout } = await tg(["review", "--chat", "Valencia", "--unanswered", "12h", "--json"], {
      adapter: () => reviewed,
    })

    expect(code).toBe(0)
    expect(json(stdout).chats[0]).toMatchObject({ answeredBy: "owner-and-admins", messages: [{ id: "80" }] })
  })

  it("--transcribe hears a review's voice messages; with --model only on this machine", async () => {
    let asked = 0
    const voiced = scripted({
      chats: async () => ({ items: [{ ...chat, lastMessageAt: latest }], hasMore: false }),
      history: async () => ({
        items: [message("82", { timestamp: latest, attachments: [{ kind: "voice", mime: "audio/ogg" }] })],
        hasMore: false,
      }),
      transcribe: async () => {
        asked++
        return { text: "hola", pending: false }
      },
    })
    const local = json(
      (
        await tg(["review", "--since-time", "2d", "--transcribe", "--model", "gigaam-v3", "--json"], {
          adapter: () => voiced,
        })
      ).stdout,
    )
    expect([local.unheard, asked]).toMatchObject([[{ messageId: "82" }], 0])

    const heard = json(
      (await tg(["review", "--since-time", "2d", "--transcribe", "--json"], { adapter: () => voiced })).stdout,
    )

    expect(heard.chats[0].messages[0].transcript).toBe("hola")
    expect(asked).toBe(1)
  })
})

describe("listening", () => {
  const events: MessageEvent[] = [
    { event: "message", message: { ...message("80"), chatTitle: chat.title } },
    { event: "edit", message: { ...message("80"), chatTitle: chat.title } },
    { event: "delete", chatId: chat.id, chatTitle: null, messageId: "80" },
  ]
  const live = scripted({
    watch: async (onEvent, _signal, onReady) => {
      onReady?.()
      for (const event of events) onEvent(event)
    },
  })

  it("watch --events names each line's event, and without it prints messages only", async () => {
    const all = await tg(["watch", "--jsonl", "--events"], { adapter: () => live })
    const plain = await tg(["watch", "--jsonl"], { adapter: () => live })

    expect(all.stdout.map((line) => JSON.parse(line).event)).toEqual(["message", "edit", "delete"])
    expect(plain.stdout.map((line) => JSON.parse(line).id)).toEqual(["80"])
  })

  it("serve keeps what arrives, and says how much when it stops", async () => {
    const { code, stdout } = await tg(["serving", "serve", "--json"], { adapter: () => live })

    expect(code).toBe(0)
    expect(json(stdout).kept).toMatchObject({ message: 1, edit: 1, delete: 1 })
  })
})

describe("store fetch", () => {
  it("walks back a page at a time until --limit, pausing --pause between pages", async () => {
    const asked: unknown[] = []
    const pages = scripted({
      history: async (_chat, window) => {
        asked.push(window.before)
        const top = window.before === undefined ? 100 : Number(window.before) - 1
        return { items: [message(String(top - 1)), message(String(top))], hasMore: true }
      },
    })
    const { code, stdout } = await tg(
      ["store", "fetch", "Valencia", "--page-size", "2", "--limit", "4", "--pause", "1ms", "--json"],
      {
        adapter: () => pages,
      },
    )
    const deep = await tg(["store", "fetch", "Valencia", "--last", "3", "--pause", "1ms", "--json"], {
      adapter: () => pages,
    })

    expect(code).toBe(0)
    expect(json(stdout)).toMatchObject({ chat: chat.id, fetched: 4, complete: false })
    expect(asked.slice(0, 2)).toEqual([undefined, "99"])
    expect(json(deep.stdout)).toMatchObject({ reachedLast: true })
  })

  it("--since-time stops after the first page older than the time", async () => {
    const pages = scripted({
      history: async () => ({ items: [message("9"), message("10")], hasMore: true }),
    })
    const { stdout } = await tg(
      ["store", "fetch", "Valencia", "--since-time", "2026-09-27", "--pause", "1ms", "--json"],
      {
        adapter: () => pages,
      },
    )

    expect(json(stdout)).toMatchObject({ fetched: 2, reachedSince: true })
  })
})

describe("the journals", () => {
  it("sends list --limit shows only the newest attempts", async () => {
    for (const text of ["uno", "dos"]) await tg(["journal", "messages", "send", "Valencia", text])
    const all = json((await tg(["journal", "sends", "list", "--json"])).stdout).items
    const newest = json((await tg(["journal", "sends", "list", "--limit", "1", "--json"])).stdout)

    expect(all).toHaveLength(2)
    expect(newest).toMatchObject({ items: [all[0]], hasMore: true })
  })

  it("runs list --limit shows only the newest runs", async () => {
    for (const _ of [1, 2]) await tg(["limited", "chats", "list", "--record"])
    const { stdout } = await tg(["limited", "runs", "list", "--limit", "1", "--json"])

    expect(json(stdout)).toMatchObject({ items: [expect.anything()], hasMore: true })
  })
})

describe("config", () => {
  it("set --defaults changes every profile, and unset --defaults takes it back", async () => {
    const limit = async (profile: string) =>
      json((await tg([profile, "config", "show", "--json"])).stdout).settings.find(
        (one: { setting: string }) => one.setting === "limit",
      )

    expect((await tg(["config", "set", "--defaults", "limit", "7"])).code).toBe(0)
    expect(await limit("anyone")).toMatchObject({ value: 7, from: "config defaults" })

    expect((await tg(["config", "unset", "--defaults", "limit"])).code).toBe(0)
    expect(await limit("anyone")).not.toMatchObject({ value: 7 })
  })

  it("--bot and --personal write and read their own section of the profile", async () => {
    const limitIn = async (...flags: string[]) =>
      json((await tg(["config", "show", ...flags, "--json"])).stdout).settings.find(
        (one: { setting: string }) => one.setting === "limit",
      )

    expect((await tg(["config", "set", "--bot", "limit", "7"])).code).toBe(0)
    expect((await tg(["config", "set", "--personal", "limit", "9"])).code).toBe(0)
    expect(await limitIn("--bot")).toMatchObject({ value: 7, from: "config file: bot.profiles.default" })
    expect(await limitIn()).toMatchObject({ value: 9, from: "config file: personal.profiles.default" })

    expect((await tg(["config", "unset", "--bot", "limit"])).code).toBe(0)
    expect((await tg(["config", "unset", "--personal", "limit"])).code).toBe(0)
    expect(await limitIn()).not.toMatchObject({ value: 9 })
  })

  it("--defaults is refused in a process locked to one profile", async () => {
    const { code } = await tg(["config", "set", "--defaults", "limit", "7"], { env: env({ TG_PROFILE_LOCK: "1" }) })
    expect(code).toBe(5)
  })
})

describe("doctor --online", () => {
  it("connects once and reads the account, sending nothing", async () => {
    let sent = false
    const adapter = scripted({
      send: async () => {
        sent = true
        throw new Error("no sends")
      },
    })
    const { code, stdout } = await tg(["doctor", "--online", "--json"], { adapter: () => adapter })

    expect(code).toBe(0)
    expect(json(stdout).online).toMatchObject({ ok: true })
    expect(sent).toBe(false)
  })
})

describe("mcp", () => {
  it("config leaves out --confirm-send and --allow-dangerous, which show no form any more", async () => {
    const { code, stdout } = await tg(["mcp", "config", "--confirm-send", "--allow-dangerous", "--json"], {
      mcp: { execPath: "/usr/bin/node", scriptPath: "/opt/tg/dist/bin/tg.js" },
    } as never)

    expect(code).toBe(0)
    expect(JSON.stringify(json(stdout))).toContain('"mcp"]')
  })

  it("config warns that the --allow-* flags decide nothing now, and leaves them out", async () => {
    const { code, stdout, stderr } = await tg(
      ["mcp", "config", "--allow-send", "--allow-mark-read", "--allow-delete", "--json"],
      {
        mcp: { execPath: "/usr/bin/node", scriptPath: "/opt/tg/dist/bin/tg.js" },
      } as never,
    )

    expect(code).toBe(0)
    expect(JSON.stringify(json(stdout))).toContain('"mcp"]')
    expect(stderr.join("\n")).toContain("the profile's permissions do")
  })
})
