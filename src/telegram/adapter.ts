import { chmodSync, existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { format } from "node:util"
import {
  ChatInviteLink,
  type DeleteMessageUpdate,
  FileLocation,
  getMarkedPeerId,
  type InputPeerLike,
  Long,
  MtcuteError,
  MtPeerNotFoundError,
  networkMiddlewares,
  type Peer,
  PeersIndex,
  type RawUpdateInfo,
  type SentCode,
  TelegramClient,
  Message as TgMessage,
  type Poll as TgPoll,
  tl,
  User,
} from "@mtcute/node"
import { CliError, isCliError } from "@wirecat/cli-core"
import type { TextSpan } from "@wirecat/cli-messaging"
import {
  type AccountSession,
  type AdminRight,
  type Attachment,
  type Chat,
  type ChatCard,
  type ChatEvents,
  type CounterField,
  type Discussion,
  type Folder,
  type FolderChange,
  type FolderRules,
  type GroupCard,
  type GroupChange,
  type GroupMember,
  type InviteLinkChange,
  type LinkTarget,
  type Markup,
  type Member,
  type Message,
  type MessageEvent,
  type MessageHit,
  type OfficialChatStats,
  observedCounters,
  type Page,
  type PersonCard,
  type PhoneBookEntry,
  type Poll,
  type ProfileFacts,
  pickChat,
  type SenderIdentity,
  type Topic,
  type TopicChange,
} from "@wirecat/cli-messaging"
import type {
  After,
  Download,
  ForumState,
  MessengerAdapter,
  NewPoll,
  SendOptions,
  ServerQuery,
  Transcript,
} from "@wirecat/cli-messaging/cli"
import type { ProxyServer } from "../proxy.js"
import { commentsOf, discussionOf } from "./comments.js"
import type { ApiCredentials } from "./credentials.js"
import { toCliError } from "./errors.js"
import { ruleFlags } from "./folder-rules.js"
import { formatHtml } from "./format-html.js"
import { formatMarkdown } from "./format-markdown.js"
import { answerJoinRequestOf, joinRequestsOf } from "./join-requests.js"
import {
  type Account,
  ADMIN_RIGHT_FIELDS,
  answerId,
  attachmentsOf,
  checkSpoiler,
  type EventOf,
  eventOf,
  GROUP_SETTINGS,
  groupMembersCount,
  peerToChat,
  toAccount,
  toAccountSession,
  toChat,
  toDeletions,
  toFolder,
  toFormatted,
  toGroupCard,
  toGroupMember,
  toInputMedia,
  toInputPoll,
  toInviteLink,
  toInvitePreview,
  toLinkChat,
  toMember,
  toMessage,
  toMessageHit,
  toPoll,
  toReactionChange,
  toTopic,
} from "./map.js"
import { pollVotersOf } from "./poll-voters.js"
import { refuseClose, refuseVote } from "./polls.js"
import { toProfileFacts } from "./profile.js"
import { proxiedTransport } from "./proxy.js"
import { savedSenderOf, sendAsIdentities, sendAsPeer } from "./send-as.js"
import { type GraphOf, toOfficialChannelStats, toOfficialGraph, toOfficialGroupStats } from "./stats.js"
import { openSessionStorage } from "./storage.js"
import { uploadAttachment } from "./upload.js"

export interface AdapterOptions {
  credentials: ApiCredentials
  sessionPath: string
  /** Where the library's own log lines go, when asked for. Never stdout. */
  diagnostic?: (line: string) => void
  verbose?: boolean
  /** Receive updates — only `watch` and `serve` ask. */
  listen?: boolean
  /** Fetch what arrived while nothing listened — `serve` only; a watch starts from now. */
  catchUp?: boolean
  /** How to log in on this profile, for the error a dropped session gives. */
  login?: string
  proxy?: ProxyServer
  /** Where a wait mtcute sits out is said — a warning, so `--quiet` drops it. The diagnostic stream if not given. */
  note?: (message: string) => void
}

export interface LoginPrompts {
  method: "qr" | "phone"
  forceSms?: boolean
  showQr: (url: string, expires: Date) => void
  phone: () => Promise<string>
  code: () => Promise<string>
  password: () => Promise<string>
  note: (message: string) => void
}

export interface Sent {
  message: Message
  /** Telegram's `random_id` for this send, as a string. Repeat it with `--send-id` after an unknown outcome. */
  sendId: string
}

/** `https://t.me/name`, `t.me/name` or `@name`, as the name alone. */
const publicName = (link: string): string =>
  link
    .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "")

const SAVED = new Set(["me", "self", "saved"])

const PHONE_CODE_RETRIES = ["PHONE_CODE_EMPTY", "PHONE_CODE_EXPIRED", "PHONE_CODE_INVALID", "PHONE_CODE_HASH_EMPTY"]
interface DialogWalk {
  dialogs: ReturnType<TelegramClient["iterDialogs"]>
  seen: Set<string>
  /** Read past the last page, to tell whether there is more; the next page starts with them. */
  held: Chat[]
  at: number
}

/** Telegram's own cap on a group's member list. */
const MEMBERS_MAX = 10_000
/** Up to 50 pages of a big group back to back is the kind of burst Telegram answers with FLOOD_WAIT. */
const MEMBER_PAGE_PAUSE_MS = 1000
/** Pages of 100 that `chats events` reads at most; the rest is `more`. */
const EVENT_PAGES = 10

/**
 * One Telegram account over one connection, speaking only the domain model above this line. Every
 * command closes it in a `finally`: an open socket keeps Node alive, and a piped command that prints
 * and never returns is a defect.
 */
export class TelegramAdapter {
  async formatMarkdown(text: string) {
    return formatMarkdown(text)
  }

  async formatHtml(text: string) {
    return formatHtml(text)
  }

  readonly #client: TelegramClient
  readonly #sessionPath: string
  readonly #login: string | undefined
  readonly #proxyFailed: Promise<never> | undefined
  /** Where the last page of `chats` stopped; any other offset, or a failure, starts a new walk. */
  #walk: DialogWalk | undefined

  /** Async because the runtime's SQLite module is imported on demand (cli-messaging `openCache`). */
  static async open(options: AdapterOptions): Promise<TelegramAdapter> {
    mkdirSync(dirname(options.sessionPath), { recursive: true, mode: 0o700 })
    const adapter = new TelegramAdapter(options, await openSessionStorage(options.sessionPath))
    // Loads the logged-in user from the session before anything else. mtcute does it on the first
    // request, but sendText reads that user before making one — measured 2026-09-27: "User info is
    // not cached yet" on the first send to Saved Messages.
    await adapter.#client.prepare()
    return adapter
  }

