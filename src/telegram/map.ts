import { extname } from "node:path"
import {
  type ChatInviteLink,
  type ChatMember,
  type ChatPreview,
  type DeleteMessageUpdate,
  type Dialog,
  type ForumTopic,
  type FullChat,
  getMarkedPeerId,
  InputMedia,
  type InputMediaLike,
  type MessageMedia,
  MessageReactions,
  type Peer,
  type PeerSender,
  PeersIndex,
  type RawUpdateInfo,
  type TextWithEntities,
  Message as TgMessage,
  type Poll as TgPoll,
  type tl,
  type UploadedFile,
} from "@mtcute/node"
import { CliError } from "@wirecat/cli-core"
import type {
  AccountSession,
  Attachment,
  Chat,
  ChatKind,
  Folder,
  GroupCard,
  GroupMember,
  InviteLink,
  LinkTarget,
  Markup,
  Member,
  Message,
  MessageChange,
  MessageHit,
  Poll,
  ProviderMetadata,
  QuotedMessage,
  Reactions,
  TextSpan,
  Topic,
} from "@wirecat/cli-messaging"
import type { NewPoll } from "@wirecat/cli-messaging/cli"
import type { Upload } from "@wirecat/cli-messaging/sends"
import { rulesOf } from "./folder-rules.js"

/** The only file that knows mtcute's shapes. Every id leaves it as a string: Telegram ids are 64-bit. */

export interface Account {
  id: string
  name: string | null
  username: string | null
}

const seconds = (at: number): string | null => (at > 0 ? new Date(at * 1000).toISOString() : null)

export const toAccountSession = (session: tl.RawAuthorization): AccountSession => ({
  current: session.current === true,
  client: [session.appName, session.appVersion].filter(Boolean).join(" ") || null,
  device: [session.deviceModel, session.platform, session.systemVersion].filter(Boolean).join(", ") || null,
  location: [session.region, session.country].filter(Boolean).join(", ") || null,
  lastActiveAt: seconds(session.dateActive),
  createdAt: seconds(session.dateCreated),
})

export const toTopic = (topic: ForumTopic): Topic => ({
  id: String(topic.id),
  title: topic.title,
  closed: topic.isClosed,
  pinned: topic.isPinned,
  unreadCount: topic.unreadCount,
  lastMessageAt: topic.lastMessage?.date.toISOString() ?? null,
  createdAt: topic.date.toISOString(),
})

/** A private invite as its preview describes it: no id until the owner joins. */
export const toInvitePreview = (preview: ChatPreview): LinkTarget => ({
  kind: preview.type === "channel" ? "channel" : "group",
  title: preview.title,
  id: null,
  username: null,
  participantsCount: preview.memberCount,
  description: null,
  member: false,
  approvalNeeded: preview.withApproval,
})

export const toLinkChat = (chat: FullChat): LinkTarget => ({
  kind: chat.chatType === "channel" ? "channel" : "group",
  title: chat.title,
  id: String(chat.id),
  username: chat.username,
  participantsCount: groupMembersCount(chat),
  description: chat.bio || null,
  member: chat.isMember,
})

/** Telegram gives a last-seen time only to someone offline whose privacy shows it. */
export const toGroupMember = (member: ChatMember): GroupMember => ({
  ...toMember(member.user),
  role: member.status === "creator" ? "owner" : member.status === "admin" ? "admin" : "member",
  lastSeenAt: member.user.lastOnline?.toISOString() ?? null,
  joinedAt: member.joinedDate?.toISOString() ?? null,
  invitedBy: member.invitedBy ? String(member.invitedBy.id) : null,
  isBot: member.user.isBot,
  deleted: member.user.isDeleted,
  ...(member.user.isScam ? { flagged: "scam" as const } : member.user.isFake ? { flagged: "fake" as const } : {}),
  hasPhoto: member.user.photo !== null,
})

export const toMember = (user: Peer): Member => ({
  id: String(user.id),
  name: user.displayName || null,
  username: user.username,
})

export const toAccount = (user: Peer): Account => ({
  id: String(user.id),
  name: user.displayName || null,
  username: user.username,
})

/**
 * A group's own member count, `null` when unknown. mtcute's `FullChat` answers 0 for a basic group, whose
 * count is on the chat itself, and a supergroup's chat object usually has none: only its full info does.
 */
export const groupMembersCount = (peer: Peer): number | null => {
  if (peer.type !== "chat") return null
  return peer.membersCount || (peer.raw?._ === "chat" ? peer.raw.participantsCount : 0) || null
}

