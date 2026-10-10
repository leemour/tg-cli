# Installation

Read this page before the first run of `tg`, or when you move it to another computer, upgrade it or
remove it. At the end, `tg` is installed, you have checked that it starts, and you know where it keeps
its files. Logging in to Telegram is the next step, on its own page.

The words this page uses:

- **npm package**: the way `tg` is distributed. npm (or pnpm, or Bun) downloads it and puts the `tg`
  command on your computer. The package is **`@wirecat/tg-cli`**; the command it installs is **`tg`**.
- **Node** or **Bun**: the program that runs `tg`. Install one of them first.
- **PATH**: the list of folders your terminal looks in when you type a command. `tg` works by its
  bare name only when its folder is on PATH.
- **Keyring**: the password store of your operating system. `tg` keeps your Telegram app keys there.
- **Skill**: a short instruction file that tells your AI agent how to use `tg`.

Installation builds nothing: SQLite comes from the runtime itself, so there is no native module to
compile. It starts nothing in the background. A global npm installation can install the bundled
skill and, on Windows, repair the user PATH. It never logs in or reads chats.

## What it needs

- **Node 22.16+ (22.x) or 24+** with npm. The command also supports **Bun**.
- Linux, macOS or Windows.
- **Your own Telegram app** from [my.telegram.org](https://my.telegram.org/apps). `tg` asks for it at
  the first login and can register it for you ([your Telegram app](sessions.md#the-app-from-mytelegramorg)).

## Install

```sh
npm install -g --allow-scripts=@wirecat/tg-cli --foreground-scripts @wirecat/tg-cli
# The global install puts the skill in .agents and .claude. Then: tg setup

pnpm add -g @wirecat/tg-cli
bun add -g @wirecat/tg-cli
```

To try it without installing:

```sh
npx @wirecat/tg-cli --help
```

Check that it works:

```sh
tg --version
tg --help
tg doctor        # where its files are, and whether a login exists; connects to nothing
```

## First run

`tg --help` shows setup and the agent instructions right after installation. `tg skill show`
prints the skill and works before login. `tg commands --json` lists the commands and options.
These work even when the package manager skipped the installation scripts.

Run setup in a local terminal:

```sh
tg setup --agent codex
tg setup --help              # examples, login choices and Windows instructions
```

`--agent` chooses which agent gets the skill: `codex`, `cursor`, `claude`, `gemini`, `all` or
`none`. Without `--agent`, the command asks at a terminal; `--json` and runs without a terminal
choose `none`. Allow about five minutes for app registration, login, a check of the first five
chats and the skill. Downloading chat history is separate and can take longer: choose a chat and
the amount before you run the suggested `store fetch` command. Setup starts no background service.

`tg setup --app browser` opens the manual app registration instructions; `--method phone` logs in
by phone number instead of QR code. The code from my.telegram.org (for the app) and the code for
the account login are two separate steps. Running setup again checks your existing session and
does not log in again. If a login was interrupted or Telegram ended the session, finish
`tg session start` first and then run setup again. See [login, sessions and profiles](sessions.md).

Without a global installation, use `npm exec --yes --package=@wirecat/tg-cli -- tg setup --agent codex`.
Setup then suggests the next commands in the same form.

### Windows: one install command

Run this in PowerShell with Node.js 22.16+ or 24+ installed:

```powershell
& ([scriptblock]::Create((Invoke-RestMethod 'https://wirecat.dev/install.ps1'))) -Tool tg -Agent all
```

The installer installs the npm package, keeps the existing user PATH entries, adds the npm command
folder once, updates the PATH of the current PowerShell and installs the skill. It checks that bare
`tg` starts. `-Agent codex|cursor|claude|gemini|all|none` selects where the skill goes; the default
`all` installs it in both supported folders. Running it again refreshes the skill and does not add
PATH twice. It also does these steps when npm installation scripts are turned off.

PowerShell's execution policy is not changed. The installer removes only npm's generated `tg.ps1`
shim for this package and keeps `tg.cmd`, so bare `tg` works under a restricted policy too. An
unrelated script with that name is left alone and reported as a conflict.

A global npm installation also repairs the saved Windows PATH and installs the skill, when npm
allows its installation script:

```powershell
npm.cmd install -g --allow-scripts=@wirecat/tg-cli --foreground-scripts @wirecat/tg-cli
```

Newer npm versions skip installation scripts unless you allow them, and `--ignore-scripts` skips
this one too. npm cannot change the PATH of the terminal that started it, so open a new terminal
after an npm installation. The PowerShell installer above updates the current terminal as well.

The installation script runs only for a global npm installation, never for a project dependency or
npx. `TG_INSTALL_AGENT=codex|cursor|claude|gemini|all|none` selects the skill; `none` turns it off.
No separate Windows program is needed.

The first commands to read your chats are in [logging in and the first commands](usage.md#log-in).

## From source

For working on the code, or for a version that is not released yet:

```sh
git clone https://github.com/WireCatLabs/tg-cli.git
cd tg-cli
pnpm install
pnpm build
```

In a checkout, `bin/tg` keeps its config, login and store under `.tg/` in the checkout, never in your
real profile. `node dist/bin/tg.js` uses the real directories below.

## Where files go

Three directories follow the conventions of the operating system, and two more are shared with
other tools:

| What | Linux | macOS | Windows |
|---|---|---|---|
| settings | `~/.config/tg-cli/` | `~/Library/Preferences/tg-cli/` | `%APPDATA%\tg-cli\Config\` |
| state | `~/.local/share/tg-cli/` | `~/Library/Application Support/tg-cli/` | `%LOCALAPPDATA%\tg-cli\Data\` |
| cache | `~/.cache/tg-cli/` | `~/Library/Caches/tg-cli/` | `%LOCALAPPDATA%\tg-cli\Cache\` |
| the local store | `~/.local/share/cli-messaging/wirecat.db` | under `~/Library/Application Support/cli-messaging/` | under `%LOCALAPPDATA%\cli-messaging\Data\` |
| speech models | `~/.cache/cli-common/models/audio/` | under `~/Library/Caches/cli-common/` | under `%LOCALAPPDATA%\cli-common\Cache\` |

- **settings** hold `config.json`, and `credentials.json` only on a machine with no keyring.
- **state** holds the login (`sessions/<profile>.session`), recorded runs (`runs/`), the journal of
  sends (`sends/`), the list of allowed recipients (`profiles/`), the saved point of `inbox --new`
  (`inbox/`), background fetch jobs, and the log and lock of `serve`.
- **the local store** is shared with other messenger tools built on the same library, such as
  [max-cli](https://github.com/WireCatLabs/max-cli). [The local store](archive.md) page describes it.
- **speech models** are downloaded only when you ask (`tg models audio download`), for
  `messages transcribe --local`.

`tg doctor` prints the exact paths on this machine.

Each directory can be moved with a variable: `TG_CONFIG_DIR`, `TG_STATE_DIR`, `TG_CACHE_DIR`,
`MESSAGING_STORE` (the store file itself) and `CLI_COMMON_CACHE_DIR` (the models).

> ⚠ **`TG_CONFIG_DIR`, `TG_STATE_DIR` and `TG_CACHE_DIR` also move the keyring entry.** A login made
> with one of them set is invisible without it, and the other way round: the command answers "no
> session" although you are logged in. Set them always, or never. `tg config show` says when one is
> set.

## Shell completion

Tab completes commands, options and their values. Where a chat is expected, it offers chats from the
local store. Add one line to your shell's startup file:

```sh
echo 'source <(tg complete zsh)' >> ~/.zshrc      # zsh
echo 'source <(tg complete bash)' >> ~/.bashrc    # bash
tg complete fish | source                         # fish, in config.fish
```

PowerShell: `tg complete powershell | Out-String | Invoke-Expression` in your profile.

A Tab **never connects to Telegram**. With no local store yet, only commands and options complete.

## Upgrade

```sh
tg upgrade            # with the package manager that installed tg: npm, pnpm or bun
tg upgrade --check    # only say whether a newer version exists; installs nothing
```

After an update, `tg upgrade` restarts each background `serve` that `tg` started, so the server does
not keep running the old code. A `serve` you started by hand is not restarted: `tg` names it on
stderr with the command that restarts it. `tg upgrade` never runs by itself.

**From 0.44.1 or older, the local archive starts again.** The store is a new file, `wirecat.db`;
the old `messages.db` stays where it was, untouched. Run `tg store fetch --all` to bring messages
back. The login stays ([the store and other versions](archive.md#the-store-and-other-versions)).

### Upgrade JSON result

`tg upgrade --check --json` reports the current and the available version without installing.
The result has `current`, `latest`, `newer`, `installer`, `command`, `updated` and `restarted`.
`restarted` lists the profiles whose servers were restarted after the update; it is an empty list
after a check, when there is no newer version, or when no server was restarted.

Once a day, at a terminal, `tg` says on stderr that a newer version is on npm. It never says so with
`--json`, into a pipe, with `--quiet` or in CI. To turn it off: `tg config set updateCheck false
--defaults`, or `TG_NO_UPDATE_CHECK=1`.

From source: `git pull && pnpm install && pnpm build`. From npx: `npx @wirecat/tg-cli@latest`.

## Uninstall

Removing the command leaves your data. Log out first, while `tg` is still there. `support` below is
an example name of a bot profile; repeat that line for each bot you connected.

```sh
tg server uninstall                  # if you installed the background unit; stop it first
tg session end                       # logs out on Telegram's side and deletes the session file
tg support bot auth remove           # forgets the token of the bot profile "support"
npm uninstall -g @wirecat/tg-cli
rm -rf ~/.config/tg-cli ~/.local/share/tg-cli ~/.cache/tg-cli
```

`tg session end` does not remove the app id and hash from the keyring. They sit under the service
`tg-cli`; remove that entry with your system's keyring tool if you want them gone.

The local store is shared with other tools. Delete `~/.local/share/cli-messaging/` only if nothing
else uses it: it holds the messages every one of them has read.

## Next

[Log in and run the first commands](usage.md#log-in).