  private constructor(
    {
      credentials,
      sessionPath,
      diagnostic,
      verbose = false,
      listen = false,
      catchUp = false,
      login,
      proxy,
      note,
    }: AdapterOptions,
    storage: Awaited<ReturnType<typeof openSessionStorage>>,
  ) {
    this.#sessionPath = sessionPath
    this.#login = login
    const proxied = proxy ? proxiedTransport(proxy) : undefined
    // watch and serve outlive a proxy that is down for a moment; mtcute's own retries suit them.
    this.#proxyFailed = listen ? undefined : proxied?.failed
    // mtcute's default handler writes with console.log, which is stdout — where only data may go.
    const write = diagnostic ?? ((line: string) => process.stderr.write(`${line}\n`))
    const say = note ?? write
    const { maxWait, maxRetries } = listen ? FLOOD_SLEEP.listening : FLOOD_SLEEP.oneShot
    this.#client = new TelegramClient({
      ...(proxied ? { transport: proxied.transport } : {}),
      apiId: credentials.id,
      apiHash: credentials.hash,
      storage,
      // The storage manager has an exit hook of its own; the close is the command's (storage.ts `setup`).
      storageOptions: { cleanup: false },
      disableUpdates: !listen,
      ...(listen ? { updates: { catchUp } } : {}),
      logLevel: verbose ? 3 : 1,
      network: {
        middlewares: networkMiddlewares.basic({
          floodWaiter: {
            maxWait,
            maxRetries,
            onBeforeWait: (context, seconds) =>
              say(`Telegram asks to wait ${seconds} s before ${context.request._} — waiting, then going on`),
          },
        }),
      },
    })
    this.#client.log.mgr.handler = (_color, _level, tag, fmt, args) => write(`[${tag}] ${format(fmt, ...args)}`)
  }

  async login(prompts: LoginPrompts): Promise<Account> {
    return this.#call(async () => {
      if (prompts.method === "phone" && prompts.forceSms) return toAccount(await this.#loginAskingForSms(prompts))
      const user: User = await this.#client.start({
        ...(prompts.method === "qr" ? { qrCodeHandler: prompts.showQr } : { phone: prompts.phone }),
        code: prompts.code,
        password: prompts.password,
        codeSentCallback: (sent) => prompts.note(`Telegram sent a login code (${sent.type})`),
        invalidCodeCallback: (what) => prompts.note(`that ${what} was not accepted — try again`),
      })
      return toAccount(user)
    })
  }

  /**
   * mtcute's `start({ forceSms })` without its one failure: when Telegram has no SMS to resend
   * (`SEND_CODE_UNAVAILABLE`) it aborts the login, though the code it first sent to the app still works.
   */
  async #loginAskingForSms(prompts: LoginPrompts): Promise<User> {
    let needsPassword = false
    try {
      return await this.#client.getMe()
    } catch (error) {
      if (tl.RpcError.is(error, "SESSION_PASSWORD_NEEDED")) needsPassword = true
      else if (!tl.RpcError.is(error, "AUTH_KEY_UNREGISTERED")) throw error
    }
    if (!needsPassword) {
      const phone = await prompts.phone()
      let sent: SentCode | undefined
      try {
        const answer = await this.#client.sendCode({ phone })
        if (answer instanceof User) return answer
        sent = answer
      } catch (error) {
        if (!tl.RpcError.is(error, "SESSION_PASSWORD_NEEDED")) throw error
        needsPassword = true
      }
      if (sent) {
        if (sent.type === "app" || sent.type === "email") {
          try {
            sent = await this.#client.resendCode({ phone, phoneCodeHash: sent.phoneCodeHash })
          } catch (error) {
            if (!tl.RpcError.is(error, "SEND_CODE_UNAVAILABLE")) throw error
            prompts.note("Telegram offers no SMS for this account")
          }
        }
        if (sent.type === "email_required") throw new MtcuteError("Email login setup is required to sign in")
        prompts.note(`Telegram sent a login code (${sent.type})`)
        for (;;) {
          try {
            return await this.#client.signIn({
              phone,
              phoneCodeHash: sent.phoneCodeHash,
              phoneCode: await prompts.code(),
            })
          } catch (error) {
            if (tl.RpcError.is(error, "SESSION_PASSWORD_NEEDED")) {
              needsPassword = true
              break
            }
            if (!PHONE_CODE_RETRIES.some((text) => tl.RpcError.is(error, text))) throw error
            prompts.note("that code was not accepted — try again")
          }
        }
      }
    }
    for (;;) {
      try {
        return await this.#client.checkPassword(await prompts.password())
      } catch (error) {
        if (!tl.RpcError.is(error, "PASSWORD_HASH_INVALID")) throw error
        prompts.note("that password was not accepted — try again")
      }
    }
  }

  /** The logged-in user's id from the session, without a request; `null` before a login. */
  self(): string | null {
    const cached = this.#client.storage.self.getCached(true)
    return cached ? String(cached.userId) : null
  }

  /** Only here the phone: `account show` masks it, and a login's answer is printed as it is. */
  me(): Promise<Account> {
    return this.#call(async () => {
      const user = await this.#client.getMe()
      return { ...toAccount(user), phone: user.phoneNumber }
    })
  }

  /**
   * For `doctor --online`: Telegram's clock, from `help.getConfig`'s `date` in whole seconds, and
   * whether the account is frozen, from `help.getAppConfig`'s `freeze_*` fields
   * (core.telegram.org/api/config, /api/auth#frozen-accounts). A frozen account still reads, so a
   * working `me()` cannot tell. Both read only.
   */
  health(): Promise<{
    serverTime: number
    serverTimeResolutionMs: number
    standingChecked: boolean
    standing?: FrozenStanding
  }> {
    return this.#call(async () => {
      const config = await this.#client.call({ _: "help.getConfig" })
      const serverTime = config.date * 1000
      let appConfig: Record<string, unknown>
      try {
        appConfig = await this.#client.appConfig.get()
      } catch {
        // The clock is still worth reporting; the standing is then unknown, never "active".
        return { serverTime, serverTimeResolutionMs: 1000, standingChecked: false }
      }
      const standing = frozenOf(appConfig)
      return { serverTime, serverTimeResolutionMs: 1000, standingChecked: true, ...(standing ? { standing } : {}) }
    })
  }

  /**
   * Telegram lists dialogs by position; `limit` unset is every one. The next page goes on with the walk the
   * last one left off, so paging through N chats asks Telegram for each dialog once, not once per page.
   */
  chats({ limit, offset }: { limit?: number; offset: number }): Promise<Page<Chat>> {
    return this.#call(async () => {
      if (limit === undefined) {
        const items = await this.#dialogs(Number.POSITIVE_INFINITY)
        return { items: items.slice(offset), hasMore: false }
      }
      const resumed = this.#walk
      this.#walk = undefined
      const walk: DialogWalk =
        resumed && offset > 0 && resumed.at === offset
          ? resumed
          : { dialogs: this.#client.iterDialogs({ archived: "keep" }), seen: new Set<string>(), held: [], at: 0 }
      const pulled = await this.#pull(walk, offset - walk.at + limit + 1)
      const items = pulled.slice(offset - walk.at, offset - walk.at + limit)
      walk.held = pulled.slice(offset - walk.at + limit)
      walk.at = offset + items.length
      this.#walk = walk
      return { items, hasMore: walk.held.length > 0 }
    })
  }

  discussionOf(channelId: string, postId: string): Promise<Discussion> {
    const post = messageNumber(postId, "a post id is a number")
    return this.#call(() => discussionOf(this.#client, Number(channelId), post))
  }

  comments(channelId: string, postId: string, { limit, before }: { limit: number; before?: string }) {
    const post = messageNumber(postId, "a post id is a number")
    const offset = before === undefined ? undefined : messageNumber(before, "--before-id takes a comment id")
    return this.#call(async (): Promise<Page<Message>> => {
      const page = await commentsOf(this.#client, Number(channelId), post, {
        limit,
        ...(offset === undefined ? {} : { before: offset }),
      })
      return { items: page.items.map(toMessage), hasMore: page.hasMore }
    })
  }

  /** Telegram reads a thread with messages.search and its top message id (core.telegram.org/api/threads). */
  topicHistory(
    reference: string,
    threadId: string,
    { limit, before }: { limit: number; before?: string },
  ): Promise<Page<Message>> {
    const thread = topicNumber(threadId)
    const offset = before === undefined ? undefined : messageNumber(before, "--before-id takes a message id")
    return this.#call(async () => {
      const page = await this.#client.searchMessages({
        chatId: await this.#inputOf(reference),
        threadId: thread,
        limit,
        ...(offset === undefined ? {} : { offset }),
      })
      return { items: page.map(remoteMessage).reverse(), hasMore: page.next !== undefined }
    })
  }

  history(reference: string, { limit, before }: { limit: number; before?: string }): Promise<Page<Message>> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const offset = before === undefined ? undefined : { id: messageNumber(before), date: 0 }
      const page = await this.#client.getHistory(peer, { limit, ...(offset ? { offset } : {}) })
      // mtcute drops deleted entries and the inexact-count flag. Its iterator follows next, never total.
      return { items: page.map(remoteMessage).reverse(), hasMore: page.next !== undefined }
    })
  }

  /**
   * Forward from a message or a moment: `reverse` reads upwards from the offset, inclusive, so an id
   * starts one past it. The filter keeps a date offset honest — Telegram places it, it does not cut at it.
   */
  historyAfter(reference: string, { limit, after }: { limit: number; after: After }): Promise<Page<Message>> {
    const offset =
      "id" in after
        ? { id: messageNumber(after.id, "--after-id takes a message id") + 1, date: 0 }
        : { id: 0, date: Math.floor(after.time / 1000) }
    const newer = (message: Message) =>
      "id" in after ? Number(message.id) > Number(after.id) : Date.parse(message.timestamp) > after.time
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const page = await this.#client.getHistory(peer, { limit, reverse: true, offset })
      // As history(): a short page is no end, deleted entries are dropped from it; only an empty one is.
      return { items: page.map(remoteMessage).filter(newer), hasMore: page.next !== undefined }
    })
  }

  /** One person's newest messages in a chat: Telegram's search by sender, newest first, answered oldest first. */
  historyFrom(reference: string, person: string, { limit }: { limit: number }): Promise<Page<Message>> {
    return this.#call(async () => {
      const [chatId, fromUser] = await Promise.all([this.#inputOf(reference), this.#inputOf(person)])
      const page = await this.#client.searchMessages({ chatId, fromUser, limit })
      return { items: page.map(remoteMessage).reverse(), hasMore: page.total > page.length }
    })
  }

  /**
   * Telegram's own text search, newest first: in one chat with `chat`, in every chat otherwise. Its
   * matching is undocumented, so the answer is candidates for the store's strict query.
   */
  searchMessages(
    query: ServerQuery,
    { limit, signal }: { limit: number; signal?: AbortSignal },
  ): Promise<Page<MessageHit> & { chats: Chat[] }> {
    return this.#call(async () => {
      const seconds = (ms?: number) => (ms === undefined ? 0 : Math.floor(ms / 1000))
      const common = {
        q: query.text,
        filter: { _: "inputMessagesFilterEmpty" as const },
        minDate: seconds(query.minDate),
        maxDate: seconds(query.maxDate),
        limit,
      }
      // The raw call, because only it takes these: a flood wait is answered at once instead of slept
      // through, and the search's time bound cancels the request rather than leaving it to hold the connection.
      const options = { floodSleepThreshold: 0, ...(signal ? { abortSignal: signal } : {}) }
      const found =
        query.chat === undefined
          ? await this.#client.call(
              {
                _: "messages.searchGlobal",
                ...common,
                offsetRate: 0,
                offsetPeer: { _: "inputPeerEmpty" },
                offsetId: 0,
              },
              options,
            )
          : await this.#client.call(
              {
                _: "messages.search",
                ...common,
                peer: await this.#client.resolvePeer(await this.#inputOf(query.chat)),
                ...(query.from === undefined
                  ? {}
                  : { fromId: await this.#client.resolvePeer(await this.#inputOf(query.from)) }),
                offsetId: 0,
                addOffset: 0,
                maxId: 0,
                minId: 0,
                hash: Long.ZERO,
              },
              options,
            )
      if (found._ === "messages.messagesNotModified") return { items: [], hasMore: false, chats: [] }
      const peers = PeersIndex.from(found)
      const page = found.messages.filter((one) => one._ !== "messageEmpty").map((one) => new TgMessage(one, peers))
      const chats = new Map(page.map((message) => [String(message.chat.id), peerToChat(message.chat)]))
      return {
        items: page.map((message) => remoteHit(message, "remote_fetch")),
        hasMore: page.length === limit,
        chats: [...chats.values()],
      }
    })
  }

  /** Back from a moment, newest first as Telegram reads, answered oldest first. The filter cuts at the moment itself. */
  historyBefore(reference: string, { limit, time }: { limit: number; time: number }): Promise<Page<Message>> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const page = await this.#client.getHistory(peer, { limit, offset: { id: 0, date: Math.floor(time / 1000) } })
      const older = page.map(remoteMessage).filter((message) => Date.parse(message.timestamp) < time)
      return { items: older.reverse(), hasMore: page.next !== undefined }
    })
  }

  /** The chat as its dialog describes it, and for a group, who is in it — at most 200, Telegram's cap. */
  chat(reference: string): Promise<ChatCard> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const [dialog] = await this.#client.getPeerDialogs(peer)
      const found = dialog ? dialog.peer : await this.#client.getPeer(peer)
      const chat = dialog ? toChat(dialog) : peerToChat(found)
      if (chat.kind !== "group") return { ...chat, members: null }
      const members = await this.#membersOf(peer)
      return {
        ...chat,
        participantsCount: await this.#groupCount(found, members?.total ?? null),
        members: members?.map((member) => toMember(member.user)) ?? null,
      }
    })
  }

  /** How many profile photos they show and the oldest one's date: the newest first, so the last page holds it. */
  photos(person: string): Promise<{ count: number; oldestAt: string | null }> {
    return this.#call(async () => {
      const peer = await this.#inputOf(person)
      const newest = await this.#client.getProfilePhotos(peer, { limit: 1 })
      if (newest.total <= 1) return { count: newest.total, oldestAt: newest[0]?.date.toISOString() ?? null }
      const [oldest] = await this.#client.getProfilePhotos(peer, { offset: newest.total - 1, limit: 1 })
      return { count: newest.total, oldestAt: oldest?.date.toISOString() ?? null }
    })
  }

  /** A person, their bio, and the groups this account shares with them — newest conversation first. */
  contact(reference: string): Promise<PersonCard> {
    return this.#call(async () => {
      const { user, full, dialog, chats } = await this.#personOf(reference)
      return {
        ...toMember(user),
        description: full.bio || null,
        lastMessagedAt: dialog ? (toChat(dialog).lastMessageAt ?? null) : null,
        chats,
      }
    })
  }

  /** The same three requests as `contact`, with everything Telegram said kept. */
  profile(reference: string): Promise<ProfileFacts> {
    return this.#call(async () => {
      const { full, chats } = await this.#personOf(reference)
      return toProfileFacts(full, chats)
    })
  }

  async #personOf(reference: string) {
    const peer = await this.#inputOf(reference)
    const user = await this.#client.getPeer(peer)
    if (user.type !== "user") throw new CliError("validation_error", `"${reference}" is a chat, not a person`)
    const [full, [dialog], common] = await Promise.all([
      this.#client.getFullUser(peer),
      this.#client.getPeerDialogs(peer),
      this.#client.getCommonChats(peer),
    ])
    const dialogs = common.length > 0 ? await this.#client.getPeerDialogs(common.map((chat) => chat.id)) : []
    // Telegram's common chats are groups only; the one-to-one chat is shared with them too.
    const chats = [dialog ?? null, ...dialogs]
      .filter((one) => one !== null)
      .map(toChat)
      .map(({ id, title, kind, lastMessageAt }) => ({ id, title, kind, lastMessageAt }))
      .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
    return { user, full, dialog, chats }
  }

  /**
   * One request: history from just above the message, shifted `after` messages newer. Telegram's
   * offset id is exclusive, hence the `+ 1`; ids are not contiguous, so the window is cut by position.
   */
  fetchCounters(reference: string, messageId: string, fields: readonly CounterField[], signal?: AbortSignal) {
    const id = messageNumber(messageId)
    return this.#call(async () => {
      signal?.throwIfAborted()
      const [found] = await this.#client.getMessages(await this.#inputOf(reference), [id])
      signal?.throwIfAborted()
      return found
        ? (observedCounters(toMessage(found), new Date().toISOString(), fields).counterObservations ?? {})
        : {}
    })
  }

  around(reference: string, messageId: string, { before, after }: { before: number; after: number }) {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const page = await this.#client.getHistory(peer, {
        offset: { id: id + 1, date: 0 },
        addOffset: -after,
        limit: before + 1 + after,
      })
      const items = page.map(remoteMessage).reverse()
      const index = items.findIndex((message) => message.id === String(id))
      if (index < 0) throw new CliError("not_found", `no message ${id} in that chat`)
      return items
        .slice(Math.max(0, index - before), index + after + 1)
        .map((message) => (message.id === String(id) ? { ...message, anchor: true as const } : message))
    })
  }

  /** The chat a reference names — by title, id, `@username` or `me` — so a write can be checked before it goes. */
  resolve(reference: string): Promise<Chat> {
    return this.#call(async () => {
      const peer = await this.#peerOf(reference)
      return typeof peer === "object" && "kind" in peer ? peer : peerToChat(await this.#client.getPeer(peer))
    })
  }

  sendAsIdentities(chatId: string): Promise<SenderIdentity[]> {
    return this.#call(() => sendAsIdentities(this.#client, chatId))
  }

  savedSender(chatId: string): Promise<string | null> {
    return this.#call(() => savedSenderOf(this.#client, chatId, this.self()))
  }

  permalink(chatId: string, messageId: string) {
    const id = messageNumber(messageId, "a message id is a positive Telegram integer")
    if (id <= 0 || id > 2147483647)
      throw new CliError("validation_error", "a message id is a positive Telegram integer")
    return this.#call(async () => {
      const input = await this.#inputOf(chatId)
      const [found] = await this.#client.getMessages(input, [id])
      if (!found || found.id !== id) throw new CliError("not_found", "that message no longer exists in this chat")
      const peer = await this.#client.getPeer(input)
      if (peer.type !== "chat" || peer.raw._ !== "channel")
        return { url: null, access: "unavailable" as const, reason: "unsupported_chat" as const }
      const { link } = await this.#client.call({
        _: "channels.exportMessageLink",
        channel: await this.#client.resolveChannel(input),
        id,
        thread: true,
      })
      const url = new URL(link)
      const known = ["t.me", "telegram.me", "telegram.dog"].includes(url.hostname)
      const access = !known
        ? ("unknown" as const)
        : url.pathname.startsWith("/c/")
          ? ("restricted" as const)
          : ("public" as const)
      return { url: link, access, reason: null }
    })
  }

  /**
   * One logical send carries one `random_id`, made before the request and repeated by a retry:
   * Telegram delivers one message for both (measured 2026-09-27, across two connections).
   */
  send(
    chatId: string,
    text: string,
    {
      sendId,
      replyTo,
      threadId,
      silent,
      noPreview,
      markup,
      formatting,
      at,
      attachments = [],
      sendAs,
      spoiler,
      captionAbove,
    }: SendOptions,
  ): Promise<Sent> {
    const id = parseSendId(sendId)
    const thread = threadId === undefined ? undefined : topicNumber(threadId)
    const answering = replyTo === undefined ? undefined : messageNumber(replyTo, "a message id is a number")
    const author = sendAs === undefined ? undefined : sendAsPeer(chatId, sendAs, this.self())
    if (attachments.length > 1) throw new CliError("validation_error", "tg sends one file or photo per message")
    const spans = formatting ?? markup
    const body = spans ? toFormatted(text, spans) : text
    const common = {
      randomId: id,
      ...(thread === undefined || thread === 1 ? {} : { threadId: thread }),
      ...(answering === undefined ? {} : { replyTo: answering }),
      ...(silent ? { silent } : {}),
      ...(at === undefined ? {} : { schedule: new Date(at) }),
      ...(author === undefined ? {} : { sendAs: author }),
    }
    return this.#call(async () => {
      const [attachment] = attachments
      if (spoiler && attachment) checkSpoiler(attachment)
      const uploaded = attachment ? await uploadAttachment(this.#client, attachment) : undefined
      try {
        const message = attachment
          ? await this.#client.sendMedia(Number(chatId), toInputMedia(attachment, body, uploaded, { spoiler }), {
              ...common,
              ...(captionAbove ? { invert: true } : {}),
            })
          : await this.#client.sendText(Number(chatId), body, {
              ...common,
              ...(noPreview ? { disableWebPreview: true } : {}),
            })
        return { message: toMessage(message), sendId }
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          `the message may have been sent. Repeat with ${repeatWith(sendId, sendAs)}, never without it`,
          retryDetails(sendId, sendAs),
        )
      }
    })
  }

  /**
   * New messages, edits, deletions and reaction changes as they arrive, until `signal` aborts. Only
   * on an adapter opened with `listen`. `onReady` once the updates loop runs, not before.
   */
  async watch(onEvent: (event: MessageEvent) => void, signal: AbortSignal, onReady?: () => void): Promise<void> {
    const client = this.#client
    const message = (found: TgMessage) => onEvent({ event: "message", message: remoteHit(found, "remote_update") })
    const edit = (found: TgMessage) => onEvent({ event: "edit", message: remoteHit(found, "remote_update") })
    const deletion = (update: DeleteMessageUpdate) => {
      for (const change of toDeletions(update)) onEvent(change)
    }
    const raw = (info: RawUpdateInfo) => {
      const change = toReactionChange(info)
      if (change?.event === "reaction")
        onEvent({
          ...change,
          counterObservation: {
            value: change.reactions.total,
            observedAt: new Date().toISOString(),
            source: "remote_update",
            reactions: change.reactions,
          },
        })
      else if (change) onEvent(change)
    }
    client.onNewMessage.add(message)
    client.onEditMessage.add(edit)
    client.onDeleteMessage.add(deletion)
    client.onRawUpdate.add(raw)
    try {
      await this.#call(async () => {
        await client.connect()
        // With catchUp, mtcute fetches the updates state in the background and, on a revoked login,
        // quietly stops its loop — serve would sit "connected" forever. Asking first makes it fail here.
        await client.call({ _: "updates.getState" })
        await client.startUpdatesLoop()
      })
      onReady?.()
      await this.#untilStopped(signal)
    } finally {
      client.onNewMessage.remove(message)
      client.onEditMessage.remove(edit)
      client.onDeleteMessage.remove(deletion)
      client.onRawUpdate.remove(raw)
    }
  }

  /**
   * Until `signal` aborts, or the login or mtcute's updates loop is found gone. mtcute stops the loop
   * without a word on AUTH_KEY_UNREGISTERED (`highlevel/updates/manager.js`, `_fetchUpdatesState` and
   * `_fetchDifferenceLater`), usually met by its own 15-minute keep-alive; the heartbeat asks itself
   * at the same rate, in case that path never runs. A refused login ends the watch with exit 4; a
   * stopped loop otherwise with exit 12, which a service unit restarts — never a process that looks
   * connected and receives nothing. A heartbeat that fails for any other reason is let pass.
   */
  async #untilStopped(signal: AbortSignal): Promise<void> {
    const updates = (this.#client._client as unknown as { updates?: { updatesLoopActive: boolean } } | undefined)
      ?.updates
    for (let tick = 1; ; tick += 1) {
      await pause(LOOP_CHECK_MS, signal)
      if (signal.aborted) return
      const down = updates?.updatesLoopActive === false
      if (!down && tick % HEARTBEAT_TICKS !== 0) continue
      const refusal = await this.#askState()
      if (signal.aborted) return
      if (refusal?.code === "authentication_error") throw refusal
      if (down) throw new CliError("provider_unavailable", LOOP_STOPPED, refusal ? { cause: refusal.code } : {})
    }
  }

  /** `updates.getState` under a timer of its own: a request that never answers must not hold the watch. */
  async #askState(): Promise<CliError | undefined> {
    let timer: NodeJS.Timeout | undefined
    const late = new Promise<CliError>((resolve) => {
      timer = setTimeout(() => resolve(new CliError("timeout", "Telegram did not answer in time")), STATE_WAIT_MS)
    })
    const asked = this.#call(() => this.#client.call({ _: "updates.getState" })).then(
      () => undefined,
      (error: unknown) => (isCliError(error) ? error : new CliError("provider_error", "Telegram failed")),
    )
    try {
      return await Promise.race([asked, late])
    } finally {
      clearTimeout(timer)
    }
  }

  scheduled(reference: string): Promise<Message[]> {
    return this.#call(async () => {
      const queued = await this.#client.getAllScheduledMessages(await this.#inputOf(reference))
      return queued.map(toMessage).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  /** The message is fetched again, never taken from the store: Telegram's file references expire. */
  download(reference: string, messageId: string): Promise<Download> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(async () => {
      const [found] = await this.#client.getMessages(await this.#inputOf(reference), id)
      if (!found) throw new CliError("not_found", `no message ${id} in that chat`)
      const media = found.media
      if (!media) return { files: [], skipped: [] }
      if (!(media instanceof FileLocation)) return { files: [], skipped: [media.type] }
      const [{ kind, name, mime, size }] = attachmentsOf(media) as [Attachment]
      const client = this.#client
      const login = this.#login
      async function* bytes() {
        try {
          yield* client.downloadAsIterable(media as FileLocation)
        } catch (error) {
          throw toCliError(error, login)
        }
      }
      return { files: [{ kind, name, mime, size, bytes }], skipped: [] }
    })
  }

  /**
   * Telegram's own speech recognition; mtcute has no high-level method for `messages.transcribeAudio`.
   * A first answer is usually still pending. The finished text arrives as an update, which a one-shot
   * connection does not receive, but asking again returns it — measured 2026-09-29 on a 19 s voice note.
   */
  transcribe(reference: string, messageId: string): Promise<Transcript> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(async () => {
      const peer = await this.#client.resolvePeer(await this.#inputOf(reference))
      const deadline = Date.now() + TRANSCRIBE_WAIT_MS
      for (;;) {
        const answer = await this.#client.call({ _: "messages.transcribeAudio", peer, msgId: id })
        if (answer.pending !== true || Date.now() >= deadline) {
          return { text: answer.text, pending: answer.pending === true }
        }
        await sleep(TRANSCRIBE_POLL_MS)
      }
    })
  }

  /** Forgets the session on Telegram's side too, so the device disappears from the account's list. */
  logout(): Promise<void> {
    return this.#call(async () => {
      await this.#client.logOut()
    })
  }

  async close(): Promise<void> {
    await this.#client.destroy()
    for (const suffix of ["", "-wal", "-shm"]) {
      const path = `${this.#sessionPath}${suffix}`
      if (existsSync(path)) chmodSync(path, 0o600)
    }
  }

  /**
   * An edit has no `random_id`, but setting the same text twice is harmless: Telegram answers the
   * repeat with MESSAGE_NOT_MODIFIED, taken here as done — so a retry after an unknown outcome is safe.
   */
  edit(
    chatId: string,
    messageId: string,
    text: string,
    { markup, formatting }: { markup?: Markup[]; formatting?: TextSpan[] } = {},
  ): Promise<Message> {
    const id = messageNumber(messageId, "a message id is a number")
    const spans = formatting ?? markup
    const body = spans ? toFormatted(text, spans) : text
    return this.#call(async () => {
      try {
        return toMessage(await this.#client.editMessage({ chatId: Number(chatId), message: id, text: body }))
      } catch (error) {
        if (tl.RpcError.is(error, "MESSAGE_NOT_MODIFIED")) {
          const [current] = await this.#client.getMessages(Number(chatId), [id])
          if (current) return toMessage(current)
        }
        throw unknownIfUnanswered(error, "the edit may have been made — repeating it is safe")
      }
    })
  }

  /**
   * The raw call, because mtcute's `forwardMessagesById` draws the `random_id` itself: a retry has to
   * repeat the first one for Telegram to keep one copy, as a send does.
   */
  forward(
    fromChatId: string,
    messageId: string,
    toChatId: string,
    { sendId, silent, sendAs, threadId }: { sendId: string; silent?: boolean; sendAs?: string; threadId?: string },
  ): Promise<Message> {
    const id = messageNumber(messageId, "a message id is a number")
    const randomId = parseSendId(sendId)
    const thread = threadId === undefined ? undefined : topicNumber(threadId)
    const author = sendAs === undefined ? undefined : sendAsPeer(toChatId, sendAs, this.self())
    return this.#call(async () => {
      try {
        const updates = await this.#client.call({
          _: "messages.forwardMessages",
          fromPeer: await this.#client.resolvePeer(Number(fromChatId)),
          toPeer: await this.#client.resolvePeer(Number(toChatId)),
          id: [id],
          randomId: [randomId],
          ...(silent ? { silent } : {}),
          ...(thread === undefined || thread === 1 ? {} : { topMsgId: thread }),
          ...(author === undefined ? {} : { sendAs: await this.#client.resolvePeer(author) }),
        })
        this.#client.handleClientUpdate(updates, true)
        const copy = forwardedCopy(updates)
        if (!copy) throw new CliError("provider_error", "Telegram answered the forward without the new message")
        return toMessage(copy)
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          `the message may have been forwarded. Repeat with ${repeatWith(sendId, sendAs)}, never without it`,
          retryDetails(sendId, sendAs),
        )
      }
    })
  }

  /** In a one-to-one chat the pin is on the owner's side only; `notify` reaches groups alone, as Telegram has it. */
  pin(chatId: string, messageId: string, { notify }: { notify: boolean }): Promise<void> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#write("the pin may have been made — repeating it is safe", async () => {
      await this.#client.pinMessage({ chatId: Number(chatId), message: id, notify })
    })
  }

  unpin(chatId: string, messageId: string): Promise<void> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#write("the message may have been unpinned — repeating it is safe", async () => {
      await this.#client.unpinMessage({ chatId: Number(chatId), message: id })
    })
  }

  /**
   * Telegram sets the owner's reactions as a whole, so one emoji replaces what was there. An emoji the
   * chat does not allow, or a second one without Premium, comes back as Telegram's refusal.
   */
  react(chatId: string, messageId: string, emoji: string | null): Promise<void> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#write("the reaction may have been set — repeating it is safe", async () => {
      await this.#client.sendReaction({ chatId: Number(chatId), message: id, emoji })
    })
  }

  /** Up to `until`, or everything; mentions stay, as Telegram's own clients leave them until they are seen. */
  markRead(chatId: string, until?: string): Promise<void> {
    const maxId = until === undefined ? undefined : messageNumber(until, "--until takes a message id")
    return this.#write("the chat may have been marked read — repeating it is safe", async () => {
      await this.#client.readHistory(Number(chatId), maxId === undefined ? {} : { maxId })
    })
  }

  /** Telegram reads a topic as a discussion thread, up to a message id: without `until`, the topic's newest. */
  markTopicRead(chatId: string, topicId: string, until?: string): Promise<void> {
    const id = topicNumber(topicId)
    const maxId = until === undefined ? undefined : messageNumber(until, "--until takes a message id")
    return this.#write("the topic may have been marked read — repeating it is safe", async () => {
      let readMaxId = maxId
      if (readMaxId === undefined) {
        const [topic] = await this.#client.getForumTopicsById(Number(chatId), id)
        if (!topic) throw new CliError("not_found", `no topic ${topicId} in that chat`)
        readMaxId = topic.lastMessage.id
      }
      await this.#client.call({
        _: "messages.readDiscussion",
        peer: await this.#client.resolvePeer(Number(chatId)),
        msgId: id,
        readMaxId,
      })
    })
  }

  /**
   * mtcute deletes for everyone unless told otherwise, so `revoke` is always passed. In a supergroup or
   * a channel Telegram has no "for me": a deletion there is for everyone, and without `forEveryone` it is refused.
   *
   * **Outside a channel the ids are checked against the chat first.** Telegram numbers private-chat and
   * basic-group messages per account and `messages.deleteMessages` takes no chat, so an id from another
   * chat — or the other side's number for the same message — deletes whatever this account has under it
   * (SEC-30). `getMessages` answers null for an id that is not in the chat it was given.
   */
  async delete(chatId: string, messageIds: string[], { forEveryone }: { forEveryone: boolean }): Promise<void> {
    const ids = messageIds.map((id) => messageNumber(id, "a message id is a number"))
    const peer = await this.#call(async () => {
      const peer = await this.#client.resolvePeer(Number(chatId))
      if (peer._ === "inputPeerChannel") {
        if (!forEveryone) {
          throw new CliError(
            "validation_error",
            "in a supergroup or a channel Telegram deletes for everyone — add --for-everyone if that is what you want",
          )
        }
        return peer
      }
      const found = await this.#client.getMessages(peer, ids)
      const missing = ids.filter((_, index) => found[index] == null)
      if (missing.length > 0) {
        throw new CliError(
          "validation_error",
          `no message ${missing.join(", ")} in chat ${chatId} — not in this chat, or already deleted; nothing was deleted`,
        )
      }
      return peer
    })
    return this.#write("the messages may have been deleted — repeating it is safe", async () => {
      await this.#client.deleteMessagesById(peer, ids, { revoke: forEveryone })
    })
  }

  poll(chatId: string, messageId: string): Promise<Poll> {
    return this.#call(async () => toPoll(chatId, messageId, await this.#pollOf(chatId, messageId)))
  }

  pollVoters(chatId: string, messageId: string, window: { limit: number; answerId?: string }) {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(() => pollVotersOf(this.#client, Number(chatId), id, window))
  }

  /** Votes by the answers' own bytes, never by index: mtcute would fetch the poll and pick by position. */
  vote(chatId: string, messageId: string, answerIds: string[]): Promise<Poll> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(async () => {
      const current = await this.#pollOf(chatId, messageId)
      const known = new Map(current.answers.map((answer) => [answerId(answer.data), answer.data]))
      const unknown = answerIds.filter((answer) => !known.has(answer))
      if (unknown.length > 0) {
        throw new CliError(
          "validation_error",
          `${unknown.join(", ")} ${unknown.length === 1 ? "is" : "are"} not an answer of this poll — its answers are ${[...known.keys()].join(", ")}`,
        )
      }
      refuseVote(current, answerIds)
      const options = answerIds.length === 0 ? null : answerIds.map((answer) => known.get(answer) as Uint8Array)
      try {
        return toPoll(chatId, messageId, await this.#client.sendVote({ chatId: Number(chatId), message: id, options }))
      } catch (error) {
        throw unknownIfUnanswered(error, "the vote may have been cast — repeating it is safe")
      }
    })
  }

  closePoll(chatId: string, messageId: string): Promise<Poll> {
    const id = messageNumber(messageId, "a message id is a number")
    return this.#call(async () => {
      refuseClose(await this.#pollOf(chatId, messageId))
      try {
        return toPoll(chatId, messageId, await this.#client.closePoll({ chatId: Number(chatId), message: id }))
      } catch (error) {
        throw unknownIfUnanswered(error, "the poll may have been closed; check `tg polls show` before repeating")
      }
    })
  }

  /**
   * One `random_id` per logical create, as a send has: a retry repeats it and Telegram keeps one poll
   * (measured 2026-10-08: the second call answered the first poll's message id — unlike topic creation).
   */
  createPoll(
    chatId: string,
    poll: NewPoll,
    { sendId, silent, threadId, sendAs }: { sendId: string; silent?: boolean; threadId?: string; sendAs?: string },
  ): Promise<Sent> {
    const randomId = parseSendId(sendId)
    const thread = threadId === undefined ? undefined : topicNumber(threadId)
    const author = sendAs === undefined ? undefined : sendAsPeer(chatId, sendAs, this.self())
    return this.#call(async () => {
      try {
        const message = await this.#client.sendMedia(Number(chatId), toInputPoll(poll), {
          randomId,
          ...(thread === undefined || thread === 1 ? {} : { threadId: thread }),
          ...(silent ? { silent } : {}),
          ...(author === undefined ? {} : { sendAs: author }),
        })
        return { message: toMessage(message), sendId }
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          `the poll may have been sent. Repeat with ${repeatWith(sendId, sendAs)}, never without it`,
          retryDetails(sendId, sendAs),
        )
      }
    })
  }

  async #pollOf(chatId: string, messageId: string): Promise<TgPoll> {
    const id = messageNumber(messageId, "a message id is a number")
    const [found] = await this.#client.getMessages(Number(chatId), [id])
    if (!found) throw new CliError("not_found", `no message ${id} in that chat`)
    if (found.media?.type !== "poll") throw new CliError("not_found", `message ${id} carries no poll`)
    return found.media
  }

  /** A name is matched against the dialogs and answered as the chat it found; anything else goes to Telegram as it is. */
  async #peerOf(reference: string): Promise<InputPeerLike | Chat> {
    const trimmed = reference.trim()
    if (SAVED.has(trimmed.toLowerCase())) return "me"
    if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
    if (trimmed.startsWith("@")) return trimmed.slice(1)

    return pickChat(trimmed, await this.#dialogs(Number.POSITIVE_INFINITY))
  }

  /**
   * Each chat once, up to `wanted`. With archived chats kept, Telegram's dialog pages bring the
   * pinned chats again further down: 8 of 1361 were listed twice on 2026-10-01, and a pinned chat's
   * title then matched itself as two chats.
   */
  async #pull(walk: DialogWalk, wanted: number): Promise<Chat[]> {
    const chats = walk.held
    while (chats.length < wanted) {
      const next = await walk.dialogs.next()
      if (next.done) break
      const chat = toChat(next.value)
      if (walk.seen.has(chat.id)) continue
      walk.seen.add(chat.id)
      chats.push(chat)
    }
    return chats
  }

  async #dialogs(wanted: number): Promise<Chat[]> {
    const seen = new Set<string>()
    const chats: Chat[] = []
    for await (const dialog of this.#client.iterDialogs({ archived: "keep" })) {
      const chat = toChat(dialog)
      if (seen.has(chat.id)) continue
      seen.add(chat.id)
      chats.push(chat)
      if (chats.length >= wanted) break
    }
    return chats
  }

  async #inputOf(reference: string): Promise<InputPeerLike> {
    const peer = await this.#peerOf(reference)
    return typeof peer === "object" && "kind" in peer ? Number(peer.id) : peer
  }

  /** An invite is previewed; one the owner already joined, or a public link, is read as the chat. Nothing joins. */
  inspect(link: string): Promise<LinkTarget> {
    const typed = link.trim()
    const invite = /(t\.me|telegram\.me)\/(\+|joinchat\/)|^tg:\/\/join/.test(typed)
    return this.#call(async () => {
      if (invite) {
        try {
          return toInvitePreview(await this.#client.getChatPreview(typed))
        } catch (error) {
          if (!(error instanceof MtPeerNotFoundError)) throw error
        }
      }
      return toLinkChat(await this.#client.getFullChat(invite ? typed : publicName(typed)))
    })
  }

  forumState(chatId: string): Promise<ForumState> {
    return this.#call(() => this.#forumState(chatId))
  }

  async #forumState(chatId: string): Promise<ForumState> {
    let full = await this.#client.getFullChat(Number(chatId))
    if (full.migratedToId != null) full = await this.#client.getFullChat(full.migratedToId)
    if (full.chatType !== "group" && full.chatType !== "supergroup") {
      throw new CliError("validation_error", "forum topics require a group, not a channel or dialog")
    }
    return {
      chat: peerToChat(full),
      forum: full.isForum,
      needsUpgrade: full.chatType === "group",
      owner: full.isCreator,
      linkedDiscussion: full.linkedChat !== null,
      canCreate:
        full.isCreator ||
        full.adminRights?.manageTopics === true ||
        full.permissions?.canManageTopics === true ||
        full.defaultPermissions?.canManageTopics === true,
    }
  }

  upgradeForum(chatId: string): Promise<ForumState> {
    return this.#call(async () => {
      const state = await this.#forumState(chatId)
      if (!state.owner) throw new CliError("permission_error", "only the owner can prepare this group for topics")
      if (!state.needsUpgrade) return state
      const peer = await this.#client.resolvePeer(Number(state.chat.id))
      if (peer._ !== "inputPeerChat") throw new CliError("validation_error", "only a basic group can be upgraded")
      let accepted = false
      let migratedChatId: string | undefined
      try {
        const updates = await this.#client.call(
          { _: "messages.migrateChat", chatId: peer.chatId },
          { maxRetryCount: 0, floodSleepThreshold: 0 },
        )
        accepted = true
        this.#client.handleClientUpdate(updates, true)
        const made =
          updates._ === "updates" || updates._ === "updatesCombined"
            ? updates.chats.find((chat) => chat._ === "channel" && chat.megagroup)
            : undefined
        if (made?._ !== "channel")
          throw new CliError(
            "outcome_unknown",
            "the group may have been upgraded; check its current chat id before repeating",
          )
        migratedChatId = String(getMarkedPeerId({ _: "peerChannel", channelId: made.id }))
        return await this.#forumState(migratedChatId)
      } catch (error) {
        if (accepted)
          throw new CliError(
            "outcome_unknown",
            "the upgrade was accepted but its state could not be read; check the current group before continuing",
            {
              previousChatId: state.chat.id,
              ...(migratedChatId === undefined ? {} : { chatId: migratedChatId, upgraded: true }),
              stage: "upgrade",
            },
          )
        throw unknownIfUnanswered(error, "the group may have been upgraded; check its current chat id before repeating")
      }
    })
  }

  enableForum(chatId: string): Promise<ForumState> {
    return this.#call(async () => {
      const state = await this.#forumState(chatId)
      if (!state.owner) throw new CliError("permission_error", "only the group owner can enable forum topics")
      if (state.needsUpgrade)
        throw new CliError("validation_error", "upgrade the basic group explicitly before enabling topics")
      if (state.linkedDiscussion)
        throw new CliError("validation_error", "a linked discussion group cannot enable forum topics")
      if (state.forum) return state
      try {
        const full = await this.#client.getFullChat(Number(state.chat.id))
        await this.#client.updateForumSettings(Number(state.chat.id), {
          isForum: true,
          threadsMode: full.raw._ === "channel" && full.raw.forumTabs ? "tabs" : "list",
        })
        return await this.#forumState(state.chat.id)
      } catch (error) {
        if (tl.RpcError.is(error, "CHAT_NOT_MODIFIED")) return this.#forumState(state.chat.id)
        throw unknownIfUnanswered(error, "topics may have been enabled; check the forum state before repeating")
      }
    })
  }

  createTopic(chatId: string, title: string, { sendId }: { sendId: string }): Promise<Topic> {
    const randomId = parseSendId(sendId)
    return this.#call(async () => {
      const state = await this.#forumState(chatId)
      if (!state.forum || state.needsUpgrade)
        throw new CliError("validation_error", "enable topics before creating a topic")
      if (!state.canCreate) throw new CliError("permission_error", "creating a topic requires manage-topics permission")
      let accepted = false
      try {
        const updates = await this.#client.call(
          {
            _: "messages.createForumTopic",
            peer: await this.#client.resolvePeer(Number(state.chat.id)),
            title,
            randomId,
          },
          { maxRetryCount: 0, floodSleepThreshold: 0 },
        )
        accepted = true
        this.#client.handleClientUpdate(updates, true)
        const message = forwardedCopy(updates)
        const mapped =
          updates._ === "updates" || updates._ === "updatesCombined"
            ? updates.updates.find(
                (update) => update._ === "updateMessageID" && String(update.randomId) === String(randomId),
              )
            : undefined
        const topicId = mapped && mapped._ === "updateMessageID" ? mapped.id : message?.id
        if (topicId === undefined)
          throw new CliError(
            "outcome_unknown",
            "Telegram did not return the topic id; check topics list and do not repeat this creation",
            { sendId, retryable: false },
          )
        const [topic] = await this.#client.getForumTopicsById(Number(state.chat.id), topicId)
        if (!topic)
          throw new CliError(
            "outcome_unknown",
            "the topic may exist but could not be read; check topics list and do not repeat this creation",
            { sendId, retryable: false },
          )
        return toTopic(topic)
      } catch (error) {
        if (accepted)
          throw new CliError(
            "outcome_unknown",
            "topic creation was accepted but its result could not be read; check topics list and do not repeat",
            { sendId, retryable: false },
          )
        throw unknownIfUnanswered(
          error,
          `the topic may have been created; check topics list and do not repeat this creation`,
          { sendId, retryable: false },
        )
      }
    })
  }

  /**
   * A repeat answers TOPIC_NOT_MODIFIED: the change is already there, so the topic is read back as for a first.
   * Pinning is Telegram's own call, made after the edit.
   */
  editTopic(chatId: string, topicId: string, { title, closed, pinned, hidden }: TopicChange): Promise<Topic> {
    const id = topicNumber(topicId)
    if (hidden !== undefined && id !== 1)
      throw new CliError("validation_error", "only the General topic (id 1) can be hidden")
    return this.#call(async () => {
      const unchanged = (error: unknown) => {
        if (!tl.RpcError.is(error, "TOPIC_NOT_MODIFIED") && !tl.RpcError.is(error, "PINNED_TOPIC_NOT_MODIFIED"))
          throw unknownIfUnanswered(error, "the topic may have changed — repeating it is safe")
      }
      if (title !== undefined || closed !== undefined) {
        await this.#client
          .editForumTopic({
            chatId: Number(chatId),
            topicId: id,
            ...(title === undefined ? {} : { title }),
            ...(closed === undefined ? {} : { closed }),
          })
          .catch(unchanged)
      }
      if (pinned !== undefined)
        await this.#client.toggleForumTopicPinned({ chatId: Number(chatId), topicId: id, pinned }).catch(unchanged)
      if (hidden !== undefined)
        await this.#client.toggleGeneralTopicHidden({ chatId: Number(chatId), hidden }).catch(unchanged)
      const [topic] = await this.#client.getForumTopicsById(Number(chatId), id)
      if (!topic) throw new CliError("not_found", `no topic ${topicId} in that chat`)
      // Measured 2026-10-04: a read right after the edit can still show the title and state of edits ago.
      return {
        ...toTopic(topic),
        ...(title === undefined ? {} : { title }),
        ...(closed === undefined ? {} : { closed }),
        ...(pinned === undefined ? {} : { pinned }),
        ...(hidden === undefined ? {} : { hidden }),
      }
    })
  }

  /** Without `force` Telegram only reorders: a topic that is not pinned stays as it is. */
  orderPinnedTopics(chatId: string, topicIds: string[]): Promise<void> {
    const order = topicIds.map(topicNumber)
    return this.#call(async () => {
      try {
        await this.#client.reorderPinnedForumTopics({ chatId: Number(chatId), order })
      } catch (error) {
        throw unknownIfUnanswered(error, "the pinned topics may have been reordered — repeating it is safe")
      }
    })
  }

  /** Telegram deletes the topic's history with it; a topic that is gone answers TOPIC_ID_INVALID, `not_found`. */
  deleteTopic(chatId: string, topicId: string): Promise<void> {
    const topic = topicNumber(topicId)
    return this.#call(async () => {
      try {
        await this.#client.deleteForumTopicHistory(Number(chatId), topic)
      } catch (error) {
        throw unknownIfUnanswered(error, "the topic may have been deleted; check `tg topics list` before repeating")
      }
    })
  }

  async validateThread(chatId: string, threadId: string, { replyTo }: { replyTo?: string }): Promise<void> {
    const topicId = topicNumber(threadId)
    const replyId = replyTo === undefined ? undefined : messageNumber(replyTo, "--reply-to needs a message id")
    return this.#call(async () => {
      const peer = await this.#client.getPeer(Number(chatId))
      if (peer.type !== "chat" || !peer.isForum) {
        throw new CliError("validation_error", "--topic requires a Telegram forum group")
      }
      const [topic] = await this.#client.getForumTopicsById(Number(chatId), topicId)
      if (!topic) throw new CliError("not_found", "that forum topic does not exist; check `topics list`")
      if (topic.isClosed) throw new CliError("permission_error", "that forum topic is closed; choose an open topic")
      if (replyId !== undefined) {
        const [reply] = await this.#client.getMessages(Number(chatId), [replyId])
        if (!reply) throw new CliError("not_found", "the message to reply to no longer exists in this chat")
        const replyThread = reply.isTopicMessage ? (reply.replyToMessage?.threadId ?? reply.id) : 1
        if (reply.id !== topicId && replyThread !== topicId) {
          throw new CliError("validation_error", "--reply-to belongs to a different topic; choose a message in --topic")
        }
      }
    })
  }

  topic(reference: string, topicId: string): Promise<Topic> {
    const id = topicNumber(topicId)
    return this.#call(async () => {
      const input = await this.#inputOf(reference)
      const peer = await this.#client.getPeer(input)
      if (peer.type !== "chat" || !peer.isForum) throw new CliError("validation_error", "that chat has no topics")
      const [topic] = await this.#client.getForumTopicsById(input, id)
      if (!topic) throw new CliError("not_found", "that forum topic does not exist; check `topics list`")
      return toTopic(topic)
    })
  }

  /** A forum's topics, newest activity first; Telegram matches `search` against their titles. */
  topics(
    reference: string,
    { search, limit, offset }: { search?: string; limit?: number; offset: number },
  ): Promise<Page<Topic>> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const items: Topic[] = []
      const wanted = limit === undefined ? {} : { limit: offset + limit + 1 }
      for await (const topic of this.#client.iterForumTopics(peer, {
        ...wanted,
        ...(search ? { query: search } : {}),
      })) {
        items.push(toTopic(topic))
      }
      const end = limit === undefined ? items.length : offset + limit
      return { items: items.slice(offset, end), hasMore: items.length > end }
    })
  }

  /** Telegram answers only where the person's privacy lets the owner find them by number. */
  lookup(phone: string): Promise<Member> {
    return this.#call(async () => toMember(await this.#client.getPeer(await this.#client.resolvePhoneNumber(phone))))
  }

  /** The owner's Telegram contacts — the address book, not the chats. */
  addressBook(): Promise<Member[]> {
    return this.#call(async () => (await this.#client.getContacts()).map(toMember))
  }

  /** Every device and app logged in; the IP address Telegram also sends is left out. */
  sessions(): Promise<AccountSession[]> {
    return this.#call(async () => {
      const { authorizations } = await this.#client.call({ _: "account.getAuthorizations" })
      return authorizations.map(toAccountSession)
    })
  }

  /**
   * A page of a group's members, 200 a request, a second apart. Telegram gives at most `MEMBERS_MAX` of a big
   * group, and a group that hides its list answers only its admins or refuses.
   */
  members(
    reference: string,
    { limit, offset }: { limit?: number; offset: number },
  ): Promise<Page<GroupMember> & { chatId: string; participantsCount: number | null }> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const group = await this.#client.getPeer(peer)
      const wanted = Math.min(limit ?? MEMBERS_MAX, MEMBERS_MAX - offset)
      const found: GroupMember[] = []
      let total: number | null = null
      while (found.length < wanted) {
        if (found.length > 0) await new Promise((resolve) => setTimeout(resolve, MEMBER_PAGE_PAUSE_MS))
        const size = Math.min(200, wanted - found.length)
        const page = await this.#client.getChatMembers(peer, { offset: offset + found.length, limit: size })
        total = page.total
        found.push(...page.map(toGroupMember))
        if (page.length < size) break
      }
      return {
        chatId: String(group.id),
        items: found,
        hasMore: offset + found.length < Math.min(total ?? 0, MEMBERS_MAX),
        participantsCount: offset === 0 ? await this.#groupCount(group, total) : null,
      }
    })
  }

  /**
   * Service messages back to `since`, newest page first, at most `EVENT_PAGES` of them — a busy
   * group's week can be thousands. The people a message names only by id are looked up in one call.
   */
  chatEvents(reference: string, { since }: { since: number }): Promise<ChatEvents> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const found: { message: TgMessage; change: EventOf }[] = []
      let offset: { id: number; date: number } | undefined
      let more = false
      for (let read = 1; ; read++) {
        const page = await this.#client.getHistory(peer, { limit: 100, ...(offset ? { offset } : {}) })
        for (const message of page) {
          const change = message.date.getTime() > since ? eventOf(message) : null
          if (change) found.push({ message, change })
        }
        const oldest = page.at(-1)
        if (!page.next || !oldest || oldest.date.getTime() <= since) break
        if (read >= EVENT_PAGES) {
          more = true
          break
        }
        offset = page.next
      }

      const names = new Map(found.map(({ message }) => [message.sender.id, message.sender.displayName || null]))
      const unknown = [...new Set(found.flatMap(({ change }) => [change.by, ...change.people]))].filter(
        (id) => !names.has(id),
      )
      if (unknown.length > 0) {
        for (const user of await this.#client.getUsers(unknown)) if (user) names.set(user.id, user.displayName || null)
      }
      const person = (id: number) => ({ id: String(id), name: names.get(id) ?? null })

      return {
        chatId: String((await this.#client.getPeer(peer)).id),
        since: new Date(since).toISOString(),
        more,
        events: found.reverse().map(({ message, change }) => ({
          messageId: String(message.id),
          timestamp: message.date.toISOString(),
          event: change.event,
          by: person(change.by),
          people: change.people.map(person),
          ...(change.title === undefined ? {} : { title: change.title }),
        })),
      }
    })
  }

  /**
   * A group's admins and its creator, for `review --unanswered`; `null` when the group hides them.
   * A basic group ignores the `admins` filter and answers everyone, hence the status check.
   */
  admins(reference: string): Promise<string[] | null> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      try {
        const members = await this.#client.getChatMembers(peer, { type: "admins", limit: 200 })
        return members
          .filter((member) => member.status === "creator" || member.status === "admin")
          .map((member) => String(member.user.id))
      } catch (error) {
        const known = toCliError(error, this.#login)
        if (known instanceof CliError && known.code === "permission_error") return null
        throw known
      }
    })
  }

  /** `null` when the group hides its member list from us: that is an answer about the group, not a failure. */
  /** Each reference as a user id, in order; a group or a channel is not a person and is refused. */
  people(references: string[]): Promise<string[]> {
    return this.#call(async () => {
      const ids: string[] = []
      for (const reference of references) {
        const peer = await this.#client.getPeer(await this.#inputOf(reference))
        if (peer.type !== "user") throw new CliError("validation_error", `${reference} is a chat, not a person`)
        ids.push(String(peer.id))
      }
      return ids
    })
  }

  /**
   * Always a supergroup, never a legacy group: a legacy group turns into a supergroup on some changes
   * and its id changes with it. The people are added after, so a group exists even if some cannot be.
   */
  createGroup(title: string, people: string[], { channel }: { channel: boolean }): Promise<GroupCard> {
    return this.#call(async () => {
      try {
        const made = channel
          ? await this.#client.createChannel({ title })
          : await this.#client.createSupergroup({ title })
        const missing = people.length > 0 ? await this.#client.addChatMembers(made.id, people.map(Number), {}) : []
        const card = toGroupCard(await this.#client.getFullChat(made.id))
        if (missing.length === 0) return card
        const notAdded = missing.map((one) => String(one.userId))
        return { ...card, providerMetadata: { ...card.providerMetadata, notAdded } }
      } catch (error) {
        throw unknownIfUnanswered(error, "the group may or may not have been made; check `tg chats list`")
      }
    })
  }

  /** An invite link, or a public one; a group that asks its admins first answers `requested`. */
  join(link: string): Promise<GroupCard | { requested: true }> {
    const typed = link.trim()
    const invite = /(t\.me|telegram\.me)\/(\+|joinchat\/)|^tg:\/\/join/.test(typed)
    return this.#call(async () => {
      let joined: Awaited<ReturnType<TelegramClient["joinChat"]>>
      try {
        joined = await this.#client.joinChat(invite ? typed : publicName(typed))
      } catch (error) {
        throw unknownIfUnanswered(error, "you may or may not have joined; check `tg chats list`")
      }
      if (joined.status === "request_sent") return { requested: true as const }
      if (joined.status !== "ok") {
        throw new CliError(
          "provider_error",
          "this group asks a bot to check who joins, which only the Telegram app can show",
        )
      }
      return toGroupCard(await this.#client.getFullChat(joined.chat.id))
    })
  }

  leave(reference: string): Promise<{ chatId: string }> {
    return this.#call(async () => {
      const peer = await this.#inputOf(reference)
      const chatId = String((await this.#client.getPeer(peer)).id)
      try {
        await this.#client.leaveChat(peer)
      } catch (error) {
        throw unknownIfUnanswered(error, "you may or may not have left; check `tg chats list`")
      }
      return { chatId }
    })
  }

  group(reference: string): Promise<GroupCard> {
    return this.#call(async () => toGroupCard(await this.#client.getFullChat(await this.#inputOf(reference))))
  }

  /**
   * Telegram computes these only on the chat's statistics server (`stats_dc`); mtcute opens that
   * connection and carries the login over itself, and `close` ends it with the others.
   */
  officialChatStats(reference: string): Promise<OfficialChatStats> {
    return this.#call(async () => {
      let full = await this.#client.getFullChat(await this.#inputOf(reference))
      if (full.migratedToId != null) full = await this.#client.getFullChat(full.migratedToId)
      const broadcast = full.chatType === "channel"
      if (!broadcast && full.chatType !== "supergroup" && full.chatType !== "gigagroup") {
        throw new CliError(
          "validation_error",
          full.chatType === "group"
            ? "Telegram keeps statistics only for supergroups and channels, not for a basic group"
            : "Telegram keeps statistics only for supergroups and channels",
        )
      }
      if (!full.canViewStats) {
        throw new CliError(
          "permission_error",
          "Telegram shows statistics only to admins of large enough groups and channels, and not for this one",
        )
      }
      const statsDc = full.full._ === "channelFull" ? full.full.statsDc : undefined
      const options = statsDc === undefined ? undefined : { dcId: statsDc }
      const channel = await this.#client.resolveChannel(full.id)
      const chat = { id: String(full.id), title: full.displayName }
      const graphOf: GraphOf = async (graph) => {
        if (graph._ === "statsGraph") return toOfficialGraph(graph.json.data)
        if (graph._ === "statsGraphError") return { error: graph.error }
        try {
          const loaded = await this.#client.call({ _: "stats.loadAsyncGraph", token: graph.token }, options)
          if (loaded._ === "statsGraph") return toOfficialGraph(loaded.json.data)
          return { error: loaded._ === "statsGraphError" ? loaded.error : "Telegram did not finish this graph" }
        } catch (error) {
          if (tl.RpcError.is(error)) return { error: error.text }
          throw error
        }
      }
      try {
        return broadcast
          ? await toOfficialChannelStats(
              chat,
              await this.#client.call({ _: "stats.getBroadcastStats", channel }, options),
              graphOf,
            )
          : await toOfficialGroupStats(
              chat,
              await this.#client.call({ _: "stats.getMegagroupStats", channel }, options),
              graphOf,
            )
      } catch (error) {
        // Reached the main server a moment ago, so the login stands; only the statistics server refused it.
        if (tl.RpcError.is(error, "AUTH_KEY_UNREGISTERED"))
          throw new CliError(
            "provider_error",
            "Telegram's statistics server did not accept this login (AUTH_KEY_UNREGISTERED); the login itself works — try again later",
            { providerError: error.text, status: error.code },
          )
        throw error
      }
    })
  }

  /**
   * Telegram keeps what members may do as rights taken away, and sets them all at once: the current
   * ones are read first, and only the switches asked for change.
   */
  updateGroup(chatId: string, { title, description, settings = {} }: GroupChange): Promise<GroupCard> {
    const missing = Object.keys(settings).filter((key) => !(GROUP_SETTINGS as readonly string[]).includes(key))
    if (missing.length > 0) {
      throw new CliError("validation_error", `Telegram has no group setting ${missing.join(", ")}`)
    }
    const peer = Number(chatId)
    return this.#call(async () => {
      try {
        if (title !== undefined) await this.#client.setChatTitle(peer, title)
        if (description !== undefined) await this.#client.setChatDescription(peer, description)
        const { allCanPin, onlyAdminsAdd, joinApproval } = settings
        if (typeof joinApproval === "boolean") await this.#client.toggleJoinRequests(peer, joinApproval)
        if (typeof allCanPin === "boolean" || typeof onlyAdminsAdd === "boolean") {
          const current = (await this.#client.getFullChat(peer)).defaultPermissions?.raw
          const { _: _kind, untilDate: _until, ...taken } = current ?? { _: "chatBannedRights", untilDate: 0 }
          await this.#client.setChatDefaultPermissions(peer, {
            ...taken,
            ...(typeof allCanPin === "boolean" ? { pinMessages: !allCanPin } : {}),
            ...(typeof onlyAdminsAdd === "boolean" ? { inviteUsers: onlyAdminsAdd } : {}),
          })
        }
      } catch (error) {
        throw unknownIfUnanswered(error, "the group may have changed in part; check `tg chats show`")
      }
      return toGroupCard(await this.#client.getFullChat(peer))
    })
  }

  /** A new primary link for the owner; the old one stops working. */
  resetInviteLink(chatId: string): Promise<GroupCard> {
    const peer = Number(chatId)
    return this.#call(async () => {
      try {
        await this.#client.exportInviteLink(peer)
      } catch (error) {
        throw unknownIfUnanswered(error, "the link may or may not have been replaced; check `tg chats link show`")
      }
      return toGroupCard(await this.#client.getFullChat(peer))
    })
  }

  createInviteLink(
    chatId: string,
    { approval, expiresAt, maxUses }: { approval: boolean; expiresAt?: string; maxUses?: number },
  ) {
    return this.#call(async () => {
      try {
        return toInviteLink(
          await this.#client.createInviteLink(Number(chatId), {
            withApproval: approval,
            ...(expiresAt === undefined ? {} : { expires: new Date(expiresAt) }),
            ...(maxUses === undefined ? {} : { usageLimit: maxUses }),
          }),
        )
      } catch (error) {
        throw unknownIfUnanswered(error, "a link may or may not have been made; it works only once shared")
      }
    })
  }

  joinRequests(chatId: string, { limit, link, search }: { limit: number; link?: string; search?: string }) {
    return this.#call(() =>
      joinRequestsOf(this.#client, Number(chatId), limit, {
        ...(link ? { link } : {}),
        ...(search ? { search } : {}),
      }),
    )
  }

  answerAllJoinRequests(chatId: string, accept: boolean, link?: string) {
    return this.#call(async () => {
      try {
        await this.#client.hideAllJoinRequests({
          chatId: Number(chatId),
          action: accept ? "approve" : "decline",
          ...(link ? { link } : {}),
        })
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          "the requests may or may not have been answered; check `tg chats requests list`",
        )
      }
    })
  }

  /** Telegram shows an admin only their own links; the creator could ask for others', which we do not. */
  inviteLinks(chatId: string, { limit, revoked }: { limit: number; revoked: boolean }) {
    return this.#call(async () => {
      const page = await this.#client.getInviteLinks(Number(chatId), { limit, revoked })
      return { items: page.map(toInviteLink), hasMore: page.total > page.length }
    })
  }

  revokeInviteLink(chatId: string, link: string) {
    return this.#call(async () => {
      try {
        return toInviteLink(await this.#client.revokeInviteLink(Number(chatId), link))
      } catch (error) {
        throw unknownIfUnanswered(error, "the link may or may not have been revoked; check `tg chats link list`")
      }
    })
  }

  updateInviteLink(chatId: string, link: string, { approval, expiresAt, maxUses }: InviteLinkChange) {
    return this.#call(async () => {
      const peer = await this.#client.resolvePeer(Number(chatId))
      try {
        // Raw, because mtcute's editInviteLink drops an expiry of 0 — Telegram's "never expires".
        const answer = await this.#client.call({
          _: "messages.editExportedChatInvite",
          peer,
          link,
          ...(approval === undefined ? {} : { requestNeeded: approval }),
          ...(expiresAt === undefined ? {} : { expireDate: expiresAt === null ? 0 : Date.parse(expiresAt) / 1000 }),
          ...(maxUses === undefined ? {} : { usageLimit: maxUses }),
        })
        return toInviteLink(new ChatInviteLink(answer.invite, PeersIndex.from(answer)))
      } catch (error) {
        throw unknownIfUnanswered(error, "the link may or may not have been changed; check `tg chats link list`")
      }
    })
  }

  answerJoinRequest(chatId: string, personId: string, accept: boolean) {
    return this.#call(async () => {
      try {
        return await answerJoinRequestOf(this.#client, Number(chatId), Number(personId), accept)
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          `the request of ${personId} may or may not have been answered; check \`tg chats requests list\``,
        )
      }
    })
  }

  /** A supergroup shows new members its history by its own setting, never per person: `history` is refused. */
  addMembers(chatId: string, people: string[], { history }: { history?: boolean }): Promise<{ notAdded: string[] }> {
    if (history)
      throw new CliError(
        "validation_error",
        "Telegram shows new members the history by the group's setting, not per person",
      )
    return this.#call(async () => {
      try {
        const missing = await this.#client.addChatMembers(Number(chatId), people.map(Number), {})
        return { notAdded: missing.map((one) => String(one.userId)) }
      } catch (error) {
        throw unknownIfUnanswered(error, "the people may or may not have been added; check `tg chats members list`")
      }
    })
  }

  /** One request per person, in turn: Telegram rate-limits these hard. */
  removeMembers(chatId: string, people: string[]): Promise<void> {
    return this.#call(async () => {
      for (const person of people) {
        try {
          await this.#client.kickChatMember({ chatId: Number(chatId), userId: Number(person) })
        } catch (error) {
          throw unknownIfUnanswered(
            error,
            `${person} may or may not have been removed; check \`tg chats members list\``,
          )
        }
      }
    })
  }

  addAdmin(chatId: string, person: string, rights: AdminRight[]): Promise<void> {
    const missing = rights.filter((right) => !(right in ADMIN_RIGHT_FIELDS))
    if (missing.length > 0) throw new CliError("validation_error", `Telegram has no admin right ${missing.join(", ")}`)
    const fields = Object.fromEntries(
      rights.map((right) => [ADMIN_RIGHT_FIELDS[right as keyof typeof ADMIN_RIGHT_FIELDS], true]),
    )
    return this.#editAdmin(chatId, person, fields)
  }

  removeAdmin(chatId: string, person: string): Promise<void> {
    return this.#editAdmin(chatId, person, {})
  }

  #editAdmin(chatId: string, person: string, rights: Omit<tl.RawChatAdminRights, "_">): Promise<void> {
    return this.#call(async () => {
      try {
        await this.#client.editAdminRights({ chatId: Number(chatId), userId: Number(person), rights })
      } catch (error) {
        throw unknownIfUnanswered(error, "the rights may or may not have changed; check `tg chats members list`")
      }
    })
  }

  folders(): Promise<Folder[]> {
    return this.#call(async () => (await this.#filters()).map(toFolder).filter((one): one is Folder => one !== null))
  }

  createFolder(title: string, chatIds: string[], rules: FolderRules = {}): Promise<Folder> {
    return this.#write(
      "the folder may have been made; check `tg chats folders list` before repeating — a repeat makes a second one",
      async () => {
        const peers = (ids: string[] = []) => Promise.all(ids.map((id) => this.#client.resolvePeer(Number(id))))
        const pinned = new Set(rules.pin)
        const made = await this.#client.createFolder({
          title: { _: "textWithEntities", text: title, entities: [] },
          includePeers: await peers(chatIds.filter((id) => !pinned.has(id))),
          pinnedPeers: await peers(rules.pin),
          excludePeers: await peers(rules.exclude),
          ...(rules.emoji === undefined ? {} : { emoticon: rules.emoji }),
          ...ruleFlags(rules),
        })
        return this.#storedFolder(made)
      },
    )
  }

  /** Telegram replaces a folder's chats as a list, so the ones it has are read and only the asked ones change. */
  updateFolder(folderId: string, change: FolderChange): Promise<Folder> {
    const { title, add = [], remove = [], exclude = [], pin = [], emoji, include, skip } = change
    return this.#write("the folder may have changed — repeating it is safe", async () => {
      const current = (await this.#filters()).find(
        (one) => one._ !== "dialogFilterDefault" && String(one.id) === folderId,
      )
      if (!current || current._ === "dialogFilterDefault") throw new CliError("not_found", `no folder ${folderId}`)
      const rulesAsked = include !== undefined || skip !== undefined || exclude.length > 0
      if (rulesAsked && current._ === "dialogFilterChatlist")
        throw new CliError("validation_error", "a folder shared by a link holds only its chats; it takes no rules")
      // A chat sits on one list at a time: pinning or excluding it takes it off the others.
      const idOf = (peer: tl.TypeInputPeer) => String(getMarkedPeerId(peer))
      const off = (peers: tl.TypeInputPeer[], ...ids: string[][]) => {
        const gone = new Set(ids.flat())
        return peers.filter((peer) => !gone.has(idOf(peer)))
      }
      const resolved = (ids: string[], have: tl.TypeInputPeer[]) => {
        const held = new Set(have.map(idOf))
        return Promise.all(ids.filter((id) => !held.has(id)).map((id) => this.#client.resolvePeer(Number(id))))
      }
      const include0 = off(current.includePeers, remove, pin, exclude)
      const pinned0 = off(current.pinnedPeers, remove, exclude)
      const listsChanged = add.length > 0 || remove.length > 0 || pin.length > 0 || exclude.length > 0
      const excluded0 = current._ === "dialogFilter" ? off(current.excludePeers, remove, add, pin) : []
      const changed = await this.#client.editFolder({
        folder: current._ === "dialogFilter" ? current : current.id,
        modification: {
          ...(title === undefined ? {} : { title: { _: "textWithEntities", text: title, entities: [] } }),
          ...(emoji === undefined ? {} : { emoticon: emoji }),
          ...ruleFlags({ ...(include === undefined ? {} : { include }), ...(skip === undefined ? {} : { skip }) }),
          ...(listsChanged
            ? {
                includePeers: [...include0, ...(await resolved(add, [...include0, ...pinned0]))],
                pinnedPeers: [...pinned0, ...(await resolved(pin, pinned0))],
                ...(current._ === "dialogFilter"
                  ? { excludePeers: [...excluded0, ...(await resolved(exclude, excluded0))] }
                  : {}),
              }
            : {}),
        },
      })
      return this.#storedFolder(changed)
    })
  }

  deleteFolder(folderId: string): Promise<void> {
    return this.#write("the folder may have been deleted — repeating it is safe", async () => {
      await this.#client.deleteFolder(Number(folderId))
    })
  }

  /** "All chats" (id 0) keeps its place: only Premium accounts may move it, and tg does not list it. */
  orderFolders(folderIds: string[]): Promise<void> {
    return this.#write("the folders may be in the new order already — repeating it is safe", async () => {
      const current = (await this.#filters()).map((one) => (one._ === "dialogFilterDefault" ? 0 : one.id))
      const order = folderIds.map(Number)
      const all = current.indexOf(0)
      if (all >= 0) order.splice(all, 0, 0)
      await this.#client.setFoldersOrder(order)
    })
  }

  joinFolder(link: string): Promise<Folder> {
    return this.#write(
      "the folder may have been joined; check `tg chats folders list` before repeating — a repeat joins nothing new",
      async () => {
        try {
          return toFolder(await this.#client.joinChatlist(link)) as Folder
        } catch (error) {
          if (tl.RpcError.is(error, "INVITE_SLUG_EXPIRED") || tl.RpcError.is(error, "INVITE_SLUG_INVALID"))
            throw new CliError("not_found", "this folder link is invalid or has expired")
          throw error
        }
      },
    )
  }

  /**
   * mtcute answers with the folder it sent, but Telegram drops what it does not take — an emoji that is not
   * one of its folder icons, measured live 2026-10-08 — so the answer is read back.
   */
  async #storedFolder(sent: tl.TypeDialogFilter): Promise<Folder> {
    const stored =
      sent._ === "dialogFilterDefault"
        ? undefined
        : (await this.#filters()).find((one) => one._ !== "dialogFilterDefault" && one.id === sent.id)
    return toFolder(stored ?? sent) as Folder
  }

  async #filters(): Promise<tl.TypeDialogFilter[]> {
    return (await this.#client.getFolders()).filters
  }

  /** Under the name they show; `renameContact` gives one of the owner's own. */
  addContact(personId: string): Promise<Member> {
    return this.#write("the contact may have been added — repeating it is safe", async () => {
      const peer = await this.#client.getPeer(Number(personId))
      if (peer.type !== "user") throw new CliError("validation_error", `${personId} is a chat, not a person`)
      return toMember(
        await this.#client.addContact({
          userId: peer.id,
          firstName: peer.firstName,
          ...(peer.lastName ? { lastName: peer.lastName } : {}),
        }),
      )
    })
  }

  removeContact(personId: string): Promise<void> {
    return this.#write("the contact may have been removed — repeating it is safe", async () => {
      await this.#client.deleteContacts([Number(personId)])
    })
  }

  block(personId: string): Promise<void> {
    return this.#write("the person may have been blocked — repeating it is safe", async () => {
      await this.#client.blockUser(Number(personId))
    })
  }

  unblock(personId: string): Promise<void> {
    return this.#write("the person may have been unblocked — repeating it is safe", async () => {
      await this.#client.unblockUser(Number(personId))
    })
  }

  renameContact(personId: string, firstName: string, lastName?: string): Promise<Member> {
    return this.#write("the contact may have been renamed — repeating it is safe", async () =>
      toMember(
        await this.#client.addContact({ userId: Number(personId), firstName, ...(lastName ? { lastName } : {}) }),
      ),
    )
  }

  /** The name is split at its first space into Telegram's first and last name. */
  importContacts(entries: PhoneBookEntry[]): Promise<Member[]> {
    return this.#write("the contacts may have been imported — repeating it is safe", async () => {
      const result = await this.#client.importContacts(
        entries.map(({ phone, name }) => {
          const [firstName = name, ...rest] = name.split(" ")
          return { phone: `+${phone}`, firstName, lastName: rest.join(" ") }
        }),
      )
      const found = new Set(result.imported.map((one) => String(one.userId)))
      const users = await this.#client.getUsers([...found].map(Number))
      return users.filter((user): user is User => user !== null).map(toMember)
    })
  }

  /** Telegram calls the description the bio. A photo goes up as a new profile photo. */
  updateProfile({
    firstName,
    lastName,
    description,
    photo,
  }: Parameters<NonNullable<MessengerAdapter["updateProfile"]>>[0]): Promise<Account> {
    return this.#call(async () => {
      if (firstName !== undefined || lastName !== undefined || description !== undefined) {
        await this.#client.updateProfile({
          ...(firstName === undefined ? {} : { firstName }),
          ...(lastName === undefined ? {} : { lastName }),
          ...(description === undefined ? {} : { bio: description }),
        })
      }
      if (photo) await this.#client.setMyProfilePhoto({ type: "photo", media: photo.bytes })
      const user = await this.#client.getMe()
      return { ...toAccount(user), phone: user.phoneNumber }
    })
  }

  /** mtcute has no call of its own for it; this is Telegram's `auth.resetAuthorizations`. */
  endOtherSessions(): Promise<AccountSession[]> {
    return this.#call(async () => {
      try {
        await this.#client.call({ _: "auth.resetAuthorizations" })
      } catch (error) {
        throw unknownIfUnanswered(
          error,
          "the other devices may or may not have been logged out; check `tg account sessions list`",
        )
      }
      const { authorizations } = await this.#client.call({ _: "account.getAuthorizations" })
      return authorizations.map(toAccountSession)
    })
  }

  /**
   * A supergroup's own count is its member list's total: its chat object and its full info both said 1 for a
   * group of 2, seen live. A list hidden from non-admins answers only part of the group, so then the full info's
   * count stands, which the shorter list never reaches. A basic group's list total is only the page it read.
   */
  async #groupCount(group: Peer, listTotal: number | null): Promise<number | null> {
    if (group.type !== "chat" || group.raw?._ !== "channel") return groupMembersCount(group)
    const full = await this.#client.getFullChat(group.id)
    const hidden = full.full._ === "channelFull" && full.full.participantsHidden === true && !full.isAdmin
    return hidden || listTotal === null ? groupMembersCount(full) : listTotal || null
  }

  async #membersOf(peer: InputPeerLike) {
    try {
      return await this.#client.getChatMembers(peer, { limit: 200 })
    } catch (error) {
      const known = toCliError(error, this.#login)
      if (known instanceof CliError && known.code === "permission_error") return null
      throw known
    }
  }

  /** A write with no id to repeat it by: no answer means it may have happened, and `what` says what to do. */
  #write<T>(what: string, work: () => Promise<T>): Promise<T> {
    return this.#call(async () => {
      try {
        return await work()
      } catch (error) {
        throw unknownIfUnanswered(error, what)
      }
    })
  }

  async #call<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await (this.#proxyFailed ? Promise.race([work(), this.#proxyFailed]) : work())
    } catch (error) {
      throw toCliError(error, this.#login)
    }
  }
}

