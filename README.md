<p align="center">
  <img src="https://raw.githubusercontent.com/WireCatLabs/tg-cli/main/docs/design/logo_text.png" alt="Tg CLI" width="480">
</p>

# tg-cli

A Telegram client for the terminal and for AI agents. `tg` is a command line tool and an MCP server
for your own Telegram account: read your chats, find what was said, and answer — yourself, or
through Claude, Codex, Cursor and other agents, within limits you set. In the groups you run, see
which questions nobody answered and who joined.

It runs on Windows, macOS and Linux. Documentation: [wirecat.dev/en/docs/tg](https://wirecat.dev/en/docs/tg).

```sh
tg inbox                                          # other people's unread messages, in every chat
tg messages send "Book club" "Running 15 minutes late"
```

[![npm](https://img.shields.io/npm/v/@wirecat/tg-cli)](https://www.npmjs.com/package/@wirecat/tg-cli)
[![CI](https://github.com/WireCatLabs/tg-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/WireCatLabs/tg-cli/actions/workflows/ci.yml)
[![Node](https://img.shields.io/node/v/@wirecat/tg-cli)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/bun-tested-f9f1e1)](https://bun.sh/)
[![npm downloads](https://img.shields.io/npm/dm/@wirecat/tg-cli)](https://www.npmjs.com/package/@wirecat/tg-cli)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

## The bot

`tg bot` works with a bot through Telegram's **official** [Bot API](https://core.telegram.org/bots/api)
and its token from [@BotFather](https://t.me/BotFather). You can keep several bots: each is kept
under a name you choose, and that name is the first word of the command.

**The entire Bot API.** All 185 methods of Telegram Bot API 10.3 are exposed through
`tg <bot> bot api <method>`, including operations beyond the convenient message and chat
commands. Use native field flags or JSON bodies for your own scripts and automation.
[Bot API guide](docs/bot.md#the-complete-bot-api) · [Every command and option](docs/commands.md).

```sh
tg sales bot auth set                    # the token, at a hidden prompt; Telegram checks it first
tg sales bot auth show                   # which bot it is
tg sales bot recipients add user:<id>    # the bot may write only here
tg sales bot messages send "Team" "Build is ready" --file report.pdf
tg bot list --check                      # every bot on this computer
```

- **Every Bot API method.** `tg sales bot api --help` lists the complete native API;
  each method's help lists its fields. The usual bot commands remain available alongside it.
- **One token per name, in the keyring.** `bot:<name>`, apart from your own login; `TG_BOT_TOKEN`
  for CI. The token is never printed — not in an error, not with `--trace`, not in a run record.
- **Recipients and a journal.** Each bot has its own list of chats it may write to, and a journal
  of what it did, without the text.
- **Messages and chats.** Send, edit, delete and pin, to a chat by id or by title, or to a person
  as `user:<id>`; `--md`, `--html`, a file or a photo. `bot store fetch` imports older channel and supergroup messages;
  `messages list` reads what this bot sent, received or imported on this computer.
  History import uses a separate MTProto session; private chats and basic groups are unsupported.
- **Admins, members, buttons, the menu, webhooks.** `bot chats admins`, `bot chats members remove`,
  `bot callbacks answer`, `bot commands`, `bot webhooks` — the same commands `max bot` has.
- **`bot watch`** prints what happens in the bot's chats as it arrives, and keeps it: that is the
  bot's history on this computer.

In full: [docs/bot.md](docs/bot.md).

## The personal account

`tg` works with your own account, as one more of your devices: every chat, its history, groups,
channels and contacts. It is not a bot: it talks to Telegram over MTProto, Telegram's own API for
client apps, with an app you register yourself.

```sh
tg chats list --limit 5
tg messages list "Book club"
tg messages send "Book club" "Running 15 minutes late"
```

In full: [docs/usage.md](docs/usage.md).

## How to use it

- **A check on a schedule.** Morning and evening, the agent looks at what came in and sends you a
  short summary: who is waiting for an answer, what is urgent, what you can skip.
- **Reports.** A week of a work chat: what was decided, who took what on, which questions are still
  open.
- **Who owes what.** `tg review` hands over everything said since the last review in one call, your
  own messages too. The agent sorts it into "I owe", "waiting on others" and "needs clarifying".
- **Reminders.** Whom you promised an answer and did not give one; whose question has waited three
  days.
- **Draft replies.** The agent proposes the text, and you send it — or it sends, if you allowed it
  to write to that chat.
- **Search.** "When did we agree to meet Anna?" — an answer with the date and the message itself.
- **A group you run.** Which questions nobody answered, who joined this week
  ([groups.md](docs/groups.md)).

What that looks like:

```text
You:    What did I promise anyone in the last three days?
Agent:  (calls tg review: 12 chats)
        I owe
        · Anna — send the invoice by Friday. "Anna", 24.09
        Waiting on others
        · Boris — the mock-up by 25.09. Not in "Design" yet
        Needs clarifying
        · "Project Alpha": who brings the samples — "we'll decide later", 25.09
        Next review — from 26.09, 14:05.
You:    Remind Boris about the mock-up.
Agent:  Draft: "Boris, hi! How is the mock-up going?" Send it?
You:    Yes.
```

Set sending to `ask` in the profile's `permissions` for confirmation in the terminal. Over MCP,
`ask` permits the requested write; configure approval in the agent app. Reading marks nothing read.
Ready requests, a schedule and limits for each job: [recipes.md](docs/recipes.md).

## Groups you run

```sh
tg review --chat "Hiking" --unanswered            # questions nobody answered in 24 hours
tg chats events "Hiking" --since-time 7d          # who joined, left, was added or removed, and by whom
tg chats members list "Hiking" --all              # everyone, with their role and when they were last seen
tg topics list "Hiking"                           # a forum group's topics, newest activity first
tg chats inspect https://t.me/+AbCdEf             # where an invite link leads, without joining
tg chats create "Hiking 2027" @olga               # a new group, with the people you name
```

Renaming a group, adding and removing members and admins, resetting its invite link and moderation
rules for links, forwards and floods are commands too. In full: [docs/groups.md](docs/groups.md).

Enable topics with `topics enable`. Only the group owner can do this. A basic group needs
`--upgrade --yes`, which permanently changes its chat id; the result gives the new address.
An existing supergroup needs no upgrade. `topics create` creates a named topic; on an unknown
outcome, check the list and never repeat an unknown creation. Existing archive rows keep
their original chat ids; histories are not automatically merged across the migration.

Send into a forum topic with `messages send --topic` or `polls create --topic`. Use the id from
`topics list`; an explicit reply must belong to that topic. Text, photo/file captions and scheduled
sends keep the topic. Closed or missing topics are refused before sending. On an unknown outcome,
repeat with the same send id, chat and topic; check the scheduled queue instead of repeating a
scheduled send.

## How it works

`tg` works in your name, as one more of your devices. It is not a bot: it talks to Telegram over
MTProto, Telegram's own API for client apps, with an app you register yourself. From then on `tg`
sees your chats, their history, groups, channels and contacts.

An agent connects to `tg` in one of two ways:

- **An agent with a terminal** — Claude Code, Codex, Gemini CLI. It runs `tg` commands itself. Give
  it the [skill](skills/tg-cli/SKILL.md): instructions for working with `tg`, installed with one
  command ([recipes.md](docs/recipes.md#once-first)).
- **An agent without a terminal** — Claude Desktop, Cursor and other MCP clients. Connect `tg mcp`;
  `tg mcp config` prints the entry for their settings. It comes with ready prompts: `/catch-up`
  (what is new), `/review` (who owes what), `/reply` (a draft answer) and `/find` (search). The
  profile's `permissions` decide what the agent may do ([mcp.md](docs/mcp.md#what-an-agent-may-do)).

## What it can do

- **Read.** Chats, history, one message with its neighbours, other people's unread messages in every
  chat at once (`tg inbox`), everything since the last review (`tg review`), new messages as they
  arrive (`tg watch`), a message's files or a whole chat's, voice messages as text.
- **Search.** Messages by their text, across the local archive and Telegram by default;
  `--backend archive` keeps search local, and `--sync-first` fetches new messages before searching.
  Use `--regex` for a pattern. Chats by part of their title, contacts by part of a name, a person by phone number.
- **Write.** Text with Markdown, replies, files, photos, videos and voice messages, silent messages,
  scheduled messages that go out even with this computer off, edits, forwards, pins, reactions,
  polls, deletion — for you or for everyone.
- **Keep an archive.** Fetch a chat's history into the local store, in the background if it is long;
  keep the store current with `tg serve`, as a systemd or launchd service; export a chat as JSON
  lines or Markdown; back the store up and restore it while it is in use ([archive.md](docs/archive.md)).
- **One request pace per profile**, shared by every command, job and server at once, so bulk work stays
  under Telegram's limits; long waits stop the run instead of being repeated ([limits.md](docs/limits.md)).
- **Groups and channels.** Create a group or a channel, join by a link, leave; rename it, add and
  remove members and admins, reset its invite link; who joined and left, forum topics, where an
  invite link leads; moderation rules for links, forwards and floods, applied when you run them
  ([groups.md](docs/groups.md)).
- **Contacts and the account.** Add, rename, block and import contacts; who you are logged in as,
  and every device and app logged in to the account.
- **About one person.** Their profile, last seen and when they registered; how many of their
  messages you hold in each shared chat; their latest messages per chat for an agent to summarise;
  and whether the account looks like a bot or a spammer, public spam lists included
  ([people.md](docs/people.md)).

## Why it is good

- **It reads without a trace.** Reading marks nothing read: the other side does not see that you
  opened the chat. Mark it read when you want to: `tg chats mark-read`.
- **An agent cannot write more than you allowed.** A profile can be read-only, allow only some
  actions, send only to the chats on its list, and send at most 30 messages an hour. When a name
  fits two chats, `tg` does not pick one: it shows both ([security.md](docs/security.md#the-send-guard)).
- **A message is never sent twice.** If the connection breaks while a message is sent, `tg` says
  plainly that it does not know whether it went, and gives the command to repeat it. Telegram
  recognises the repeat and does not create a second message
  ([usage.md](docs/usage.md#when-the-outcome-is-unknown)).
- **Your own copy of your messages.** Everything read is kept on your computer. Search over it is
  fast, and `--offline` answers from it without connecting at all.
- **Voice messages as text, on your computer.** Telegram transcribes for Premium accounts; `tg` can
  also run a speech model on this machine, downloaded only when you ask
  ([usage.md](docs/usage.md#voice-messages)).
- **Other people's text does not control your terminal.** Control characters in names, titles and
  messages are shown as text, and a name is printed on one line
  ([security.md](docs/security.md#other-peoples-text-on-your-screen)).
- **No secret on the command line.** No command takes a password, a login code or a phone number as
  an argument. The app keys are in the system keyring.
- **Easy to read for a script and an agent.** With `--json`, a command prints data and nothing else,
  always in the same shape. An error comes separately, with its own exit code
  ([usage.md](docs/usage.md#for-scripts-and-agents)).
- **Problems can be looked at without your messages.** `--trace` shows each request to Telegram and
  holds no text, names, phone numbers or keys, so it can go into a bug report
  ([diagnostics.md](docs/diagnostics.md)).

## Custom work

We build process automation and tools for your task: integrations with Telegram and other
messengers, AI agents, internal services. Write to [info@neirox.ai](mailto:info@neirox.ai).

## How it differs

There are good tools for a Telegram account already. Choose what fits the job:
[Compared with other tools](docs/compare.md) puts `tg` next to tgcli, telegram-mcp and tdl, feature by
feature.

**Telegram's own apps** are made for a person. `tg` is made for a script and an agent: one operation
per call, the same shape of answer every time, a limit on what an agent may send, your messages
searchable offline, and nothing marked read by reading.

**Bots.** A Telegram bot, through the [Bot API](https://core.telegram.org/bots/api), sees only the
chats it was added to and speaks as the bot. `tg` is you: your chats, in your name. `tg bot` drives a bot of
yours through that API ([bot.md](docs/bot.md)).

## Contents

- [The bot](#the-bot)
- [The personal account](#the-personal-account)
- [Groups you run](#groups-you-run)
- [Install](#install)
- [Log in](#log-in)
- [Use](#use)
- [For scripts and agents](#for-scripts-and-agents)
- [Security](#security)
- [Documentation](#documentation)
- [Development](#development)
- [Roadmap](#roadmap)
- [Licence](#licence)
- [Contributing](#contributing)

## Install

The package is **`@wirecat/tg-cli`**; the command it installs is **`tg`**.

Try it without installing:

```sh
npx @wirecat/tg-cli --help
```

Install it:

```sh
npm install -g --allow-scripts=@wirecat/tg-cli --foreground-scripts @wirecat/tg-cli     # or: pnpm add -g @wirecat/tg-cli, bun add -g @wirecat/tg-cli
tg --version
tg setup                        # guided first run; allow about five minutes
```

For an agent, read `tg skill show` before login and use `tg setup --agent codex`.
`tg --help` and `tg setup --help` show the next steps.

It needs **Node 22.16 or newer**, or **Bun** — CI runs the built command under both — on macOS, Linux
or Windows. SQLite comes from the
runtime itself, or from tg's own copy when a Linux Node's system SQLite is too old, so there is
nothing to compile. `tg doctor` says where its files are and whether a
session is saved, without connecting; `tg doctor --online` checks the login works. Details, variables and where the files go:
[docs/installation.md](docs/installation.md).

### Windows installation

```powershell
& ([scriptblock]::Create((Invoke-RestMethod 'https://wirecat.dev/install.ps1'))) -Tool tg -Agent all
```

This single installer call saves the npm command folder to user PATH, updates this PowerShell,
installs the bundled agent skill and verifies bare `tg`. It preserves existing PATH entries,
works when npm skips lifecycle scripts and leaves PowerShell execution policy unchanged.
An agent reads `tg skill show` before guiding login. Installation itself contacts no account.
See [installation](docs/installation.md#windows-one-install-command).

## Log in

For a first run, use the guided command in your terminal:

```sh
tg setup --agent codex       # also: cursor, claude, gemini, all or none
```

Allow about five minutes. It checks local directories, obtains your Telegram app keys, logs in
by QR code, checks the first five chats and installs the selected agent skill. Without `--agent`,
it asks at a terminal; machine output defaults to `none`. A repeat run checks the existing session.
History downloads are a separate step: choose a chat before `tg store fetch <chat> --last 100`.
If automatic app registration fails, use `tg session start --app browser`, then rerun setup.

Every user registers their own Telegram app at [my.telegram.org](https://my.telegram.org/apps).
`tg session start` asks for it the first time; `--app auto` fills in the site for you.

```sh
tg session start                        # a QR code in the terminal: Settings → Devices → Link Desktop Device
tg session start phone                  # or a phone number, the code, and your 2FA password
tg session start --qr-file login.png    # the QR code as a picture, for an agent to show you
tg account show                         # who you are logged in as
tg account list                         # every profile here, and who each is logged in as
```

Several accounts are several profiles, and the profile is **the first word**, not an option:

```sh
tg chats list              # profile "default"
tg work chats list         # profile "work"
export TG_PROFILE=work     # or for the whole shell session
```

The app, the session and profiles: [docs/sessions.md](docs/sessions.md).

## Use

**A conversation in your name:**

```sh
tg inbox                                          # unread in every chat, nothing marked read
tg messages list "Book club" --limit 20
tg messages send "Book club" "Call at 3?" --reply-to <id>
tg reactions add "Book club" <id> 👍
tg messages send me "Call mum" --at-time 2h       # a reminder in Saved Messages in two hours
tg review --since-time 1d                         # a day of messages: who promised what
```

**Files and voice:**

```sh
tg messages send "Book club" "The minutes" --file minutes.pdf
tg messages download "Book club" <id> --output-dir ~/Downloads
tg messages transcribe "Book club" <id>           # a voice message as text
```

**Find and keep:**

```sh
tg search all "contract"                          # messages, mail and notes kept, without connecting
tg messages evidence "Project Alpha" --json        # bounded evidence for a chat brief
tg store fetch "Project Alpha" --last 5000 --background
tg store export "Project Alpha" --format markdown --output alpha.md
tg server install                                 # keep the store current as a service
```

Every command answers in JSON with `--json`, and every send goes into a journal — without its text.

In full: [docs/usage.md](docs/usage.md). Every command and option:
[docs/commands.md](docs/commands.md) — generated from the program itself, so it cannot describe a
version that does not exist.

## For scripts and agents

### A skill for agents with a terminal

A skill is a file of instructions an agent reads before it works. The bundled skill is available
before login through `tg skill show`. It explains setup, reading, permissions and safe sending.
Guided setup installs it for your chosen agent; an already configured account can install it
separately:

```sh
tg setup --agent codex            # also cursor, claude, gemini, all or none
tg skill install --for all        # install both supported skill directories, without logging in
tg skill show                    # read the complete instructions without installing them
```

Claude Code uses `~/.claude/skills/tg-cli/`. Codex, Gemini CLI and local Cursor use
`~/.agents/skills/tg-cli/`. Start a new agent session after installation if it does not see the
skill. The installed instructions come from the same package version as `tg`.

How these agents find skills: [Codex](https://learn.chatgpt.com/docs/build-skills),
[Gemini CLI](https://geminicli.com/docs/cli/skills/),
[Cursor](https://cursor.com/docs/skills).

### An MCP server for agents without a terminal

Claude Desktop, Cursor and other MCP clients connect to `tg mcp` and work with the same account.
The profile's `permissions` decide which commands it gets: by default it can send, react, mark
read and delete your own messages, with no form. Set a level to `readonly` to keep the agent from
changing it; to see each change first, leave `tg_write` unapproved in your client.
In full: [docs/mcp.md](docs/mcp.md).

```sh
claude mcp add tg -- tg mcp         # Claude Code
tg mcp doctor                       # check the local MCP server
tg mcp setup codex                 # add it to Codex
tg mcp setup claude-code           # add it to Claude Code
tg mcp config                       # the entry for Claude Desktop, Cursor and others, with full paths
```

The server's prompts — `/catch-up`, `/review`, `/reply`, `/find` — are ready requests: the agent
knows which tools to call and what not to do. ChatGPT or Claude in the browser can reach it too,
through a login proxy and a tunnel: [docs/remote.md](docs/remote.md).

### Answers in JSON

```sh
tg chats list --json
```

With `--json` a command prints only data, as one JSON value — no tables, colour or hints. It does
the same when another program reads its output, as in `tg … | jq`. `--jsonl` prints one object per
line. Every list comes in one shape:

```json
{ "items": [ … ], "page": 1, "limit": 20, "hasMore": true }
```

An error comes apart from the data — one line on stderr, while stdout stays empty, so it cannot be
taken for an empty result:

```json
{"error":{"code":"authentication_error","message":"…"}}
```

Every error has a number — the exit code. A script decides what to do next by it: `4` log in, `5`
the profile may not do this, `6` chat or message not found, `8` a limit, `9` Telegram did not answer
in time, `14` unknown whether a message went. `tg commands --json` is the whole command tree, with
every exit code. All codes: [docs/commands.md](docs/commands.md#exit-codes).

## Security

- The session is a file readable only by your user, and it is as good as your password: copying it
  copies the login. The app keys are in the system keyring.
- The local store is readable only by your user. It holds the full text of what was read,
  unencrypted; only whole-disk encryption protects it from a stolen disk. It stays after logging out.
- Before each send, from a command or over MCP, `tg` checks the profile's limits and writes a line to
  the journal — without the message's text.
- A level of `ask` in `permissions` asks you in the terminal before a change; over MCP nobody is
  there to answer, so it goes ahead — use `readonly` to stop an agent. `--file` protects known credential
  files, CLI folders and the local store. Ordinary hidden working folders are allowed;
  `--allow-any-file` is available only in CLI, and MCP cannot override these protections.
- The limits protect against an agent talked into sending by a message it read, not against one
  that sets out to get round them: against that you need a boundary outside — a sandbox or a
  separate user.

In full — what reaches the disk, what goes over the network and what the tool never does:
[docs/security.md](docs/security.md).

## Documentation

| Page | Answers |
|---|---|
| [installation](docs/installation.md) | requirements, where files go, shell completion, upgrade, removal |
| [usage](docs/usage.md) | profiles, reading, paging, sending, scripts |
| [sessions](docs/sessions.md) | QR and phone login, the app from my.telegram.org, the keyring, profiles, logout |
| [archive](docs/archive.md) | the local store: fetch, search, export, `--offline`, `serve` as a service, backup |
| [groups](docs/groups.md) | groups you run: unanswered questions, newcomers, a weekly report |
| [people](docs/people.md) | one person: profile, what they said in each chat, does the account look like a bot |
| [replies](docs/replies.md) | answer messages by your rules, to everyone or only the people you choose |
| [mcp](docs/mcp.md) | Claude Desktop, Cursor and other clients without a terminal |
| [remote](docs/remote.md) | ChatGPT or Claude in the browser, through a login proxy and a tunnel |
| [recipes](docs/recipes.md) | an agent's daily work: summary, who owes what, unanswered, on a schedule |
| [commands](docs/commands.md) | every command, option and exit code, generated from the program |
| [configuration](docs/configuration.md) | common setup |
| [configuration reference](docs/configuration-reference.md) | every key, type, default, scope and variable |
| [CLI contract](docs/cli-contract.md) | output, errors, bounds and agent execution |
| [diagnostics](docs/diagnostics.md) | `--trace`, `--record`, `runs`, `doctor report`, and what is never recorded |
| [troubleshooting](docs/troubleshooting.md) | by symptom: what the screen says, and what to do |
| [security](docs/security.md) | what reaches the disk and the network; the send guard |
| [roadmap](docs/roadmap.md) | what is coming |

What each version changed: [CHANGELOG.md](CHANGELOG.md).

## Development

```sh
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build && pnpm smoke:bun  # the built command under the second runtime
pnpm generate                 # rewrites docs/commands.md from the command tree
bin/tg session start          # everything under .tg/ in this checkout, never the real profile
bin/tg chats list --limit 5
```

Everything that is not specific to Telegram — the commands, the store, the send guard, the MCP
server — lives in [cli-messaging](https://github.com/WireCatLabs/cli-messaging), shared with
[max-cli](https://github.com/WireCatLabs/max-cli). Telegram-specific code lives only in `src/telegram/`,
and a lint rule keeps [mtcute](https://mtcute.dev), the Telegram library underneath, there.

To work on `cli-messaging` at the same time, point the dependency at a checkout for the length of
the change — `pnpm add @wirecat/cli-messaging@link:../cli-messaging` — and put the version back
before the pull request.

## Roadmap

What is coming to `tg`, in the order it is likely to arrive. The order can change. Ideas and
requests are welcome in [issues](https://github.com/WireCatLabs/tg-cli/issues).

- **Richer sending** — several photos in one message
  ([usage.md](docs/usage.md#not-in-tg-yet)).

What each released version changed is in [CHANGELOG.md](CHANGELOG.md).

## Licence

Apache License 2.0 — see [LICENSE](LICENSE).

## Contributing

Pull requests, bug reports and ideas are welcome —
[issues](https://github.com/WireCatLabs/tg-cli/issues). How the code is built and how to test it:
[docs/dev/ARCHITECTURE.md](docs/dev/ARCHITECTURE.md) and [docs/dev/TESTING.md](docs/dev/TESTING.md).

For browser connectors, `tg mcp --http --public-url https://<name>.ts.net` serves behind your tunnel
with an owner-code login. Profile permissions govern writes; the server has no confirmation forms. See [remote access](docs/remote.md).
Group activity is available with `tg stats chats show <chat>`; [statistics](docs/groups.md#statistics-for-group-admins).

### Private contact notes and automatic tags

`tg contacts alias set <person> <alias>` keeps a display name locally for the selected account;
`contacts rename` updates the messenger address book. Write your own notes with
`contacts notes add <person> --file <path>`, then use `list`, `show`, `edit --revision <n>` and
`remove`. `contacts show --with-notes` includes notes explicitly; `contacts list --search-notes
<text>` searches them. A contact's notes show in every account that sees the contact; an alias stays in
its own account. Contact refresh preserves notes and aliases; linking people does not
combine their private metadata.

`tg metadata refresh --chat <id>` caches a group/channel description; `metadata get --chat <id>`
reads that snapshot. `tags auto --chat <id> --dry-run` previews keyword labels. Use
`--refresh-metadata` without `--dry-run` for current descriptions. Each run handles at most 500
chats, 50 by default. Automatic labels preserve manual labels; `tags list|remove --source auto`
selects generated claims. Classification uses no message text or external model.
