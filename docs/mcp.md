# The MCP server

`tg mcp` hands a profile to an agent over [MCP](https://modelcontextprotocol.io), on stdin and
stdout, with no network port. The server comes with `tg`; there is nothing else to install.

**When you need it.** In Claude Code, Codex and other agents with a terminal, `tg` itself is enough
— it costs the same tokens and can do the same things. MCP is for clients without a terminal, such
as Claude Desktop or Cursor's chat, and for anyone who wants the client to ask before each send.
ChatGPT or Claude **in the browser** need more than this — see [remote.md](remote.md).

This server is copied from max-cli's (`max mcp`) and behaves the same way.

## Connecting

Run `tg setup --agent none` in a local terminal first. It configures the Telegram account;
`tg mcp setup` separately connects the client. `tg skill show` explains both before login.
The MCP server never logs in for you.

**Codex or Claude Code on this computer:**

```sh
tg mcp doctor                # check that MCP starts and lists tools
tg mcp setup codex          # add it to Codex
tg mcp setup claude-code    # or add it to Claude Code
```

Put a profile first, for example `tg work mcp setup codex`. Setup uses the client's own command
and leaves its other servers alone. If the same name already exists, remove that entry in the
client before running setup again. The default tg profile offers writing tools. Setup therefore
asks you to review its permissions and repeat with `--allow-writes`; that flag acknowledges the
installation and does not change permissions. To restrict what the agent can do, set the profile's
`permissions` first ([below](#what-an-agent-may-do)).

`mcp doctor` reads no messages and does not log in to Telegram. A healthy result means the MCP
handshake and tool list work, not that the account session is valid. `potentialWrites` counts tools
without a read-only declaration. Browser and mobile chats need a separate remote connection
([remote.md](remote.md)).

**Claude Code:**

```sh
claude mcp add tg -- tg mcp
```

With a profile — it goes first, as in any command:

```sh
claude mcp add tg-work -- tg work mcp
```

**Claude Desktop, Cursor and others:** `tg` prints the entry for their settings file:

```sh
tg mcp config
tg work mcp config --confirm-send     # the entry with a form before every change
```

`--confirm-send`, `--allow-dangerous` and `--yes` go into the entry as given
([below](#what-an-agent-may-do)).

```json
{
  "mcpServers": {
    "tg": {
      "type": "stdio",
      "command": "/usr/bin/node",
      "args": ["/usr/lib/node_modules/@leemour/tg-cli/dist/bin/tg.js", "mcp"],
      "env": { "XDG_RUNTIME_DIR": "/run/user/1000" }
    }
  }
}
```

Paste the entry under `mcpServers` in the client's settings file: for Claude Desktop that is
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and
`%APPDATA%\Claude\claude_desktop_config.json` on Windows; for Cursor, `~/.cursor/mcp.json`. The
command writes nothing itself.

The paths are full because a client started from the desktop does not see the terminal's `PATH`,
and on Windows `tg` is a `tg.cmd` file that a client without a shell cannot start. The entry copies
`TG_CONFIG_DIR`, `TG_STATE_DIR`, `TG_CACHE_DIR`, `MESSAGING_STORE` and `XDG_RUNTIME_DIR` when they
are set; never `TG_API_ID`, `TG_API_HASH` or the session.

If Node came from nvm, fnm or Volta, its path belongs to one Node version — run `tg mcp config`
again after changing it. From `npx` the command refuses: npx's cache is cleared, and the path would
stop existing.

⚠ **`TG_CONFIG_DIR`, `TG_STATE_DIR` and `TG_CACHE_DIR` change where the login is looked for.** If
they are set in the terminal and not for the MCP client, or the other way round, the server answers
"no session" although `tg` works in the terminal. Set them the same in both, or in neither.

⚠ **On Linux the app credentials are in the keyring, which is reached through `XDG_RUNTIME_DIR`.**
A client that starts servers with a trimmed environment leaves it out, and every tool then answers
that the keyring is probably out of reach. The entry from `tg mcp config` includes it.

## What an agent may do

The profile's `permissions` decide which tools an agent is offered, by the same levels as the
commands ([configuration.md](configuration.md#what-a-profile-may-do)):

| Level | Over MCP |
|---|---|
| `deny` | the tool is not offered; `messages: deny` also hides the prompts and the chat resources |
| `readonly` | the reading tools are offered, the writing ones are not |
| `ask` | before the tool acts, the server shows you a form ([below](#a-confirmation-form-from-the-server-itself)) |
| `allow` | the tool acts without asking |

**With the default settings an agent can send, edit, react, forward, pin, vote and mark a chat
read**, with no flag and no question. Only `tg_messages_delete` is at `ask`: you see a form before
each deletion. An agent never deletes for everyone and never ends your other sessions, whatever the
level.

To keep an agent read-only, give it a profile of its own — `tg agent session start` logs it in, as
another device of the same account — and set each resource there:

```sh
for key in messages reactions polls topics chats contacts account; do
  tg agent config set permissions.$key readonly
done
claude mcp add tg -- tg agent mcp
```

`readOnly: true` in that profile does the same, as an older setting. To have the agent ask before
each send, set `messages.send` to `ask`:

```sh
tg agent config set permissions.messages.send ask
```

The levels bind you too: in that profile your own `tg agent messages send` asks as well. Two flags
skip the form for the levels at `ask`:

- `tg mcp --allow-dangerous` — no form before a deletion;
- `tg mcp --yes` — no form before any other change.

A send, an edit or a forward over MCP goes through the same checks as its command: the profile's
`permissions`, the list of allowed recipients, the hourly limit, and the journal of sends
(`tg sends list`). On top of that every writing tool is marked as dangerous: VS Code
and Cursor ask before every call, and Claude Code, by its documentation, shows an approval dialog
even where everything else is allowed in advance.

**Marking a chat read** is `chats.mark-read`: the other side sees that you read it. Set it to
`readonly` when an agent reads on your behalf and should not give that away. `tg_chats_mark_read`
never counts toward the hourly limit.

**Deleting** is `messages.delete`. `tg_messages_delete` removes up to 10 messages from **your** view
only; deleting for everyone is left to the command, typed by you. In a supergroup or a channel
Telegram has no "for me only", so there the tool is refused.

`--allow-send`, `--allow-mark-read` and `--allow-delete` decide nothing: they are accepted with a
warning so an agent set up with them still starts. Remove them from the client's settings.

### A confirmation form from the server itself

```sh
claude mcp add tg -- tg mcp --confirm-send
```

The server shows a form before a change whose level is `ask`, and with `--confirm-send` before
every change, whatever its level. A send's form shows **which chat** — the title and id the
agent's name resolved to — and **the whole text**. The change goes only after Accept; the form has
no fields, only the one button. The client's own window shows the arguments as the model wrote them
(`chat: "Anna"`); the form shows what you are actually agreeing to ("Anna Petrova (123456)").

- Decline, or closing the form: nothing is changed, and the agent gets `confirmation_required` and
  must not try again.
- A client that cannot show forms gets an error — **nothing is changed**. Claude Code shows forms.
- The yes is bound to what the form showed: if the agent changes the chat, the text or the tool
  after confirming, nothing is changed.
- A yes works once, for 5 minutes. Replaying the same answer changes nothing.

## Tools

| Tool | Command | What it does |
|---|---|---|
| `tg_status` | `tg doctor` | which profile the server speaks for, which account it last saw, which writing tools are on; never connects |
| `tg_review` | `tg review`, `--since-time`, `--chat`, `--unanswered`, `--all` | every message, the owner's too, in each chat that changed since a point (three days without one); `complete` and `until` say where the next review starts; `unanswered` keeps the questions nobody answered; `transcribe` hears voice messages, `model` picks the model |
| `tg_inbox` | `tg inbox`, `--since-time`, `--all` | what came in: the unread messages, or everything after a moment, in one call; muted and archived chats only when they mention the owner, or with `all`; marks nothing read and never moves `tg inbox --new`'s point; `transcribe` hears voice messages, `model` picks the model |
| `tg_account_show` | `tg account show` | who the login is; the phone always as its last four digits |
| `tg_account_sessions` | `tg account sessions list` | every device and app logged in; reads only |
| `tg_chats_list` | `tg chats list`, `--search`, `--kind`, `--unread` | chats, newest first; filtered over the newest 200, `partial` when older ones exist |
| `tg_chats_events` | `tg chats events`, `--since-time`, `--type` | who joined, left, was added or removed, and by whom, from the chat's service messages; seven days back without `since_time` |
| `tg_chats_members` | `tg chats members list` | a group's members, paged, with role and last seen |
| `tg_chats_inspect` | `tg chats inspect` | what an invite or public link leads to; joins nothing |
| `tg_topics_list` | `tg topics list`, `tg topics search` | a forum group's topics with their ids; `search` matches titles |
| `tg_chats_show` | `tg chats show` | one chat and who is in it |
| `tg_contacts_list` | `tg contacts list` | people with a one-to-one chat |
| `tg_contacts_show` | `tg contacts show` | one person and the chats shared with them |
| `tg_contacts_lookup` | `tg contacts lookup` | who has a phone number, where their privacy allows; adds no contact |
| `tg_messages_evidence` | `tg messages evidence`, `--limit`, `--before-id` | one local chat evidence packet, newest first, with locators, fingerprints, coverage and `nextBeforeId`; pass the cursor as `before_id`; whole messages within 64 KiB of JSON items, header additional; history coverage unknown; an oversized first message yields an empty byte-truncated packet without a cursor; never connects or marks read; permission `messages.evidence` |
| `tg_messages_list` | `tg messages list`, `--before-id`, `--before-time`, `--after-id`, `--after-time` | a chat's messages; `before_id` or `before_time` read back, `after_id` or `after_time` forward — one of them at most; marks nothing read — `tg_chats_mark_read` does that, behind its own key; a voice message carries `transcript` once heard, `transcribe` hears the rest, and `model` picks the model |
| `tg_messages_context` | `tg messages show`, `context`, `--before-n`, `--after-n` | one message and those either side; `before_n` and `after_n` say how many |
| `tg_messages_scheduled` | `tg messages scheduled` | what waits to be sent in a chat, soonest first, each with `scheduledFor` |
| `tg_messages_photo` | `tg messages download` | a message's photo as an image to look at, up to 512 KB; anything else is refused with the `tg messages download` command that saves it |
| `tg_messages_transcribe` | `tg messages transcribe` | a voice message as text — by Telegram (Premium or the weekly trial), else by a speech model on this machine; `local: true` skips Telegram; `pending: true` means Telegram was not finished within a minute; a missing model is refused with `tg models audio download`, never downloaded |
| `tg_messages_search` | `tg messages search` | search what this machine has kept; never asks Telegram |
| `tg_messages_send` | `tg messages send`, `--reply-to`, `--topic` | send, by `messages.send`; `topic` chooses an open forum topic, and `reply_to` must belong to it; `send_id` repeats a send whose outcome was unknown with the same chat and topic; `silent`, `no_preview` and `md` as `--silent`, `--no-preview` and `--md`; `at_time` sends it later — never retried, the confirmation form shows the clock time; `file` or `photo` attaches a path from this machine, the text as the caption (`as_file` keeps a video a file), `voice` sends an Ogg Opus file as a voice message — hidden files, `~/.ssh`, tg's own folders and the message store are refused, with no way around it over MCP |
| `tg_messages_edit` | `tg messages edit` | the new text of the owner's own message, by `messages.edit`; `md` as `--md`; repeating it changes nothing |
| `tg_chats_mark_read` | `tg chats mark-read` | mark a chat read, to its newest message or `until` one, by `chats.mark-read` — the other side sees it |
| `tg_messages_delete` | `tg messages delete` | up to 10 messages from the owner's view, by `messages.delete` — a form first by default; never for everyone; each counts toward the hourly limit |
| `tg_reactions_add`, `tg_reactions_remove` | `tg reactions add`, `remove` | the owner's reaction on one message, by `reactions`; the confirmation form shows the emoji |
| `tg_polls_show` | `tg polls show` | a poll and its answer ids; a read tool |
| `tg_polls_vote`, `tg_polls_close`, `tg_polls_create` | `tg polls vote`, `close`, `create`, `--topic` | vote by answer id (`polls.vote`), close the owner's own poll (`polls.close`), create one (`polls.create`, with `topic` for an open forum topic, `send_id` for a retry in the same chat and topic, and `revote` to let people change their vote) |
| `tg_messages_forward` | `tg messages forward` | one message into another chat (`to`), by `messages.forward`; `send_id` repeats a forward whose outcome was unknown |
| `tg_messages_pin`, `tg_messages_unpin` | `tg messages pin`, `unpin` | pin one message, quietly unless `notify`, by `messages.pin` and `messages.unpin` |
| `tg_chats_create`, `tg_chats_join`, `tg_chats_leave` | `tg chats create`, `join`, `leave` | make a group or channel with these people, join one by its link, leave one — the others see each |
| `tg_chats_update` | `tg chats update` | rename a group or channel, change its description or settings; its members see the change |
| `tg_chats_link_show`, `tg_chats_link_reset` | `tg chats link show`, `reset` | a group's invite link; a new one, after which the old one stops working |
| `tg_chats_members_add`, `tg_chats_members_remove` | `tg chats members add`, `remove` | add people to a group (each is told), or remove them; their messages stay |
| `tg_chats_admins_add`, `tg_chats_admins_remove` | `tg chats admins add`, `remove` | make a member an admin with these rights, or take them back |
| `tg_chats_folders_list`, `_create`, `_update`, `_delete` | `tg chats folders …` | the owner's chat folders; create one, rename it or change its chats, delete it — the chats stay |
| `tg_chats_rules_show`, `tg_chats_moderate` | `tg chats rules show`, `tg chats moderate` | a group's rules; judge its new messages and members by them and act where the rules' levels allow ([groups.md](groups.md)) |
| `tg_account_update` | `tg account update` | the name or description everyone sees on the owner's profile |
| `tg_contacts_rename` | `tg contacts rename` | a name for a person only the owner sees |
| `tg_conversations_list`, `tg_conversations_show` | `tg conversations list`, `show` | the conversations inside a group, from the stored messages; one conversation's messages |

Answers are what the command prints with `--json`: a list is `{ items, page, limit, hasMore }`, a
chat's messages `{ items, limit, hasMore }`, ids are strings. An error is
`{ error: { code, message, … } }` with the CLI's codes; an ambiguous chat name answers with the
`candidates`.

Reads from Telegram are saved to the local store, as a command’s are; evidence reads that archive.
Each call can be kept as a run
(`tg runs list`), named `mcp chats list` and so on.

## Prompts, and chats by `@`

The server offers four ready prompts — in Claude Code they are `/` commands:

| Prompt | Argument | What the agent does |
|---|---|---|
| `catch-up` | `since` — optional | calls `tg_inbox` once and summarises per chat; sends nothing |
| `reply` | `chat` | reads the chat, writes a draft, and sends it only after your yes to that text |
| `find` | `text` | looks for a person or for words, and shows the messages around each hit; sends nothing |
| `review` | `since`, `groups` — optional | calls `tg_review` once and sorts it into what you owe, what others owe and what needs clarifying; drafts reminders, sends one only after your yes |

`reply` and `review` send through `tg_messages_send`, so where `messages.send` is `readonly` the
agent only shows the drafts.

Chats are resources `tg://chat/<id>` — in Claude Code you can mention them with `@`. A resource is
the chat and its recent messages. The list comes from the local store and never connects to
Telegram; until something was read, it is empty. Only reading one chat connects.

## How it holds the connection

The first call connects to Telegram, and the next ones reuse the connection. It closes after 2
minutes without a call, and in any case 5 minutes after it opened, so a long agent session never
reads a stale snapshot. The next call connects again. Calls run one at a time, even when the client
sends them together.

The server exits as soon as the client closes stdin, and closes its connection to Telegram.
