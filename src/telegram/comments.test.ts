import { tl } from "@mtcute/node"
import { describe, expect, it, vi } from "vitest"
import { commentsOf, discussionOf } from "./comments.js"

const reply = (id: number) => ({
  _: "message",
  id,
  peerId: { _: "peerChannel", channelId: 2 },
  fromId: { _: "peerUser", userId: 9 },
  date: 1_760_000_000,
  message: `synthetic comment ${id}`,
  replyTo: { _: "messageReplyHeader", replyToMsgId: 900 },
})

const client = (answer: unknown) => {
  const call = vi.fn(async () => answer)
  return {
    call,
    fake: {
      call,
      resolvePeer: async (id: number) => ({ _: "inputPeerChannel", channelId: id, accessHash: 0 }),
    } as never,
  }
}

describe("a channel post's discussion", () => {
  it("is the post's copy in the discussion group", async () => {
    const { fake } = client({ messages: [{ _: "message", id: 900, peerId: { _: "peerChannel", channelId: 2 } }] })
    expect(await discussionOf(fake, -1000000000001, 42)).toEqual({ chatId: "-1000000000002", messageId: "900" })
  })

  it("is not_found where Telegram answers MSG_ID_INVALID or nothing", async () => {
    const invalid = client(undefined)
    invalid.call.mockRejectedValueOnce(new tl.RpcError(400, "MSG_ID_INVALID"))
    await expect(discussionOf(invalid.fake, -1000000000001, 42)).rejects.toMatchObject({ code: "not_found" })
    await expect(discussionOf(client({ messages: [] }).fake, -1000000000001, 42)).rejects.toMatchObject({
      code: "not_found",
    })
    const other = client(undefined)
    other.call.mockRejectedValueOnce(new tl.RpcError(400, "CHANNEL_PRIVATE"))
    await expect(discussionOf(other.fake, -1000000000001, 42)).rejects.toThrow("CHANNEL_PRIVATE")
  })
})

describe("a post's comments", () => {
  it("asks for one more than wanted, answers oldest first and says whether older ones remain", async () => {
    const { fake, call } = client({
      _: "messages.channelMessages",
      messages: [reply(5), reply(4), reply(3)],
      chats: [],
      users: [],
    })
    const page = await commentsOf(fake, -1000000000001, 42, { limit: 2, before: 6 })
    expect(page.items.map((one) => one.id)).toEqual([4, 5])
    expect(page.hasMore).toBe(true)
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({ _: "messages.getReplies", msgId: 42, offsetId: 6, limit: 3 }),
    )
  })

  it("asks for at most Telegram's 100, and reads a full page of 100 as more to come", async () => {
    const full = Array.from({ length: 100 }, (_, i) => reply(200 - i))
    const { fake, call } = client({ _: "messages.channelMessages", messages: full, chats: [], users: [] })

    const page = await commentsOf(fake, -1000000000001, 42, { limit: 500 })

    expect(page.items).toHaveLength(100)
    expect(page.hasMore).toBe(true)
    expect(call).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
  })
})