const kindOf = (peer: Peer): ChatKind => {
  if (peer.type === "user") return peer.isSelf ? "saved" : "dialog"
  if (peer.chatType === "channel") return "channel"
  return "group"
}

/** A chat as a peer alone describes it — no unread count or last message, which only a dialog carries. */
export const peerToChat = (peer: Peer, extra: Record<string, unknown> = {}): Chat => {
  const metadata = compact({
    isBot: peer.type === "user" && peer.isBot ? true : undefined,
    isForum: peer.type === "chat" && peer.isForum ? true : undefined,
    chatType: peer.type === "chat" ? peer.chatType : undefined,
    username: peer.username ?? undefined,
    ...extra,
  })
  return {
    id: String(peer.id),
    title: peer.type === "user" && peer.isSelf ? "Saved Messages" : peer.displayName || null,
    kind: kindOf(peer),
    unreadCount: null,
    lastMessageAt: null,
    participantsCount: groupMembersCount(peer),
    ...(metadata ? { providerMetadata: metadata } : {}),
  }
}

/** `isMuted` is `null` when the chat follows the account's default, which the dialog does not carry. */
export const toChat = (dialog: Dialog): Chat => ({
  ...peerToChat(dialog.peer, { pinned: dialog.isPinned || undefined }),
  unreadCount: dialog.unreadCount,
  lastMessageAt: dialog.lastMessage?.date.toISOString() ?? null,
  ...(dialog.isMuted === null ? {} : { muted: dialog.isMuted }),
  archived: dialog.isArchived,
  unreadMentions: dialog.unreadMentionsCount,
})

export const toMessage = (message: TgMessage): Message => {
  const reply = message.replyToMessage
  const metadata = compact({
    views: message.views ?? undefined,
    forwards: message.forwards ?? undefined,
    comments: message.replies?.hasComments ? message.replies.count : undefined,
    groupedId: message.groupedIdUnique ?? undefined,
    action: message.action?.type,
    poll: message.media?.type === "poll" ? pollMetadata(message.media) : undefined,
    link: linkOf(message),
    graph: {
      version: 1,
      ...(reply === null
        ? { reply: null }
        : reply?.id != null && !(reply.isForumTopic && reply.id === reply.threadId)
          ? { reply: { chatId: String(reply.chat?.id ?? message.chat.id), messageId: String(reply.id) } }
          : {}),
      ...(message.replies?.hasComments && message.replies.discussion != null
        ? { discussionChatId: String(message.replies.discussion) }
        : {}),
      ...(message.isAutomaticForward && message.forward?.raw.savedFromPeer && message.forward.raw.savedFromMsgId != null
        ? {
            discussionSource: {
              chatId: String(getMarkedPeerId(message.forward.raw.savedFromPeer)),
              messageId: String(message.forward.raw.savedFromMsgId),
            },
          }
        : {}),
    },
  })
  return {
    id: String(message.id),
    chatId: String(message.chat.id),
    senderId: String(message.sender.id),
    senderName: message.sender.displayName || null,
    ...(message.sender.type === "chat" ? { senderIsChat: true } : {}),
    ...(message.sender.type === "user" && message.sender.username ? { senderUsername: message.sender.username } : {}),
    timestamp: message.date.toISOString(),
    editedAt: message.editDate?.toISOString() ?? null,
    text: message.text,
    outgoing: message.isOutgoing,
    attachments: attachmentsOf(message.media),
    replyTo: null,
    ...(reply?.id != null ? { replyToId: String(reply.id) } : {}),
    forwardedFrom: message.forward ? forwardOf(message) : null,
    ...(message.isTopicMessage && reply?.threadId != null ? { threadId: String(reply.threadId) } : {}),
    reactions: message.reactions ? reactionsOf(message.reactions) : null,
    ...(message.isScheduled ? { scheduledFor: message.date.toISOString() } : {}),
    ...(metadata ? { providerMetadata: metadata } : {}),
    ...mentionsOf(message),
  }
}

/** Enough of a poll to read a channel's history without a `polls show` per message. */
const pollMetadata = (poll: TgPoll) => {
  const { question, voters, answers } = toPoll("", "", poll)
  return { question, voters, answers: answers.map(({ text, voters }) => ({ text, voters })) }
}

