import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { FileLocation, Long, MtPeerNotFoundError, MtTimeoutError, tl } from "@mtcute/node"
import type { MessageEvent } from "@wirecat/cli-messaging"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  FLOOD_SLEEP,
  HEARTBEAT_TICKS,
  LOOP_CHECK_MS,
  STATE_WAIT_MS,
  TelegramAdapter,
  TRANSCRIBE_POLL_MS,
} from "./adapter.js"

type Handler = (value: unknown) => void

const stand = vi.hoisted(() => ({ client: undefined as unknown as FakeClient, options: undefined as unknown }))

class Signal {
  readonly handlers = new Set<Handler>()
  add(handler: Handler) {
    this.handlers.add(handler)
  }
  remove(handler: Handler) {
    this.handlers.delete(handler)
  }
  emit(value: unknown) {
    for (const handler of this.handlers) handler(value)
  }
}

const page = <T>(items: T[], next?: unknown, total = Number.POSITIVE_INFINITY) =>
  Object.assign([...items], { next, total })

class FakeClient {
  readonly calls: { method: string; args: unknown[] }[] = []
  readonly log = { mgr: { handler: undefined as unknown } }
  readonly storage = { self: { getCached: (_: boolean) => ({ userId: 1 }) as { userId: number } | null } }
  readonly onNewMessage = new Signal()
  readonly onEditMessage = new Signal()
  readonly onDeleteMessage = new Signal()
  readonly onRawUpdate = new Signal()
  dialogs: unknown[] = []
  history: unknown[] = []
  historyNext: unknown = undefined
  historyTotal = Number.POSITIVE_INFINITY
  peer: unknown = undefined
  members: unknown = []
  membersTotal: number | undefined
  found: unknown = null
  transcripts: { text: string; pending?: boolean }[] = []
  resolvePeer = async (peer: unknown): Promise<unknown> => ({ _: "inputPeerChannel", peer })
  exportedLink: string | Error = "https://t.me/test_channel/1"
  resolveChannel = vi.fn(async (_peer: unknown) => ({ _: "inputChannel", channelId: 500, accessHash: 42 }))
  authorizations: unknown[] = []
  phoneOwner: unknown = null
  contacts: unknown[] = []
  forwardAnswer: unknown = forwarded(60)
  searchAnswer: unknown = found([7, 5])
  migrationAnswer: unknown = undefined
  topicAnswer: unknown = forwarded(12)
  handleClientUpdate = vi.fn()
  serverDate = 1_790_000_000
  appConfigValue: Record<string, unknown> | Error = {}
  readonly appConfig = {
    get: async () => {
      if (this.appConfigValue instanceof Error) throw this.appConfigValue
      return this.appConfigValue
    },
  }
  call = async (request: { _: string }, options?: unknown) => {
    this.#record("call", options === undefined ? [request] : [request, options])
    if (request._ === "help.getConfig") return { _: "config", date: this.serverDate }
    if (request._ === "channels.exportMessageLink") {
      if (this.exportedLink instanceof Error) throw this.exportedLink
      return { link: this.exportedLink, html: "ignored synthetic embed" }
    }
    if (request._ === "messages.migrateChat") {
      if (this.migrationAnswer instanceof Error) throw this.migrationAnswer
      return this.migrationAnswer
    }
    if (request._ === "messages.createForumTopic") {
      if (this.topicAnswer instanceof Error) throw this.topicAnswer
      return this.topicAnswer
    }
    if (request._ === "account.getAuthorizations") return { authorizations: this.authorizations }
    if (request._ === "messages.search" || request._ === "messages.searchGlobal") {
      if (this.searchAnswer instanceof Error) throw this.searchAnswer
      return this.searchAnswer
    }
    if (request._ === "messages.editExportedChatInvite") {
      const { link, requestNeeded, expireDate, usageLimit } = request as Record<string, unknown>
      return {
        _: "messages.exportedChatInvite",
        invite: { _: "chatInviteExported", link, requestNeeded, expireDate, usageLimit, date: 0, adminId: 1 },
        users: [],
      }
    }
    if (request._ === "messages.forwardMessages") {
      if (this.forwardAnswer instanceof Error) throw this.forwardAnswer
      return this.forwardAnswer
    }
    return this.transcripts.shift() ?? { text: "", pending: true }
  }
  resolvePhoneNumber = async (phone: string) => {
    this.#record("resolvePhoneNumber", [phone])
    if (!this.phoneOwner) throw new tl.RpcError(400, "PHONE_NOT_OCCUPIED")
    this.peer = this.phoneOwner
    return { _: "inputPeerUser" }
  }
  getContacts = async () => this.contacts
  preview: unknown = null
  fullChat: unknown = null
  fullChats = new Map<number, unknown>()
  updateForumSettings = vi.fn(async (id: number) => {
    const current = this.fullChats.get(id) ?? this.fullChat
    if (current && typeof current === "object") this.fullChats.set(id, { ...current, isForum: true })
  })
  topics: unknown[] = []
  editForumTopic = vi.fn(async (..._args: unknown[]): Promise<unknown> => null)
  toggleForumTopicPinned = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  toggleGeneralTopicHidden = vi.fn(async (..._args: unknown[]): Promise<unknown> => null)
  reorderPinnedForumTopics = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  deleteForumTopicHistory = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  getForumTopicsById = vi.fn(async (..._args: unknown[]): Promise<unknown[]> => this.topics)
  getChatPreview = async (link: string) => {
    this.#record("getChatPreview", [link])
    if (!this.preview) throw new MtPeerNotFoundError("You have already joined this chat!")
    return this.preview
  }
  getFullChat = async (reference: unknown) => {
    this.#record("getFullChat", [reference])
    return this.fullChats.get(Number(reference)) ?? this.fullChat
  }
  async *iterForumTopics(...args: unknown[]) {
    this.#record("iterForumTopics", args)
    yield* this.topics
  }
  chunks: unknown[] = [new Uint8Array([1, 2]), new Uint8Array([3])]
  getMessages = async (...args: unknown[]) => {
    this.#record("getMessages", args)
    return [this.found]
  }
  async *downloadAsIterable(file: unknown) {
    this.#record("downloadAsIterable", [file])
    for (const chunk of this.chunks) {
      if (chunk instanceof Error) throw chunk
      yield chunk
    }
  }
  readHistory = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  deleteMessagesById = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  sendVote = vi.fn(async (..._args: unknown[]): Promise<unknown> => fakePoll({ chosen: 1 }))
  closePoll = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ ...fakePoll({}), isClosed: true }))
  sendText = vi.fn(async (..._args: unknown[]): Promise<unknown> => message(99))
  uploadFile = vi.fn(
    async (params: { file: Uint8Array; fileName?: string; fileMime?: string }): Promise<unknown> => ({
      inputFile: { _: "inputFile", name: params.fileName },
      size: params.file.length,
      mime: params.fileMime ?? "application/octet-stream",
    }),
  )
  sendMedia = vi.fn(async (..._args: unknown[]): Promise<unknown> => message(98))
  scheduledQueue: unknown[] = []
  getAllScheduledMessages = vi.fn(async (..._args: unknown[]) => this.scheduledQueue)
  createSupergroup = vi.fn(async (params: { title: string }): Promise<unknown> => group(-100700, params.title))
  createChannel = vi.fn(async (params: { title: string }): Promise<unknown> => group(-100701, params.title))
  addChatMembers = vi.fn(async (..._args: unknown[]): Promise<{ userId: number }[]> => [])
  joinChat = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ status: "ok", chat: group(-100702, "Joined") }))
  leaveChat = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  setChatTitle = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  setChatDescription = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  setChatDefaultPermissions = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({}))
  exportInviteLink = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ link: "https://t.me/+new" }))
  toggleJoinRequests = vi.fn(async (..._args: unknown[]): Promise<unknown> => undefined)
  hideAllJoinRequests = vi.fn(async (..._args: unknown[]): Promise<unknown> => undefined)
  getInviteLinks = vi.fn(
    async (..._args: unknown[]): Promise<unknown> =>
      Object.assign(
        [
          {
            link: "https://t.me/+extra",
            approvalNeeded: true,
            endDate: null,
            usageLimit: Number.POSITIVE_INFINITY,
            isPrimary: false,
            isRevoked: false,
            pendingApprovals: 2,
            usage: 1,
          },
        ],
        { total: 3 },
      ),
  )
  revokeInviteLink = vi.fn(
    async (..._args: unknown[]): Promise<unknown> => ({
      link: "https://t.me/+fresh",
      approvalNeeded: false,
      endDate: null,
      usageLimit: Number.POSITIVE_INFINITY,
      isPrimary: true,
      isRevoked: false,
      pendingApprovals: 0,
      usage: 0,
    }),
  )
  createInviteLink = vi.fn(
    async (..._args: unknown[]): Promise<unknown> => ({
      link: "https://t.me/+extra",
      approvalNeeded: true,
      endDate: new Date("2026-10-14T18:00:00Z"),
      usageLimit: Number.POSITIVE_INFINITY,
    }),
  )
  kickChatMember = vi.fn(async (..._args: unknown[]): Promise<unknown> => null)
  editAdminRights = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  filters: unknown[] = []
  getFolders = vi.fn(async () => ({ _: "messages.dialogFilters", filters: this.filters }))
  createFolder = vi.fn(async (folder: Record<string, unknown>): Promise<unknown> => {
    const made = { _: "dialogFilter", id: 3, pinnedPeers: [], excludePeers: [], ...folder }
    this.filters = [...this.filters, made]
    return made
  })
  editFolder = vi.fn(async (params: { folder: Record<string, unknown>; modification: Record<string, unknown> }) => {
    const changed = { ...params.folder, ...params.modification }
    this.filters = this.filters.map((one) => ((one as { id?: unknown }).id === changed.id ? changed : one))
    return changed
  })
  deleteFolder = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  setFoldersOrder = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  joinChatlist = vi.fn(
    async (..._args: unknown[]): Promise<unknown> => ({
      _: "dialogFilterChatlist",
      id: 6,
      title: { _: "textWithEntities", text: "Shared", entities: [] },
      pinnedPeers: [],
      includePeers: [{ _: "inputPeerUser", userId: 7, accessHash: 0 }],
    }),
  )
  addContact = vi.fn(
    async (params: { userId: unknown; firstName: string; lastName?: string }): Promise<unknown> =>
      user(Number(params.userId), [params.firstName, params.lastName].filter(Boolean).join(" ")),
  )
  deleteContacts = vi.fn(async (..._args: unknown[]): Promise<unknown[]> => [])
  blockUser = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  unblockUser = vi.fn(async (..._args: unknown[]): Promise<void> => {})
  importContacts = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ imported: [{ userId: 91 }] }))
  updateProfile = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({}))
  setMyProfilePhoto = vi.fn(async (..._args: unknown[]): Promise<unknown> => ({}))
  sendReaction = vi.fn(async (..._args: unknown[]): Promise<unknown> => null)
  editMessage = vi.fn(async (..._args: unknown[]): Promise<unknown> => message(5))
  forwardMessagesById = vi.fn(async (..._args: unknown[]): Promise<unknown[]> => [message(60)])
  pinMessage = vi.fn(async (..._args: unknown[]): Promise<unknown> => null)
  unpinMessage = vi.fn(async (..._args: unknown[]): Promise<void> => {})

  #record(method: string, args: unknown[]) {
    this.calls.push({ method, args })
  }
  prepare = async () => this.#record("prepare", [])
  start = async (options: unknown) => {
    this.#record("start", [options])
    return user(1, "Owner", { isSelf: true })
  }
  getMe = async () => user(1, "Owner", { isSelf: true })
  sendCode = vi.fn(async (_params: unknown): Promise<unknown> => ({ type: "app", phoneCodeHash: "first" }))
  resendCode = vi.fn(async (_params: unknown): Promise<unknown> => ({ type: "sms", phoneCodeHash: "second" }))
  signIn = vi.fn(async (_params: unknown): Promise<unknown> => user(1, "Owner", { isSelf: true }))
  checkPassword = vi.fn(async (_password: unknown): Promise<unknown> => user(1, "Owner", { isSelf: true }))
  dialogsPulled = 0
  async *iterDialogs(options: unknown) {
    this.#record("iterDialogs", [options])
    for (const one of this.dialogs) {
      this.dialogsPulled += 1
      yield one
    }
  }
  getHistory = async (...args: unknown[]) => {
    this.#record("getHistory", args)
    return page(this.history, this.historyNext, this.historyTotal)
  }
  searchMessages = async (...args: unknown[]) => {
    this.#record("searchMessages", args)
    return page(this.history, this.historyNext, this.historyTotal)
  }
  getPeerDialogs = async (peer: unknown) => {
    this.#record("getPeerDialogs", [peer])
    const of = (id: unknown) =>
      (this.dialogs as { peer: { id: unknown } }[]).find((one) => one.peer.id === id) ?? this.dialogs[0] ?? null
    return Array.isArray(peer) ? peer.map(of) : [of(peer)]
  }
  getPeer = async (peer: unknown) => {
    this.#record("getPeer", [peer])
    return this.peer
  }
  getFullUser = async () => ({ bio: "a bio" })
  getCommonChats = async () => [{ id: -100500 }]
  photoDates: string[] = []
  getProfilePhotos = async (_peer: unknown, { offset = 0, limit = 100 }: { offset?: number; limit?: number } = {}) => {
    this.#record("getProfilePhotos", [offset, limit])
    const page = this.photoDates.slice(offset, offset + limit).map((at) => ({ date: new Date(at) }))
    return Object.assign(page, { total: this.photoDates.length })
  }
  getUsers = async (ids: number[]) => ids.map((id) => (id === 404 ? null : user(id, `User ${id}`)))
  getChatMembers = async (...args: unknown[]) => {
    this.#record("getChatMembers", args)
    if (this.members instanceof Error) throw this.members
    return Object.assign([...(this.members as unknown[])], {
      total: this.membersTotal ?? (this.members as unknown[]).length,
    })
  }
  connect = async () => this.#record("connect", [])
  startUpdatesLoop = async () => this.#record("startUpdatesLoop", [])
  readonly _client = { updates: { updatesLoopActive: true } }
  logOut = async () => this.#record("logOut", [])
  destroy = async () => this.#record("destroy", [])
}

vi.mock("@mtcute/node", async (importOriginal) => {
  const real = await importOriginal<typeof import("@mtcute/node")>()
  return {
    ...real,
    TelegramClient: function TelegramClient(options: unknown) {
      stand.options = options
      stand.client = new FakeClient()
      return stand.client
    },
  }
})
vi.mock("./storage.js", () => ({ openSessionStorage: async () => ({}) }))

const user = (id: number, displayName: string, extra: Record<string, unknown> = {}) => ({
  type: "user",
  id,
  displayName,
  username: null,
  isSelf: false,
  isBot: false,
  ...extra,
})

const group = (id: number, displayName: string) => ({
  type: "chat",
  id,
  displayName,
  username: null,
  chatType: "supergroup",
  isForum: false,
  membersCount: 12,
})

const dialog = (peer: unknown, lastMessageAt = "2026-09-27T10:00:00.000Z") => ({
  peer,
  isArchived: false,
  isPinned: false,
  unreadCount: 2,
  lastMessage: { date: new Date(lastMessageAt) },
})

