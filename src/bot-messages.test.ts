import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Readable } from "node:stream"
import { captureStreams, memoryKeyring } from "@wirecat/cli-core"
import { beforeEach, describe, expect, it } from "vitest"
import type { FetchLike } from "./bot/transport.js"
import { run } from "./program.js"

const TOKEN = "123456789:AAsecretSECRETsecretSECRETsecret0"
const BOT = { id: 7_000_000_001, is_bot: true, first_name: "Sales", username: "sales_bot" }
const GROUP = { id: -1001234567890, type: "supergroup", title: "Team" }

let keyring: ReturnType<typeof memoryKeyring>
let requests: { method: string; params: Record<string, unknown>; file?: string }[]
let next: number
let refusing: string | undefined
let pages: unknown[][]
let stop: AbortController
let webhook: string

const ok = (result: unknown) => new Response(JSON.stringify({ ok: true, result }))

/** A stand-in for api.telegram.org that remembers each request, JSON or multipart. */
const telegram: FetchLike = async (url, init) => {
  const method = url.split("/").at(-1) ?? ""
  let params: Record<string, unknown> = {}
  let file: string | undefined
  if (init.body instanceof FormData) {
    for (const [name, value] of init.body.entries()) {
      if (typeof value === "string") params[name] = value
      else file = `${name}:${value.name}`
    }
  } else params = JSON.parse(String(init.body ?? "{}"))
  requests.push({ method, params, ...(file ? { file } : {}) })
  if (method === refusing) {
    return new Response(JSON.stringify({ ok: false, error_code: 400, description: "Bad Request: not enough rights" }))
  }
  const chat = String(params.chat_id).startsWith("-")
    ? GROUP
    : { id: Number(params.chat_id), type: "private", first_name: "Ann" }
  const reply: { message_id: number } | undefined =
    typeof params.reply_parameters === "string" ? JSON.parse(params.reply_parameters) : params.reply_parameters
  const message = (text: unknown) => ({
    message_id: next++,
    chat,
    from: BOT,
    date: 1_759_312_800,
    text,
    ...(reply
      ? {
          reply_to_message: {
            message_id: reply.message_id,
            chat,
            from: { id: 42, first_name: "Ann", last_name: "Lee" },
            date: 1_759_312_700,
            text: "the numbers?",
          },
        }
      : {}),
  })
  switch (method) {
    case "getMe":
      return ok(BOT)
    case "sendMessage":
      return ok(message(params.text))
    case "sendDocument":
    case "sendPhoto":
      return ok({
        ...message(undefined),
        caption: params.caption,
        document: { file_id: "BQAC", file_name: "report.pdf", file_size: 4 },
      })
    case "editMessageText":
      return ok({ ...message(params.text), message_id: Number(params.message_id), edit_date: 1_759_312_900 })
    case "getChat":
      return ok(GROUP)
    case "getMyCommands":
      return ok([{ command: "start", description: "Begin" }])
    case "getWebhookInfo":
      return ok({ url: webhook, ...(webhook ? { allowed_updates: ["message"] } : {}) })
    case "getUpdates": {
      const page = pages.shift()
      if (!page) stop.abort()
      return ok(page ?? [])
    }
    case "getChatAdministrators":
      return ok([
        { status: "creator", user: { id: 1, first_name: "Olga" }, is_anonymous: false },
        {
          status: "administrator",
          user: { id: 91, first_name: "Ivan", username: "ivan" },
          custom_title: "Mod",
          can_pin_messages: true,
          can_restrict_members: true,
          can_manage_chat: true,
        },
      ])
    default:
      return ok(true)
  }
}

const tg = async (argv: string[], stdin = "") => {
  if (stop.signal.aborted) stop = new AbortController()
  const streams = captureStreams()
  const code = await run(argv, {
    streams,
    tty: false,
    keyring,
    botFetch: telegram,
    signal: stop.signal,
    stdin: Object.assign(Readable.from([stdin]), { isTTY: false }),
  })
  const lines = streams.stdout.map((line) => JSON.parse(line))
  return { code, answer: lines.length === 1 ? lines[0] : undefined, lines, err: streams.stderr.join("\n") }
}