export { GROUP_SETTINGS }

export interface FrozenStanding {
  state: "frozen"
  since?: string
  until?: string
  appealUrl?: string
  hint: string
}

const unixTime = (value: unknown): string | undefined =>
  typeof value === "number" && value > 0 ? new Date(value * 1000).toISOString() : undefined

/** Telegram sets `freeze_since_date` non-zero only on a frozen account; the dates are unix seconds. */
export const frozenOf = (config: Record<string, unknown>): FrozenStanding | undefined => {
  const since = unixTime(config.freeze_since_date)
  if (!since) return undefined
  const until = unixTime(config.freeze_until_date)
  const appealUrl =
    typeof config.freeze_appeal_url === "string" && config.freeze_appeal_url ? config.freeze_appeal_url : undefined
  return {
    state: "frozen",
    since,
    ...(until ? { until } : {}),
    ...(appealUrl ? { appealUrl } : {}),
    hint:
      "Telegram froze this account: it can read but not write" +
      (until ? `, and deletes it on ${until.slice(0, 10)}` : "") +
      (appealUrl ? ` unless an appeal is accepted — appeal at ${appealUrl}` : " unless an appeal is accepted"),
  }
}

/** The rights `tg chats admins add --can` offers: max's, less `read`. */
export const ADMIN_RIGHTS = Object.keys(ADMIN_RIGHT_FIELDS) as AdminRight[]