function fakePoll({
  chosen,
  closed = false,
  multiple = false,
  final = false,
  creator = true,
}: {
  chosen?: number
  closed?: boolean
  multiple?: boolean
  final?: boolean
  creator?: boolean
}) {
  const answer = (data: string, text: string, voters: number, index: number) => ({
    data: new TextEncoder().encode(data),
    text,
    voters,
    chosen: index === chosen,
  })
  return {
    type: "poll",
    question: "Friday?",
    answers: [answer("0", "yes", 4, 0), answer("1", "no", 1, 1)],
    isClosed: closed,
    isMultiple: multiple,
    isRevotingDisabled: final,
    isCreator: creator,
    isQuiz: false,
    isPublic: true,
    voters: 5,
    results: { totalVoters: 5 },
  }
}

/** What Telegram answers a search with: the messages, in a supergroup, among the users and chats they name. */
function found(ids: number[]) {
  const { users, chats } = forwarded(0)
  return {
    _: "messages.messagesSlice",
    count: ids.length,
    messages: ids.map((id) => ({
      _: "message",
      id,
      peerId: { _: "peerChannel", channelId: 500 },
      fromId: { _: "peerUser", userId: 1 },
      date: 1790000000,
      message: `synthetic invoice ${id}`,
    })),
    users,
    chats,
  }
}

/** What Telegram answers a forward with: the copy, in a supergroup, among the users and chats it names. */
function forwarded(id: number) {
  return {
    _: "updates",
    updates: [
      {
        _: "updateNewChannelMessage",
        message: {
          _: "message",
          id,
          peerId: { _: "peerChannel", channelId: 500 },
          fromId: { _: "peerUser", userId: 1 },
          date: 1790000000,
          message: "synthetic copy",
          out: true,
        },
        pts: 1,
        ptsCount: 1,
      },
    ],
    users: [{ _: "user", id: 1, firstName: "Owner", self: true }],
    chats: [
      {
        _: "channel",
        id: 500,
        title: "Valencia expats",
        megagroup: true,
        accessHash: Long.ZERO,
        photo: { _: "chatPhotoEmpty" },
        date: 0,
      },
    ],
    date: 1790000000,
    seq: 0,
  }
}

function message(id: number) {
  return {
    id,
    chat: group(-100500, "Valencia expats"),
    sender: user(777, "Ana"),
    date: new Date("2026-09-27T10:00:00.000Z"),
    editDate: null,
    text: `message ${id}`,
    entities: [],
    isOutgoing: false,
    media: null,
    replyToMessage: null,
    forward: null,
    isTopicMessage: false,
    reactions: null,
    views: null,
    forwards: null,
    groupedIdUnique: null,
    action: null,
    link: undefined,
  }
}

let umask: number
beforeEach(() => {
  umask = process.umask()
})
afterEach(() => {
  process.umask(umask)
})

const open = async (options: { listen?: boolean; diagnostic?: (line: string) => void } = {}) => {
  const adapter = await TelegramAdapter.open({
    credentials: { id: 1, hash: "h" },
    sessionPath: join(mkdtempSync(join(process.env.TG_TEST_SANDBOX ?? "", "adapter-")), "default.session"),
    ...options,
  })
  return { adapter, client: stand.client }
}

describe("opening", () => {
  it("**loads the logged-in user before any request**, and keeps updates off for a one-shot command", async () => {
    const { adapter, client } = await open()

    expect(client.calls[0]?.method).toBe("prepare")
    expect(stand.options).toMatchObject({ apiId: 1, apiHash: "h", disableUpdates: true })
    expect(adapter.self()).toBe("1")
  })

  it("sends mtcute's own log lines to the diagnostic stream, never stdout", async () => {
    const lines: string[] = []
    const { client } = await open({ diagnostic: (line) => lines.push(line) })
    const handler = client.log.mgr.handler as (...args: unknown[]) => void
    handler(0, 2, "net", "connected to %s", ["dc2"])

    expect(lines).toEqual(["[net] connected to dc2"])
  })

  it("asks for updates only when listening", async () => {
    await open({ listen: true })
    expect(stand.options).toMatchObject({ disableUpdates: false, updates: { catchUp: false } })
  })

  it("answers self() with null before a login", async () => {
    const { adapter, client } = await open()
    client.storage.self.getCached = () => null
    expect(adapter.self()).toBeNull()
  })
})

describe("health", () => {
  it("reads Telegram's clock in whole seconds, and an account in good standing has none", async () => {
    const { adapter } = await open()
    expect(await adapter.health()).toEqual({
      serverTime: 1_790_000_000_000,
      serverTimeResolutionMs: 1000,
      standingChecked: true,
    })
  })

  it("**reports a frozen account with its dates and the appeal link**", async () => {
    const { adapter, client } = await open()
    client.appConfigValue = {
      freeze_since_date: 1_788_000_000,
      freeze_until_date: 1_791_000_000,
      freeze_appeal_url: "https://example.org/appeal",
    }
    expect((await adapter.health()).standing).toEqual({
      state: "frozen",
      since: new Date(1_788_000_000_000).toISOString(),
      until: new Date(1_791_000_000_000).toISOString(),
      appealUrl: "https://example.org/appeal",
      hint: expect.stringContaining("appeal at https://example.org/appeal"),
    })
  })

  it("treats a zero freeze date as not frozen, and still answers the clock when the app configuration fails", async () => {
    const { adapter, client } = await open()
    client.appConfigValue = { freeze_since_date: 0 }
    expect((await adapter.health()).standing).toBeUndefined()
    client.appConfigValue = new tl.RpcError(500, "INTERNAL")
    expect(await adapter.health()).toEqual({
      serverTime: 1_790_000_000_000,
      serverTimeResolutionMs: 1000,
      standingChecked: false,
    })
  })
})

