# Running agents on tg-cli

Several Claude Code sessions work at once, each on a **lane** — one thread of work — in worktrees of
its own. Each is an ordinary Claude Code session the owner starts in the lane's folder; the guards in
`.claude/` keep it inside. This file is how.


## Start the lanes in parallel

1. `bin/check-agents` — every item as its label says (6c must fail).
2. `bin/lane <lane>` for each lane, then one terminal or zellij tab per lane:
   `cd .worktrees/<lane>/tg-cli && claude`, told which handoff to read.
3. Each lane works through its handoff alone: PR per item, merge on green, release its own work.
   Watch GitHub, not the terminals.

## Start a lane

```sh
bin/lane l1-reading     # .worktrees/l1-reading/{tg-cli,cli-messaging}: install, build, copy the login in
bin/trust-folder .worktrees/l1-reading/tg-cli .worktrees/l1-reading/cli-messaging   # from a terminal; or accept Claude's trust dialog
cd .worktrees/l1-reading/tg-cli && claude   # then point it at its handoff
bin/lane --remove l1-reading   # at the end; refuses while either worktree has uncommitted work
```

- **Worktrees live in `.worktrees/`** of the main checkout, which `.gitignore` excludes — without
  that, `git add -A` would stage each one as an embedded repository (chitchat, 2026-07-26). Checked:
  `git add -A --dry-run` lists nothing under it.
- **The login is copied, never repeated.** `scripts/seed-worktree.ts` copies the main checkout's
  session files and moves the app credentials keyring to keyring in-process; a `session start` per
  worktree would be a new device on the owner's account. The **message store is not copied**: a
  branch build may migrate it, so each lane starts with an empty one and reads fill it.
- **The skills are linked, never tracked.** `release`, `test-live` and `add-command` live in
  [`docs/dev/skills/`](skills/); `bin/lane` links them as `.claude/skills`, and any other checkout
  needs `ln -s ../docs/dev/skills .claude/skills` once, from a terminal. A tracked `.claude/skills`
  breaks every checkout that lacks it: inside the sandbox git cannot create it and refuses the
  switch ("Device or resource busy", measured 2026-10-01).
- **The two worktrees of a lane sit side by side**, so `bin/try-messaging` in the tg worktree packs
  the lane's cli-messaging and tries it, and `--undo` puts the release back. Never commit the
  `file:` path it writes.

## What an agent may do, and what stops it

| | How |
|---|---|
| **File edits only in `~/Projects/AI`** | [`.claude/hooks/writes-stay-inside.sh`](../../.claude/hooks/writes-stay-inside.sh) on Edit, Write and NotebookEdit, in every mode. It also refuses the guards themselves — `.claude/settings*.json` and `.claude/hooks/` in any checkout — so an agent cannot lift them; the owner changes those |
| **Shell commands in the same folders** | the Bash sandbox ([`.claude/settings.json`](../../.claude/settings.json) `sandbox`): writes only to `~/Projects/AI`, the pnpm and npm caches and `/tmp`. Local sockets are open (`allowAllUnixSockets`), so the keyring over D-Bus works — `gh` needs it. On Ubuntu 26.04 it needed [`bin/enable-sandbox`](../../bin/enable-sandbox) once, run by the owner |
| **No way out of the sandbox** | [`.claude/hooks/sandbox-stays-on.sh`](../../.claude/hooks/sandbox-stays-on.sh) refuses any Bash call that asks for `dangerouslyDisableSandbox` |
| **The one command outside it** | a **plain** `bin/tg …`, or a lane's own `.worktrees/<lane>/tg-cli/bin/tg …` (`excludedCommands`) — Telegram connects to IP addresses over raw TCP, which the sandbox has no route for. Matched as typed: `bin/tg … \| jq`, `bin/tg … > file` or `cd x && bin/tg …` run *inside* and fail with `ENETUNREACH`. Run it alone and read the tool's output. **A session's shell goes back to the folder it was started in before every command**, so a session started in the main checkout reaches a lane's build only by that path — measured 2026-09-29: the path ran, a `cd` into the lane did not carry over |
| **Git** | over SSH as always: `~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.npmrc` and `~/.pypirc` are in `denyRead`; only `~/.ssh/id_ed25519.pub` and `known_hosts` are re-opened — never the private key — and the SSH agent's socket signs commits and carries pushes (**measured**: a commit signed and a branch pushed from inside the sandbox). The sandbox masks `.git/config` in the working folder, so nothing may write it: **push without `-u`** (`git push origin <branch>`), **branch with `--no-track`** (`git switch -c feat/x --no-track origin/main`) — otherwise git fails halfway and leaves the checkout half switched |
| **Refused, in every mode** | `sudo` (`permissions.deny`) |
| **A change to the guards** | inside the sandbox git cannot replace `.claude/settings.json` or `.claude/hooks` (they are locked), so a checkout whose guards differ from the target stops halfway with "unable to unlink". After merging a guard change, the owner runs [`bin/lanes-take-settings`](../../bin/lanes-take-settings) from a terminal and restarts the lanes it names |
| **Measured 2026-09-29** by [`bin/check-agents`](../../bin/check-agents), headless, bypass | refused: shell writes to max-cli and `~`, `rm` of max-cli's `package.json`, a Write into max-cli, a Bash call asking to leave the sandbox, `sudo`; ran with no prompt: `rm` and `git branch -D` inside the project, `gh` (chained too), a signed commit and a push over SSH, `pnpm test`. **Not yet measured under these exact settings**: a plain `bin/tg` running outside the sandbox — it worked when the same exclusion came from `--settings`; [`bin/check-agents`](../../bin/check-agents), run from a terminal, settles it |
| **The owner's real account** | project rule 1: live checks read, or send only to Saved Messages through the worktree's `bin/tg` |

