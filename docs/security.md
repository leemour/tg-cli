# Security: what reaches the disk, and what stops a send

Read this page before you give an AI agent or a script access to your Telegram account through `tg`,
or when you want to know what `tg` keeps on your computer. It explains where your login is kept, what
`tg` writes to disk, which servers it talks to, what stops an unwanted send, and what to do if your
login leaks. By the end you can judge what someone with access to this computer, or an agent with
access to `tg`, could do.

Words this page uses:

- **Session**: the file that keeps you logged in to Telegram. Whoever has it can use your account.
- **Local store**: the database on your computer where `tg` and `max` keep the messages they have
  read. It is shared by both tools and is not encrypted.
- **Send guard**: the checks every change goes through before it reaches Telegram: permissions, the
  list of allowed recipients and the hourly send limit.

What every WireCat tool has in common — the local store, the send guard, what an agent may do over
MCP, other people's text on your screen, how to report a vulnerability — is on the
[shared security page](https://wirecat.dev/en/docs/security). This page covers what only Telegram adds.

## In short

- **The session file is your login.** Anyone who can read it uses your account, with no password
  and no code ([below](#where-the-login-lives)).
- **No command takes a secret as an argument** — not the app hash, the 2FA password, the login code
  or a phone number.
- **The send guard is the shared one**: `permissions`, the recipient list and `sendsPerHour` are
  checked by every command and MCP tool ([below](#the-send-guard)).
- **`tg` talks to Telegram, npm and my.telegram.org** — through your proxy when you set one —
  and to model download hosts or explicitly configured embedding/analysis endpoints ([below](#what-goes-over-the-network)).
- **It does not protect against someone with your user account on this machine**, or an agent
  allowed to change the settings.

## Where the login lives

| What | Where | Who can use it |
|---|---|---|
| the session | `sessions/<profile>.session` in the state directory, `0600` in a `0700` folder | anyone who can read the file: it is as good as your password |
| a bot history session | `bots/<profile>/mtproto-<bot-id>.session` in the state directory | anyone who can read it can use that bot authorization; protect it like the personal session |
| the app id and hash | the OS keyring; `credentials.json` (`0600`) beside the settings where there is no keyring | only together with a session |
| for CI | `TG_API_ID` and `TG_API_HASH` | the process that has them |
| a proxy password or MTProxy secret | the OS keyring, or `credentials.json`, one per profile and one for `--defaults`; the settings keep the URL without it | anyone who can use the proxy with it |

The session is Telegram's authorization key. Copying the file copies the login, with no password and
no code. Treat it like a password: never commit it, never attach it, never paste it.

**No command takes a secret as an argument.** The app hash and the 2FA password are asked without
echo; the login code and the phone number are asked, or read from stdin. An argument would be
visible to every process on the machine in `ps`, and would stay in your shell history.

**The settings file has no field for a secret**: not for the app hash, a phone number or a session.

## What reaches the disk

The local store, settings, run records, the send journal, the recipient list, speech models and
exports are described on the
[shared page](https://wirecat.dev/en/docs/security). The store is
shared with `max`, holds **the full text** of every message `tg` has read or sent, and is not
encrypted. Besides those, `tg` writes:

| What | Where | Holds | Mode |
|---|---|---|---|
| `inbox --new`'s point | `inbox/<profile>.json` | where the last check stopped | `0600` |
| background fetch jobs | the state directory | the chat, the progress, the outcome | `0600` |
| `serve`'s log and lock | `serve/<profile>.log`, or the systemd journal | what `serve` did | `0600` |
| a systemd unit or launchd agent — only `tg server install` | your user's unit folder | the command line that starts `serve` | `0644` |
| a backup — only `tg store backup` | the file you name | a copy of the whole store | `0600` |

The exact paths on this machine: `tg doctor`. The folders on each system:
[where files go](installation.md#where-files-go).

If the computer is lost, end the session from another device: in the Telegram app, Settings →
Devices, end the session that `tg` created. That makes the session file useless.

## The send guard

Every command and MCP tool that changes something in Telegram goes through the shared guard:
`permissions`, the recipient list, `sendsPerHour` (30 by default) and a journal without text. How
each check works, its exit code, and what it cannot hold: the
[shared page](https://wirecat.dev/en/docs/security).

```sh
tg config set permissions.messages readonly  # no change to messages from this profile
tg config set permissions.messages.send ask  # a question before each send
tg recipients add "Book club"                # the first add turns the list on
tg sends list                                # every attempt: sent, refused, failed, or not known
```

In Telegram, these count toward the hourly limit: a message, a forward, an edit, a pin that
notifies, each deleted message, a new group, and each person added to one. A reaction, a vote, a
quiet pin and marking a chat read do not. A forward is checked against the chat it goes to.

`TG_PROFILE_LOCK` pins the profile where an agent cannot change its own environment. `--file` and
`--photo` refuse known credential files and folders, `tg`'s own folders and the local store,
including symlink targets. Ordinary hidden working folders are allowed; MCP cannot override
these protected locations.

## Other people's text on your screen

Control characters, line breaks in names and look-alike chat titles are handled as the
[shared page](https://wirecat.dev/en/docs/security) describes. A
downloaded file's name also loses any leading dot.

## What goes over the network

- **Telegram**, over MTProto for personal-account commands, including files and photos. Bot commands
  use the HTTPS Bot API; `bot store fetch` uses a separate MTProto bot session for history.
- **npm**, once a day at a terminal, to see whether a newer `tg` exists, and on `tg upgrade`.
  `updateCheck` or `TG_NO_UPDATE_CHECK=1` turns it off ([configuration](configuration.md)).
- **my.telegram.org**, only during `tg setup` or `tg session start`: opened in your browser, or, with `--app auto`,
  driven by `tg`. An app `tg` creates there is titled `tg-cli`, with this project's GitHub page as its
  address.
- **Hugging Face and GitHub**, only when you run `tg models audio download` or `tg models text download`. A voice message never goes
  there: a local model runs on this machine.
- **Configured embedding endpoints** receive conversation text from `conversations embed` after consent,
  and query text from remote `search conversations`, including MCP searches. Local embeddings send no text.
- **Configured analysis endpoints** receive bounded message batches only with `conversations build --analyze --chat`,
  after consent scoped to account, chat and provider; ordinary build sends nothing.

There is no telemetry.

## Your own app, and Telegram's terms

`tg` is a Telegram client, as the apps on your phone and computer are. It signs in with your own app
from my.telegram.org and follows
[Telegram's API Terms of Service](https://core.telegram.org/api/terms). The hourly limit is on by
default, so an agent sends at the pace of a person.

## Logging in

`tg setup` and `tg session start` draw the QR code in the terminal. It stays in the scrollback, and Telegram renews
it while you wait, so an old one is useless. `--qr-file` writes it as a PNG readable only by you, and
removes the file when the login ends, whether it worked or not.

`--app auto` fills in my.telegram.org for you, without a browser: it asks your phone number and the
code the site sends you in Telegram, and nothing else.

Every login adds a device to the list in the Telegram app: Settings → Devices.

## Global installation changes

The global npm postinstall installs the bundled skill in the user's agent directories; on Windows
it adds the npm command folder to user PATH and removes only npm's generated `tg.ps1` shim for
this package. The `.cmd` launcher remains. Project installs and npx do not perform these changes.
`TG_INSTALL_AGENT=none` skips skill installation. The standalone Windows installer performs the
same preparation even when npm scripts are disabled. It does not change execution policy, machine
PATH, credentials or account state. Installation never logs in or reads chats.

## If the session leaked

1. In the Telegram app: Settings → Devices, end the session `tg` created. Or run `tg session end` on
   this machine, which ends it on Telegram's side and deletes the file.
2. Log in again: `tg session start`.

## Next

- [Shared security page](https://wirecat.dev/en/docs/security): the store, the guard, agents and
  MCP, reporting a vulnerability
- [Diagnostics](diagnostics.md): what exactly is recorded, and what never is
- [Login, sessions and profiles](sessions.md): the app, the keyring, profiles, logging out
- [MCP](mcp.md): what an agent can do over MCP, and what each level and flag changes
- [Permissions](permissions.md): how to set `permissions` and `sendsPerHour`