describe("reading", () => {
  it("pages chats by position and says whether more are left", async () => {
    const { adapter, client } = await open()
    client.dialogs = [1, 2, 3, 4].map((id) => dialog(group(-id, `chat ${id}`)))

    const chats = await adapter.chats({ limit: 2, offset: 1 })

    expect(chats.items.map((chat) => chat.title)).toEqual(["chat 2", "chat 3"])
    expect(chats.hasMore).toBe(true)
    expect(client.calls.find((call) => call.method === "iterDialogs")?.args[0]).toEqual({ archived: "keep" })
    expect((await adapter.chats({ offset: 0 })).items).toHaveLength(4)
  })

  it("pages through every chat in one walk of the dialogs, not a walk per page", async () => {
    const { adapter, client } = await open()
    client.dialogs = Array.from({ length: 350 }, (_, index) => dialog(group(-(index + 1), `chat ${index + 1}`)))

    const ids: string[] = []
    for (let offset = 0; ; ) {
      const page = await adapter.chats({ limit: 100, offset })
      ids.push(...page.items.map((chat) => chat.id))
      offset += page.items.length
      if (!page.hasMore) break
    }

    expect(new Set(ids).size).toBe(350)
    expect(client.calls.filter((call) => call.method === "iterDialogs")).toHaveLength(1)
    expect(client.dialogsPulled).toBe(350)
  })

  it("walks again from the top when a listing starts over or jumps", async () => {
    const { adapter, client } = await open()
    client.dialogs = [1, 2, 3, 4, 5].map((id) => dialog(group(-id, `chat ${id}`)))

    await adapter.chats({ limit: 2, offset: 0 })
    expect((await adapter.chats({ limit: 2, offset: 0 })).items.map((chat) => chat.id)).toEqual(["-1", "-2"])
    expect((await adapter.chats({ limit: 2, offset: 3 })).items.map((chat) => chat.id)).toEqual(["-4", "-5"])
    expect(client.calls.filter((call) => call.method === "iterDialogs")).toHaveLength(3)
  })

  it("walks again when the next page comes more than a minute later", async () => {
    const { adapter, client } = await open()
    client.dialogs = [1, 2, 3, 4].map((id) => dialog(group(-id, `chat ${id}`)))
    vi.useFakeTimers()
    try {
      await adapter.chats({ limit: 2, offset: 0 })
      vi.advanceTimersByTime(61_000)
      expect((await adapter.chats({ limit: 2, offset: 2 })).items.map((chat) => chat.id)).toEqual(["-3", "-4"])
      expect(client.calls.filter((call) => call.method === "iterDialogs")).toHaveLength(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it("lists a pinned chat once when Telegram's pages bring it again, and finds it by title", async () => {
    const { adapter, client } = await open()
    const pinned = dialog(group(-1, "Valencia expats"))
    client.dialogs = [pinned, dialog(group(-2, "chat 2")), pinned, dialog(group(-3, "chat 3"))]

    expect((await adapter.chats({ offset: 0 })).items.map((chat) => chat.id)).toEqual(["-1", "-2", "-3"])
    const page = await adapter.chats({ limit: 2, offset: 0 })
    expect(page.items.map((chat) => chat.id)).toEqual(["-1", "-2"])
    expect(page.hasMore).toBe(true)
    expect((await adapter.chat("Valencia")).id).toBe("-1")
  })

  it("refreshes supplied counters by exact message without view increments or read marks", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(42), views: 0, replies: { hasComments: true, count: 4 } }
    const counters = await adapter.fetchCounters("-100500", "42", ["views", "reactions", "comments"])
    expect(counters).toMatchObject({
      views: { value: 0, source: "remote_fetch", observedAt: expect.any(String) },
      comments: { value: 4 },
    })
    expect(counters.reactions).toBeUndefined()
    expect(client.calls.filter((call) => call.method === "getMessages").map((call) => call.args)).toEqual([
      [-100500, [42]],
    ])
    expect(client.calls.some((call) => /send|readHistory|increment|views/i.test(call.method))).toBe(false)
    const controller = new AbortController()
    controller.abort()
    await expect(adapter.fetchCounters("-100500", "42", ["views"], controller.signal)).rejects.toBeDefined()
    await adapter.close()
  })

  it("reads history oldest first, from before a message id, by chat id or @username", async () => {
    const { adapter, client } = await open()
    client.history = [message(3), message(2)]
    client.historyNext = {}

    const history = await adapter.history("-100500", { limit: 2, before: "10" })
    await adapter.history("@someone", { limit: 2 })

    expect(history.items.map((one) => one.id)).toEqual(["2", "3"])
    expect(history.hasMore).toBe(true)
    const asked = client.calls.filter((call) => call.method === "getHistory").map((call) => call.args)
    expect(asked).toEqual([
      [-100500, { limit: 2, offset: { id: 10, date: 0 } }],
      ["someone", { limit: 2 }],
    ])
  })

  it("reads one forum topic by Telegram's search in the thread, oldest first", async () => {
    const { adapter, client } = await open()
    client.history = [message(9), message(8)]
    client.historyNext = 8

    const topic = await adapter.topicHistory("-100500", "12", { limit: 2, before: "10" })

    expect(topic).toMatchObject({ items: [{ id: "8" }, { id: "9" }], hasMore: true })
    expect(client.calls.find((call) => call.method === "searchMessages")?.args).toEqual([
      { chatId: -100500, threadId: 12, limit: 2, offset: 10 },
    ])
  })

  it("reads one person's newest in a chat by Telegram's search by sender, oldest first", async () => {
    const { adapter, client } = await open()
    client.history = [message(7), message(5)]
    client.historyTotal = 3

    const found = await adapter.historyFrom("-100500", "42", { limit: 2 })

    expect(found.items.map((one) => one.id)).toEqual(["5", "7"])
    expect(found.hasMore).toBe(true)
    expect(client.calls.find((call) => call.method === "searchMessages")?.args).toEqual([
      { chatId: -100500, fromUser: 42, limit: 2 },
    ])
  })

  it("searches one chat on the server with its filters, and every chat without one", async () => {
    const { adapter, client } = await open()
    const signal = new AbortController().signal

    const inChat = await adapter.searchMessages(
      { text: "invoice", chat: "-100500", from: "42", minDate: Date.UTC(2026, 9, 1), maxDate: Date.UTC(2026, 9, 2) },
      { limit: 2, signal },
    )
    const everywhere = await adapter.searchMessages({ text: "invoice" }, { limit: 100 })

    expect(inChat.items.map((one) => [one.chatId, one.id, one.chatTitle])).toEqual([
      ["-1000000000500", "7", "Valencia expats"],
      ["-1000000000500", "5", "Valencia expats"],
    ])
    expect(inChat.hasMore).toBe(true)
    expect(inChat.chats).toMatchObject([{ id: "-1000000000500", title: "Valencia expats" }])
    expect(everywhere.hasMore).toBe(false)
    const searches = client.calls.filter(
      ({ method, args }) => method === "call" && /^messages\.search/.test((args[0] as { _: string })._),
    )
    expect(searches.map(({ args }) => args)).toEqual([
      [
        expect.objectContaining({
          _: "messages.search",
          q: "invoice",
          limit: 2,
          minDate: Date.UTC(2026, 9, 1) / 1000,
          maxDate: Date.UTC(2026, 9, 2) / 1000,
          peer: { _: "inputPeerChannel", peer: -100500 },
          fromId: { _: "inputPeerChannel", peer: 42 },
        }),
        { floodSleepThreshold: 0, abortSignal: signal },
      ],
      [expect.objectContaining({ _: "messages.searchGlobal", q: "invoice", limit: 100 }), { floodSleepThreshold: 0 }],
    ])
  })

  it("answers a flood wait on a server search at once, as rate_limited", async () => {
    const { adapter, client } = await open()
    client.searchAnswer = new tl.RpcError(420, "FLOOD_WAIT_30")

    await expect(adapter.searchMessages({ text: "invoice" }, { limit: 100 })).rejects.toMatchObject({
      code: "rate_limited",
    })
  })

  it("**reads past short pages and untrusted counts**, until the library returns no cursor", async () => {
    const { adapter, client } = await open()
    client.history = [message(3)]
    client.historyNext = { id: 3, date: 0 }
    client.historyTotal = 250
    const short = await adapter.history("-100500", { limit: 100, before: "10" })
    client.historyTotal = 0
    const inexact = await adapter.history("-100500", { limit: 100, before: "10" })

    client.history = [message(2), message(1)]
    client.historyNext = { id: 1, date: 0 }
    client.historyTotal = 2
    const small = await adapter.history("@someone", { limit: 100 })

    client.history = []
    client.historyNext = undefined
    client.historyTotal = 0
    const start = await adapter.history("-100500", { limit: 100, before: "3" })

    expect([short.items.map((one) => one.id), short.hasMore]).toEqual([["3"], true])
    expect(inexact.hasMore).toBe(true)
    expect([small.items.map((one) => one.id), small.hasMore]).toEqual([["1", "2"], true])
    expect([start.items, start.hasMore]).toEqual([[], false])
  })

  it("reads forward from one past a message id, or from a moment, keeping only what is newer", async () => {
    const { adapter, client } = await open()
    client.history = [message(11), message(12)]
    client.historyNext = { id: 13, date: 0 }

    const byId = await adapter.historyAfter("-100500", { limit: 2, after: { id: "10" } })
    client.history = [message(11), { ...message(12), date: new Date("2026-09-27T11:00:00.000Z") }]
    const byTime = await adapter.historyAfter("-100500", {
      limit: 5,
      after: { time: Date.parse("2026-09-27T10:30:00.000Z") },
    })

    expect([byId.items.map((one) => one.id), byId.hasMore]).toEqual([["11", "12"], true])
    expect([byTime.items.map((one) => one.id), byTime.hasMore]).toEqual([["12"], true])
    const asked = client.calls.filter((call) => call.method === "getHistory").map((call) => call.args[1])
    expect(asked).toEqual([
      { limit: 2, reverse: true, offset: { id: 11, date: 0 } },
      { limit: 5, reverse: true, offset: { id: 0, date: Date.parse("2026-09-27T10:30:00.000Z") / 1000 } },
    ])
  })

  it("reads back from a moment, oldest first, keeping only what is older", async () => {
    const { adapter, client } = await open()
    const at = (id: number, time: string) => ({ ...message(id), date: new Date(time) })
    client.history = [
      at(12, "2026-09-27T11:00:00.000Z"),
      at(11, "2026-09-27T09:00:00.000Z"),
      at(10, "2026-09-27T08:00:00.000Z"),
    ]
    client.historyNext = { id: 10, date: 0 }

    const page = await adapter.historyBefore("-100500", { limit: 3, time: Date.parse("2026-09-27T10:00:00.000Z") })

    expect([page.items.map((one) => one.id), page.hasMore]).toEqual([["10", "11"], true])
    const asked = client.calls.filter((call) => call.method === "getHistory").map((call) => call.args[1])
    expect(asked).toEqual([{ limit: 3, offset: { id: 0, date: Date.parse("2026-09-27T10:00:00.000Z") / 1000 } }])
  })

  it("**reads past a short page** before or after a moment, and stops only at an empty one", async () => {
    const { adapter, client } = await open()
    const time = Date.parse("2026-09-27T10:00:00.000Z")
    client.history = [{ ...message(5), date: new Date("2026-09-27T09:00:00.000Z") }]
    client.historyNext = { id: 5, date: 0 }
    const shortBefore = await adapter.historyBefore("-100500", { limit: 100, time })
    const shortAfter = await adapter.historyAfter("-100500", { limit: 100, after: { id: "4" } })

    client.history = []
    client.historyNext = undefined
    const startBefore = await adapter.historyBefore("-100500", { limit: 100, time })
    const endAfter = await adapter.historyAfter("-100500", { limit: 100, after: { id: "5" } })

    expect([shortBefore.items.map((one) => one.id), shortBefore.hasMore]).toEqual([["5"], true])
    expect([shortAfter.items.map((one) => one.id), shortAfter.hasMore]).toEqual([["5"], true])
    expect([startBefore.hasMore, endAfter.hasMore]).toEqual([false, false])
  })

  it("reads chat events from service messages, oldest first, naming people it only has ids for", async () => {
    const { adapter, client } = await open()
    const at = (minute: number) => new Date(Date.UTC(2026, 8, 27, 10, minute))
    client.peer = group(-100500, "Valencia expats")
    client.history = [
      { ...message(5), date: at(5), action: { type: "user_joined_link", inviter: 30 } },
      { ...message(4), date: at(4), action: { type: "photo_changed" } },
      { ...message(3), date: at(3), action: { type: "users_added", users: [31, 404] } },
      { ...message(2), date: at(3) },
      { ...message(1), date: at(0), action: { type: "user_left" } },
    ]

    const found = await adapter.chatEvents("-100500", { since: at(1).getTime() })

    expect(found.events.map((one) => [one.messageId, one.event, one.by.name, one.people])).toEqual([
      [
        "3",
        "add",
        "Ana",
        [
          { id: "31", name: "User 31" },
          { id: "404", name: null },
        ],
      ],
      ["5", "join", "User 30", [{ id: "777", name: "Ana" }]],
    ])
    expect([found.chatId, found.more]).toEqual(["-100500", false])
  })

  it("stops chat events after ten pages and says there was more", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "Valencia expats")
    client.history = [message(1)]
    client.historyNext = {}

    const found = await adapter.chatEvents("-100500", { since: 0 })

    expect(found.more).toBe(true)
    expect(client.calls.filter((call) => call.method === "getHistory")).toHaveLength(10)
  })

  it("refuses a --before that is not a message id before asking Telegram", async () => {
    const { adapter, client } = await open()
    await expect(adapter.history("me", { limit: 2, before: "abc" })).rejects.toMatchObject({
      code: "validation_error",
    })
    expect(client.calls.some((call) => call.method === "getHistory")).toBe(false)
  })

  it("finds a chat by part of its title among the dialogs", async () => {
    const { adapter, client } = await open()
    client.dialogs = [dialog(group(-100500, "Valencia expats")), dialog(group(-100600, "Books"))]

    const chat = await adapter.resolve("valencia")

    expect(chat).toMatchObject({ id: "-100500", title: "Valencia expats", kind: "group" })
  })

  it("answers `me` as Saved Messages through Telegram's own peer", async () => {
    const { adapter, client } = await open()
    client.peer = user(1, "Owner", { isSelf: true })

    expect(await adapter.resolve("me")).toMatchObject({ id: "1", title: "Saved Messages", kind: "saved" })
    expect(client.calls.find((call) => call.method === "getPeer")?.args[0]).toBe("me")
  })

  it("shows a group with its members, and a hidden member list as null", async () => {
    const { adapter, client } = await open()
    client.dialogs = [dialog(group(-100500, "Valencia expats"))]
    client.members = [{ user: user(777, "Ana") }]

    expect((await adapter.chat("-100500")).members).toEqual([{ id: "777", name: "Ana", username: null }])

    client.members = new tl.RpcError(403, "CHAT_ADMIN_REQUIRED")
    expect((await adapter.chat("-100500")).members).toBeNull()
  })

  it("names a group's admins and creator, and a hidden list as null", async () => {
    const { adapter, client } = await open()
    client.dialogs = [dialog(group(-100500, "Valencia expats"))]
    client.members = [
      { user: user(1, "Owner"), status: "creator" },
      { user: user(2, "Mod"), status: "admin" },
      { user: user(3, "Ana"), status: "member" },
    ]

    expect(await adapter.admins("-100500")).toEqual(["1", "2"])

    client.members = new tl.RpcError(403, "CHAT_ADMIN_REQUIRED")
    expect(await adapter.admins("-100500")).toBeNull()
  })

  it("lists a group's members a page at a time, with role and last seen", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "Valencia expats")
    client.members = [
      { user: user(1, "Owner", { lastOnline: new Date("2026-09-27T10:00:00.000Z") }), status: "creator" },
      { user: user(2, "Ana"), status: "member" },
    ]
    client.membersTotal = 5

    const page = await adapter.members("-100500", { limit: 2, offset: 2 })

    expect(page).toMatchObject({
      chatId: "-100500",
      hasMore: true,
      items: [
        { id: "1", role: "owner", lastSeenAt: "2026-09-27T10:00:00.000Z" },
        { id: "2", role: "member", lastSeenAt: null },
      ],
    })
    const asked = client.calls.filter((call) => call.method === "getChatMembers").map((call) => call.args[1])
    expect(asked).toEqual([{ offset: 2, limit: 2 }])
  })

  it("pauses a second between pages of one member list instead of asking for them back to back", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "Test group")
    const everyone = Array.from({ length: 450 }, (_, index) => ({ user: user(index + 2, "Alice Example") }))
    client.getChatMembers = async (...args: unknown[]) => {
      client.calls.push({ method: "getChatMembers", args })
      const { offset, limit } = args[1] as { offset: number; limit: number }
      return Object.assign(everyone.slice(offset, offset + limit), { total: everyone.length })
    }
    const pages = () => client.calls.filter((call) => call.method === "getChatMembers").length
    vi.useFakeTimers()
    try {
      const reading = adapter.members("-100500", { offset: 0 })
      await vi.advanceTimersByTimeAsync(999)
      expect(pages()).toBe(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(pages()).toBe(2)
      await vi.advanceTimersByTimeAsync(1000)
      expect((await reading).items).toHaveLength(450)
      expect(pages()).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it("counts a supergroup by its member list, which the chat and its full info can lag behind", async () => {
    const { adapter, client } = await open()
    client.peer = { ...group(-100500, "Test group"), membersCount: 1, raw: { _: "channel" } }
    client.fullChat = { ...group(-100500, "Test group"), membersCount: 1, full: { _: "channelFull" } }
    client.members = [{ user: user(1, "Owner"), status: "creator" }, { user: user(2, "Ana") }]

    expect(await adapter.members("-100500", { offset: 0 })).toMatchObject({ participantsCount: 2, hasMore: false })
    expect(await adapter.members("-100500", { offset: 200 })).toMatchObject({ participantsCount: null })
    client.dialogs = [dialog(client.peer)]
    expect(await adapter.chat("-100500")).toMatchObject({ participantsCount: 2, members: [{ id: "1" }, { id: "2" }] })
  })

  it("keeps a supergroup's full count when its list is hidden from this account", async () => {
    const { adapter, client } = await open()
    client.peer = { ...group(-100500, "Test group"), raw: { _: "channel" } }
    client.fullChat = {
      ...group(-100500, "Test group"),
      membersCount: 40,
      full: { _: "channelFull", participantsHidden: true },
    }
    client.members = [{ user: user(1, "Owner"), status: "creator" }]

    expect(await adapter.members("-100500", { offset: 0 })).toMatchObject({ participantsCount: 40 })
  })

  it("previews an invite without joining, and reads a joined invite or a public link as the chat", async () => {
    const { adapter, client } = await open()
    const chat = {
      chatType: "supergroup",
      title: "Pisos",
      id: -100500,
      username: "pisos_vlc",
      membersCount: 40,
      bio: "",
      isMember: true,
    }
    client.preview = { type: "supergroup", title: "Pisos", memberCount: 40, withApproval: true }

    expect(await adapter.inspect("https://t.me/+abc")).toMatchObject({ id: null, member: false, approvalNeeded: true })

    client.preview = null
    client.fullChat = chat
    expect(await adapter.inspect("https://t.me/+abc")).toMatchObject({ id: "-100500", member: true, description: null })
    expect(await adapter.inspect("https://t.me/pisos_vlc?start=1")).toMatchObject({ username: "pisos_vlc" })
    const read = client.calls.filter((call) => call.method === "getFullChat").map((call) => call.args[0])
    expect(read).toEqual(["https://t.me/+abc", "pisos_vlc"])
  })

  it("lists a forum's topics a page at a time, passing a search on as Telegram's query", async () => {
    const { adapter, client } = await open()
    const topic = (id: number) => ({
      id,
      title: `Topic ${id}`,
      isClosed: false,
      isPinned: id === 1,
      unreadCount: 0,
      lastMessage: { date: new Date("2026-09-27T10:00:00.000Z") },
      date: new Date("2026-09-01T10:00:00.000Z"),
    })
    client.topics = [topic(1), topic(2), topic(3)]

    const page = await adapter.topics("-100500", { search: "pis", limit: 1, offset: 1 })

    expect(page).toMatchObject({ hasMore: true, items: [{ id: "2", title: "Topic 2", pinned: false }] })
    expect(client.calls.find((call) => call.method === "iterForumTopics")?.args[1]).toEqual({ limit: 3, query: "pis" })
  })

  it("shows one forum topic, and says when the topic or the forum is not there", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "synthetic")
    await expect(adapter.topic("-100500", "4")).rejects.toMatchObject({ code: "validation_error" })
    client.peer = { ...group(-100500, "synthetic"), isForum: true }
    client.topics = []
    await expect(adapter.topic("-100500", "4")).rejects.toMatchObject({ code: "not_found" })
    client.topics = [
      {
        id: 4,
        title: "Pisos",
        isClosed: true,
        isPinned: false,
        unreadCount: 2,
        lastMessage: { date: new Date("2026-09-27T10:00:00.000Z") },
        date: new Date("2026-09-01T10:00:00.000Z"),
      },
    ]

    expect(await adapter.topic("-100500", "4")).toEqual({
      id: "4",
      title: "Pisos",
      closed: true,
      pinned: false,
      unreadCount: 2,
      lastMessageAt: "2026-09-27T10:00:00.000Z",
      createdAt: "2026-09-01T10:00:00.000Z",
    })
    expect(client.getForumTopicsById).toHaveBeenLastCalledWith(-100500, 4)
  })

  it("finds a person by phone, and says nobody is there without repeating the number", async () => {
    const { adapter, client } = await open()
    client.phoneOwner = user(21, "Adam", { username: "adam_k" })

    expect(await adapter.lookup("34600123456")).toEqual({ id: "21", name: "Adam", username: "adam_k" })

    client.phoneOwner = null
    const missing = adapter.lookup("34600123456")
    await expect(missing).rejects.toMatchObject({ code: "not_found" })
    await expect(missing).rejects.not.toThrow(/600123456/)
  })

  it("lists the address book, and the sessions without their IP address", async () => {
    const { adapter, client } = await open()
    client.contacts = [user(21, "Adam")]
    client.authorizations = [
      {
        current: true,
        appName: "tg",
        appVersion: "0.9.0",
        deviceModel: "Linux",
        platform: "",
        systemVersion: "6.8",
        region: "Valencia",
        country: "Spain",
        ip: "192.0.2.1",
        dateActive: 1_790_000_000,
        dateCreated: 0,
      },
    ]

    expect(await adapter.addressBook()).toEqual([{ id: "21", name: "Adam", username: null }])
    const [session] = await adapter.sessions()
    expect(session).toEqual({
      current: true,
      client: "tg 0.9.0",
      device: "Linux, 6.8",
      location: "Valencia, Spain",
      lastActiveAt: new Date(1_790_000_000_000).toISOString(),
      createdAt: null,
    })
  })

  it("shows a person with their bio, the one-to-one chat and the chats in common", async () => {
    const { adapter, client } = await open()
    client.peer = user(777, "Ana")
    client.dialogs = [dialog(group(-100500, "Valencia expats")), dialog(user(777, "Ana"), "2026-09-28T10:00:00.000Z")]

    const card = await adapter.contact("777")

    expect(card).toMatchObject({ id: "777", name: "Ana", description: "a bio" })
    expect(card.chats).toEqual([
      { id: "777", title: "Ana", kind: "dialog", lastMessageAt: "2026-09-28T10:00:00.000Z" },
      { id: "-100500", title: "Valencia expats", kind: "group", lastMessageAt: "2026-09-27T10:00:00.000Z" },
    ])
  })

  it("reads how many profile photos a person shows and the oldest one's date, in two requests at most", async () => {
    const { adapter, client } = await open()
    client.peer = user(777, "Ana")
    client.photoDates = ["2026-09-30T10:00:00.000Z", "2024-01-01T10:00:00.000Z", "2019-05-05T10:00:00.000Z"]

    expect(await adapter.photos("777")).toEqual({ count: 3, oldestAt: "2019-05-05T10:00:00.000Z" })
    expect(client.calls.filter(({ method }) => method === "getProfilePhotos").map(({ args }) => args)).toEqual([
      [0, 1],
      [2, 1],
    ])
    client.photoDates = []
    expect(await adapter.photos("777")).toEqual({ count: 0, oldestAt: null })
  })

  it("refuses a contact that is a chat", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "Valencia expats")
    await expect(adapter.contact("-100500")).rejects.toMatchObject({ code: "validation_error" })
  })

  it("cuts the window around a message and marks the anchor", async () => {
    const { adapter, client } = await open()
    client.history = [message(12), message(11), message(10), message(9), message(8)]

    const window = await adapter.around("-100500", "10", { before: 1, after: 1 })

    expect(window.map((one) => one.id)).toEqual(["9", "10", "11"])
    expect(window.find((one) => one.id === "10")).toMatchObject({ anchor: true })
    expect(client.calls.find((call) => call.method === "getHistory")?.args[1]).toEqual({
      offset: { id: 11, date: 0 },
      addOffset: -1,
      limit: 3,
    })
  })

  it("says not found when the message is not in the window", async () => {
    const { adapter, client } = await open()
    client.history = [message(5)]
    await expect(adapter.around("-100500", "10", { before: 1, after: 1 })).rejects.toMatchObject({
      code: "not_found",
    })
  })

  it("answers who this is with the phone, which only me() carries", async () => {
    const { adapter, client } = await open()
    client.getMe = async () => user(1, "Owner", { isSelf: true, phoneNumber: "0000001234" })

    expect(await adapter.me()).toEqual({ id: "1", name: "Owner", username: null, phone: "0000001234" })
  })

  it("turns Telegram's refusal into a typed error", async () => {
    const { adapter, client } = await open()
    client.getMe = async () => {
      throw new tl.RpcError(401, "AUTH_KEY_UNREGISTERED")
    }
    await expect(adapter.me()).rejects.toMatchObject({ code: "authentication_error" })
  })
})

