# Changelog

Notable changes to `@leemour/tg-cli`. One section per version, newest first; versions follow
[semantic versioning](https://semver.org), so before `1.0.0` the command interface may still change.

## 0.23.0 — 03.10.2026

### What's new

- **Setup is discoverable immediately after installation**: root help and first-run errors point
  to `tg setup`; setup and session help include examples, agent instructions and Windows advice.
  Quick-start, installation, MCP and security pages consistently explain the guided first run.
  `tg skill show` works before login and setup completion points agents to it.

- **`tg messages send --topic` and `tg polls create --topic` send to a named forum topic.** Text, media captions, replies and scheduled messages preserve the topic; missing or closed topics and replies from another topic are refused before sending. MCP accepts the same address as `topic`.
- **`tg setup` guides the first run**: local checks, automatic or browser app registration, QR
  or phone login, a check of five chats and an optional agent skill. It reuses existing sessions,
  explains the five-minute wait and leaves history downloads as a separate choice. Windows
  instructions include `.cmd` wrappers and an npm exec fallback when PATH is missing.

- **`tg mcp setup codex|claude-code` and `tg mcp doctor`** add the local server to a client and
  check its handshake and tools. Setup requires `--allow-writes` when the profile offers writing
  tools; doctor does not check the Telegram login.
- **`tg <bot> bot store fetch <chat>` imports older channel and supergroup messages** into the bot's
  local copy, without sending or marking read. Use `--from <message link>` for a first run without
  a known message number; later runs continue backwards. Private chats and basic groups are refused.
  See [the bot page](docs/bot.md#fetching-older-messages).

### Fixed

- Login completion shortens Windows home paths correctly. Release documentation checks recognize
  Windows path separators. File-mode tests apply Unix permissions only on Unix; Windows access
  follows inherited ACLs, now stated in the security page.

## 0.22.0 — 03.10.2026

### What's new

- **`tg mcp` lets go of the search model after 10 minutes without a search**: an agent's
  `conversations_search` no longer keeps about 1 GB in memory for the whole session. The next search
  loads the model again, in about a second.
- **`tg messages evidence <chat>` and `tg_messages_evidence` over MCP** prepare a bounded packet
  from the local archive for an agent’s chat brief, without connecting or marking read. Source
  locators, fingerprints, explicit coverage and an older-page cursor keep citations and paging
  precise. Whole messages fit within 64 KiB of JSON items; `--limit` accepts 1–100.

- **`tg <name> bot contacts show --refresh`** says the same as in `max`: its help no longer names the
  messenger (cli-messaging 0.109.0).
- **The bot page is complete** ([docs/bot.md](docs/bot.md)): how to find a chat's id, sending files and
  their limits, and the exit codes a script sees.
- **`tg <name> bot contacts show`, `bot messages search` and `bot messages between`** read what the bot
  kept on this computer. See [the bot page](docs/bot.md#what-the-bot-kept).
- **`tg <name> bot chats moderate` and `bot chats rules`**: a bot judges a group's new messages by its
  rules and acts as they allow. It judges what `bot watch` kept or `bot store fetch` imported.
  See [the bot page](docs/bot.md#moderating-a-group-by-its-rules).
- **`tg <name> bot mcp`: the bot for an agent**, over MCP. It offers the tools the bot profile's
  permissions allow; a deletion asks in a form first. See [the bot page](docs/bot.md#the-bot-for-an-agent-mcp).
- **`tg messages search` takes a query language**: `"a phrase"`, `-word`, `a OR b`, and the filters
  `from:`, `chat:`, `after:`/`before:` and `has:`. A typo is corrected, and stderr says so.
  `--context <n>` shows the messages around each hit (2 in the terminal). `in:max`, `in:all` or
  `--source` also search the other accounts kept in the same store, MAX ones included. See
  [the archive](docs/archive.md#search).
- **Search a group's conversations by meaning**: `tg conversations embed --chat <chat>` computes a
  vector for each conversation on this computer, and `tg conversations search "<question>"` finds the
  nearest ones, in one chat or every one you embedded. `tg models text list|download` fetches the model
  once into the folder the speech models share. With your own key, `--provider openai` (or
  `--base-url` for Ollama, LM Studio and the like) computes them instead, after telling you what goes
  out and what it may cost. See [the archive](docs/archive.md#search-by-meaning).
- **`tg store fetch` no longer runs for ever** when Telegram keeps answering with messages it already
  gave.
- **`tg bot watch`**: what happens in the bot's chats as it arrives, kept in the bot's history on this
  computer before it is printed; `--events` for edits, buttons and people joining and leaving.
  **`tg bot callbacks answer`**, **`tg bot commands list|set|clear`** and **`tg bot webhooks
  list|set|delete`**, the same commands `max bot` has. See [the bot page](docs/bot.md).
- **`tg bot chats admins list|add|remove`** and **`tg bot chats members remove [--block]`**: the bot's
  admins with their rights and title, making one with `--can` and `--title`, taking the rights back,
  and taking a person out of a chat, for good with `--block`. See [the bot page](docs/bot.md).
- **`tg bot messages send|list|show|edit|delete|pin|unpin`** and **`tg bot chats show|leave|action`**
  — the bot writes to a chat by id or title, or to a person as `user:<id>`, with `--md`, `--html`, a
  file or a photo. `list` and `show` answer from what this bot sent, received and imported on this
  computer. A delete asks first; `--allow-dangerous` answers.
- **Your own AI agent can link a group's conversations**, when you ask it to: `tg skill show
  link-conversations` is its guide. It says how much text it would read and waits for your yes, then
  answers the chat a batch at a time (`tg conversations batches next`, `tg conversations links add`);
  `tg conversations links clear` drops its answers. tg calls no model itself. See
  [the archive](docs/archive.md).
- **`tg mcp` serves this tool's guide as the resource `tg://skill`**, and names it in what it tells
  the agent on connecting, so an agent can read it without running `tg skill show`.

### Changed — may break scripts

- **`tg messages search` puts the best match first**, not the newest; `--newest` gives the old order.
  When no message has every word, it now takes any of them, then a piece of a word. The JSON keeps
  `items`, `limit` and `hasMore`, and adds `match` and `score` to each hit, plus `corrections`,
  `completeness` (per chat: held in full or not) and `wordsReady`. A query of one or two letters is
  searched instead of refused.
- **tg needs Node 22.16 or newer** (or Bun, as before). When a Linux Node uses a system SQLite too old
  for the message store, `tg` restarts itself on its own SQLite from `@leemour/cli-messaging-sqlite`,
  before it reads or sends anything. Official Node and Bun builds notice nothing.

### Fixed

- **A refused bot write names a working config command** with `--bot` and the permission key
  (cli-messaging 0.111.0). The former hint placed `config` under `bot`, where it does not exist.

- **Commands that change only this computer no longer say they change Telegram.** `config set` and
  `unset`, `chats rules set` and `unset`, `recipients add`, `remove` and `clear`, and the bot's
  `auth set`, `auth remove` and `recipients add`, `remove` and `clear` write the config file, the
  group-rules file, the recipient lists or the keyring. The [command reference](docs/commands.md) now
  says "Changes something on this computer only." under them. They are still listed as writes in
  `tg commands`. `chats moderate` and `session end` still say they change Telegram.
- **`tg contacts show` lists the one-to-one chat with the person** among the chats you share, newest
  first. Before, it listed only the groups, because Telegram's list of common chats holds groups only.

## 0.21.0 — 01.10.2026

### What's new

- **`tg bot`** — a Telegram bot, through the official Bot API and its token: `bot auth set|show|remove`,
  `bot list [--check]`, `bot chats list`, `bot recipients list|add|remove|clear` and `bot sends list`,
  the same commands `max bot` has. Several bots, each under its own name; the token lives in the
  keyring as `bot:<name>`, or in `TG_BOT_TOKEN`. See [the bot page](docs/bot.md).
- **`tg conversations batches status|next --chat <chat> [--size <n>]`**: a group chat in batches for
  your own AI agent to link into conversations. `status` says how many messages and batches are left
  before you start; `next` prints the next batch. tg itself calls no model.
- **`tg skill install [--for claude|agents|all]`** writes tg's guide for AI agents where Claude Code
  and other agents look for it. When an agent runs tg and no copy is installed, tg says so once a day
  on stderr; `tg config set skillHint false --defaults` turns that off.
- **`tg store clear --left`** deletes the chats you have left from the local store, with their
  messages. It asks for `--allow-dangerous` and otherwise says how much it would delete.
- **`tg conversations build|list|show`** and **`tg messages links`**, with the MCP tools
  `tg_conversations_list` and `tg_conversations_show`: the conversations inside a group, found in the
  stored messages by replies, mentions and who wrote next — no Telegram request, no AI. Nothing is built
  until you run `build`. See [the store](docs/archive.md#conversations-in-a-group).
- **A mention by name is kept**: when someone is mentioned by name rather than by @username, the stored
  message remembers whom, so conversations follow it.
- **`tg chats rules show|set|unset` and `tg chats moderate`**, with the MCP tools
  `tg_chats_rules_show` and `tg_chats_moderate`: a group's rules say what to look for — links, invite
  links, forwards, floods, blocked people — and how far a run may go: deny, report only, ask (the
  default), or act. Nothing runs in the background. See [groups](docs/groups.md#rules).
- **`tg messages list --before-time`** reads back from a moment: ISO 8601, or `2h` / `1d` ago.
- **`tg contacts add|remove|block|unblock|rename|import`** and **`tg account update`**,
  **`tg account sessions end --others`**, with the MCP tools `tg_contacts_add|remove|block|unblock|rename`
  and `tg_account_update`. `contacts import` reads `number, name` lines from a file and prints only
  counts and who Telegram knew. Ending other sessions logs your phone out too: it asks first, and no
  agent is ever offered it.
- **`tg chats folders list|create|update|delete`**, with the MCP tools
  `tg_chats_folders_list|create|update|delete`. Changing a folder's chats keeps the others in it;
  "All chats" is not listed, since nobody can change it.
- **`tg chats members add|remove`** and **`tg chats admins add|remove`**, with the MCP tools
  `tg_chats_members_add|remove` and `tg_chats_admins_add|remove`. `--can` takes members, admins,
  info, pin, link, post, edit and delete; Telegram has no separate right to read. Adding answers who
  could not be added; each person added counts toward the hourly limit.
- **`tg chats update <chat>`** — `--title`, `--description`, `--all-can-pin on|off`,
  `--only-admins-add on|off` — and **`tg chats link show|reset`**, with the MCP tools
  `tg_chats_update`, `tg_chats_link_show`, `tg_chats_link_reset`. `tg chats show` adds a group's
  description, invite link and settings.
- **`tg chats create <title> [person...]`, `tg chats join <link>`, `tg chats leave <chat>`**, and
  the MCP tools `tg_chats_create`, `tg_chats_join`, `tg_chats_leave`. A new group is always a
  supergroup (`--channel` makes a channel); people who cannot be added are listed in the answer.
  See [usage](docs/usage.md#groups-and-channels).
- **Permissions: one level per command, for you and for an AI agent alike.** A profile's
  `permissions` setting gives each command path a level: `deny` (not even reading), `readonly`, `ask`
  or `allow`; the most specific key wins — `tg config set permissions.messages.delete allow`. By
  default everything is allowed except deleting messages and ending other sessions, which ask. `ask`
  asks y/N in the terminal; `--allow-dangerous` (deleting) or the new `--yes` (any other write) says
  yes in a script. `readOnly` and `allow` still work. See [security](docs/security.md).
- **`tg messages send --voice <file>`** sends an Ogg Opus file as a voice message, and a `.mp4` or
  `.mov` given with `--file` now plays in the chat as a video; `--as-file` keeps it a file to download.
- **`tg messages list --mark-read`** marks the chat read up to the newest message shown. Nothing else
  that reads marks anything read.
- **`--model` beside `--transcribe`** on `tg messages list` and `tg inbox`, and **`tg review
  --transcribe`**: voice messages in a review come with their text.
- **`tg store fetch --last <n>`** stops once the newest n messages of the chat are held, so a later
  run with the same `--last` asks Telegram for one page and stops.
- **`tg polls create --revote`** lets people change their vote.
- **`tg store export --output <file> --since-time <time>`.** The export goes into a new file only you can
  read, never over one, and can start from a time.
- **`tg account show` prints the phone's last four digits**, and the whole number with
  `--show-phone`. The MCP tool `tg_account_show` always prints only the last four.
- **`tg messages forward --send-id`.** A forward that got no answer is repeated with the send id from
  the error, and Telegram keeps one copy, as with a send. The `--json` answer carries `sendId`; MCP's
  `tg_messages_forward` takes `send_id`.
- **`tg messages edit --md`** formats the new text as `messages send --md` does; MCP's
  `tg_messages_edit` takes `markdown`.
- **Looking after the message store: `tg store info`, `check`, `migrate`, `backup`, `restore`.**
  `info` says where `messages.db` is, its size, its schema and how many rows it holds. `check`
  reports whether it is healthy — integrity, foreign keys, the search indexes, free disk — and names
  every chat whose stored history stops before the chat's newest message; it repairs nothing.
  `migrate` brings the file up to this version and normalizes the messages stored before it.
  `backup <file>` copies the store while it is in use, readable by you alone, never over a file.
  `restore <file>` puts a backup in place and keeps the store it replaces beside it; it refuses while
  `tg serve` runs or any process has the store open. The same file serves max-cli, so restart any
  running `serve` or `mcp` of either CLI afterwards.
- **Every write has its own id, `operationId`.** A send, edit, forward, deletion, pin, reaction,
  mark-read and poll vote prints it in its `--json` answer and MCP result, and the send journal and
  `--trace` name it, so one write can be followed from the answer to the log. A send's
  `operationId` is its `sendId`.
- **About 16 MB less to install**: cli-messaging 0.60.0 bundles its database layer instead of
  depending on it.

### Changed — may break scripts

- **`tg server status --json` answers the fields both tools share**: `since` is `startedAt`,
  `listening` is `connected`, `listeningSince` is `connectedAt`; new are `cliVersion`, `log`, and
  `stale` when a `serve` that is gone left its lock behind. `tg server start` answers `startedAt`
  and `connectedAt` the same way, and `tg server stop` says who had started it (`by`). The lines say
  "connected" where they said "listening".
- **`tg messages send --at` is now `--at-time`**, as every option that takes a time names it.
- **The MCP tools' arguments carry their option's name**: `tg_messages_list` takes `before_id`,
  `before_time`, `after_id`, `after_time`; `tg_messages_context` `before_n`, `after_n`; `since` is
  `since_time` in `tg_inbox`, `tg_review` and `tg_chats_events`, whose `event` is `type`;
  `tg_messages_send` takes `md` and `at_time`.
- **Options name the kind of value they take.** The old names are refused as unknown options; there
  are no aliases. The MCP tools' arguments do not change.
  - `tg messages list --before` is now `--before-id`; `--after` is `--after-id` for a message id and
    `--after-time` for a time, so an id is never read as a time.
  - `tg messages context --before` and `--after` are now `--before-n` and `--after-n`.
  - `--since` is now `--since-time` in `tg inbox`, `tg review`, `tg chats events` and
    `tg store fetch`.
  - `tg messages download --output` is now `--output-dir`.
  - `tg chats events --event` is now `--type`.
- **`tg review --unanswered` takes a duration** — `4h`, `1d` — not bare hours; `--unanswered 4` is
  refused. Without a value it is 24 hours, as before. MCP's `tg_review` still takes hours.
- **`tg chats events --json` prints `{ items, page, limit, hasMore, chatId, since }`**: `events` moved
  to `items` and `more` to `hasMore`. **`tg server logs --json`** moved `lines` to `items`. `--jsonl`
  is unchanged.
- **A `.mp4` or `.mov` sent with `--file` plays in the chat as a video**; it arrived as a file
  before. Add `--as-file` to keep it a file to download.
- **`tg mcp` offers tools by the profile's permissions, not by flags.** With the default settings an
  agent can now send, edit, forward, react, vote and mark read without `--allow-send`, and without a
  form; deleting shows you a form first (`tg mcp --allow-dangerous` skips it). To keep an agent
  read-only, give it a profile with `readOnly` — [mcp](docs/mcp.md) shows how. `--allow-send`, `--allow-mark-read` and `--allow-delete` decide nothing
  now and print a warning; `--confirm-send` still shows every write in a form.
- **`tg messages delete` asks** in the terminal when `--allow-dangerous` is missing, instead of
  refusing; with no terminal it is refused as before.
- **`tg store fetch --max <n>` is gone; `--limit <n>` caps a run instead**, in messages (1000 by
  default, as before), and `--page-size <n>` sets how many one request asks for (100 by default). The
  same names as max-cli's. `--max` is not kept as an alias.
- **A poll made without `--revote` no longer lets people change their vote**, as in max-cli; Telegram
  allowed it by default. Add `--revote` to keep the old behaviour.
- **`tg polls vote` and `tg polls close --json` print `{ operationId, poll }`** instead of the poll
  alone; read the poll from `.poll`. The MCP tools `tg_polls_vote` and `tg_polls_close` answer the same.
- **`tg runs list`, `tg sends list` and `tg recipients list --json` print `{ items, page, limit, hasMore }`**
  instead of a bare array, as every other list does; read the rows from `.items`. `--jsonl` is unchanged.

### Fixed

- **`tg chats list` no longer lists a pinned chat twice.** With archived chats included, Telegram's
  pages brought the pinned chats again further down; on one account 8 of 1361 chats appeared twice.
  A pinned chat's title also matched itself as two chats, so typing it could be refused as
  ambiguous.

- **`tg server stop` and Ctrl-C end `serve` and `watch` cleanly.** The serve went down before it could
  clean up, so `tg server status` reported a leftover lock (`stale`) after every stop.
- **`tg server` in a development checkout leaves the installed tg's systemd unit alone.** A checkout
  with its own `TG_STATE_DIR` or store gets a unit of its own name; the installed tg keeps
  `tg-serve-<profile>.service`.
- **A chat you have left no longer shows in `chats list --offline`.** It drops out the next time
  `tg chats list` reads your whole chat list; its messages stay until `tg store clear --left`, and a
  chat you rejoin comes back.

- **Two refusals say what to do.** Adding back someone who left or was removed, when you are not
  each other's contacts, now says to send them the invite link (`tg chats link show <chat>`);
  naming a person by an id this account has never seen now says to use an @username, or to read a
  chat they are in first.

- **An argument Telegram's library refused no longer repeats what you typed.** The error said the
  library's own words, which could quote a chat's title or a link. It now says what kind of input
  was wrong where tg can tell — a chat you have not joined, a message or invite link, a phone
  number, a login code or password — and otherwise that Telegram refused an argument.
- **A conversation reads in English.** Your own messages are `you`, and day headings read
  `26 September 2026`; they were Russian.
- **A chat or message tg cannot find is `not_found`**, and a chat of the wrong kind for the command
  is `validation_error`. They were an unknown failure with exit code 1 and the library's own words,
  which could repeat a chat's title.
- **The "not logged in" error names your profile**: `tg <profile> session start`, as the other login
  hints already did.
- **Downloads and exports get your usual file permissions again.** Since the first release, opening a
  session made every file tg wrote afterwards readable only by you. The session file and its
  companions stay owner-only.

## 0.20.0 — 30.09.2026

### What's new

- **A message's sender keeps their @username in the local store**, so `--from @name` and the coming
  conversation view can match a mention to the person. Takes effect with cli-messaging 0.57.0 or later;
  history already downloaded gains it the next time it is fetched.
- **`tg store fetch <chat> --since <time>`** stops once it reaches messages older than the time:
  `2026-09-01`, or `2h` / `1d` ago.

### Changed — may break scripts

Commands follow one naming standard: a noun, then a verb. The old names are gone, with no aliases —
a script that uses one now fails with "unknown command" or "unknown option".

- **`tg export <chat>` is `tg store export <chat>`**, **`tg sync status [chat]` is
  `tg store status [chat]`**, **`tg backfill <chat>` is `tg store fetch <chat>`**, and
  **`tg backfill list|status|cancel` is `tg store jobs list|show|cancel`**. `store fetch` fetches by
  default; `--estimate` only estimates. `--pace` is **`--pause`** there and in
  `tg messages download --all`. `--max` keeps its name: it counts messages.
- **`tg messages reply` is gone**: `tg messages send <chat> [text] --reply-to <id>` answers a message,
  and every send option (`--file`, `--photo`, `--silent`, `--at`, …) now works with it. The
  `msg:telegram/…` form has no replacement; give the chat and the message id.
- **`tg chats read` is `tg chats mark-read`**; the MCP tool `tg_chats_read` is `tg_chats_mark_read`.
- **`tg recipients off` is `tg recipients clear`.**
- **`tg update [--check]` is `tg upgrade [--check]`**, and the daily line about a newer version names
  `tg upgrade`.
- **`tg messages search <words…>` names its argument `<text…>`**; the search is unchanged.

## 0.19.0 — 30.09.2026

### Fixed

- **tg always exits once a command has finished.** Once, a download printed its answer and then stayed
  running for half an hour, `--timeout` or not. If anything is still open five seconds after a command
  is done, tg now names it on stderr and exits with the command's own exit code. Output still being
  written is waited for.

## 0.18.0 — 30.09.2026

### Fixed

- **A supergroup or channel first seen through one of its messages no longer loses messages to a deletion
  in a private chat** (cli-messaging 0.54.0). 0.16.0 left such a chat exposed because the store did not know
  its kind yet; its `-100…` id now says enough.
- **Messages a deletion elsewhere marked deleted by mistake come back** the next time their chat is read
  (`messages list`, `messages context`, or an edit arriving live). A deletion newer than the read stays.

## 0.17.0 — 30.09.2026

### What's new

- **`tg messages download <chat> --all`** saves every file of a chat — photos, documents, videos,
  voice notes — into `--output`, newest first. Cut short by `--timeout` or Ctrl-C, it continues where
  it stopped the next time, and picks up newer messages too; where it got to is kept in a
  `.download-<chat>.json` beside the files. Telegram's "wait N seconds" is sat out up to five minutes,
  and `--pace` (1 s) spaces the pages. A file name another message already took gets the message id in
  front; nothing is overwritten. (cli-messaging 0.53.0)

## 0.16.0 — 30.09.2026

### Fixed

- **A message deleted in a private chat or a basic group no longer marks other chats' messages deleted**
  (cli-messaging 0.52.0). Telegram reports such a deletion without the chat, and the local store marked
  every stored message with that number deleted — channel and supergroup messages included. Messages
  already marked that way stay marked; their text is kept.

## 0.15.0 — 30.09.2026

### Fixed

- **A speech model on this machine no longer drops quietly spoken words.** A quiet stretch in the
  middle of a voice message was taken for silence and left out of the text; now it is heard, by
  Parakeet and GigaAM alike. Voice messages a local model heard before are heard again the next time
  `--transcribe` asks for them; Telegram's transcripts stay. (cli-messaging 0.51.0)

## 0.14.0 — 30.09.2026

### What's new

Changing messages other people see — each through the send guard, as `messages send` is: a
read-only profile refuses, `allow` must name the permission, the recipient list and the hourly limit
apply where they count, and `tg sends list` records it without the text.

- **`tg messages edit <chat> <id> [text]`**: the new text of your own message. Repeating the same edit
  changes nothing. `tg_messages_edit` with `mcp --allow-send`.
- **`tg messages forward <chat> <id> --to <chat> [--silent]`**, checked against the chat it goes to.
  After an unknown outcome, look in that chat before forwarding again. `tg_messages_forward`.
- **`tg messages pin|unpin <chat> <id>`**, quiet unless `--notify`; in a one-to-one chat the pin is on
  your side only. `tg_messages_pin` and `tg_messages_unpin`.
- **`tg reactions add <chat> <id> <emoji>`** and **`tg reactions remove <chat> <id>`**; a reaction
  never counts toward the hourly limit. `tg_reactions_add` and `tg_reactions_remove`.
- **`tg chats read <chat> [--until id]`** marks a chat read — the other side sees it. Its tool,
  `tg_chats_read`, comes only with the new **`tg mcp --allow-mark-read`**, which `--allow-send` does not
  turn on.
- **`tg messages delete <chat> <id…> --allow-dangerous [--for-everyone]`**: at most 10, for you only
  unless `--for-everyone`, and nothing without `--allow-dangerous`. In a supergroup or a channel
  Telegram has no "for me only", so there it needs `--for-everyone`. The new **`tg mcp --allow-delete`**
  offers `tg_messages_delete`, which only ever deletes your own copy.
- **`tg polls show|vote|close|create`**: a poll with its answer ids, a vote by those ids (never by
  position) or `--retract`, closing your own poll, and a new one — public unless `--anonymous`, with
  `--send-id` for a safe retry. `tg_polls_show` reads; `tg_polls_vote`, `_close` and `_create` come with
  `--allow-send`.

## 0.13.0 — 30.09.2026

### Changed — may break scripts

- **The shared message store moves to version 6** (cli-messaging 0.49.0). The first `tg` run upgrades
  `messages.db`; a `max` older than the one released the same day then refuses it and asks to be
  upgraded — `npm install -g @leemour/max-cli@latest`. Nothing in `tg`'s own commands changes.

## 0.12.0 — 30.09.2026

### What's new

- **`tg chats inspect <link>`** and `tg_chats_inspect`: what an invite or public link leads to — title,
  members, description, whether you are in it and whether joining needs approval — without joining.
- **`tg topics list <chat>` and `tg topics search <chat> <text>`**, and `tg_topics_list`: a forum
  group's topics, paged, with the id each message in a topic carries as `threadId`.

## 0.11.0 — 30.09.2026

### What's new

- **Voice messages carry their text in `tg messages list` and `tg inbox`.** A transcript heard once
  is kept per profile in tg's cache and shows on every later read — `transcript` in `--json`,
  `🎤 …` under the text for a person. `--transcribe` hears the rest, by Telegram or the model on
  this machine, within two minutes for the whole list; what is left is in `unheard`. The same as
  `transcribe` on `tg_messages_list` and `tg_inbox`.
- **`tg chats members list <chat>`** and `tg_chats_members`: a group's members, paged, each with a role
  and when Telegram last saw them — up to Telegram's own 10 000.
- **`tg contacts lookup`**: who has a phone number, where their privacy lets you find them. The number is
  piped in or typed when asked, never an argument. Also `tg_contacts_lookup`.
- **`tg contacts sync`**: your Telegram contacts into the local store, answering how many were new or
  changed.
- **`tg account sessions list`** and `tg_account_sessions`: every device and app logged in to the account,
  without their IP addresses. It ends nothing.

## 0.10.0 — 29.09.2026

### What's new

- **Voice to text on this machine.** `tg models audio list` and `tg models audio download <id>`
  fetch a speech model once — Parakeet v3 (25 languages, the default), GigaAM v3 or GigaAM v3 CTC
  (Russian) — into `~/.cache/cli-common/models/audio`, a folder every CLI of the family shares. `tg messages transcribe` asks Telegram first
  and falls back to the local model when the account has no Premium; `--local` or `--model <id>`
  skip Telegram. The profile's `transcribeWith` (`auto`, `messenger`, `local`) and `speechModel`
  set the defaults. Nothing downloads a model by itself.
- **`tg messages send --photo <path>` or `--file <path>`**, the text as the caption, and `photo` and
  `file` on `tg_messages_send`. Hidden files and folders, `~/.ssh`, tg's own folders and the message
  store are refused unless the owner adds `--allow-any-file`; over MCP there is no way around it. The
  send journal records the attachment's kind and size, never its name. A retry with the same
  `--send-id` sends one message (measured on a photo).

- **`tg update` restarts a running server with the new tg**, so it stops running the old code; a
  serve started by hand is named, for you to restart. **`tg server status` says when the running serve
  is older than tg**, as max-cli's does.

- **`tg chats events <chat> [--since] [--event]`** and `tg_chats_events`: who joined, left, was added
  or removed, and by whom — plus a chat created, renamed or a message pinned — from the chat's service
  messages, seven days back by default. At most ten pages of history a run; `more` says there was more.

## 0.9.0 — 29.09.2026

### What's new

- **`tg session start` says who logged in, where the session file is, where the app keys are read
  from and what to run next**, in sentences; `--json` gains `session` and `appKeys` (`environment`,
  `keyring` or `file` — never the keys).
- **`tg chats list --search <text> --kind <kind> --unread`**, and the same on `tg_chats_list`. The
  filters combine over the newest 200 chats; `--search` takes at least 3 characters.
- **`tg messages list --after <id-or-time>`** reads a chat forward: the oldest messages newer than a
  message id, or than a time (`2h`, `1d`, ISO 8601). `after` on `tg_messages_list`.
- **`tg messages send --silent --no-preview --md`** — without a notification, without a link's preview
  card, and with `**bold**`, `_italic_`, `~~struck~~` and `` `code` `` as Telegram formatting. The MCP
  send tool takes `silent`, `no_preview` and `markdown`. The send journal still holds only the length.
- **`tg messages send --at <time>`** hands the message to Telegram to send later — `2h`, `1d`, or
  `2026-10-01T09:00` in local time — and `tg messages scheduled <chat>` (MCP `tg_messages_scheduled`)
  lists what waits. A scheduled send is never repeated: `--send-id` is refused with it.

### Changed — may break scripts

- **`tg service …` is now `tg server …`** — `start|stop|restart|status|logs|install|uninstall`, as in
  max-cli — and `tg serve status` is gone: `tg server status` answers. `tg server start` without a unit
  runs serve in the background. A unit written by `tg service install` is still found. From
  cli-messaging 0.40.0.

## 0.8.0 — 29.09.2026

### What's new

- **`tg review`**: every message, yours too, in each chat that changed since `--since` (three days
  without it) — for sorting out who owes what. It ends by saying where the next review starts.
  `--chat` reads one chat, `--unanswered [hours]` keeps the questions nobody answered — a group's
  admins answer for it too — and `--all` takes in muted and archived chats. The MCP tool `tg_review`
  and the `review` prompt do the same.

## 0.7.0 — 29.09.2026

### What's new

- **`tg messages transcribe <chat> <id>`** and the MCP tool `tg_messages_transcribe` turn a voice
  or video note into text with Telegram's own recognition — on a Premium account, or within
  Telegram's weekly free trial. Telegram usually needs a few seconds; tg asks again for up to a
  minute, then answers `"pending": true`. Refusals say why in plain words: not a voice message, too
  long, no Premium.
- **The MCP tool `tg_messages_photo`** hands an agent a message's photo as an image to look at, up
  to 512 KB. A larger photo, a file, a video or a voice note is refused with the
  `tg messages download` command that saves it.

## 0.6.0 — 29.09.2026

### What's new

- **`tg inbox` leaves out muted and archived chats** unless they mention you or reply to you; `--all`
  (and `all` on `tg_inbox`) shows them too. On a busy account most unread chats are muted, and they took
  the 20 chats `inbox` reads at once. The JSON's `quiet` counts what was left out.
- **A chat carries `muted`, `archived` and `unreadMentions`** in `--json`. `archived` moved out of
  `providerMetadata`; `muted` is absent when the chat follows the account's default.

### Fixed

- **`tg messages send --silent`, `--no-preview` and `--markdown` refuse the send** instead of sending
  without them: they came with cli-messaging 0.32, and tg does not carry them to Telegram yet.

## 0.5.0 — 29.09.2026

### What's new

- **`tg service install|uninstall|start|stop|status|logs`** runs `tg serve` as a systemd user unit
  (Linux) or a launchd agent (macOS), one per profile. `install` only writes the file; nothing starts
  until `tg service start`.
- **`tg backfill <chat> --background`** runs a backfill as a job that outlives the command;
  `tg backfill list`, `status [job]` and `cancel <job>` follow it. Ctrl-C or `cancel` stop a backfill
  after the page in hand, and it keeps that page.
- **`tg backfill <chat> --estimate`** — how many messages, requests and seconds a full backfill would
  still take, from the store; it asks Telegram nothing.
- **`tg export <chat> --format markdown`** — a chat as a transcript a person reads.
- **`tg messages search --regex '<pattern>'`** — a regular expression over the stored text.
- **`tg doctor report create`** writes a problem report — versions, paths, the failed run, the recent
  send attempts — with no message text, and every chat, message and account id replaced by a label.
- **`tg session start --qr-file login.png`** writes the login QR code as a PNG instead of drawing it,
  so an agent can pass it on, and removes it after the login. With the app already stored it needs
  no terminal.
- **`tg messages download <chat> <id> [--output dir]`** saves a message's photo, file, video or
  voice note into a folder — the current one unless `--output` names another — and answers its path
  and size. A name the sender chose cannot leave the folder or hide the file, and a file already
  there is never overwritten. The message is fetched again each time, so an old one still downloads.

### Fixed

- **`tg messages list --jsonl` and `tg messages search --jsonl` print one message per line**, as their
  `--help` says. They printed the whole page as one JSON line; a script that read `.items` from it must
  now read each line as a message.

## 0.4.0 — 29.09.2026

### What's new

- **`tg inbox`** — other people's unread messages in every chat; `--new` shows only what arrived
  since the last check, each message once. The MCP server offers it as the `tg_inbox` tool and the
  `catch-up` prompt.
- **`tg skill show`** prints the instructions an agent is given for this tool.
- **MCP prompts and a chat resource:** the `reply` and `find` prompts, and `tg://chat/{id}`.

## 0.3.0 — 28.09.2026

### What's new

- **`tg mcp`** serves a profile to an agent over MCP, on stdin and stdout. Read-only by default;
  `--allow-send` offers the send tool, and `--confirm-send` shows the owner every send first.
  `tg mcp config` prints the entry for an MCP client's settings.

### Changed — may break scripts

- **A failure before a command runs is kept as a run** — a usage error, a configuration that will
  not load. `tg runs list` shows it; `--no-record` turns it off.

## 0.2.0 — 28.09.2026

### What's new

- **`tg update`** updates tg with the package manager that installed it; `--check` only looks.
- **A daily line on stderr when a newer version is on npm**, at a terminal only and after the
  command. `TG_NO_UPDATE_CHECK=1` turns it off.

## 0.1.0 — 27.09.2026

The first release on npm.

### What's new

- **Log in** by QR code or phone number (`tg session start`); the app credentials from
  my.telegram.org are fetched by opening the site or by filling it in for you (`--app auto`), and
  kept in the OS keyring.
- **Read:** `account show`, `chats list|show`, `contacts list|show`, `messages list|show|context`.
- **Send** with `messages send` and `messages reply`, through a send guard: a recipient list,
  read-only profiles, a journal of every attempt (`tg sends`), and `--send-id` to repeat a send
  whose outcome is unknown without sending it twice.
- **A local archive:** every read is kept in a store shared by the messenger CLIs; `--offline`
  answers from it, `messages search` searches it, `backfill` fills it, `watch` and `serve` keep it
  current, `sync status` and `export` read it.
- **Run records** (`tg runs`), `config`, `doctor`, `commands` and shell completion (`complete`).