beforeEach(async () => {
  keyring = memoryKeyring()
  requests = []
  next = 500
  refusing = undefined
  pages = []
  stop = new AbortController()
  webhook = ""
  await tg(["sales", "bot", "auth", "set"], TOKEN)
  await tg(["sales", "bot", "chats", "show", String(GROUP.id)])
  requests = []
})

describe("tg bot messages send", () => {
  it("**sends to a chat by its title**, with --md as Telegram's entities, and keeps it", async () => {
    const done = await tg([
      "sales",
      "bot",
      "messages",
      "send",
      "Team",
      "**Done** today",
      "--md",
      "--reply-to",
      "7",
      "--silent",
      "--json",
    ])

    expect(done.code).toBe(0)
    expect(requests).toEqual([
      {
        method: "sendMessage",
        params: {
          chat_id: String(GROUP.id),
          text: "Done today",
          entities: [{ type: "bold", offset: 0, length: 4 }],
          reply_parameters: { message_id: 7 },
          disable_notification: true,
        },
      },
    ])
    expect(done.answer.message).toMatchObject({ id: "500", chatId: String(GROUP.id), text: "Done today" })
    const kept = await tg(["sales", "bot", "messages", "list", "Team", "--json"])
    expect(kept.answer.items.map((item: { id: string }) => item.id)).toEqual(["500"])
    expect(kept.err).toContain("gives a bot no history")
    await tg(["sales", "bot", "messages", "send", "Team", "and tomorrow"])
    const newest = await tg(["sales", "bot", "messages", "list", "Team", "--limit", "1", "--json"])
    expect(newest.answer.items.map((item: { id: string }) => item.id)).toEqual(["501"])
  })

  it("uses Telegram-native underline and spoiler through common bot send/edit", async () => {
    expect((await tg(["sales", "bot", "messages", "send", "Team", "__u__ ||s||", "--md"])).code).toBe(0)
    expect(requests.at(-1)?.params).toMatchObject({
      text: "u s",
      entities: [
        { type: "underline", offset: 0, length: 1 },
        { type: "spoiler", offset: 2, length: 1 },
      ],
    })
    expect(
      (await tg(["sales", "bot", "messages", "edit", "Team", "500", "[l](https://example.test)", "--md"])).code,
    ).toBe(0)
    expect(requests.at(-1)?.params).toMatchObject({
      text: "l",
      entities: [{ type: "text_link", offset: 0, length: 1, url: "https://example.test" }],
    })
  })

  it("writes to a person as user:<id>, and sends --html as Telegram's HTML", async () => {
    await tg(["sales", "bot", "messages", "send", "user:42", "<b>hi</b>", "--html"])
    expect(requests[0]?.params).toMatchObject({ chat_id: "42", text: "<b>hi</b>", parse_mode: "HTML" })
  })

  it("**sends a file in the same request**, the text as its caption", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tg-bot-file-"))
    const path = join(dir, "report.pdf")
    writeFileSync(path, "%PDF")
    await tg(["sales", "bot", "messages", "send", "Team", "Weekly", "--file", path])

    expect(requests).toEqual([
      { method: "sendDocument", params: { chat_id: String(GROUP.id), caption: "Weekly" }, file: "document:report.pdf" },
    ])
  })

  it("**answers with the file by Telegram's id, never its download address**, and the message it replied to", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tg-bot-reply-"))
    writeFileSync(join(dir, "report.pdf"), "%PDF")
    const done = await tg([
      "sales",
      "bot",
      "messages",
      "send",
      "Team",
      "Weekly",
      "--file",
      join(dir, "report.pdf"),
      "--reply-to",
      "7",
      "--json",
    ])

    expect(done.answer.message).toMatchObject({
      text: "Weekly",
      attachments: [{ kind: "file", providerRef: { fileId: "BQAC" }, name: "report.pdf", size: 4 }],
      replyToId: "7",
      replyTo: { id: "7", senderId: "42", senderName: "Ann Lee", text: "the numbers?" },
    })
    expect(JSON.stringify(done.answer)).not.toContain("api.telegram.org")
  })

  it("**chooses the method by the option**: a photo, a voice message, a video as a file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tg-bot-kinds-"))
    for (const name of ["shot.png", "note.ogg", "clip.mp4"]) writeFileSync(join(dir, name), "x")
    await tg(["sales", "bot", "messages", "send", "Team", "look", "--photo", join(dir, "shot.png")])
    await tg(["sales", "bot", "messages", "send", "Team", "--voice", join(dir, "note.ogg")])
    await tg(["sales", "bot", "messages", "send", "Team", "--file", join(dir, "clip.mp4"), "--as-file"])

    expect(requests.map(({ method, file }) => [method, file])).toEqual([
      ["sendPhoto", "photo:shot.png"],
      ["sendVoice", "voice:note.ogg"],
      ["sendDocument", "document:clip.mp4"],
    ])
  })

  it("**refuses a file from a credential folder** unless --allow-any-file says it is meant to go", async () => {
    const dir = join(mkdtempSync(join(tmpdir(), "tg-bot-hidden-")), ".ssh")
    mkdirSync(dir)
    writeFileSync(join(dir, "key.txt"), "x")

    expect((await tg(["sales", "bot", "messages", "send", "Team", "--file", join(dir, "key.txt")])).code).toBe(2)
    expect(requests).toEqual([])
    await tg(["sales", "bot", "messages", "send", "Team", "--file", join(dir, "key.txt"), "--allow-any-file"])
    expect(requests.map(({ method }) => method)).toEqual(["sendDocument"])
  })
})