describe("downloading", () => {
  const document = () =>
    Object.assign(new FileLocation(new Uint8Array()), {
      type: "document",
      fileName: "notes.pdf",
      mimeType: "application/pdf",
      fileSize: 3,
    })
  const read = async (file?: { bytes(): AsyncIterable<Uint8Array> }) => {
    const chunks: number[] = []
    for await (const chunk of file?.bytes() ?? []) chunks.push(...chunk)
    return chunks
  }

  it("**fetches the message afresh** and hands over its file with the bytes to read", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(10), media: document() }

    const { files, skipped } = await adapter.download("-100500", "10")

    expect(client.calls.find((call) => call.method === "getMessages")?.args).toEqual([-100500, 10])
    expect(files).toMatchObject([{ kind: "document", name: "notes.pdf", mime: "application/pdf", size: 3 }])
    expect(await read(files[0])).toEqual([1, 2, 3])
    expect(skipped).toEqual([])
  })

  it("names media that is not a file, and says not found for a missing message", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(10), media: { type: "poll" } }
    expect(await adapter.download("-100500", "10")).toEqual({ files: [], skipped: ["poll"] })

    client.found = null
    await expect(adapter.download("-100500", "10")).rejects.toMatchObject({ code: "not_found" })
  })

  it("turns a failure mid-download into a typed error", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(10), media: document() }
    client.chunks = [new tl.RpcError(400, "FILE_REFERENCE_EXPIRED")]

    const { files } = await adapter.download("-100500", "10")

    await expect(read(files[0])).rejects.toMatchObject({ code: "provider_error" })
  })
})

describe("transcribing", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("**asks again until Telegram has finished**, and answers the text", async () => {
    vi.useFakeTimers()
    const { adapter, client } = await open()
    client.transcripts = [{ text: "", pending: true }, { text: "", pending: true }, { text: "hello" }]

    const answer = adapter.transcribe("me", "126508")
    await vi.advanceTimersByTimeAsync(TRANSCRIBE_POLL_MS * 2)

    expect(await answer).toEqual({ text: "hello", pending: false })
    expect(client.calls.filter((call) => call.method === "call")).toHaveLength(3)
    expect(client.calls.find((call) => call.method === "call")?.args[0]).toMatchObject({
      _: "messages.transcribeAudio",
      msgId: 126508,
    })
  })

  it("stops after a minute and says it is still pending", async () => {
    vi.useFakeTimers()
    const { adapter } = await open()

    const answer = adapter.transcribe("me", "5")
    await vi.advanceTimersByTimeAsync(61_000)

    expect(await answer).toEqual({ text: "", pending: true })
  })
})

const forumFull = (id: number, extra: Record<string, unknown> = {}) => ({
  ...group(id, "synthetic group"),
  chatType: "supergroup",
  isCreator: true,
  isForum: false,
  linkedChat: null,
  migratedToId: null,
  raw: { _: "channel", forumTabs: false },
  adminRights: null,
  permissions: null,
  defaultPermissions: null,
  ...extra,
})

describe("forum setup", () => {
  it("reads basic, migrated and forum state, and refuses channels", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-500, { chatType: "group" })
    expect(await adapter.forumState("-500")).toMatchObject({ needsUpgrade: true, owner: true, forum: false })
    client.fullChat = forumFull(-500, { chatType: "group", migratedToId: -1000000000700 })
    client.fullChats.set(-1000000000700, forumFull(-1000000000700, { isForum: true }))
    expect(await adapter.forumState("-500")).toMatchObject({
      chat: { id: "-1000000000700" },
      needsUpgrade: false,
      forum: true,
    })
    client.fullChat = forumFull(-501, { chatType: "channel" })
    await expect(adapter.forumState("-501")).rejects.toThrow("not a channel")
  })
  it("migrates once and uses the returned supergroup peer", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-500, { chatType: "group" })
    client.resolvePeer = async () => ({ _: "inputPeerChat", chatId: 500 })
    client.fullChats.set(-1000000000700, forumFull(-1000000000700))
    client.migrationAnswer = {
      _: "updates",
      users: [],
      updates: [],
      chats: [{ _: "channel", id: 700, megagroup: true }],
      date: 0,
      seq: 0,
    }
    expect(await adapter.upgradeForum("-500")).toMatchObject({ chat: { id: "-1000000000700" }, needsUpgrade: false })
    expect(client.calls).toContainEqual({
      method: "call",
      args: [
        { _: "messages.migrateChat", chatId: 500 },
        { maxRetryCount: 0, floodSleepThreshold: 0 },
      ],
    })
    expect(client.handleClientUpdate).toHaveBeenCalled()
    await adapter.upgradeForum("-1000000000700")
    expect(client.calls.filter(({ method }) => method === "call")).toHaveLength(1)
  })
  it("preserves the migrated peer when confirmation fails", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-500, { chatType: "group" })
    client.resolvePeer = async () => ({ _: "inputPeerChat", chatId: 500 })
    client.migrationAnswer = {
      _: "updates",
      users: [],
      updates: [],
      chats: [{ _: "channel", id: 700, megagroup: true }],
      date: 0,
      seq: 0,
    }
    const read = client.getFullChat
    client.getFullChat = async (reference) => {
      if (reference === -1000000000700) throw new Error("synthetic confirmation failure")
      return read(reference)
    }
    await expect(adapter.upgradeForum("-500")).rejects.toMatchObject({
      code: "outcome_unknown",
      details: { previousChatId: "-500", chatId: "-1000000000700", upgraded: true, stage: "upgrade" },
    })
    expect(client.updateForumSettings).not.toHaveBeenCalled()
  })
  it("preserves forum UI, reads back and does not toggle again", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-100700, { raw: { _: "channel", forumTabs: true } })
    expect(await adapter.enableForum("-100700")).toMatchObject({ forum: true })
    expect(client.updateForumSettings).toHaveBeenCalledWith(-100700, { isForum: true, threadsMode: "tabs" })
    await adapter.enableForum("-100700")
    expect(client.updateForumSettings).toHaveBeenCalledTimes(1)
  })
  it.each([{ isCreator: false }, { chatType: "group" }, { linkedChat: {} }])(
    "refuses invalid enable state %j without toggle",
    async (extra) => {
      const { adapter, client } = await open()
      client.fullChat = forumFull(-100700, extra)
      await expect(adapter.enableForum("-100700")).rejects.toThrow()
      expect(client.updateForumSettings).not.toHaveBeenCalled()
    },
  )
  it("renames and closes a topic in one call, takes a repeat as done, and answers what Telegram accepted", async () => {
    const { adapter, client } = await open()
    client.topics = [
      {
        id: 12,
        title: "renamed",
        isClosed: true,
        isPinned: false,
        unreadCount: 0,
        lastMessage: null,
        date: new Date("2026-10-04T00:00:00Z"),
      },
    ]

    expect(await adapter.editTopic("-100500", "12", { title: "renamed", closed: true })).toMatchObject({
      id: "12",
      title: "renamed",
      closed: true,
    })
    expect(client.editForumTopic).toHaveBeenCalledWith({ chatId: -100500, topicId: 12, title: "renamed", closed: true })

    client.editForumTopic.mockRejectedValueOnce(new tl.RpcError(400, "TOPIC_NOT_MODIFIED"))
    await expect(adapter.editTopic("-100500", "12", { closed: true })).resolves.toMatchObject({ closed: true })
    await expect(adapter.editTopic("-100500", "12", { closed: false, title: "again" })).resolves.toMatchObject({
      closed: false,
      title: "again",
    })
    expect(client.editForumTopic).toHaveBeenNthCalledWith(2, { chatId: -100500, topicId: 12, closed: true })

    client.editForumTopic.mockRejectedValueOnce(new MtTimeoutError(1000))
    await expect(adapter.editTopic("-100500", "12", { closed: false })).rejects.toMatchObject({
      code: "outcome_unknown",
    })
    client.topics = []
    await expect(adapter.editTopic("-100500", "12", { closed: false })).rejects.toMatchObject({ code: "not_found" })
    expect(() => adapter.editTopic("-100500", "x", { closed: false })).toThrow("--topic")
  })

  it("pins without editing, and reorders pinned topics by number without force", async () => {
    const { adapter, client } = await open()
    client.topics = [
      {
        id: 12,
        title: "synthetic",
        isClosed: false,
        isPinned: false,
        unreadCount: 0,
        lastMessage: null,
        date: new Date("2026-10-04T00:00:00Z"),
      },
    ]

    expect(await adapter.editTopic("-100500", "12", { pinned: true })).toMatchObject({ pinned: true })
    expect(client.editForumTopic).not.toHaveBeenCalled()
    expect(client.toggleForumTopicPinned).toHaveBeenCalledWith({ chatId: -100500, topicId: 12, pinned: true })

    client.topics = [{ ...(client.topics[0] as object), id: 1, title: "General" }]
    expect(await adapter.editTopic("-100500", "1", { hidden: true })).toMatchObject({ id: "1", hidden: true })
    expect(client.toggleGeneralTopicHidden).toHaveBeenCalledWith({ chatId: -100500, hidden: true })
    expect(() => adapter.editTopic("-100500", "12", { hidden: true })).toThrow("only the General topic")

    await adapter.orderPinnedTopics("-100500", ["12", "3"])
    expect(client.reorderPinnedForumTopics).toHaveBeenCalledWith({ chatId: -100500, order: [12, 3] })
    client.reorderPinnedForumTopics.mockRejectedValueOnce(new MtTimeoutError(1000))
    await expect(adapter.orderPinnedTopics("-100500", ["12"])).rejects.toMatchObject({ code: "outcome_unknown" })
  })

  it("**deletes a topic with its history**, a gone topic is not_found, and a dropped answer is unknown", async () => {
    const { adapter, client } = await open()

    await adapter.deleteTopic("-100500", "12")
    expect(client.deleteForumTopicHistory).toHaveBeenCalledWith(-100500, 12)
    client.deleteForumTopicHistory.mockRejectedValueOnce(new tl.RpcError(400, "TOPIC_ID_INVALID"))
    await expect(adapter.deleteTopic("-100500", "12")).rejects.toMatchObject({ code: "not_found" })
    client.deleteForumTopicHistory.mockRejectedValueOnce(new MtTimeoutError(1000))
    await expect(adapter.deleteTopic("-100500", "12")).rejects.toMatchObject({ code: "outcome_unknown" })
  })

  it("creates a topic with the chosen random id and returns its server fields", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-100500, { isForum: true })
    client.topics = [
      {
        id: 12,
        title: "synthetic topic",
        isClosed: false,
        isPinned: false,
        unreadCount: 0,
        lastMessage: null,
        date: new Date("2026-10-03T00:00:00Z"),
      },
    ]
    const topic = await adapter.createTopic("-100500", "synthetic topic", { sendId: "42" })
    expect(topic).toMatchObject({ id: "12", title: "synthetic topic" })
    const request = client.calls.find(
      ({ method, args }) => method === "call" && (args[0] as { _: string })._ === "messages.createForumTopic",
    )?.args[0] as { randomId: unknown }
    expect(String(request.randomId)).toBe("42")
    expect(
      client.calls.find(
        ({ method, args }) => method === "call" && (args[0] as { _: string })._ === "messages.createForumTopic",
      )?.args[1],
    ).toEqual({ maxRetryCount: 0, floodSleepThreshold: 0 })
    expect(client.getForumTopicsById).toHaveBeenCalledWith(-100500, 12)
  })
  it("reports unknown creation/migration without inventing a retry identity", async () => {
    const { adapter, client } = await open()
    client.fullChat = forumFull(-100500, { isForum: true })
    client.topicAnswer = new MtTimeoutError(1000)
    await expect(adapter.createTopic("-100500", "synthetic", { sendId: "42" })).rejects.toMatchObject({
      code: "outcome_unknown",
      details: { sendId: "42", retryable: false },
    })
    client.topicAnswer = { _: "updates", updates: [], chats: [], users: [] }
    await expect(adapter.createTopic("-100500", "synthetic", { sendId: "43" })).rejects.toMatchObject({
      code: "outcome_unknown",
      details: { retryable: false },
    })
    client.fullChat = forumFull(-500, { chatType: "group" })
    client.resolvePeer = async () => ({ _: "inputPeerChat", chatId: 500 })
    client.migrationAnswer = new MtTimeoutError(1000)
    await expect(adapter.upgradeForum("-500")).rejects.toMatchObject({ code: "outcome_unknown" })
  })
})

describe("provider Markdown mapping", () => {
  it("preserves rich spans across text, edit and scheduled captions", async () => {
    const { adapter, client } = await open()
    const formatted = await adapter.formatMarkdown("🧪 **b** __u__ [l](https://example.test)")
    await adapter.send("-100500", formatted.text, { sendId: "42", threadId: "12", formatting: formatted.spans })
    expect(client.sendText.mock.calls[0]?.[1]).toMatchObject({
      text: "🧪 b u l",
      entities: [
        { _: "messageEntityBold", offset: 3, length: 1 },
        { _: "messageEntityUnderline", offset: 5, length: 1 },
        { _: "messageEntityTextUrl", offset: 7, length: 1, url: "https://example.test" },
      ],
    })
    await adapter.edit("-100500", "14", formatted.text, { formatting: formatted.spans })
    expect(client.editMessage.mock.calls[0]?.[0]).toMatchObject({ text: { text: formatted.text } })
    await adapter.send("-100500", formatted.text, {
      sendId: "43",
      threadId: "12",
      at: "2027-01-01T12:00:00.000Z",
      formatting: formatted.spans,
      attachments: [{ kind: "photo", name: "synthetic.png", bytes: new Uint8Array([1]) }],
    })
    expect(client.sendMedia.mock.calls[0]?.[1]).toMatchObject({
      caption: { text: formatted.text, entities: expect.any(Array) },
    })
    expect(client.sendMedia.mock.calls[0]?.[2]).toMatchObject({
      threadId: 12,
      schedule: new Date("2027-01-01T12:00:00.000Z"),
    })
  })
})