export const toHistoryChannel = (chats: tl.TypeChat[], id: number): tl.TypeInputChannel | undefined => {
  const chat = chats.find((one) => one._ === "channel" && one.id === id)
  return chat?._ === "channel" && chat.accessHash
    ? { _: "inputChannel", channelId: chat.id, accessHash: chat.accessHash }
    : undefined
}

export const toHistoryMessages = (
  page: Exclude<tl.messages.TypeMessages, tl.messages.RawMessagesNotModified>,
): Message[] => {
  const peers = PeersIndex.from(page)
  return page.messages
    .filter((message) => message._ !== "messageEmpty")
    .map((message) => toMessage(new TgMessage(message, peers)))
}

/** A mention by name has no `@handle` in the text; the entity carries the person's id. */
const mentionsOf = (message: TgMessage): { mentions?: string[] } => {
  const ids = message.entities.flatMap(({ params }) => (params.kind === "text_mention" ? [String(params.userId)] : []))
  return ids.length > 0 ? { mentions: [...new Set(ids)] } : {}
}

/** Only public chats and supergroups have links; mtcute throws for the rest, and that is not an error here. */
const linkOf = (message: TgMessage): string | undefined => {
  try {
    return message.link
  } catch {
    return undefined
  }
}

const forwardOf = (message: TgMessage): QuotedMessage => {
  const forward = message.forward
  const sender: PeerSender | undefined = forward?.sender
  return {
    id: forward?.fromMessageId != null ? String(forward.fromMessageId) : "",
    senderId: sender && sender.type !== "anonymous" ? String(sender.id) : null,
    senderName: sender?.displayName || null,
    timestamp: forward?.date.toISOString() ?? null,
    // The text of a forward is the message's own text in Telegram; a second copy would print twice.
    text: "",
    attachments: [],
    outgoing: null,
  }
}

const reactionsOf = (reactions: MessageReactions): Reactions => {
  const counts = reactions.reactions.map((one) => ({
    reaction: typeof one.emoji === "string" ? one.emoji : `custom:${String(one.emoji)}`,
    count: one.count,
    mine: one.order !== null,
  }))
  return {
    counts: counts.map(({ reaction, count }) => ({ reaction, count })),
    mine: counts.find((one) => one.mine)?.reaction ?? null,
    total: counts.reduce((sum, one) => sum + one.count, 0),
  }
}

export const attachmentsOf = (media: MessageMedia): Attachment[] => {
  if (!media) return []
  const read = <T>(name: string): T | undefined => {
    if (!(name in media)) return undefined
    const value = (media as unknown as Record<string, unknown>)[name]
    return value === null || value === "" ? undefined : (value as T)
  }
  const attachment: Attachment = { kind: media.type }
  const name = read<string>("fileName")
  const mime = read<string>("mimeType")
  const size = read<number>("fileSize")
  const width = read<number>("width")
  const height = read<number>("height")
  const duration = read<number>("duration")
  // In the domain type's order, so an answer from the store prints byte for byte the same.
  if (typeof width === "number") attachment.width = width
  if (typeof height === "number") attachment.height = height
  if (name !== undefined) attachment.name = name
  if (typeof size === "number") attachment.size = size
  if (mime !== undefined) attachment.mime = mime
  if (typeof duration === "number") attachment.duration = duration
  return [attachment]
}

const compact = (fields: Record<string, unknown>): ProviderMetadata | undefined => {
  const kept = Object.entries(fields).filter(([, value]) => value !== undefined)
  return kept.length > 0 ? Object.fromEntries(kept) : undefined
}

export interface EventOf {
  event: string
  by: number
  people: number[]
  title?: string
}

/** A service message as a change to who is in the chat, or to the chat itself; `null` for anything else. */
export const eventOf = (message: TgMessage): EventOf | null => {
  const { action } = message
  const by = message.sender.id
  switch (action?.type) {
    case "users_added":
      return { event: "add", by, people: [...action.users] }
    case "user_left":
      return { event: "leave", by, people: [by] }
    case "user_removed":
      return { event: "remove", by, people: [action.user] }
    case "user_joined_link":
      return { event: "join", by: action.inviter, people: [by] }
    case "user_joined_approved":
      return { event: "join", by, people: [by] }
    case "chat_created":
      return { event: "create", by, people: [...action.users], title: action.title }
    case "channel_created":
      return { event: "create", by, people: [], title: action.title }
    case "title_changed":
      return { event: "title", by, people: [], title: action.title }
    case "message_pinned":
      return { event: "pin", by, people: [] }
    default:
      return null
  }
}