/**
 * How long mtcute sits out a FLOOD_WAIT before the wait becomes `rate_limited` with `retryAfterMs`, and
 * how many times. One-shot: 10 s, mtcute's own default, which covers the routine short waits; past it a
 * person or a script is better told the wait than held, and twice at most keeps a command under ~20 s
 * of announced waiting. Listening (`watch`, `serve`): nobody is waiting on a request, and giving up
 * costs a restart and a new connection — 120 s, tlgr's threshold. `store fetch` keeps the one-shot
 * value: cli-messaging's `patiently` sits out up to 5 min above it, and says so.
 */
export const FLOOD_SLEEP = {
  oneShot: { maxWait: 10_000, maxRetries: 2 },
  listening: { maxWait: 120_000, maxRetries: 3 },
}

/** A look at a local flag, not a request. */
export const LOOP_CHECK_MS = 30_000
/** Every 15 minutes, mtcute's own keep-alive rate: ~96 light requests a day. */
export const HEARTBEAT_TICKS = 30
export const STATE_WAIT_MS = 30_000
const LOOP_STOPPED =
  "Telegram's updates stopped arriving although the connection is open — ending, so a service unit starts it again"

export const TRANSCRIBE_POLL_MS = 2000
const TRANSCRIBE_WAIT_MS = 60_000
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal.removeEventListener("abort", done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    if (signal.aborted) done()
    else signal.addEventListener("abort", done, { once: true })
  })