describe("forum addressing", () => {
  it.each(["0", "-1", "1.2", "2147483648", "x", " 12"])("rejects invalid topic %s without a request", async (id) => {
    const { adapter, client } = await open()
    await expect(adapter.validateThread("-100500", id, {})).rejects.toThrow("positive Telegram topic id")
    expect(client.getForumTopicsById).not.toHaveBeenCalled()
  })

  it("checks the forum, topic state and reply membership without sending", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "synthetic")
    await expect(adapter.validateThread("-100500", "12", {})).rejects.toThrow("requires a Telegram forum group")
    client.peer = { ...group(-100500, "synthetic"), isForum: true }
    await expect(adapter.validateThread("-100500", "12", {})).rejects.toThrow("does not exist")
    client.topics = [{ id: 12, isClosed: true }]
    await expect(adapter.validateThread("-100500", "12", {})).rejects.toThrow("is closed")
    client.topics = [{ id: 12, isClosed: false }]
    await expect(adapter.validateThread("-100500", "12", { replyTo: "14" })).rejects.toThrow("no longer exists")
    client.found = { ...message(14), isTopicMessage: true, replyToMessage: { threadId: 13 } }
    await expect(adapter.validateThread("-100500", "12", { replyTo: "14" })).rejects.toThrow("different topic")
    client.found = { ...message(14), isTopicMessage: true, replyToMessage: { threadId: 12 } }
    await adapter.validateThread("-100500", "12", { replyTo: "14" })
    client.found = message(12)
    await adapter.validateThread("-100500", "12", { replyTo: "12" })
    client.found = message(14)
    await adapter.validateThread("-100500", "1", { replyTo: "14" })
    expect(client.sendText).not.toHaveBeenCalled()
    expect(client.sendMedia).not.toHaveBeenCalled()
  })

  it("preserves non-General topics across text, scheduled media and polls", async () => {
    const { adapter, client } = await open()
    await adapter.send("-100500", "hello", { sendId: "42", threadId: "12", replyTo: "14" })
    await adapter.send("-100500", "caption", {
      sendId: "43",
      threadId: "12",
      at: "2027-01-01T12:00:00.000Z",
      attachments: [{ kind: "photo", name: "synthetic.png", bytes: new Uint8Array([1]) }],
    })
    await adapter.createPoll(
      "-100500",
      { question: "Friday?", answers: ["yes", "no"], anonymous: true, multiple: false, revote: false },
      { sendId: "44", threadId: "12", silent: true },
    )
    expect(client.sendText.mock.calls[0]?.[2]).toMatchObject({ threadId: 12, replyTo: 14 })
    expect(client.sendMedia.mock.calls[0]?.[2]).toMatchObject({
      threadId: 12,
      schedule: new Date("2027-01-01T12:00:00.000Z"),
    })
    expect(client.sendMedia.mock.calls[1]?.[2]).toMatchObject({ threadId: 12, silent: true })
    expect(String((client.sendMedia.mock.calls[1]?.[2] as { randomId: unknown } | undefined)?.randomId)).toBe("44")
    await adapter.send("-100500", "general", { sendId: "45", threadId: "1", replyTo: "14" })
    expect(client.sendText.mock.calls[1]?.[2]).toMatchObject({ replyTo: 14 })
    expect(client.sendText.mock.calls[1]?.[2]).not.toHaveProperty("threadId")
  })

  it("maps a topic closed after preflight to a known refusal", async () => {
    const { adapter, client } = await open()
    client.sendText.mockRejectedValueOnce(new tl.RpcError(400, "TOPIC_CLOSED"))
    await expect(adapter.send("-100500", "hi", { sendId: "42", threadId: "12" })).rejects.toMatchObject({
      code: "permission_error",
    })
    expect(client.sendText).toHaveBeenCalledTimes(1)
  })
})

describe("sending", () => {
  it("**sends with the given random_id** and answers with the message", async () => {
    const { adapter, client } = await open()

    const sent = await adapter.send("-100500", "hola", { sendId: "123456789012345", replyTo: "7" })

    expect(sent).toMatchObject({ sendId: "123456789012345", message: { id: "99" } })
    const [chat, text, options] = client.sendText.mock.calls[0] ?? []
    expect([chat, text]).toEqual([-100500, "hola"])
    expect(String((options as { randomId: unknown }).randomId)).toBe("123456789012345")
    expect(options).toMatchObject({ replyTo: 7 })
  })

  it("sends as the identity it was given, and refuses one that is not a peer id", async () => {
    const { adapter, client } = await open()

    await adapter.send("-1000000000500", "hola", { sendId: "42", sendAs: "-1002" })
    expect(() => adapter.send("-1000000000500", "hola", { sendId: "43", sendAs: "@channel" })).toThrow(
      "--send-as takes",
    )

    expect(client.sendText.mock.calls[0]?.[2]).toMatchObject({ sendAs: -1002 })
    expect(client.sendText).toHaveBeenCalledOnce()
  })

  it("sends a file and creates a poll as the identity it was given", async () => {
    const { adapter, client } = await open()
    const bytes = new Uint8Array([1])

    await adapter.send("-1000000000500", "caption", {
      sendId: "1",
      sendAs: "-1002",
      attachments: [{ kind: "file", name: "synthetic.txt", bytes }],
    })
    await adapter.createPoll(
      "-1000000000500",
      { question: "Friday?", answers: ["yes", "no"], anonymous: false, multiple: false },
      { sendId: "2", sendAs: "-1002" },
    )

    expect(client.sendMedia.mock.calls.map((call) => call[2])).toMatchObject([{ sendAs: -1002 }, { sendAs: -1002 }])
  })

  it("names the identity in the repeat an unknown outcome asks for", async () => {
    const { adapter, client } = await open()
    client.sendText.mockRejectedValueOnce(new MtTimeoutError(1))

    await expect(adapter.send("-1000000000500", "hola", { sendId: "42", sendAs: "-1002" })).rejects.toMatchObject({
      code: "outcome_unknown",
      message: expect.stringContaining("--send-id 42 --send-as -1002"),
    })
  })

  it("sends silently, without a preview, with each span as a Telegram entity", async () => {
    const { adapter, client } = await open()

    await adapter.send("-100500", "hola amigo", {
      sendId: "42",
      silent: true,
      noPreview: true,
      markup: [
        { type: "bold", from: 0, length: 4 },
        { type: "code", from: 5, length: 5 },
      ],
    })

    const [, text, options] = client.sendText.mock.calls[0] ?? []
    expect(text).toEqual({
      text: "hola amigo",
      entities: [
        { _: "messageEntityBold", offset: 0, length: 4 },
        { _: "messageEntityCode", offset: 5, length: 5 },
      ],
    })
    expect(options).toMatchObject({ silent: true, disableWebPreview: true })
  })

  it("sends nothing when the upload fails, and answers that nothing was sent", async () => {
    const { adapter, client } = await open()
    client.uploadFile.mockRejectedValue(new tl.RpcError(400, "FILE_PARTS_INVALID"))
    client.sendMedia.mockClear()

    await expect(
      adapter.send("-100500", "", {
        sendId: "1",
        attachments: [{ kind: "file", name: "plan.pdf", bytes: new Uint8Array([1]) }],
      }),
    ).rejects.not.toMatchObject({ code: "outcome_unknown" })
    expect(client.sendMedia).not.toHaveBeenCalled()
  })

  it("hides a photo or a video behind a spoiler, shows the caption above, and refuses a spoiler on a document", async () => {
    const { adapter, client } = await open()
    const bytes = new Uint8Array([1, 2, 3])
    client.sendMedia.mockClear()

    await adapter.send("-100500", "look", {
      sendId: "1",
      spoiler: true,
      captionAbove: true,
      attachments: [{ kind: "photo", name: "a.jpg", bytes }],
    })
    await adapter.send("-100500", "", {
      sendId: "2",
      spoiler: true,
      attachments: [{ kind: "file", name: "trip.mp4", bytes }],
    })
    client.uploadFile.mockClear()
    for (const attachment of [
      { kind: "file" as const, name: "trip.mp4", bytes, asFile: true as const },
      { kind: "file" as const, name: "notes.txt", bytes },
      { kind: "voice" as const, name: "note.ogg", bytes },
    ]) {
      await expect(
        adapter.send("-100500", "", { sendId: "3", spoiler: true, attachments: [attachment] }),
      ).rejects.toMatchObject({
        code: "validation_error",
      })
    }

    expect(client.uploadFile).not.toHaveBeenCalled()
    expect(client.sendMedia.mock.calls.map((call) => call[1])).toMatchObject([
      { type: "photo", spoiler: true },
      { type: "video", spoiler: true },
    ])
    expect(client.sendMedia.mock.calls[0]?.[2]).toMatchObject({ invert: true })
    expect(client.sendMedia.mock.calls[1]?.[2]).not.toHaveProperty("invert")
  })

  it("sends a voice message as voice, and a video as a video unless asFile", async () => {
    const { adapter, client } = await open()
    const bytes = new Uint8Array([1, 2, 3])
    client.sendMedia.mockClear()

    await adapter.send("-100500", "", { sendId: "1", attachments: [{ kind: "voice", name: "note.ogg", bytes }] })
    await adapter.send("-100500", "", { sendId: "2", attachments: [{ kind: "file", name: "trip.mp4", bytes }] })
    await adapter.send("-100500", "", {
      sendId: "3",
      attachments: [{ kind: "file", name: "trip.mp4", bytes, asFile: true }],
    })

    expect(client.sendMedia.mock.calls.map((call) => call[1])).toMatchObject([
      { type: "voice", fileMime: "audio/ogg" },
      { type: "video", fileName: "trip.mp4", fileMime: "video/mp4" },
      { type: "document", fileName: "trip.mp4" },
    ])
  })

  it("**sends a photo with its caption, the same random_id and the reply**, a file as a document, one per message", async () => {
    const { adapter, client } = await open()
    const bytes = new Uint8Array([1, 2, 3])

    const sent = await adapter.send("-100500", "look", {
      sendId: "123456789012345",
      replyTo: "7",
      attachments: [{ kind: "photo", name: "cat.png", bytes }],
    })
    await adapter.send("-100500", "", { sendId: "42", attachments: [{ kind: "file", name: "plan.pdf", bytes }] })

    expect(sent.message.id).toBe("98")
    const [[chat, photo, options], [, file]] = client.sendMedia.mock.calls as unknown[][] as [unknown[], unknown[]]
    expect(chat).toBe(-100500)
    expect(client.uploadFile.mock.calls[0]?.[0]).toMatchObject({
      file: bytes,
      fileName: "cat.png",
      requireFileSize: true,
    })
    expect(photo).toMatchObject({ type: "photo", file: { inputFile: { name: "cat.png" } }, caption: "look" })
    expect(String((options as { randomId: unknown }).randomId)).toBe("123456789012345")
    expect(options).toMatchObject({ replyTo: 7 })
    expect(file).toMatchObject({ type: "document", fileName: "plan.pdf" })
    expect(client.sendText).not.toHaveBeenCalled()
    expect(() =>
      adapter.send("-100500", "", {
        sendId: "42",
        attachments: [
          { kind: "photo", name: "a.png", bytes },
          { kind: "photo", name: "b.png", bytes },
        ],
      }),
    ).toThrow(/one file or photo/)
  })

  it("schedules with --at, and lists the queue soonest first, each with the time it goes", async () => {
    const { adapter, client } = await open()
    const at = "2030-01-01T09:00:00.000Z"
    client.scheduledQueue = [
      { ...message(8), isScheduled: true, date: new Date("2030-01-02T09:00:00.000Z") },
      { ...message(7), isScheduled: true, date: new Date(at) },
    ]

    await adapter.send("-100500", "later", { sendId: "42", at })
    const queued = await adapter.scheduled("-100500")

    const [, , options] = client.sendText.mock.calls[0] ?? []
    expect((options as { schedule: Date }).schedule.toISOString()).toBe(at)
    expect(queued.map((one) => [one.id, one.scheduledFor])).toEqual([
      ["7", at],
      ["8", "2030-01-02T09:00:00.000Z"],
    ])
  })

  it("**makes a timeout an unknown outcome** that names the send id to repeat", async () => {
    const { adapter, client } = await open()
    client.sendText.mockRejectedValueOnce(new MtTimeoutError(1000))

    await expect(adapter.send("-100500", "hola", { sendId: "42" })).rejects.toMatchObject({
      code: "outcome_unknown",
      details: { sendId: "42", cause: "timeout" },
    })
  })

  it("passes any other refusal through as it is", async () => {
    const { adapter, client } = await open()
    client.sendText.mockRejectedValueOnce(new tl.RpcError(403, "CHAT_WRITE_FORBIDDEN"))

    await expect(adapter.send("-100500", "hola", { sendId: "42" })).rejects.toMatchObject({ code: "permission_error" })
  })

  it("refuses a send id that is not a number without sending", async () => {
    const { adapter, client } = await open()
    expect(() => adapter.send("-100500", "hola", { sendId: "abc" })).toThrow(/--send-id/)
    expect(client.sendText).not.toHaveBeenCalled()
  })
})

describe("editing", () => {
  it("edits by chat and message id and answers with the edited message", async () => {
    const { adapter, client } = await open()

    const edited = await adapter.edit("-100500", "5", "fixed")

    expect(edited).toMatchObject({ id: "5" })
    expect(client.editMessage).toHaveBeenCalledWith({ chatId: -100500, message: 5, text: "fixed" })
  })

  it("sends an edit's markup as Telegram entities", async () => {
    const { adapter, client } = await open()

    await adapter.edit("-100500", "5", "fixed now", { markup: [{ type: "bold", from: 0, length: 5 }] })

    expect(client.editMessage).toHaveBeenCalledWith({
      chatId: -100500,
      message: 5,
      text: { text: "fixed now", entities: [{ _: "messageEntityBold", offset: 0, length: 5 }] },
    })
  })

  it("**takes an edit to the same text as done**, answering the message as it stands", async () => {
    const { adapter, client } = await open()
    client.editMessage.mockRejectedValueOnce(new tl.RpcError(400, "MESSAGE_NOT_MODIFIED"))
    client.found = message(5)

    await expect(adapter.edit("-100500", "5", "same")).resolves.toMatchObject({ id: "5" })
    expect(client.calls.find((call) => call.method === "getMessages")?.args).toEqual([-100500, [5]])
  })

  it("makes a timeout an unknown outcome, and passes a refusal through", async () => {
    const { adapter, client } = await open()
    client.editMessage.mockRejectedValueOnce(new MtTimeoutError(1000))
    client.editMessage.mockRejectedValueOnce(new tl.RpcError(403, "MESSAGE_AUTHOR_REQUIRED"))

    await expect(adapter.edit("-100500", "5", "x")).rejects.toMatchObject({ code: "outcome_unknown" })
    await expect(adapter.edit("-100500", "5", "x")).rejects.toMatchObject({ code: "permission_error" })
  })
})