describe("tg bot messages edit, delete, pin", () => {
  it("edits with --md as entities and with --html as Telegram's HTML, and pins with --notify", async () => {
    await tg(["sales", "bot", "messages", "edit", "Team", "500", "_now_", "--md"])
    await tg(["sales", "bot", "messages", "edit", "Team", "500", "<i>now</i>", "--html"])
    await tg(["sales", "bot", "messages", "pin", "Team", "500", "--notify"])

    expect(requests.map(({ params }) => params)).toEqual([
      { chat_id: String(GROUP.id), message_id: 500, text: "now", entities: [{ type: "italic", offset: 0, length: 3 }] },
      { chat_id: String(GROUP.id), message_id: 500, text: "<i>now</i>", parse_mode: "HTML" },
      { chat_id: String(GROUP.id), message_id: 500, disable_notification: false },
    ])
  })

  it("edits, deletes several at once, pins quietly and unpins one message", async () => {
    await tg(["sales", "bot", "messages", "edit", "Team", "500", "new text"])
    await tg(["sales", "bot", "messages", "delete", "Team", "500", "501", "--allow-dangerous"])
    await tg(["sales", "bot", "messages", "pin", "Team", "502"])
    await tg(["sales", "bot", "messages", "unpin", "Team", "502"])

    expect(requests.map(({ method, params }) => [method, params])).toEqual([
      ["editMessageText", { chat_id: String(GROUP.id), message_id: 500, text: "new text" }],
      ["deleteMessages", { chat_id: String(GROUP.id), message_ids: [500, 501] }],
      ["pinChatMessage", { chat_id: String(GROUP.id), message_id: 502, disable_notification: true }],
      ["unpinChatMessage", { chat_id: String(GROUP.id), message_id: 502 }],
    ])
  })
})

describe("tg bot chats", () => {
  it("shows the bot typing in Telegram's word for it, and leaves", async () => {
    await tg(["sales", "bot", "chats", "action", "Team", "file"])
    await tg(["sales", "bot", "chats", "leave", "Team"])

    expect(requests).toEqual([
      { method: "sendChatAction", params: { chat_id: String(GROUP.id), action: "upload_document" } },
      { method: "leaveChat", params: { chat_id: String(GROUP.id) } },
    ])
  })
})