export const toMessageHit = (message: TgMessage): MessageHit => ({
  ...toMessage(message),
  chatTitle: peerToChat(message.chat).title,
})

/** Private chats and basic groups name deleted ids without a chat; only a channel's say which. */
export const toDeletions = (update: DeleteMessageUpdate): MessageChange[] => {
  const chatId = update.channelId === null ? null : String(getMarkedPeerId(update.channelId, "channel"))
  return update.messageIds.map((id) => ({ event: "delete", chatId, chatTitle: null, messageId: String(id) }))
}

/** A personal account gets reaction changes only as a raw update; mtcute parses them for bots alone. */
export const toReactionChange = ({ update, peers }: RawUpdateInfo): MessageChange | undefined => {
  if (update._ !== "updateMessageReactions") return undefined
  const chatId = getMarkedPeerId(update.peer)
  return {
    event: "reaction",
    chatId: String(chatId),
    chatTitle: null,
    messageId: String(update.msgId),
    reactions: reactionsOf(new MessageReactions(update.msgId, chatId, update.reactions, peers)),
  }
}

const ENTITIES = {
  bold: "messageEntityBold",
  italic: "messageEntityItalic",
  strike: "messageEntityStrike",
  code: "messageEntityCode",
} as const satisfies Record<Markup["type"], tl.TypeMessageEntity["_"]>

/** Both count in UTF-16 code units, so a span's place carries over unchanged. */
export const toFormatted = (text: string, markup: readonly (Markup | TextSpan)[]): TextWithEntities => ({
  text,
  entities: markup.map((span): tl.TypeMessageEntity => {
    const base = { offset: span.from, length: span.length }
    switch (span.type) {
      case "bold":
      case "italic":
      case "strike":
      case "code":
        return { _: ENTITIES[span.type], ...base }
      case "underline":
        return { _: "messageEntityUnderline", ...base }
      case "spoiler":
        return { _: "messageEntitySpoiler", ...base }
      case "blockquote":
        return { _: "messageEntityBlockquote", ...base }
      case "pre":
        return { _: "messageEntityPre", ...base, language: span.language ?? "" }
      case "link":
        if (!span.url) throw new CliError("validation_error", "a formatted link needs a URL")
        return { _: "messageEntityTextUrl", ...base, url: span.url }
      default:
        throw new CliError("validation_error", "Telegram does not support this formatting span")
    }
  }),
})

/** A file goes as a document, so Telegram keeps it byte for byte; a photo is recompressed, as in the apps. */
const VIDEO: Record<string, string> = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".mov": "video/quicktime" }

/** A video plays in the chat unless `asFile`; a `document` is always a file to download (`forceFile`). */
const videoMime = ({ kind, name, asFile }: Upload): string | undefined =>
  kind === "file" && !asFile ? VIDEO[extname(name).toLowerCase()] : undefined

/** What `uploadFile` needs to store the file as `toInputMedia` will send it. */
export const toUploadParams = (upload: Upload) => {
  const mime = upload.kind === "voice" ? "audio/ogg" : videoMime(upload)
  return {
    file: upload.bytes,
    fileName: upload.name,
    ...(mime ? { fileMime: mime } : {}),
    ...(upload.kind === "photo" ? { requireFileSize: true, requireExtension: true } : {}),
  }
}

/** Checked before the upload, so a refused spoiler never spends one. */
export const checkSpoiler = (upload: Upload) => {
  if (upload.kind !== "photo" && !videoMime(upload))
    throw new CliError("validation_error", "--spoiler hides a photo or a video only")
}

/** `file` is the bytes, or the same file already uploaded — then nothing is uploaded again. */
export const toInputMedia = (
  upload: Upload,
  caption: string | TextWithEntities,
  file: Uint8Array | UploadedFile = upload.bytes,
  { spoiler = false }: { spoiler?: boolean } = {},
): InputMediaLike => {
  const { kind, name } = upload
  const hidden = spoiler ? { spoiler } : {}
  if (kind === "photo") return InputMedia.photo(file, { fileName: name, caption, ...hidden })
  if (kind === "voice") return InputMedia.voice(file, { fileMime: "audio/ogg", caption })
  const video = videoMime(upload)
  return video
    ? InputMedia.video(file, { fileName: name, fileMime: video, caption, supportsStreaming: true, ...hidden })
    : InputMedia.document(file, { fileName: name, caption })
}

/** An answer's id is its option bytes as base64url: Telegram's own, and not a position a person could guess. */
export const answerId = (data: Uint8Array): string => Buffer.from(data).toString("base64url")

