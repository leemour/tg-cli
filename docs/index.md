# tg

`tg` connects your own Telegram account to the terminal and to your AI agent (for example Claude
Code, Codex, Cursor or Gemini CLI). Use it when you want to read, search and answer your chats
without opening the Telegram app, or hand that work to an agent within limits you set.

This page tells you what `tg` can do, how to start in about five minutes, and which page answers
which question.

Three terms appear on every page:

- **Terminal** (command line): the window where you type commands, such as Terminal on macOS or
  PowerShell on Windows. `tg` is one command you type there.
- **AI agent**: a program that does tasks for you and can run commands, such as Claude Code or
  Codex. It uses `tg` for you.
- **Skill**: a short instruction file that tells your agent how to use `tg`. Setup installs it.

## What it can do

| You want to | Where |
|---|---|
| Read your chats and other people's unread messages; by default nothing is marked read | [Using tg](usage.md) |
| Find what was said, by words, people, dates, files or topic | [Search](search.md) |
| Keep a copy of your messages on this computer, and search or export it | [The local store](archive.md) |
| Answer and send, yourself or through an agent, within the limits you set | [Using tg](usage.md), [Permissions](permissions.md) |
| See which questions nobody answered in the groups you run, and who joined | [Groups you run](groups.md) |
| Run a Telegram bot from the terminal | [A Telegram bot](bot.md) |
| Use Telegram from an app with no terminal (for example Claude Desktop or Cursor) or from a chat in the browser | [The MCP server](mcp.md), [ChatGPT, Codex or Claude in the browser](remote.md) |

Every command does one thing, gives the same shape of answer every time, and has a fixed exit
code for each kind of failure. This is why scripts and agents can rely on it.

## Get started

```sh
npm install -g @wirecat/tg-cli
tg setup                  # guided app registration, login and agent skill
tg inbox                  # other people's unread messages, in every chat; nothing is marked read
tg messages list me       # Saved Messages, the latest 20
```

Allow about five minutes for setup. Downloading older chat history is a separate step. To choose
the agent that gets the skill, add `--agent` with `codex`, `cursor`, `claude`, `gemini` or `all`
(for example `tg setup --agent codex`). `tg setup --help` shows the login choices and the Windows
instructions.

With a bot (`support` here is an example name of a bot profile):

```sh
tg support bot auth set                          # the token, typed without showing it
tg support bot api get-me --json
```

`tg` needs Node 22.16+ or 24+, or Bun ([what to install first](installation.md#what-it-needs)). The
first login asks for your own Telegram app; `tg` can register it for you
([your Telegram app](sessions.md#the-app-from-mytelegramorg)).

How `tg` differs from other tools: [compared with other tools](compare.md).

## Where to go next

| Page | Answers |
|---|---|
| [Installation](installation.md) | What does it need, where do its files go, how do I upgrade or remove it? |
| [Using tg](usage.md) | How do I read, page, send, and use it from a script? |
| [Login, sessions and profiles](sessions.md) | How does login work, where are the keys, how do profiles work? |
| [The local store](archive.md) | What does the local store keep, and how do I fill, search, export and back it up? |
| [Groups you run](groups.md) | How do I keep up with a group I run? |
| [A Telegram bot](bot.md) | How do I run a Telegram bot from the command line? |
| [The MCP server](mcp.md) | How do I connect Claude Desktop, Cursor or another client without a terminal? |
| [ChatGPT, Codex or Claude in the browser](remote.md) | How do I reach it from ChatGPT or Claude in the browser? |
| [Recipes](recipes.md) | What can an agent do for me every day, and how do I run it on a schedule? |
| [All commands](commands.md) | Every command, option and exit code |
| [Configuration](configuration.md) | What can I set, and which value wins? |
| [Diagnostics: what a command did](diagnostics.md) | What did a command do, and what is never recorded? |
| [Troubleshooting](troubleshooting.md) | Something does not work: what the screen says, and what to do |
| [Security](security.md) | What reaches the disk and the network, and what stops a send going to the wrong place? |
| [Roadmap](roadmap.md) | What is coming next? |

[Search](search.md): `tg search all` covers messages, mail and notes at once; `search messages`
finds messages by words, people, dates, files and tags; [topic search](topic-search.md) finds
discussions by what they were about; the [search query language](query-language.md) is the full
reference.

[Message and author rankings](rankings.md): metrics, scores, saved queries and bounded evidence.