const messageNumber = (id: string, rule = "--before-id takes a message id"): number => {
  if (!/^\d+$/.test(id)) throw new CliError("validation_error", `${rule}, got "${id}"`)
  return Number(id)
}

const forwardedCopy = (updates: tl.TypeUpdates): TgMessage | undefined => {
  if (updates._ !== "updates" && updates._ !== "updatesCombined") return undefined
  const update = updates.updates.find((one) => one._ === "updateNewMessage" || one._ === "updateNewChannelMessage")
  return update && "message" in update ? new TgMessage(update.message, PeersIndex.from(updates)) : undefined
}

const parseSendId = (typed: string): Long => {
  if (!/^-?\d{1,20}$/.test(typed))
    throw new CliError("validation_error", "--send-id is the number a failed send printed")
  return Long.fromString(typed)
}

/** No answer is not a refusal: the write may have reached Telegram. Anything else is left for `#call` to map. */
const unknownIfUnanswered = (error: unknown, what: string, details: Record<string, unknown> = {}): unknown => {
  const known = toCliError(error)
  if (known instanceof CliError && ["timeout", "network_error"].includes(known.code)) {
    return new CliError("outcome_unknown", `no answer from Telegram — ${what}`, { ...details, cause: known.code })
  }
  return error
}

const repeatWith = (sendId: string, sendAs: string | undefined): string =>
  sendAs === undefined ? `--send-id ${sendId}` : `--send-id ${sendId} --send-as ${sendAs}`

const retryDetails = (sendId: string, sendAs: string | undefined) => ({
  sendId,
  ...(sendAs === undefined ? {} : { sendAs }),
})

const topicNumber = (id: string): number => {
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) {
    throw new CliError("validation_error", "--topic needs a positive Telegram topic id")
  }
  return Number(id)
}

const remoteMessage = (message: TgMessage): Message =>
  observedCounters(toMessage(message), new Date().toISOString(), ["views", "reactions", "comments"])

const remoteHit = (message: TgMessage, source: "remote_fetch" | "remote_update"): MessageHit => ({
  ...toMessageHit(message),
  ...observedCounters(toMessage(message), new Date().toISOString(), ["views", "reactions", "comments"], source),
})