describe("forwarding", () => {
  it("forwards one message by id, quietly when asked, and answers the copy", async () => {
    const { adapter, client } = await open()

    const copy = await adapter.forward("-100500", "5", "-1001", { sendId: "123456789012345", silent: true })

    expect(copy).toMatchObject({ id: "60", text: "synthetic copy", outgoing: true })
    const request = client.calls.find((call) => call.method === "call")?.args[0] as Record<string, unknown>
    expect(request).toMatchObject({ _: "messages.forwardMessages", id: [5], silent: true })
    expect(String((request.randomId as unknown[])[0])).toBe("123456789012345")
    expect(client.handleClientUpdate).toHaveBeenCalledOnce()
  })

  it("forwards as the identity it was given into a supergroup", async () => {
    const { adapter, client } = await open()

    await adapter.forward("-100500", "5", "-1000000000500", { sendId: "42", sendAs: "-1002" })

    const request = client.calls.find((call) => call.method === "call")?.args[0] as Record<string, unknown>
    expect(request).toMatchObject({ sendAs: { _: "inputPeerChannel", peer: -1002 } })
  })

  it("forwards into a forum topic as its top message, and into General with no topic", async () => {
    const { adapter, client } = await open()

    await adapter.forward("-100500", "5", "-1000000000500", { sendId: "42", threadId: "12" })
    await adapter.forward("-100500", "5", "-1000000000500", { sendId: "43", threadId: "1" })

    const requests = client.calls.filter((call) => call.method === "call").map((call) => call.args[0])
    expect(requests[0]).toMatchObject({ topMsgId: 12 })
    expect(requests[1]).not.toHaveProperty("topMsgId")
  })

  it("makes a timeout an unknown outcome that names the send id to repeat with", async () => {
    const { adapter, client } = await open()
    client.forwardAnswer = new MtTimeoutError(1000)

    await expect(adapter.forward("-100500", "5", "1", { sendId: "77" })).rejects.toMatchObject({
      code: "outcome_unknown",
      message: expect.stringContaining("--send-id 77"),
      details: { sendId: "77" },
    })
  })
})

describe("pinning", () => {
  it("pins quietly unless asked, and unpins by message id", async () => {
    const { adapter, client } = await open()

    await adapter.pin("-100500", "5", { notify: false })
    await adapter.unpin("-100500", "5")

    expect(client.pinMessage).toHaveBeenCalledWith({ chatId: -100500, message: 5, notify: false })
    expect(client.unpinMessage).toHaveBeenCalledWith({ chatId: -100500, message: 5 })
  })

  it("turns a missing admin right into a permission error", async () => {
    const { adapter, client } = await open()
    client.pinMessage.mockRejectedValueOnce(new tl.RpcError(403, "CHAT_ADMIN_REQUIRED"))

    await expect(adapter.pin("-100500", "5", { notify: true })).rejects.toMatchObject({ code: "permission_error" })
  })
})

describe("reacting", () => {
  it("sets one emoji, and null takes it off", async () => {
    const { adapter, client } = await open()

    await adapter.react("-100500", "5", "👍")
    await adapter.react("-100500", "5", null)

    expect(client.sendReaction.mock.calls).toEqual([
      [{ chatId: -100500, message: 5, emoji: "👍" }],
      [{ chatId: -100500, message: 5, emoji: null }],
    ])
  })

  it("passes an emoji the chat does not allow through as Telegram's refusal", async () => {
    const { adapter, client } = await open()
    client.sendReaction.mockRejectedValueOnce(new tl.RpcError(400, "REACTION_INVALID"))

    await expect(adapter.react("-100500", "5", "🦄")).rejects.toMatchObject({ code: "provider_error" })
  })
})

