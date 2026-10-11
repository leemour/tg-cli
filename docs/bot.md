# A Telegram bot

Use this page when you have a Telegram bot, or want one, and need it to post messages, answer
people, watch a group or keep order there. You will learn how to connect a bot to `tg`, find its
chats, send and read messages as the bot, limit where it may write, and hand the bot to your AI
agent.

Some words on this page:

- **A bot** is a separate Telegram account that a program runs. `tg bot` works with it through
  Telegram's official [Bot API](https://core.telegram.org/bots/api). It has nothing to do with your
  own account: the bot has its own name, its own chats and its own token, and `tg …` without the
  word `bot` is still you (see [using your own account](usage.md)).
- **A token** is the bot's password. You create a bot with [@BotFather](https://t.me/BotFather) in
  Telegram, and it gives you the token.
- **A bot name** is the word you choose to keep a bot's token under, such as `sales`. It is the
  first word of every bot command: `tg sales bot …`.
- **The local copy** is what the bot sent, received or imported, kept on this computer. Telegram
  gives a bot no message history, so reading old messages uses this copy.

## What you can do

| Task | Command |
| --- | --- |
| Connect a bot and check which bot it is | `tg <bot> bot auth set`, `tg <bot> bot me` |
| Send, edit, delete and pin messages and files | `tg <bot> bot messages send\|edit\|delete\|pin` |
| See new messages, button presses and joins | `tg <bot> bot watch` |
| Read and search what the bot saw | `tg <bot> bot messages list`, `tg <bot> bot search messages` |
| Import older messages of a channel or supergroup | `tg <bot> bot store fetch` |
| Manage admins and remove members | `tg <bot> bot chats admins`, `tg <bot> bot chats members remove` |
| Keep a group in order by your rules | `tg <bot> bot chats moderate` |
| Answer buttons, set the command menu and webhooks | `tg <bot> bot callbacks`, `commands`, `webhooks` |
| Limit the chats the bot may write to | `tg <bot> bot recipients` |
| Call any Bot API method | `tg <bot> bot api <method>` |
| Give the bot to your AI agent | `tg <bot> bot mcp` |

Every command and option is in the [command reference](commands.md).

## The first minute

```sh
tg sales bot auth set     # the token, at a hidden prompt
tg sales bot auth show    # which bot it is
```

`auth set` asks Telegram whose token it is before keeping it, so a typo never replaces a token that
works.

## Finding a chat's id

Telegram gives a bot no list of its chats, so a chat's id comes from something the bot did or saw.