## Rules for a lane

- **Read your handoff first.** It says what to read, in order.
- **A branch and a PR per item**, off `origin/main`, in both repositories: `git switch -c feat/<item>
  --no-track origin/main`. The worktree's own `lane/<lane>` branch is only where it parks.
- **Rebase-merge your PR once CI is green**, then start the next item without waiting.
- **Release your own merged work** (NEED-10 → C): `git fetch`, `npm view @wirecat/cli-messaging
  version`, a `chore: release` PR raising it from what is really published, `bin/release`. Another
  lane may release first — `bin/release` refuses a version already on npm, so rebase, raise the
  number again, retry. Then tg: `pnpm add @wirecat/cli-messaging@<v>`.
- **A store migration number is taken before the migration is written**: cli-messaging's
  `docs/dev/COORDINATION.md` names the next free number; take it in a PR of its own, merged first.
- **Do not touch another lane's worktree or branch**, even to help.

## Where lanes collide

| Where | What to do |
|---|---|
| `cli-messaging/src/cli/messenger/messages-command.ts` | L2 and L3 both add to `messages`. Put a new subcommand in a file of its own and add one line to `messagesCommand`; rebase keeps both |
| `tg-cli/src/telegram/adapter.ts`, `map.ts` | every lane adds methods. Add yours as a group at the end of the class; a rebase conflict here is two groups, keep both |
| `MessengerAdapter` in `port.ts` | a new method is optional (`edit?`), asked for with `capability()`; the wrappers pass it through (`throughWrapper`) — no edit to `observed.ts`/`stored.ts` unless you want ids in the run or a save |
| `mcp/tools/<resource>.ts` | one file per resource; a new one is a file and a line in `tools.ts` |
| `README.md`, `docs/mcp.md`, `skills/tg-cli/SKILL.md` | lists; on a conflict keep both rows |
| the version in `package.json` | see releasing, above |
| `docs/dev/test-matrix.md` | generated — on a conflict run `pnpm test:matrix` and commit what it writes, never merge it by hand. A new command or option needs a test through `run()` or an entry in `scripts/test-matrix-untested.ts`, or CI fails ([TESTING.md](TESTING.md#every-command-and-option-has-a-test-or-a-reason)) |
| coverage (`pnpm test:coverage`) | every file keeps at least 50 % of its lines; a new adapter group comes with its cases in `src/telegram/adapter.test.ts` ([TESTING.md](TESTING.md#coverage-has-a-floor)) |
| Telegram's rate limits | three lanes reading live at once share one account's FLOOD_WAIT budget; keep live checks small (`--limit 3`) |
