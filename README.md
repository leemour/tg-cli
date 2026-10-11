<p align="center">
  <img src="https://raw.githubusercontent.com/WireCatLabs/tg-cli/main/docs/design/logo_text.png" alt="Tg CLI" width="480">
</p>

# tg — Telegram CLI for AI agents

<p align="center">
  Your whole Telegram account in the terminal, searchable on your computer, and ready for Claude Code,
  Codex, Cursor or any agent — within limits you set.
</p>

<p align="center">
  <a href="https://wirecat.dev/en/docs/tg">Docs</a> ·
  <a href="https://github.com/WireCatLabs/tg-cli/blob/main/docs/recipes.md">Examples</a> ·
  <a href="https://wirecat.dev">WireCat</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@wirecat/tg-cli"><img src="https://img.shields.io/npm/v/@wirecat/tg-cli" alt="npm"></a>
  <a href="https://github.com/WireCatLabs/tg-cli/actions/workflows/ci.yml"><img src="https://github.com/WireCatLabs/tg-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/@wirecat/tg-cli" alt="Node"></a>
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/bun-tested-f9f1e1" alt="Bun"></a>
  <a href="https://www.npmjs.com/package/@wirecat/tg-cli"><img src="https://img.shields.io/npm/dm/@wirecat/tg-cli" alt="npm downloads"></a>
  <a href="https://github.com/WireCatLabs/tg-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License: Apache 2.0"></a>
</p>

<!-- HERO DEMO SLOT: replace the example below with a 30–45 s recording (GIF or video) of an agent
     answering a question with source references. Record on a demo account whose chats hold only
     invented people (Alice Example, Bob Sample), never a real account: this repository is public.
     Use an absolute raw.githubusercontent.com URL so npmjs.com renders it too. -->

An example conversation (invented people, illustrative output):

```text
You:    Use tg CLI. What did I promise anyone in the last three days?
Agent:  (runs tg review --since-time 3d: 12 chats)
        I owe
        · Alice Example — the invoice by Friday. "Alice Example", 24.09
        Waiting on others
        · Bob Sample — the mock-up by 25.09. Not in "Design" yet
You:    Remind Bob about the mock-up.
Agent:  Draft: "Hi Bob, how is the mock-up going?" Send it?
You:    Yes.
```

## Quick start

```sh
npm install -g @wirecat/tg-cli    # or: pnpm add -g @wirecat/tg-cli, bun add -g @wirecat/tg-cli
tg setup --agent claude           # also codex, cursor, gemini, all or none
tg inbox                          # other people's unread messages, in every chat; nothing is marked read
```