describe("tg bot chats admins and members", () => {
  it("**lists the admins with their rights in the shared words**; the owner has every right", async () => {
    const listed = await tg(["sales", "bot", "chats", "admins", "list", "Team", "--json"])

    expect(listed.answer.items).toEqual([
      {
        id: "1",
        name: "Olga",
        username: null,
        role: "owner",
        rights: ["members", "admins", "info", "pin", "link", "post", "edit", "delete"],
        title: null,
      },
      { id: "91", name: "Ivan", username: "ivan", role: "admin", rights: ["members", "pin"], title: "Mod" },
    ])
  })

  it("**promotes with exactly the rights asked**, then sets the title; demotes with every right false", async () => {
    await tg(["sales", "bot", "chats", "admins", "add", "Team", "91", "--can", "pin,members", "--title", "Mod"])
    await tg(["sales", "bot", "chats", "admins", "remove", "Team", "91"])

    const [promote, title, demote] = requests
    expect(promote?.params).toMatchObject({
      chat_id: String(GROUP.id),
      user_id: 91,
      can_pin_messages: true,
      can_restrict_members: true,
      can_delete_messages: false,
      can_manage_chat: false,
    })
    expect(title).toEqual({
      method: "setChatAdministratorCustomTitle",
      params: { chat_id: String(GROUP.id), user_id: 91, custom_title: "Mod" },
    })
    expect(demote?.method).toBe("promoteChatMember")
    expect(Object.values(demote?.params ?? {}).filter((value) => value === true)).toEqual([])
  })

  it("**offers no read right**: Telegram's admins always read", async () => {
    const refused = await tg(["sales", "bot", "chats", "admins", "add", "Team", "91", "--can", "read"])

    expect(refused.code).toBe(2)
    expect(refused.err).toContain("--can takes rights from: members, admins")
    expect(requests).toEqual([])
  })

  it("**says the person is an admin when only the title failed**", async () => {
    refusing = "setChatAdministratorCustomTitle"
    const failed = await tg(["sales", "bot", "chats", "admins", "add", "Team", "91", "--can", "pin", "--title", "Mod"])

    expect(failed.code).not.toBe(0)
    expect(failed.err).toContain("91 is an admin now, but")
    expect(failed.err).not.toContain(TOKEN)
  })

  it("**removes by a ban lifted at once**, and keeps the ban with --block", async () => {
    await tg(["sales", "bot", "chats", "members", "remove", "Team", "91"])
    await tg(["sales", "bot", "chats", "members", "remove", "Team", "92", "--block"])

    expect(requests.map(({ method, params }) => [method, params])).toEqual([
      ["banChatMember", { chat_id: String(GROUP.id), user_id: 91 }],
      ["unbanChatMember", { chat_id: String(GROUP.id), user_id: 91, only_if_banned: true }],
      ["banChatMember", { chat_id: String(GROUP.id), user_id: 92 }],
    ])
  })

  it("**says the person is still blocked when lifting the ban failed**", async () => {
    refusing = "unbanChatMember"
    const failed = await tg(["sales", "bot", "chats", "members", "remove", "Team", "91"])

    expect(failed.code).not.toBe(0)
    expect(failed.err).toContain("91 is out of the chat and still blocked, but")
  })
})

const ANN = { id: 42, is_bot: false, first_name: "Ann" }