describe("making, joining and leaving groups", () => {
  const full = (id: number, title: string) => ({
    ...group(id, title),
    bio: "",
    inviteLink: null,
    defaultPermissions: { canPinMessages: false, canInviteUsers: true },
  })

  it("**makes a supergroup, never a legacy group**, adds the people after, and says who could not be added", async () => {
    const { adapter, client } = await open()
    client.fullChat = full(-100700, "Plans")
    client.addChatMembers.mockResolvedValueOnce([{ userId: 92 }])

    const card = await adapter.createGroup("Plans", ["91", "92"], { channel: false })

    expect(client.createSupergroup.mock.calls).toEqual([[{ title: "Plans" }]])
    expect(client.addChatMembers.mock.calls).toEqual([[-100700, [91, 92], {}]])
    expect(card).toMatchObject({
      id: "-100700",
      title: "Plans",
      description: null,
      settings: { allCanPin: false, onlyAdminsAdd: false, onlyAdminsCall: null },
      providerMetadata: { notAdded: ["92"] },
    })
  })

  it("makes a channel with --channel, and adds nobody when nobody was named", async () => {
    const { adapter, client } = await open()
    client.fullChat = full(-100701, "News")

    await adapter.createGroup("News", [], { channel: true })

    expect(client.createChannel).toHaveBeenCalledOnce()
    expect(client.addChatMembers).not.toHaveBeenCalled()
  })

  it("**turns references into user ids**, and refuses a chat where a person was expected", async () => {
    const { adapter, client } = await open()
    client.peer = user(91, "Ivan")
    expect(await adapter.people(["@ivan"])).toEqual(["91"])

    client.peer = group(-100500, "Book club")
    await expect(adapter.people(["@books"])).rejects.toMatchObject({ code: "validation_error" })
  })

  it("joins by link, and says a join that waits for admins was only requested", async () => {
    const { adapter, client } = await open()
    client.fullChat = full(-100702, "Joined")

    expect(await adapter.join("https://t.me/+abc")).toMatchObject({ id: "-100702" })
    expect(client.joinChat.mock.calls[0]).toEqual(["https://t.me/+abc"])

    client.joinChat.mockResolvedValueOnce({ status: "request_sent" })
    expect(await adapter.join("https://t.me/pisos_vlc")).toEqual({ requested: true })
    expect(client.joinChat.mock.calls[1]).toEqual(["pisos_vlc"])

    client.joinChat.mockResolvedValueOnce({ status: "webview" })
    await expect(adapter.join("https://t.me/pisos_vlc")).rejects.toMatchObject({ code: "provider_error" })
  })

  it("**changes only the switches asked for**, keeping every other right Telegram holds", async () => {
    const { adapter, client } = await open()
    client.fullChat = {
      ...full(-100700, "Plans"),
      defaultPermissions: {
        canPinMessages: false,
        canInviteUsers: true,
        raw: { _: "chatBannedRights", untilDate: 0, pinMessages: true, sendPolls: true },
      },
    }

    await adapter.updateGroup("-100700", { title: "Plans 2", settings: { allCanPin: true, onlyAdminsAdd: true } })

    expect(client.setChatTitle.mock.calls).toEqual([[-100700, "Plans 2"]])
    expect(client.setChatDescription).not.toHaveBeenCalled()
    expect(client.setChatDefaultPermissions.mock.calls).toEqual([
      [-100700, { pinMessages: false, sendPolls: true, inviteUsers: true }],
    ])
    expect(() => adapter.updateGroup("-100700", { settings: { onlyAdminsCall: true } })).toThrow(/no group setting/)
  })

  it("**turns join approval on**, and reads it back from the group", async () => {
    const { adapter, client } = await open()
    client.fullChat = { ...full(-100700, "Plans"), hasJoinRequests: true }

    expect(await adapter.updateGroup("-100700", { settings: { joinApproval: true } })).toMatchObject({
      settings: { joinApproval: true },
    })
    expect(client.toggleJoinRequests.mock.calls).toEqual([[-100700, true]])
    expect(client.setChatDefaultPermissions).not.toHaveBeenCalled()
  })

  it("**makes another invite link** with approval, an expiry and a limit, and reads no limit as none", async () => {
    const { adapter, client } = await open()

    expect(
      await adapter.createInviteLink("-100700", { approval: true, expiresAt: "2026-10-14T18:00:00.000Z", maxUses: 5 }),
    ).toEqual({
      link: "https://t.me/+extra",
      approval: true,
      expiresAt: "2026-10-14T18:00:00.000Z",
      maxUses: null,
    })
    expect(client.createInviteLink.mock.calls).toEqual([
      [-100700, { withApproval: true, expires: new Date("2026-10-14T18:00:00.000Z"), usageLimit: 5 }],
    ])
    await adapter.createInviteLink("-100700", { approval: false })
    expect(client.createInviteLink.mock.calls[1]).toEqual([-100700, { withApproval: false }])
  })

  it("**answers every request at once**, by one link or all, and lists and revokes links", async () => {
    const { adapter, client } = await open()

    await adapter.answerAllJoinRequests("-100700", false, "https://t.me/+extra")
    await adapter.answerAllJoinRequests("-100700", true)
    expect(client.hideAllJoinRequests.mock.calls).toEqual([
      [{ chatId: -100700, action: "decline", link: "https://t.me/+extra" }],
      [{ chatId: -100700, action: "approve" }],
    ])

    expect(await adapter.inviteLinks("-100700", { limit: 1, revoked: false })).toEqual({
      items: [
        {
          link: "https://t.me/+extra",
          approval: true,
          expiresAt: null,
          maxUses: null,
          primary: false,
          revoked: false,
          pending: 2,
          joined: 1,
        },
      ],
      hasMore: true,
    })
    expect(client.getInviteLinks.mock.calls).toEqual([[-100700, { limit: 1, revoked: false }]])

    expect(await adapter.revokeInviteLink("-100700", "https://t.me/+old")).toMatchObject({
      link: "https://t.me/+fresh",
      primary: true,
    })
    expect(client.revokeInviteLink.mock.calls).toEqual([[-100700, "https://t.me/+old"]])
  })

  it("changes only the given fields of a link, and takes an expiry away with 0", async () => {
    const { adapter, client } = await open()

    expect(
      await adapter.updateInviteLink("-100700", "https://t.me/+extra", { approval: false, maxUses: 5 }),
    ).toMatchObject({ link: "https://t.me/+extra", approval: false, maxUses: 5 })
    expect(
      await adapter.updateInviteLink("-100700", "https://t.me/+extra", { expiresAt: "2026-10-14T18:00:00.000Z" }),
    ).toMatchObject({ expiresAt: "2026-10-14T18:00:00.000Z" })
    expect(await adapter.updateInviteLink("-100700", "https://t.me/+extra", { expiresAt: null })).toMatchObject({
      expiresAt: null,
    })
    const sent = client.calls.filter((call) => call.method === "call").map((call) => call.args[0])
    expect(sent).toEqual([
      expect.objectContaining({ link: "https://t.me/+extra", requestNeeded: false, usageLimit: 5 }),
      expect.objectContaining({ expireDate: Date.parse("2026-10-14T18:00:00.000Z") / 1000 }),
      expect.objectContaining({ _: "messages.editExportedChatInvite", expireDate: 0 }),
    ])
  })

  it("reads a group, and replaces its link", async () => {
    const { adapter, client } = await open()
    client.fullChat = { ...full(-100700, "Plans"), inviteLink: { link: "https://t.me/+old" } }
    client.peer = group(-100700, "Plans")

    expect(await adapter.group("-100700")).toMatchObject({ link: "https://t.me/+old", settings: { allCanPin: false } })
    await adapter.resetInviteLink("-100700")
    expect(client.exportInviteLink.mock.calls).toEqual([[-100700]])
  })

  it("**adds people, naming who could not be added**, and refuses history per person", async () => {
    const { adapter, client } = await open()
    client.addChatMembers.mockResolvedValueOnce([{ userId: 92 }])

    expect(await adapter.addMembers("-100700", ["91", "92"], {})).toEqual({ notAdded: ["92"] })
    expect(client.addChatMembers.mock.calls).toEqual([[-100700, [91, 92], {}]])
    expect(() => adapter.addMembers("-100700", ["91"], { history: true })).toThrow(/group's setting/)
  })

  it("removes people one at a time, and gives or takes admin rights in Telegram's words", async () => {
    const { adapter, client } = await open()

    await adapter.removeMembers("-100700", ["91", "92"])
    await adapter.addAdmin("-100700", "91", ["pin", "members", "link"])
    await adapter.removeAdmin("-100700", "91")

    expect(client.kickChatMember.mock.calls).toEqual([
      [{ chatId: -100700, userId: 91 }],
      [{ chatId: -100700, userId: 92 }],
    ])
    expect(client.editAdminRights.mock.calls).toEqual([
      [{ chatId: -100700, userId: 91, rights: { pinMessages: true, banUsers: true, inviteUsers: true } }],
      [{ chatId: -100700, userId: 91, rights: {} }],
    ])
    expect(() => adapter.addAdmin("-100700", "91", ["read"])).toThrow(/no admin right read/)
  })

  it("leaves, answering the chat's id", async () => {
    const { adapter, client } = await open()
    client.peer = group(-100500, "Book club")

    expect(await adapter.leave("-100500")).toEqual({ chatId: "-100500" })
    expect(client.leaveChat).toHaveBeenCalledOnce()
  })
})

describe("chat folders", () => {
  const user7 = { _: "inputPeerUser", userId: 7, accessHash: 0 }
  const user8 = { _: "inputPeerUser", userId: 8, accessHash: 0 }
  const work = {
    _: "dialogFilter",
    id: 2,
    title: { _: "textWithEntities", text: "Work", entities: [] },
    pinnedPeers: [user8],
    includePeers: [user7],
    excludePeers: [],
  }

  it("**lists the folders, leaving out All chats**, pinned chats counted as in the folder", async () => {
    const { adapter, client } = await open()
    client.filters = [{ _: "dialogFilterDefault" }, work]

    expect(await adapter.folders()).toEqual([{ id: "2", title: "Work", chatIds: ["8", "7"], pinnedChatIds: ["8"] }])
  })

  it("**changes only the chats asked for**, keeping the rest of the folder", async () => {
    const { adapter, client } = await open()
    client.filters = [work]
    client.resolvePeer = (async (peer: unknown) => ({ _: "inputPeerUser", userId: peer, accessHash: 0 })) as never

    const changed = await adapter.updateFolder("2", { title: "Job", add: ["9", "7"], remove: ["7"] })

    expect(client.editFolder.mock.calls[0]?.[0]).toMatchObject({
      folder: work,
      modification: { title: { text: "Job" }, includePeers: [{ userId: 9 }, { userId: 7 }] },
    })
    expect(changed.title).toBe("Job")
    await expect(adapter.updateFolder("5", { title: "x" })).rejects.toMatchObject({ code: "not_found" })
  })

  it("creates a folder with its chats, and deletes one by id", async () => {
    const { adapter, client } = await open()
    client.resolvePeer = (async (peer: unknown) => ({ _: "inputPeerUser", userId: peer, accessHash: 0 })) as never

    expect(await adapter.createFolder("Home", ["7"])).toEqual({ id: "3", title: "Home", chatIds: ["7"] })
    await adapter.deleteFolder("3")
    expect(client.deleteFolder.mock.calls).toEqual([[3]])
  })

  it("**orders folders with All chats left where it was**, and joins a shared folder by its link", async () => {
    const { adapter, client } = await open()
    client.filters = [work, { _: "dialogFilterDefault" }, { ...work, id: 4 }]

    await adapter.orderFolders(["4", "2"])
    expect(await adapter.joinFolder("https://t.me/addlist/abc")).toEqual({ id: "6", title: "Shared", chatIds: ["7"] })

    expect(client.setFoldersOrder.mock.calls).toEqual([[[4, 0, 2]]])
    expect(client.joinChatlist.mock.calls).toEqual([["https://t.me/addlist/abc"]])
  })

  it("says plainly when a shared folder link is invalid or expired", async () => {
    const { adapter, client } = await open()
    client.joinChatlist.mockRejectedValueOnce(new tl.RpcError(400, "INVITE_SLUG_EXPIRED"))

    await expect(adapter.joinFolder("https://t.me/addlist/old")).rejects.toMatchObject({
      code: "not_found",
      message: "this folder link is invalid or has expired",
    })
  })

  it("**creates a folder by rules**, a pinned chat not listed twice, and reads the rules back", async () => {
    const { adapter, client } = await open()
    client.resolvePeer = (async (peer: unknown) => ({ _: "inputPeerUser", userId: peer, accessHash: 0 })) as never

    const made = await adapter.createFolder("Inbox", ["7", "8"], {
      include: ["contacts", "channels"],
      skip: ["archived"],
      exclude: ["9"],
      pin: ["8"],
      emoji: "📥",
    })

    expect(client.createFolder.mock.calls[0]?.[0]).toMatchObject({
      includePeers: [{ userId: 7 }],
      pinnedPeers: [{ userId: 8 }],
      excludePeers: [{ userId: 9 }],
      emoticon: "📥",
      contacts: true,
      nonContacts: false,
      broadcasts: true,
      bots: false,
      excludeArchived: true,
      excludeMuted: false,
    })
    expect(made).toMatchObject({
      chatIds: ["8", "7"],
      emoji: "📥",
      include: ["contacts", "channels"],
      skip: ["archived"],
      excludedChatIds: ["9"],
      pinnedChatIds: ["8"],
    })
  })

  it("**replaces a folder's rule sets, and moves a chat between its lists**", async () => {
    const { adapter, client } = await open()
    client.filters = [{ ...work, contacts: true, excludeRead: true }]
    client.resolvePeer = (async (peer: unknown) => ({ _: "inputPeerUser", userId: peer, accessHash: 0 })) as never

    await adapter.updateFolder("2", { include: [], skip: ["muted"], exclude: ["7"], pin: ["9"] })

    const { modification } = client.editFolder.mock.calls[0]?.[0] ?? { modification: {} }
    expect(modification).toMatchObject({
      contacts: false,
      excludeRead: false,
      excludeMuted: true,
      includePeers: [],
      pinnedPeers: [{ userId: 8 }, { userId: 9 }],
      excludePeers: [{ userId: 7 }],
    })
  })

  it("answers with the folder Telegram stored, which drops an emoji that is not a folder icon", async () => {
    const { adapter, client } = await open()
    client.filters = [work]
    client.editFolder.mockImplementationOnce(async (params) => {
      client.filters = [{ ...work, title: { _: "textWithEntities", text: "Job", entities: [] } }]
      return { ...params.folder, ...params.modification }
    })

    const changed = await adapter.updateFolder("2", { title: "Job", emoji: "🧪" })

    expect(changed).toMatchObject({ title: "Job" })
    expect(changed).not.toHaveProperty("emoji")
  })

  it("refuses rules on a folder shared by a link", async () => {
    const { adapter, client } = await open()
    client.filters = [{ ...work, _: "dialogFilterChatlist" }]

    await expect(adapter.updateFolder("2", { include: ["bots"] })).rejects.toMatchObject({ code: "validation_error" })
  })
})

describe("the address book and the profile", () => {
  it("**adds a person under the name they show**, renames, removes, blocks and unblocks by id", async () => {
    const { adapter, client } = await open()
    client.peer = user(91, "Ivan Petrov", { firstName: "Ivan", lastName: "Petrov" })

    expect(await adapter.addContact("91")).toMatchObject({ id: "91" })
    await adapter.renameContact("91", "Vanya")
    await adapter.removeContact("91")
    await adapter.block("91")
    await adapter.unblock("91")

    expect(client.addContact.mock.calls).toEqual([
      [{ userId: 91, firstName: "Ivan", lastName: "Petrov" }],
      [{ userId: 91, firstName: "Vanya" }],
    ])
    expect(client.deleteContacts.mock.calls).toEqual([[[91]]])
    expect(client.blockUser.mock.calls).toEqual([[91]])
    expect(client.unblockUser.mock.calls).toEqual([[91]])
  })

  it("imports numbers with a plus, the name split at its first space, and answers who Telegram knew", async () => {
    const { adapter, client } = await open()

    const known = await adapter.importContacts([{ phone: "34600111222", name: "Ivan de la Cruz" }])

    expect(client.importContacts.mock.calls).toEqual([
      [[{ phone: "+34600111222", firstName: "Ivan", lastName: "de la Cruz" }]],
    ])
    expect(known).toMatchObject([{ id: "91" }])
  })

  it("**calls the description the bio**, puts a photo up, and ends other sessions with Telegram's own call", async () => {
    const { adapter, client } = await open()

    await adapter.updateProfile({
      firstName: "New",
      description: "hi",
      photo: { kind: "photo", name: "me.jpg", bytes: new Uint8Array([1]) },
    })
    await adapter.endOtherSessions()

    expect(client.updateProfile.mock.calls).toEqual([[{ firstName: "New", bio: "hi" }]])
    expect(client.setMyProfilePhoto.mock.calls[0]?.[0]).toMatchObject({ type: "photo" })
    expect(client.calls.filter((one) => one.method === "call").map((one) => (one.args[0] as { _: string })._)).toEqual([
      "auth.resetAuthorizations",
      "account.getAuthorizations",
    ])
  })
})

describe("marking read", () => {
  it("reads everything, or up to a message", async () => {
    const { adapter, client } = await open()

    await adapter.markRead("-100500")
    await adapter.markRead("-100500", "9")

    expect(client.readHistory.mock.calls).toEqual([
      [-100500, {}],
      [-100500, { maxId: 9 }],
    ])
  })

  it("refuses an --until that is not a message id before asking Telegram", async () => {
    const { adapter, client } = await open()
    expect(() => adapter.markRead("-100500", "yesterday")).toThrow(/--until/)
    expect(client.readHistory).not.toHaveBeenCalled()
  })
})

describe("deleting", () => {
  it("**always says whether for everyone**, since mtcute's default is yes", async () => {
    const { adapter, client } = await open()
    client.resolvePeer = async (peer) => ({ _: "inputPeerUser", peer })
    client.getMessages = async (_peer: unknown, ids: unknown) => (ids as number[]).map((id) => message(id))

    await adapter.delete("1", ["5", "6"], { forEveryone: false })
    await adapter.delete("1", ["7"], { forEveryone: true })

    expect(client.deleteMessagesById.mock.calls).toEqual([
      [{ _: "inputPeerUser", peer: 1 }, [5, 6], { revoke: false }],
      [{ _: "inputPeerUser", peer: 1 }, [7], { revoke: true }],
    ])
  })

  it("**refuses a delete for me in a supergroup**, where Telegram deletes for everyone", async () => {
    const { adapter, client } = await open()

    await expect(adapter.delete("-1001234567890", ["5"], { forEveryone: false })).rejects.toMatchObject({
      code: "validation_error",
      message: expect.stringContaining("--for-everyone"),
    })
    await adapter.delete("-1001234567890", ["5"], { forEveryone: true })

    expect(client.deleteMessagesById).toHaveBeenCalledTimes(1)
  })

  it("**refuses an id that is not in the private chat**, deleting none, since Telegram numbers them per account", async () => {
    const { adapter, client } = await open()
    client.resolvePeer = async (peer) => ({ _: "inputPeerUser", peer })
    // mtcute answers null for an id it found in another chat.
    client.getMessages = async (_peer: unknown, ids: unknown) =>
      (ids as number[]).map((id) => (id === 289 ? null : message(id)))

    await expect(adapter.delete("1", ["127188", "289"], { forEveryone: true })).rejects.toMatchObject({
      code: "validation_error",
      message: expect.stringContaining("no message 289 in chat 1"),
    })
    expect(client.deleteMessagesById).not.toHaveBeenCalled()
  })
})

describe("polls", () => {
  it("**names each answer by its own bytes**, and counts each answer's voters only once they are known", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(3), media: fakePoll({}) }

    const poll = await adapter.poll("-100500", "3")

    expect(poll.answers).toEqual([
      { id: "MA", text: "yes", voters: null, chosen: false },
      { id: "MQ", text: "no", voters: null, chosen: false },
    ])
    expect(poll).toMatchObject({
      question: "Friday?",
      anonymous: false,
      closed: false,
      voters: 5,
      quiz: false,
      revote: true,
      creator: true,
    })
  })

  it("carries each poll's question and total in a history page, so a channel reads without `polls show`", async () => {
    const { adapter, client } = await open()
    client.history = [{ ...message(3), media: fakePoll({}) }]

    const [item] = (await adapter.history("-100500", { limit: 1 })).items

    expect(item?.providerMetadata?.poll).toEqual({
      question: "Friday?",
      voters: 5,
      answers: [
        { text: "yes", voters: null },
        { text: "no", voters: null },
      ],
    })
  })

  it("**votes with the answer's bytes, not its position**, and refuses an id the poll does not have", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(3), media: fakePoll({}) }

    const voted = await adapter.vote("-100500", "3", ["MQ"])
    await expect(adapter.vote("-100500", "3", ["1"])).rejects.toMatchObject({
      code: "validation_error",
      message: expect.stringContaining("MA, MQ"),
    })
    client.found = { ...message(3), media: fakePoll({ chosen: 1 }) }
    await adapter.vote("-100500", "3", [])

    expect(voted.answers.map((answer) => answer.voters)).toEqual([4, 1])
    const [first, retract] = client.sendVote.mock.calls.map(([params]) => params as { options: unknown })
    expect(first?.options).toEqual([new Uint8Array([0x31])])
    expect(retract?.options).toBeNull()
  })

  it.each([
    ["a closed poll", { closed: true }, ["MA"], "closed"],
    ["two answers in a one-answer poll", {}, ["MA", "MQ"], "one answer"],
    ["a changed vote where the vote is final", { chosen: 0, final: true }, ["MQ"], "final"],
    ["a retraction where the vote is final", { chosen: 0, final: true }, [], "final"],
    ["a retraction with no vote", {}, [], "not voted"],
  ] as const)("refuses %s before sending", async (_name, state, answers, said) => {
    const { adapter, client } = await open()
    client.found = { ...message(3), media: fakePoll(state) }
    client.sendVote.mockClear()

    await expect(adapter.vote("-100500", "3", [...answers])).rejects.toMatchObject({
      message: expect.stringContaining(said),
    })
    expect(client.sendVote).not.toHaveBeenCalled()
  })

  it("lets several answers into a poll that takes them", async () => {
    const { adapter, client } = await open()
    client.found = { ...message(3), media: fakePoll({ multiple: true }) }

    await adapter.vote("-100500", "3", ["MA", "MQ"])
    expect(client.sendVote).toHaveBeenCalled()
  })

  it("refuses to close a closed poll, or one made by somebody else, before sending", async () => {
    const { adapter, client } = await open()
    client.closePoll.mockClear()

    client.found = { ...message(3), media: fakePoll({ closed: true }) }
    await expect(adapter.closePoll("-100500", "3")).rejects.toMatchObject({ code: "validation_error" })
    client.found = { ...message(3), media: fakePoll({ creator: false }) }
    await expect(adapter.closePoll("-100500", "3")).rejects.toMatchObject({ code: "permission_error" })
    expect(client.closePoll).not.toHaveBeenCalled()
  })

  it("calls a timeout reading the poll a timeout, not a vote that may have been cast", async () => {
    const { adapter, client } = await open()
    client.getMessages = async () => {
      throw new MtTimeoutError(1000)
    }

    const failed = await adapter.vote("-100500", "3", ["MA"]).catch((error: unknown) => error)
    expect(failed).toMatchObject({ code: expect.not.stringMatching("outcome_unknown") })
    expect(client.sendVote).not.toHaveBeenCalled()
  })

  it("creates a quiz with its right answer and solution", async () => {
    const { adapter, client } = await open()
    client.sendMedia.mockClear()

    await adapter.createPoll(
      "-100500",
      {
        question: "2+2?",
        answers: ["3", "4"],
        multiple: false,
        anonymous: false,
        quiz: { correct: 1, solution: "four" },
      },
      { sendId: "79" },
    )

    expect(client.sendMedia.mock.calls[0]?.[1]).toMatchObject({
      type: "quiz",
      correct: 1,
      solution: "four",
      public: true,
    })
  })

  it("closes a poll by itself after the seconds given, and sends no period without them", async () => {
    const { adapter, client } = await open()
    client.sendMedia.mockClear()
    const poll = { question: "Now?", answers: ["yes", "no"], multiple: false, anonymous: false }

    await adapter.createPoll("-100500", { ...poll, closeAfter: 90 }, { sendId: "80" })
    await adapter.createPoll("-100500", poll, { sendId: "81" })

    expect(client.sendMedia.mock.calls[0]?.[1]).toMatchObject({ type: "poll", closePeriod: 90 })
    expect(client.sendMedia.mock.calls[1]?.[1]).not.toHaveProperty("closePeriod")
  })

  it("says a message without a poll is not found", async () => {
    const { adapter, client } = await open()
    client.found = message(3)

    await expect(adapter.poll("-100500", "3")).rejects.toMatchObject({ code: "not_found" })
  })

  it("closes a poll, and creates one with the send's random_id, public unless anonymous", async () => {
    const { adapter, client } = await open()
    client.sendMedia.mockClear()
    client.found = { ...message(3), media: fakePoll({}) }

    expect((await adapter.closePoll("-100500", "3")).closed).toBe(true)
    await adapter.createPoll(
      "-100500",
      { question: "Where?", answers: ["here", "there"], multiple: true, anonymous: false },
      { sendId: "77" },
    )
    await adapter.createPoll(
      "-100500",
      { question: "Again?", answers: ["yes", "no"], multiple: false, anonymous: true, revote: true },
      { sendId: "78" },
    )

    const [chat, media, options] = client.sendMedia.mock.calls[0] ?? []
    expect(chat).toBe(-100500)
    expect(media).toMatchObject({
      type: "poll",
      question: "Where?",
      multiple: true,
      public: true,
      disableRevoting: true,
    })
    expect(client.sendMedia.mock.calls[1]?.[1]).toMatchObject({ public: false, disableRevoting: false })
    expect(String((options as { randomId: unknown }).randomId)).toBe("77")
  })
})

describe("listening", () => {
  it("**passes messages, edits and deletions on until aborted**, then lets go of every handler", async () => {
    const { adapter, client } = await open({ listen: true })
    const events: MessageEvent[] = []
    const stop = new AbortController()
    let ready = false

    const watching = adapter.watch(
      (event) => events.push(event),
      stop.signal,
      () => {
        ready = true
      },
    )
    await vi.waitFor(() => expect(ready).toBe(true))
    client.onNewMessage.emit({ ...message(1), views: 0 })
    client.onEditMessage.emit(message(1))
    client.onDeleteMessage.emit({ messageIds: [1], channelId: null })
    client.onRawUpdate.emit({
      update: {
        _: "updateMessageReactions",
        peer: { _: "peerChannel", channelId: 500 },
        msgId: 1,
        reactions: {
          _: "messageReactions",
          min: true,
          results: [{ reaction: { _: "reactionEmoji", emoticon: "🔥" }, count: 2 }],
        },
      },
      peers: {},
    })
    client.onRawUpdate.emit({ update: { _: "updateUserStatus" }, peers: {} })
    stop.abort()
    await watching

    expect(events.map((event) => event.event)).toEqual(["message", "edit", "delete", "reaction"])
    expect(events[0]).toMatchObject({
      message: { counterObservations: { views: { value: 0, source: "remote_update" } } },
    })
    expect(events[3]).toMatchObject({
      counterObservation: { value: 2, source: "remote_update", observedAt: expect.any(String) },
    })
    expect(client.calls.map((call) => call.method)).toContain("startUpdatesLoop")
    expect(client.onNewMessage.handlers.size + client.onRawUpdate.handlers.size).toBe(0)
  })

  it("**fails on a revoked login before it says it is ready**, rather than listening to nothing", async () => {
    const { adapter, client } = await open({ listen: true })
    client.call = async (request: { _: string }) => {
      if (request._ === "updates.getState") throw new tl.RpcError(401, "AUTH_KEY_UNREGISTERED")
      return {}
    }
    let ready = false

    await expect(
      adapter.watch(
        () => {},
        new AbortController().signal,
        () => {
          ready = true
        },
      ),
    ).rejects.toMatchObject({ code: "authentication_error" })
    expect(ready).toBe(false)
    expect(client.onNewMessage.handlers.size).toBe(0)
  })
})

