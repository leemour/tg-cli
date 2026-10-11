import { getMarkedPeerId, Long, PeersIndex, type TelegramClient, Message as TgMessage, tl } from "@mtcute/node"
import { CliError } from "@wirecat/cli-core"
import type { Discussion } from "@wirecat/cli-messaging"

type Client = Pick<TelegramClient, "call" | "resolvePeer">

const PAGE = 100

const noComments = () =>
  new CliError(
    "not_found",
    "this post takes no comments — the channel has no discussion, or the post is closed to them",
  )

/**
 * Measured 2026-10-07: a post whose channel has no discussion group, and a post closed to comments,
 * answer MSG_ID_INVALID — not the empty answer mtcute's own getDiscussionMessage expects.
 */
export const discussionOf = async (client: Client, channelId: number, postId: number): Promise<Discussion> => {
  try {
    const answer = await client.call({
      _: "messages.getDiscussionMessage",
      peer: await client.resolvePeer(channelId),
      msgId: postId,
    })
    const [root] = answer.messages
    if (!root || root._ === "messageEmpty") throw noComments()
    return { chatId: String(getMarkedPeerId(root.peerId)), messageId: String(root.id) }
  } catch (error) {
    if (tl.RpcError.is(error, "MSG_ID_INVALID")) throw noComments()
    throw error
  }
}

/**
 * Newest first from Telegram, one more than asked to know whether older ones remain; answered oldest first.
 * Telegram returns at most 100, so at a limit of 100 or more a full page is the only sign that more remain.
 */
export const commentsOf = async (
  client: Client,
  channelId: number,
  postId: number,
  { limit, before }: { limit: number; before?: number },
): Promise<{ items: TgMessage[]; hasMore: boolean }> => {
  const answer = await client.call({
    _: "messages.getReplies",
    peer: await client.resolvePeer(channelId),
    msgId: postId,
    offsetId: before ?? 0,
    offsetDate: 0,
    addOffset: 0,
    limit: Math.min(limit + 1, PAGE),
    maxId: 0,
    minId: 0,
    hash: Long.ZERO,
  })
  if (answer._ === "messages.messagesNotModified") return { items: [], hasMore: false }
  const peers = PeersIndex.from(answer)
  const found = answer.messages
    .filter((one): one is tl.RawMessage => one._ === "message")
    .map((one) => new TgMessage(one, peers))
  return { items: found.slice(0, limit).reverse(), hasMore: found.length > limit || found.length === PAGE }
}