describe("tg bot watch", () => {
  it("**asks from the next update every time, with the full list of kinds**, and keeps what came", async () => {
    pages = [
      [
        { update_id: 7, message: { message_id: 600, chat: GROUP, from: ANN, date: 1_759_312_800, text: "hi bot" } },
        {
          update_id: 8,
          chat_member: {
            chat: GROUP,
            from: ANN,
            date: 1_759_312_801,
            old_chat_member: { status: "left", user: ANN },
            new_chat_member: { status: "member", user: ANN },
          },
        },
      ],
    ]
    const watched = await tg(["sales", "bot", "watch", "--events", "--jsonl"])

    const polls = requests.filter(({ method }) => method === "getUpdates").map(({ params }) => params)
    expect(polls[0]).toMatchObject({
      timeout: 25,
      allowed_updates: expect.arrayContaining(["chat_member", "callback_query"]),
    })
    expect(polls[0]).not.toHaveProperty("offset")
    expect(polls[1]).toMatchObject({ offset: 9 })
    expect(watched.code).toBe(0)
    expect(watched.lines.map((line: { event: string }) => line.event)).toEqual(["message", "joined"])
    stop = new AbortController()
    const kept = await tg(["sales", "bot", "messages", "show", "Team", "600", "--offline", "--json"])
    expect(kept.answer).toMatchObject({ text: "hi bot", senderId: "42" })
  })

  it("asks Telegram for only the --types given", async () => {
    await tg(["sales", "bot", "watch", "--types", "message,callback_query", "--jsonl"])
    expect(requests.find(({ method }) => method === "getUpdates")?.params).toMatchObject({
      allowed_updates: ["message", "callback_query"],
    })
  })

  it("**replaces the pressed message from the press `bot watch` kept**, after answering the button", async () => {
    pages = [
      [
        {
          update_id: 9,
          callback_query: {
            id: "cq-1",
            from: ANN,
            data: "yes",
            message: { message_id: 601, chat: GROUP, date: 1_759_312_800 },
          },
        },
      ],
    ]
    await tg(["sales", "bot", "watch", "--jsonl"])
    requests = []
    stop = new AbortController()
    await tg(["sales", "bot", "callbacks", "answer", "cq-1", "--notification", "Done", "--text", "Confirmed"])

    expect(requests.map(({ method, params }) => [method, params])).toEqual([
      ["answerCallbackQuery", { callback_query_id: "cq-1", text: "Done" }],
      ["editMessageText", { chat_id: String(GROUP.id), message_id: 601, text: "Confirmed" }],
    ])
    expect((await tg(["sales", "bot", "callbacks", "answer", "cq-unseen", "--text", "x"])).code).toBe(2)
  })

  it("sets the menu, refuses a command without a description, and clears it", async () => {
    await tg(["sales", "bot", "commands", "set", "start=Begin", "help=Help"])
    expect((await tg(["sales", "bot", "commands", "set", "start"])).code).toBe(2)
    await tg(["sales", "bot", "commands", "clear"])
    const listed = await tg(["sales", "bot", "commands", "list", "--json"])

    expect(requests.map(({ method }) => method)).toEqual(["setMyCommands", "deleteMyCommands", "getMyCommands"])
    expect(listed.answer.items).toEqual([{ name: "start", description: "Begin" }])
  })

  it("**sets a webhook only while none is set**, deletes only the address set, and watch refuses meanwhile", async () => {
    await tg(["sales", "bot", "webhooks", "set", "https://a.example/hook"])
    expect(requests.find(({ method }) => method === "setWebhook")?.params).toMatchObject({
      url: "https://a.example/hook",
      allowed_updates: expect.arrayContaining(["chat_member"]),
    })
    requests = []
    await tg(
      ["sales", "bot", "webhooks", "set", "https://a.example/hook", "--types", "message", "--secret-stdin"],
      "s3cret",
    )
    expect(requests.find(({ method }) => method === "setWebhook")?.params).toEqual({
      url: "https://a.example/hook",
      allowed_updates: ["message"],
      secret_token: "s3cret",
    })
    webhook = "https://a.example/hook"
    expect((await tg(["sales", "bot", "webhooks", "set", "https://b.example/hook"])).code).toBe(7)
    expect((await tg(["sales", "bot", "webhooks", "set", "https://b.example/hook", "--add"])).code).not.toBe(0)
    expect((await tg(["sales", "bot", "watch", "--jsonl"])).code).toBe(2)
    expect((await tg(["sales", "bot", "webhooks", "delete", "https://b.example/hook"])).code).toBe(6)
    requests = []
    await tg(["sales", "bot", "webhooks", "delete", "https://a.example/hook"])
    expect(requests.map(({ method }) => method)).toContain("deleteWebhook")
  })
})