Allow about five minutes. `tg setup` registers your own Telegram app at
[my.telegram.org](https://my.telegram.org/apps), logs in by QR code, checks your first chats and installs
the agent skill. Downloading older history is a separate step.

It needs **Node 22.16+ or 24+**, or **Bun**, on macOS, Linux or Windows. Try it without installing:
`npx @wirecat/tg-cli --help`. The Windows one-line installer, phone login and where files go:
[installation](docs/installation.md) and [login and sessions](docs/sessions.md).

## What can you do?

**Catch up.** *"Use tg CLI. What came in since this morning, and who is waiting for my answer?"*

```sh
tg inbox
tg review --since-time 1d
```

**Find anything.** *"Use tg CLI. When did we agree on the venue with Alice?"* — an answer with the date
and the message itself.

```sh
tg search all "venue"                         # messages, mail and notes kept on this computer
```

**Keep your promises.** *"Use tg CLI. What did I promise, and what am I still waiting on?"* `tg review`
hands over everything said since the last review in one call, your own messages too.

```sh
tg review --new                               # what changed since the last review --new
```

**Run your groups.** *"Use tg CLI. Which questions in Hiking has nobody answered?"*

```sh
tg review --chat "Hiking" --unanswered
tg chats events "Hiking" --since-time 7d      # who joined, left, was added or removed
```

More whole tasks, with a schedule and limits for each: [recipes](docs/recipes.md).

## Built for AI agents

Your agent. Your Telegram. Your rules.

- **Agents with a terminal** (for example Claude Code, Codex, Gemini CLI) run `tg` commands
  themselves. The bundled [skill](skills/tg-cli/SKILL.md) tells them how: `tg setup --agent …` or
  `tg skill install` puts it in place, and `tg skill show` prints it before login.
- **Apps without a terminal** (for example Claude Desktop, Cursor and other MCP clients) connect to
  `tg mcp`. It comes with ready prompts: `/catch-up`, `/review`, `/reply` and `/find`.

```sh
tg mcp setup claude-code    # or: tg mcp setup codex
tg mcp config               # the entry for Claude Desktop, Cursor and others
```

ChatGPT or Claude in the browser can reach it through a login proxy and a tunnel:
[remote access](docs/remote.md). In full: [the MCP server](docs/mcp.md).

## Why tg?

- **Your whole account, not only bots.** Every chat, group, channel and contact, with its history —
  `tg` is one more of your devices.
- **Local-first search.** Everything read is kept on your computer. Search is fast, and `--offline`
  answers without connecting.
- **Made for agents.** One operation per call, the same JSON shape every time with `--json`, a fixed
  exit code for each kind of failure, an MCP server and a skill.
- **Safe by default.** Reading marks nothing read. A profile decides which actions an agent may take,
  which chats it may send to, and how many messages an hour (30 by default). When a send's outcome is
  unknown, `tg` says so and gives a repeat command that Telegram does not deliver twice
  ([unknown outcomes](docs/usage.md#when-the-outcome-is-unknown)).
- **The full Bot API too.** All 185 methods, next to the convenient bot commands.

## Personal account and bots

**Your account.** `tg` talks to Telegram over MTProto, Telegram's own API for client apps, with an
app you register yourself. Read, search, send, edit, forward, react, schedule, download files, turn
voice messages into text, keep a local archive current with `tg serve`, and run the groups and
channels you own. In full: [using tg](docs/usage.md), [the local store](docs/archive.md),
[groups you run](docs/groups.md), [one person](docs/people.md).

```sh
tg chats list --limit 5
tg messages send "Book club" "Running 15 minutes late"
```

**A bot.** `tg bot` drives a bot of yours through Telegram's official
[Bot API](https://core.telegram.org/bots/api), with its token from
[@BotFather](https://t.me/BotFather) kept in the system keyring. Each bot has a name you choose, its own
list of chats it may write to, and a journal of what it did.

```sh
tg support bot auth set                  # the token, at a hidden prompt
tg support bot messages send "Team" "Build is ready" --file report.pdf
tg support bot api --help                # every Bot API method
```

In full: [a Telegram bot](docs/bot.md).

## How it differs

Telegram's own apps are made for a person; `tg` is made for a script and an agent. A Telegram bot sees
only the chats it was added to and speaks as the bot; `tg` is you, in your chats. Other open tools
connect a Telegram account to an agent too:
[compared with tgcli, telegram-mcp and tdl](docs/compare.md).

## Part of WireCat

[WireCat](https://wirecat.dev) is an open-source, local-first context layer for AI agents. `tg` is
where it starts; [max-cli](https://github.com/WireCatLabs/max-cli) brings the MAX messenger into the
same local store. Start with Telegram. Add more context when you need it. Your context. Any agent.

## Documentation

The full guide is at [wirecat.dev/en/docs/tg](https://wirecat.dev/en/docs/tg). The same pages are in
[`docs/`](docs/):

| Page | Answers |
|---|---|
| [installation](docs/installation.md) | requirements, the Windows installer, where files go, upgrade, removal |
| [sessions](docs/sessions.md) | QR and phone login, your Telegram app, the keyring, profiles |
| [usage](docs/usage.md) | reading, sending, files, voice, output for scripts and agents |
| [search](docs/search.md) | finding messages by words, people, dates, files, links and tags |
| [archive](docs/archive.md) | the local store: fetch, export, keep current, back up |
| [groups](docs/groups.md) | groups you run: unanswered questions, newcomers, topics, moderation |
| [bot](docs/bot.md) | a Telegram bot and the complete Bot API |
| [mcp](docs/mcp.md) | Claude Desktop, Cursor and other clients without a terminal |
| [recipes](docs/recipes.md) | an agent's daily work, on a schedule |
| [commands](docs/commands.md) | every command, option and exit code, generated from the program |
| [troubleshooting](docs/troubleshooting.md) | by symptom: what the screen says, and what to do |
| [security](docs/security.md) | what reaches the disk and the network; the send guard |

What each version changed: [CHANGELOG.md](CHANGELOG.md). What is coming: [roadmap](docs/roadmap.md).

## Security

- The session file is as good as your password, readable only by your user; the app keys are in the
  system keyring. No command takes a password, a login code or a phone number as an argument.
- Every send, from a command or over MCP, passes the profile's limits and is written to a journal —
  without its text.
- The local store holds the full text of what was read, unencrypted and readable only by your user.
- `--trace` shows each request to Telegram without text, names, phone numbers or keys, so it can go
  into a bug report.

In full: [security](docs/security.md). To report a vulnerability: [SECURITY.md](SECURITY.md).

## Contributing

Pull requests, bug reports and ideas are welcome in
[issues](https://github.com/WireCatLabs/tg-cli/issues). How the code is built and tested:
[ARCHITECTURE](docs/dev/ARCHITECTURE.md) and [TESTING](docs/dev/TESTING.md). Everything that is not
specific to Telegram lives in [cli-messaging](https://github.com/WireCatLabs/cli-messaging).

Custom automation with Telegram, other messengers and AI agents: [info@neirox.ai](mailto:info@neirox.ai).

## License

Apache License 2.0 — see [LICENSE](LICENSE).