/**
 * Each answer's voters are counted only once the owner voted or the poll closed; before that Telegram says
 * nothing about them. The total comes either way.
 */
export const toPoll = (chatId: string, messageId: string, poll: TgPoll): Poll => {
  const counted = poll.isClosed || poll.answers.some((answer) => answer.chosen)
  return {
    chatId,
    messageId,
    question: poll.question,
    answers: poll.answers.map((answer) => ({
      id: answerId(answer.data),
      text: answer.text,
      voters: counted ? answer.voters : null,
      chosen: answer.chosen,
    })),
    closed: poll.isClosed,
    multiple: poll.isMultiple,
    anonymous: !poll.isPublic,
    voters: counted ? poll.voters : (poll.results?.totalVoters ?? null),
    quiz: poll.isQuiz,
    revote: !poll.isRevotingDisabled,
    creator: poll.isCreator,
  }
}

export const toInputPoll = ({
  question,
  answers,
  multiple,
  anonymous,
  revote,
  quiz,
  closeAfter,
}: NewPoll): InputMediaLike => {
  const closing = closeAfter === undefined ? {} : { closePeriod: closeAfter }
  return quiz
    ? InputMedia.quiz({
        question,
        answers,
        public: !anonymous,
        correct: quiz.correct,
        ...(quiz.solution === undefined ? {} : { solution: quiz.solution }),
        ...closing,
      })
    : InputMedia.poll({ question, answers, multiple, public: !anonymous, disableRevoting: revote !== true, ...closing })
}

/** The two of max's five group switches Telegram has, as default member permissions. */
export const GROUP_SETTINGS = ["allCanPin", "onlyAdminsAdd", "joinApproval"] as const

/**
 * max's admin rights in Telegram's words. Telegram has no right to read: an admin always reads, so
 * `read` is not offered.
 */
export const ADMIN_RIGHT_FIELDS = {
  members: "banUsers",
  admins: "addAdmins",
  info: "changeInfo",
  pin: "pinMessages",
  link: "inviteUsers",
  post: "postMessages",
  edit: "editMessages",
  delete: "deleteMessages",
} as const

/**
 * A group as `chats create` and `chats join` answer it. Telegram has two of max's five switches —
 * whether members may pin, and whether they may add people — as default member permissions; the
 * other three are `null`.
 */
export const toGroupCard = (full: FullChat): GroupCard => {
  const defaults = full.defaultPermissions
  return {
    ...peerToChat(full),
    description: full.bio || null,
    link: full.inviteLink?.link ?? null,
    settings: {
      allCanPin: defaults ? defaults.canPinMessages : null,
      onlyAdminsAdd: defaults ? !defaults.canInviteUsers : null,
      onlyAdminsCall: null,
      onlyOwnerEditsInfo: null,
      membersSeeLink: null,
      joinApproval: full.hasJoinRequests,
    },
  }
}

/** mtcute reads a link with no use limit as `Infinity`. */
export const toInviteLink = (made: ChatInviteLink): InviteLink => ({
  link: made.link,
  approval: made.approvalNeeded,
  expiresAt: made.endDate?.toISOString() ?? null,
  maxUses: Number.isFinite(made.usageLimit) ? made.usageLimit : null,
  primary: made.isPrimary,
  revoked: made.isRevoked,
  pending: made.pendingApprovals,
  joined: made.usage,
})

/**
 * A folder as `chats folders` answers it; `null` for "All chats", which Telegram lists among the
 * folders but nobody can change. Pinned chats are in the folder too, so they count as added.
 */
const idsOf = (peers: tl.TypeInputPeer[]) => [...new Set(peers.map((peer) => String(getMarkedPeerId(peer))))]

export const toFolder = (filter: tl.TypeDialogFilter): Folder | null => {
  if (filter._ === "dialogFilterDefault") return null
  const folder: Folder = {
    id: String(filter.id),
    title: filter.title.text,
    chatIds: idsOf([...filter.pinnedPeers, ...filter.includePeers]),
  }
  if (filter.emoticon) folder.emoji = filter.emoticon
  if (filter.pinnedPeers.length > 0) folder.pinnedChatIds = idsOf(filter.pinnedPeers)
  if (filter._ === "dialogFilter") {
    Object.assign(folder, rulesOf(filter))
    if (filter.excludePeers.length > 0) folder.excludedChatIds = idsOf(filter.excludePeers)
  }
  return folder
}