describe("a watch whose updates loop stops", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const watching = async (answer: () => Promise<unknown>) => {
    vi.useFakeTimers()
    const { adapter, client } = await open({ listen: true })
    const asked: string[] = []
    client.call = async (request: { _: string }) => {
      asked.push(request._)
      return request._ === "updates.getState" && asked.length > 1 ? answer() : {}
    }
    const stop = new AbortController()
    let ready = false
    const watch = adapter.watch(
      () => {},
      stop.signal,
      () => {
        ready = true
      },
    )
    await vi.waitFor(() => expect(ready).toBe(true))
    return { watch, client, stop, asked }
  }

  it("**ends with exit 4 when Telegram ended the login while it listened**", async () => {
    const { watch, client, asked } = await watching(() => Promise.reject(new tl.RpcError(401, "AUTH_KEY_UNREGISTERED")))
    const ended = expect(watch).rejects.toMatchObject({ code: "authentication_error" })

    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS)
    expect(asked).toEqual(["updates.getState"])
    client._client.updates.updatesLoopActive = false
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS)

    await ended
    expect(asked).toEqual(["updates.getState", "updates.getState"])
    expect(client.onNewMessage.handlers.size).toBe(0)
  })

  it("**ends with a code a service restarts** when the loop stopped and the login still works", async () => {
    const { watch, client } = await watching(async () => ({ _: "updates.state" }))
    const ended = expect(watch).rejects.toMatchObject({ code: "provider_unavailable" })

    client._client.updates.updatesLoopActive = false
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS)
    await ended
  })

  it("a network failure while asking is a restart too, never exit 4", async () => {
    const { watch, client } = await watching(() =>
      Promise.reject(Object.assign(new Error("x"), { code: "ECONNRESET" })),
    )
    const ended = expect(watch).rejects.toMatchObject({
      code: "provider_unavailable",
      details: { cause: "network_error" },
    })

    client._client.updates.updatesLoopActive = false
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS)
    await ended
  })

  it("an ask that never answers is a restart too, so the watch cannot hang on it", async () => {
    const { watch, client } = await watching(() => new Promise(() => {}))
    const ended = expect(watch).rejects.toMatchObject({ code: "provider_unavailable", details: { cause: "timeout" } })

    client._client.updates.updatesLoopActive = false
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS + STATE_WAIT_MS)
    await ended
  })

  it("**asks Telegram itself every 15 minutes**: a refused login ends it even while the loop looks alive", async () => {
    const answers: (() => Promise<unknown>)[] = [
      () => Promise.reject(Object.assign(new Error("x"), { code: "ECONNRESET" })),
      () => Promise.reject(new tl.RpcError(401, "SESSION_REVOKED")),
    ]
    const { watch, asked } = await watching(() => (answers.shift() as () => Promise<unknown>)())
    const ended = expect(watch).rejects.toMatchObject({ code: "authentication_error" })

    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS * (HEARTBEAT_TICKS - 1))
    expect(asked).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS)
    expect(asked).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS * HEARTBEAT_TICKS)
    await ended
    expect(asked).toHaveLength(3)
  })

  it("a stop asked for is a stop, even once the loop is down", async () => {
    const { watch, client, stop, asked } = await watching(async () => ({}))

    stop.abort()
    client._client.updates.updatesLoopActive = false
    await vi.advanceTimersByTimeAsync(LOOP_CHECK_MS * 2)
    await expect(watch).resolves.toBeUndefined()
    expect(asked).toEqual(["updates.getState"])
  })
})

describe("flood waits", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  type Middleware = (context: unknown, next: (context: unknown) => Promise<unknown>) => Promise<unknown>
  const floodWaiterOf = () => {
    const { middlewares } = (stand.options as { network: { middlewares: Middleware[] } }).network
    // mtcute's `basic()`: media throttle, flood waiter, internal errors.
    return middlewares[1] as Middleware
  }
  const context = {
    request: { _: "messages.getHistory" },
    manager: { _log: { warn: () => {} }, teardownSignal: new AbortController().signal },
  }
  const flood = (seconds: number) => ({ _: "mt_rpc_error", errorCode: 420, errorMessage: `FLOOD_WAIT_${seconds}` })

  it("**a one-shot command sits out a short wait and says so, and is told a long one at once**", async () => {
    vi.useFakeTimers()
    const notes: string[] = []
    await TelegramAdapter.open({
      credentials: { id: 1, hash: "h" },
      sessionPath: join(mkdtempSync(join(process.env.TG_TEST_SANDBOX ?? "", "adapter-")), "default.session"),
      note: (line) => notes.push(line),
    })
    const waiter = floodWaiterOf()

    const long = vi.fn(async () => flood(30))
    expect(await waiter(context, long)).toEqual(flood(30))
    expect(long).toHaveBeenCalledTimes(1)
    expect(notes).toEqual([])

    const answers = [flood(3), { ok: true }]
    const short = vi.fn(async () => answers.shift())
    const waited = waiter({ ...context, request: { _: "contacts.resolveUsername" } }, short)
    await vi.advanceTimersByTimeAsync(3000)
    expect(await waited).toEqual({ ok: true })
    expect(notes).toEqual(["Telegram asks to wait 3 s before contacts.resolveUsername — waiting, then going on"])
  })

  it("serve sits out a wait up to two minutes", async () => {
    vi.useFakeTimers()
    const lines: string[] = []
    await open({ listen: true, diagnostic: (line) => lines.push(line) })
    const answers = [flood(90), { ok: true }]
    const waited = floodWaiterOf()(
      context,
      vi.fn(async () => answers.shift()),
    )
    await vi.advanceTimersByTimeAsync(90_000)
    expect(await waited).toEqual({ ok: true })
    expect(lines).toEqual(["Telegram asks to wait 90 s before messages.getHistory — waiting, then going on"])
    expect(FLOOD_SLEEP.listening.maxWait).toBe(120_000)
  })
})

describe("closing", () => {
  it("logs out on Telegram's side, and close destroys the client", async () => {
    const { adapter, client } = await open()
    await adapter.logout()
    await adapter.close()

    expect(client.calls.map((call) => call.method).slice(-2)).toEqual(["logOut", "destroy"])
  })

  it("logs in by QR code and answers with the account", async () => {
    const { adapter, client } = await open()
    const account = await adapter.login({
      method: "qr",
      showQr: () => {},
      phone: async () => "",
      code: async () => "",
      password: async () => "",
      note: () => {},
    })

    expect(account).toEqual({ id: "1", name: "Owner", username: null })
    expect(client.calls.find((call) => call.method === "start")?.args[0]).toHaveProperty("qrCodeHandler")
  })

  describe("a phone login that asks for SMS", () => {
    const smsLogin = async (setup: (client: FakeClient) => void, codes = ["11111"], passwords = ["secret"]) => {
      const { adapter, client } = await open()
      client.getMe = async () => {
        throw new tl.RpcError(401, "AUTH_KEY_UNREGISTERED")
      }
      setup(client)
      const notes: string[] = []
      const account = await adapter.login({
        method: "phone",
        forceSms: true,
        showQr: () => {},
        phone: async () => "+10000000000",
        code: async () => codes.shift() ?? "",
        password: async () => passwords.shift() ?? "",
        note: (line) => notes.push(line),
      })
      return { account, client, notes }
    }
    const sendsToApp = (client: FakeClient) => {
      client.sendCode = vi.fn(async () => ({ type: "app", phoneCodeHash: "first" }))
      client.signIn = vi.fn(async () => user(1, "Owner", { isSelf: true }))
    }

    it("**keeps the code sent to the app when Telegram has no SMS**, and says so", async () => {
      const { account, client, notes } = await smsLogin((client) => {
        sendsToApp(client)
        client.resendCode = vi.fn(async () => {
          throw new tl.RpcError(400, "SEND_CODE_UNAVAILABLE")
        })
      })

      expect(account).toEqual({ id: "1", name: "Owner", username: null })
      expect(client.signIn).toHaveBeenCalledWith({ phone: "+10000000000", phoneCodeHash: "first", phoneCode: "11111" })
      expect(notes).toEqual(["Telegram offers no SMS for this account", "Telegram sent a login code (app)"])
      expect(client.calls.some((call) => call.method === "start")).toBe(false)
    })

    it("signs in with the resent code's hash when Telegram sends an SMS", async () => {
      const { client, notes } = await smsLogin((client) => {
        sendsToApp(client)
        client.resendCode = vi.fn(async () => ({ type: "sms", phoneCodeHash: "second" }))
      })

      expect(client.signIn).toHaveBeenCalledWith(expect.objectContaining({ phoneCodeHash: "second" }))
      expect(notes).toEqual(["Telegram sent a login code (sms)"])
    })

    it("asks again for a wrong code, then for the 2FA password", async () => {
      let tries = 0
      const { client, notes } = await smsLogin(
        (client) => {
          sendsToApp(client)
          client.resendCode = vi.fn(async () => ({ type: "sms", phoneCodeHash: "second" }))
          client.signIn = vi.fn(async () => {
            tries += 1
            throw new tl.RpcError(400, tries === 1 ? "PHONE_CODE_INVALID" : "SESSION_PASSWORD_NEEDED")
          })
          client.checkPassword = vi.fn(async () => user(1, "Owner", { isSelf: true }))
        },
        ["00000", "11111"],
      )

      expect(client.signIn).toHaveBeenCalledTimes(2)
      expect(client.checkPassword).toHaveBeenCalledWith("secret")
      expect(notes).toContain("that code was not accepted — try again")
    })

    it("asks nothing when the session is still logged in", async () => {
      const { adapter, client } = await open()
      client.sendCode = vi.fn()
      await adapter.login({
        method: "phone",
        forceSms: true,
        showQr: () => {},
        phone: async () => "+10000000000",
        code: async () => "",
        password: async () => "",
        note: () => {},
      })

      expect(client.sendCode).not.toHaveBeenCalled()
    })
  })
})

describe("message permalinks", () => {
  it.each([
    ["https://t.me/test_channel/12", "public"],
    ["https://t.me/c/500/3/12", "restricted"],
    ["https://other.example/12", "unknown"],
    ["https://t.me/test_channel/12?thread=3", "public"],
    ["https://t.me/test_channel/12?single&thread=3", "public"],
  ])("exports the individual target with thread context: %s", async (url, access) => {
    const { adapter, client } = await open()
    client.peer = { ...group(-100500, "Synthetic"), raw: { _: "channel" }, isForum: true }
    client.found = { id: 12 }
    client.exportedLink = url
    expect(await adapter.permalink("-100500", "12")).toEqual({ url, access, reason: null })
    expect(client.calls.find((call) => call.method === "getMessages")?.args[1]).toEqual([12])
    expect(client.calls.find((call) => call.method === "call")?.args[0]).toEqual({
      _: "channels.exportMessageLink",
      channel: { _: "inputChannel", channelId: 500, accessHash: 42 },
      id: 12,
      thread: true,
    })
    expect(client.readHistory).not.toHaveBeenCalled()
    expect(client.sendText).not.toHaveBeenCalled()
  })

  it.each([
    { type: "user", isSelf: false },
    { type: "user", isSelf: true },
    { type: "chat", raw: { _: "chat" } },
  ])("returns no native URL for unsupported chat kinds", async (peer) => {
    const { adapter, client } = await open()
    client.peer = peer
    client.found = { id: 12 }
    expect(await adapter.permalink("7", "12")).toEqual({ url: null, access: "unavailable", reason: "unsupported_chat" })
    expect(client.calls.some((call) => call.method === "call")).toBe(false)
  })

  it("refuses deleted targets and propagates export denial", async () => {
    const { adapter, client } = await open()
    client.found = null
    await expect(adapter.permalink("7", "12")).rejects.toMatchObject({ code: "not_found" })
    expect(client.calls.some((call) => call.method === "getPeer")).toBe(false)
    client.peer = { ...group(-100500, "Synthetic"), raw: { _: "channel" } }
    client.found = { id: 12 }
    client.exportedLink = new tl.RpcError(400, "CHANNEL_PRIVATE")
    await expect(adapter.permalink("-100500", "12")).rejects.toMatchObject({ code: "permission_error" })
  })

  it.each(["0", "-1", "2147483648", "9007199254740993", "12x"])(
    "refuses invalid ids without requests: %s",
    async (id) => {
      const { adapter, client } = await open()
      client.calls.length = 0
      await expect(async () => adapter.permalink("7", id)).rejects.toMatchObject({ code: "validation_error" })
      expect(client.calls).toEqual([])
    },
  )
})

describe("a write with no answer", () => {
  it("is an unknown outcome that says a repeat is safe where it is", async () => {
    const { adapter, client } = await open()
    client.pinMessage.mockRejectedValueOnce(new MtTimeoutError(1000))
    client.sendReaction.mockRejectedValueOnce(new MtTimeoutError(1000))
    client.blockUser.mockRejectedValueOnce(new MtTimeoutError(1000))

    for (const write of [
      () => adapter.pin("-100500", "5", { notify: false }),
      () => adapter.react("-100500", "5", "👍"),
      () => adapter.block("42"),
    ]) {
      await expect(write()).rejects.toMatchObject({
        code: "outcome_unknown",
        message: expect.stringContaining("repeating it is safe"),
      })
    }
  })

  it("warns that a repeated folder creation makes a second folder", async () => {
    const { adapter, client } = await open()
    client.createFolder.mockRejectedValueOnce(new MtTimeoutError(1000))

    await expect(adapter.createFolder("Work", [])).rejects.toMatchObject({
      code: "outcome_unknown",
      message: expect.stringContaining("a repeat makes a second one"),
    })
  })

  it("keeps a refusal a refusal", async () => {
    const { adapter, client } = await open()
    client.pinMessage.mockRejectedValueOnce(new tl.RpcError(400, "MESSAGE_ID_INVALID"))

    await expect(adapter.pin("-100500", "5", { notify: false })).rejects.not.toMatchObject({ code: "outcome_unknown" })
  })
})

describe("marking one forum topic read", () => {
  it("reads the topic as a thread, up to the message given or its newest", async () => {
    const { adapter, client } = await open()
    client.topics = [{ id: 12, lastMessage: { id: 90 } }]
    const reads = () =>
      client.calls
        .filter(({ method, args }) => method === "call" && (args[0] as { _: string })._ === "messages.readDiscussion")
        .map(({ args }) => args[0])

    await adapter.markTopicRead("-100500", "12", "40")
    await adapter.markTopicRead("-100500", "12")

    expect(reads()).toMatchObject([
      { msgId: 12, readMaxId: 40 },
      { msgId: 12, readMaxId: 90 },
    ])
    client.topics = []
    await expect(adapter.markTopicRead("-100500", "13")).rejects.toMatchObject({ code: "not_found" })
  })
})