- **A person.** Write to them as `user:<id>`. Sending prints the chat the message went to, as
  `chatId` in `--json`. A person must have started the bot first: a Telegram bot cannot
  [start a conversation](https://core.telegram.org/bots#how-are-bots-different-from-users) with someone who never wrote to it.
- **A group or a channel.** Add the bot there, write something in it, then watch what the bot sees:

  ```sh
  tg sales bot watch --events --jsonl --timeout 1m
  ```

  Each line carries the chat's id as `chatId`. In a group, a bot that is not an admin sees only
  commands and replies to it, unless its [privacy mode](https://core.telegram.org/bots/features#privacy-mode)
  is turned off in @BotFather.

After `tg sales bot chats show <id>` the bot knows the chat's title, and the commands below take the
title too. `chats list` shows every chat the bot has seen.

- A group's or a channel's id is **negative**.
- A positive id is a person.

## Several bots

A bot is kept under a name you choose, and that name is the **first word** of the command, as a
profile is for your account:

```sh
tg sales bot auth set
tg support bot auth set
tg bot list --check       # every name with a bot token, and which bot each is
```

Without a name it is the `defaultProfile` setting, else `default`. `TG_PROFILE` sets it for the shell.

## The token

The token lives in the system keyring, as `bot:<name>`, apart from your own login. Without a keyring
it goes into a file only you can read.

```sh
tg sales bot auth show    # where the token comes from, and which bot it is
tg sales bot me           # the bot's id, name and username
tg sales bot auth remove  # forget it
```

`TG_BOT_TOKEN` wins over the keyring when it is set — that is how CI does it. `auth set` does not
store the variable's token.

Telegram puts the token in the address of every request. `tg` never prints that address: not in an
error, not with `--trace`, not in a run record.

## Messages

A chat is its id, `user:<id>` for a person, or the title of a chat the bot has seen. A message is
always named with its chat: Telegram numbers messages inside each chat.

```sh
tg sales bot messages send "Team" "Build is ready"
tg sales bot messages send user:4815162342 "Hello"
tg sales bot messages send "Team" "**Weekly** report" --md       # or --html
tg sales bot messages send "Team" "Got it" --reply-to 511
echo "From a pipe" | tg sales bot messages send "Team"
tg sales bot messages edit "Team" 512 "Fixed text"
tg sales bot messages delete "Team" 512 513 --allow-dangerous
tg sales bot messages pin "Team" 512 --notify
tg sales bot messages unpin "Team" 512
```

`--silent` sends without a notification. A message is up to 4096 characters
([`sendMessage`](https://core.telegram.org/bots/api#sendmessage)). `--md` and `--html` do not go
together. Deleting asks first; `--allow-dangerous` answers yes. Pinning is quiet unless `--notify`.
The answer to a send is the message and its `operationId`, its line in the bot's journal. Telegram
deletes only messages under 48 hours old.

If the connection breaks while a message is going, `tg` does not send it again: it says it does not
know whether the message arrived (exit code 14). Check the chat before you send it again.

### Files

`--file` attaches a file from disk and sends it as a file to download, whatever its type.
`--photo` sends a `.jpg`, `.png` or `.webp` picture as a photo, and `--voice` an Ogg Opus file as a
voice message, alone, with no text. The text becomes the caption, and may be left out:

```sh
tg sales bot messages send "Team" "Weekly report" --file report.pdf
tg sales bot messages send "Team" --photo screenshot.png
```

Known credential files and folders, `tg`'s own folders and the message store are protected.
Ordinary hidden working folders are allowed; CLI `--allow-any-file` overrides protected paths.
A bot sends one file per message: a photo up to 10 MB, any other file up to 50 MB
([sending files](https://core.telegram.org/bots/api#sending-files)).

## Chats

Telegram gives a bot no list of its chats, so `chats list` shows **the chats this bot has seen on
this computer**. It is not a full list.

```sh
tg sales bot chats list
tg sales bot chats show -1001234567890    # from Telegram; the bot remembers its title
tg sales bot chats action "Team" typing   # typing, photo, video, voice, file — a few seconds
tg sales bot chats leave "Team"           # only an admin can bring the bot back
```

<a id="a-chat"></a>

### Admins and members

The bot must be an admin of the chat, with the right to add admins or to remove members. A person is
their user id.

```sh
tg sales bot chats admins list "Team"                                  # who runs it, and what each may do
tg sales bot chats admins add "Team" 4815162342 --can pin,delete --title Mod
tg sales bot chats admins remove "Team" 4815162342                     # they stay in the chat
tg sales bot chats members remove "Team" 4815162342                    # they may come back by the link
tg sales bot chats members remove "Team" 4815162342 --block            # they may not
```

`--can` takes members, admins, info, pin, link, post, edit and delete. Telegram has no right to read:
an admin always reads. Promoting works in supergroups and channels, and the title only in
supergroups. Telegram's Bot API cannot list a chat's members or add people.

## What the bot kept

Everything `tg sales bot watch` saw is kept on this computer, and these commands read it without
asking Telegram. A person is an id, an `@username` or part of a name.

```sh
tg sales bot messages list "Team"
tg sales bot messages show "Team" 512
tg sales bot contacts show @ann              # where Ann wrote, and her private chat with the bot
tg sales bot search messages "price list"    # best match first; --newest for newest first
tg sales bot search messages --from @ann     # what one person wrote
tg sales bot messages between @ann Bob       # what both wrote, in the chats both wrote in
```

**Telegram's Bot API has no history call.** `messages list` and `messages show` answer from what
the bot has sent, what `bot watch` received, and what `bot store fetch` imported on this computer,
and say so. Search needs every word; `"a phrase"`, `-word`, `a OR b` and the filters `from:`,
`chat:`, `after:`, `before:` and `has:` work, and a typo is corrected. `contacts show --refresh` is
refused: import older messages with `bot store fetch` first.

`--all-bots` and `--bots <names>` also read other bots' copies, when the profile's `readOtherBots`
allows it.

### Fetching older messages

`bot store fetch` reads older messages in a channel or supergroup into the bot's local copy.
It signs the bot in to Telegram's MTProto API with its existing bot token, in a separate session.
It reads message numbers through [channels.getMessages](https://core.telegram.org/method/channels.getMessages).
Sending and `bot watch` continue through the Bot API; the history session has updates off.
The command sends nothing and marks nothing read.

These examples use a synthetic chat id and message link:

```sh
tg sales bot store fetch -1001234567890 --from https://t.me/c/1234567890/512 --limit 20 --json
tg sales bot store fetch -1001234567890 --last 200 --pause 1s
```

`--from` starts at that message, inclusive, and must name the same chat. Without it, the command
uses the newest message the bot has kept for the chat. If there is none, it reads the newest from
the existing `default` personal session. If neither knows a number, it exits with code `2` and asks for `--from`.
It uses the bot profile's Telegram app credentials (`api_id` and `api_hash`), or the existing
`default` profile's credentials; `TG_API_ID` and `TG_API_HASH` also work. No personal login is made.

- `--limit` bounds messages fetched in this run (1,000 by default).
- `--page-size` bounds the message numbers requested per page, at most 100.
- `--pause` waits between requests (1 second by default), including requests across empty ranges.
- `--last` stops when the newest requested number of messages is held.
- `--since-time` stops when it reaches older messages; ISO 8601 or `2h` / `1d` ago.
  Give `--last` or `--since-time`, not both.

Run it again to continue backwards. JSON reports `chat`, `fetched`, `complete` and `ranges`.
An imported message becomes available to `bot messages list --offline`, search and contacts.
The bot's session is stored separately under its state directory, per profile and bot id; it is
closed when the command ends.

**Limits:** private chats and basic groups are refused: their message numbers share one sequence
across all of the bot's chats. The bot must be able to access the channel or supergroup. Deleted
messages and service numbers leave gaps; the reader scans past them to number 1. Large gaps can
need many requests even with a small `--limit`. Telegram's bot rate limits still apply: short
flood waits are respected, and a long wait ends the run so you can resume later.

## What happens in the bot's chats

```sh
tg sales bot watch                       # new messages, until Ctrl-C or --timeout
tg sales bot watch --events --jsonl      # and the rest: edits, buttons pressed, people joining and leaving
tg sales bot watch --types message,callback_query
```

`watch` keeps what arrives before it prints it: messages in the bot's history on this computer,
buttons pressed for `callbacks answer`. The next run starts after the last update it kept. Telegram
keeps a bot's updates for 24 hours, so a bot watched less often than that misses some. With
`--events`, every line names its event: `message`, `edit`, `callback`, `joined`, `left`, `added`,
`removed`, `other`. Telegram tells a bot who joins and leaves only when the bot is an admin of the
chat. `--types` takes Telegram's update names.

## Moderating a group by its rules

A bot that is an admin of a group can judge what is new there by the group's rules, as
`tg chats moderate` does for your account (see [rules for groups you run](groups.md#rules)):

```sh
tg sales bot chats rules set -1001234567890 invites delete   # invite links to other chats: delete
tg sales bot chats moderate -1001234567890 --dry-run         # what breaks the rules, without acting
tg sales bot chats moderate -1001234567890                   # act as the rules allow
```

The bot judges only what `tg sales bot watch` kept or `bot store fetch` imported on this
computer. Joins are not judged. A removed person cannot come
back by the link unless `--no-ban`. The rules live in the same file as those of your account profile
of the same name.

<a id="buttons-the-menu-webhooks"></a>

## Buttons

When a person presses a button under the bot's message, the bot gets a callback id and answers it:

```sh
tg sales bot callbacks answer <callback> --notification "Done"   # a note only the person who pressed sees
tg sales bot callbacks answer <callback> --text "Confirmed"      # replaces the message the button was on
```

`--text` replaces the message of a button `bot watch` saw pressed.

## The command menu

The menu is what people see after typing `/` in a chat with the bot.

```sh
tg sales bot commands set start=Begin "report=Today's report"
tg sales bot commands list
tg sales bot commands clear
```

A Telegram command needs a description.

## Webhooks

A webhook is an address where Telegram sends everything the bot receives.

```sh
tg sales bot webhooks set https://bot.example.com/telegram --secret-stdin
tg sales bot webhooks list
tg sales bot webhooks delete https://bot.example.com/telegram
```

A bot holds one webhook; while it is set, `bot watch` gets nothing, and `webhooks set` refuses a
second address until the first is deleted.

## Who the bot may write to

Each bot has its own list of chats it may write to. With no list, it may write anywhere.

```sh
tg sales bot recipients add -1001234567890    # a chat id
tg sales bot recipients add user:4815162342   # a person
tg sales bot recipients list
tg sales bot recipients remove -1001234567890
tg sales bot recipients clear                 # any chat again
```

Every write the bot makes goes into its journal — the chat, the kind of action and the outcome,
never the text:

```sh
tg sales bot sends list
```

The settings for a bot, such as an hourly limit on sends, live in the `bot` section of the
configuration file: `tg sales config set --bot sendsPerHour 200` (see
[configuration](configuration.md)).

## The complete Bot API

`tg <bot> bot api <method>` exposes every method in the pinned Telegram Bot API schema — all 185
of them, including operations beyond the convenient bot commands above.
Method and field names use kebab case: `get-me`, `get-chat --chat-id <id>`.
`tg bot api --help` lists the methods; each method's help lists its fields. Results retain
Telegram's native structure; integers outside JavaScript's safe range are strings.

Supply fields as separate flags or JSON with `--body <json>`, `--body -` (stdin),
or `--body-file <path>`. `--body-file -` also reads stdin. A field cannot appear both
as a flag and in the JSON body. The native `timeout` parameter is `--poll-timeout`;
the global `--timeout` limits the entire command.

Only schema-declared file fields interpret `@path` as a local upload, including nested
fields in a `media` JSON array. Ordinary text containing `@` stays literal.
Secret fields such as `secret_token` and `provider_token` use stdin or a JSON file readable
only by its owner; they have no separate argument flags.

Operations use `permissions.bot.api.<method>`, the bot's recipient list and its send journal.
Destructive actions ask by default. `get-updates` also asks: its offset can acknowledge or
forget updates. An unanswered write is never retried automatically. This interface requires
the messenger and refuses `--offline`.

`get-managed-bot-token` and `replace-managed-bot-token` require `--store-token <profile>`.
The returned token goes only to the OS keyring and is never printed. The destination must
belong to the requested bot; its identity is checked before remote token rotation.
After storage, stdout contains only the profile, bot id and `stored: "keyring"`.
An unavailable keyring causes a refusal without storing the returned token in a file.

<a id="for-scripts-and-agents"></a>

## When the bot refuses or fails

A refused or failed command says why in its error message and ends with a code:

| Code | What happened | What to do |
|---|---|---|
| `4` | no bot token, or Telegram did not accept it | run `bot auth set` again |
| `5` | the profile's permissions do not let the bot do this | change the permission only if you want to allow it |
| `6` | the chat was not found — a title the bot has not seen yet, say | use the chat id, or open the chat with `bot chats show` |
| `7` | the chat is not on the bot's recipient list, or nobody answered a question an `ask` level put | add the chat with `bot recipients add`, or run the command where you can answer |
| `8` | the bot's `sendsPerHour` is used up | wait, or raise the limit |
| `14` | no answer came: whether Telegram did the write is not known | check the chat before you repeat it |

Every code is in the [command reference](commands.md). `--trace` and `--record` work for a bot too:
each Bot API request is a line on stderr, never with its address, since the token is in it. A failed
run is kept and shows in `tg runs list` (see [diagnostics](diagnostics.md)).

## The bot for an agent (MCP)

`tg <name> bot mcp` serves the bot to your AI agent, as `tg mcp` serves your account:

```sh
claude mcp add sales-bot -- tg sales bot mcp
tg sales bot mcp config          # the entry for Claude Desktop, Cursor and other apps
```

The agent gets what the bot profile's permissions allow, under `bot.`: the chats the bot has seen,
messages, admins, the command menu, the journal and the recipient list — and, unless the profile is
read-only, writing as the bot: send, edit, pin, "typing", answer buttons, delete, remove members.
`permissions.bot: readonly` blocks writes unless a more specific rule permits one. A deletion at
`ask` and `allow` permit a requested MCP write without a server form; `deny` and `readonly`
block it. Old confirmation flags have no effect. Separate moderation rule consent still
applies: actions requiring it return a plan for you to approve through the CLI.
`tg_bot_read` (`command: "status"`) says which profile
the server speaks for and which writing tools are on.

Each write runs the same command you would type, so the bot's recipient list and journal apply.
The token, the webhooks, the command menu and the recipient list stay yours to change.

Bot `--md` uses the same [Telegram formatting rules](usage.md#sending) as personal sends.
Text edits and file/photo captions use that formatter too.
