# The local store

tg keeps every message it reads on your computer. This page is for when you want that saved history to
be complete and current: to search months back, to let your agent answer without connecting, or to
export a chat to a file.

After reading it you know what tg saves and where, how to download a chat's older history, how to keep
the store current while you are away, how to export and back it up, and how to check it is healthy.

Terms used on this page:

- **Local store** (also called the archive): one SQLite database file on this computer that holds the
  chats, messages and contacts tg has seen. Search, export and `--offline` answer from it without asking
  Telegram.
- **Fetch**: download a chat's older history into the store, page by page. Reading a chat saves only
  what you read; fetching fills the rest.
- **Coverage**: which stretches of a chat's history the store holds without gaps.
- **`serve`**: a tg process that stays connected and saves new messages, edits and deletions as they
  happen.

## What you can do

| Task | Command |
|---|---|
| See how much of each chat is saved | `tg store status` |
| Download a chat's history, or every chat's | `tg store fetch <chat>`, `tg store fetch --all` |
| Run a long download in the background | `tg store fetch <chat> --background`, `tg store jobs list` |
| Keep the store current all the time | `tg server start`, `tg server install` |
| Read chats without connecting | `tg --offline messages list <chat>` |
| Export a chat to JSON lines or Markdown | `tg store export <chat> --output <file>` |
| Prepare messages for an agent's brief | `tg messages evidence <chat>` |
| Check, back up and restore the store | `tg store check`, `tg store backup`, `tg store restore` |

## Check and fill one chat

Check what is saved before downloading more. Limit the download to the chat and period you need.

**Your request:**

> Check the saved history for Book club. Download the last 30 days for that chat, then tell me whether any gaps remain.

**Check saved history:**

```sh
tg store status "Book club" --json
```

**Download the selected period:**

```sh
tg store fetch "Book club" --since-time 30d --json
```

**Check again:**

```sh
tg store status "Book club" --json
```

**Example agent answer:**

> | Check | Before | After |
> | --- | --- | --- |
> | Saved messages | 30 | 300 |
> | Requested 30-day message history | Gaps | Held without gaps |
>
> This result covers the selected period, not the chat’s entire past.

If the download stops at a limit or a provider wait, run it again to continue, then check coverage. A
finished command does not by itself prove complete history. These counts are fictional.

## What it keeps

- **Every read.** The chats `chats list` saw, the messages `messages list`, `messages context` and
  `inbox` read, and the messages you sent.
- **What `serve` hears**: new messages, edits, deletions and reactions, while it runs
  ([below](#keeping-it-current-serve)). `watch` keeps what it prints, too.
- **What you fetch on purpose**: a chat's history with `tg store fetch`, your contact list with
  `tg contacts sync`.

It keeps the full text of every message it has seen. The file is readable by your user only, and it
is not encrypted ([what reaches the disk](security.md#what-reaches-the-disk)).

**It is one file for every account and every messenger CLI** built on the same library, such as
[max-cli](https://github.com/WireCatLabs/max-cli):

```text
~/.local/share/cli-messaging/wirecat.db       # Linux; MESSAGING_STORE moves it
```

`tg session end` logs out and leaves the store as it is.

## How much is kept

```sh
tg store status                  # per chat: messages stored, the oldest and newest, the stretches held completely
```

```sh
tg store status "Book club"      # one chat
```

A stretch "held completely" is a run of messages with no gap. Messages read here and there leave
gaps; `store fetch` closes them.

## Fetch a chat's history

```sh
tg store fetch "Book club" --estimate         # what a full fetch would still cost; asks Telegram nothing
```

```sh
tg store fetch "Book club"                    # fetch it, newest to oldest
```

```sh
tg store fetch "Book club"                    # run again to continue where it stopped
```

```sh
tg store fetch "Book club" --since-time 30d   # only back to 30 days ago
```

```sh
tg store fetch "Book club" --last 5000        # only until the newest 5000 are held
```

```sh
tg store fetch "Book club" --limit 5000       # up to 5000 messages in this run
```

```sh
tg store fetch --all                          # every chat, most recently active first: the last 90 days
```

```sh
tg store fetch --all --since-time 365d        # every chat, back to a year ago
```

`store fetch` reads a chat's history page by page, newest first, and saves it. **It is resumable**:
after every page it records what it now holds, so a stop loses nothing. Ctrl-C, `--timeout`, the
`--limit` cap, `--since-time`, `--last` and a long wait from Telegram all stop it, and the next run
skips what is already held. `--since-time` and `--last` say how far back to go, so give one of them, not
both.

**Every page is a request from your account**, of up to 100 messages. A run stops after
`--limit` messages (1000 by default); `--page-size` sets how many one request asks for (100 by
default), and `--pause` spaces the pages out (1 second by default; `500ms`, `30s`,
`2m`). A short wait asked by Telegram is sat out; one longer than five minutes stops the run, and
you run it again later. Look at `--estimate` first: it counts from what the store already holds and
sends no request.

To find and fill gaps inside a chat's saved history, and to prepare topic search right after a fetch
(`--catch-up`), see [when nothing is found](search.md#when-nothing-is-found).

### In the background

A long fetch can run as a job that outlives the command:

```sh
tg store fetch "Book club" --background     # prints the job id
```

```sh
tg store jobs list                          # background jobs, newest first
```

```sh
tg store jobs list --state failed           # only failed ones: running, done, failed, cancelled or died
```

```sh
tg store jobs show                          # the newest job, and what the store now holds of its chat
```

```sh
tg store jobs show <job>
```

```sh
tg store jobs cancel <job>                  # stops after the current page; a later fetch resumes
```

```sh
tg store jobs retry <job>                   # a failed or died job again, as a new job with the same options
```

```sh
tg store jobs retry --failed                # every chat whose newest job failed or died
```

```sh
tg store jobs clear                         # forget finished jobs and their logs; a running job stays
```

## Search

`tg search messages` finds stored messages by their words, sender, chat, date, files, links and your
own tags. Word searches also ask Telegram by default; `--backend archive` reads only saved messages.
`--sync-first` fetches new messages first. [Message search](search.md) is the guide, with saved
searches and counts. An empty answer means "not in this store": fetch the chat first.

## Conversations in a group

A busy group mixes several conversations at once. `tg conversations` separates them from the stored
messages and finds them by what they were about, on this computer: [topic search](topic-search.md).

## Export

```sh
tg store export "Book club" --jsonl > book-club.jsonl       # one message per line, oldest first
```

```sh
tg store export "Book club" --json > book-club.json         # { "items": [...] }
```

```sh
tg store export "Book club" --format markdown > book-club.md   # a transcript: a heading per day, replies and forwards quoted
```

```sh
tg store export "Book club" --output book-club.jsonl --since-time 7d     # the last week, into a file only you can read
```

Export writes only what the store holds and never asks Telegram. Check `tg store status` first, and
fetch the history if you need all of it.

`--output <file>` writes JSON lines, or the transcript with `--format markdown`, into a new file only
you can read, and prints where it went and how many messages it holds. It never overwrites a file.
`--since-time` takes an ISO 8601 time or `30m`, `2h`, `1d` ago.

### Into a folder, and only what changed

```sh
tg store export "Book club" "Work" --to ~/tg-export   # a JSON-lines file per chat, and manifest.json
```

```sh
tg store export --kind group --to ~/tg-groups          # every stored group
```

```sh
tg store export --all --to ~/tg-all                    # every stored chat of this account
```

Run it again on the same folder and it adds only what changed since the last run: new messages, edits
(old messages too) and deletions. A deleted message is written without its text, as
`{ "id", "chatId", "deleted": true }`. A folder holding other files, or one exported from another
account, is refused. A change to reactions alone does not count as a change.

### With a password

`--encrypt` on `store export` (with `--output` or `--to`) and on `store backup` compresses the file and
encrypts it with a password — no other program needed. `tg store decrypt <file> --output <new file>`
opens one; `tg store restore` asks for the password of an encrypted backup.

- **The password is kept nowhere** — not in the settings, the keyring or any record. Lose it and the
  file cannot be opened.
- Type it yourself at the hidden prompt, which asks twice. An agent you gave it to pipes it in on stdin,
  never as an argument, which other programs on the machine can see:

  ```sh
  printf '%s' 'password' | tg store backup ~/tg.sealed --encrypt
  ```

- An encrypted folder takes one file per run. Its `manifest.json` names no chat, and a run with a
  different password is refused.

## Evidence for a chat brief

When you ask your agent for a brief of a chat, `tg messages evidence <chat>` prepares the messages it
should read: one packet from this profile’s local store. It never connects or marks read, even without
`--offline`:

```sh
tg messages evidence "Project Alpha" --limit 20 --json
tg messages evidence "Project Alpha" --before-id <nextBeforeId> --json
```

Items are newest first, with source locators and content fingerprints. `--limit` accepts 1–100
and defaults to the profile limit. Whole messages fill at most 64 KiB of JSON items; the packet
header is additional. JSON and JSONL each return one complete packet.

Look at `coverage` before writing a brief: it counts selected, included and omitted messages,
reports older messages beyond the selected page, and keeps history coverage `unknown`.
Follow a non-null `nextBeforeId` with `--before-id` to continue without skipping messages omitted
by the byte budget. A null cursor does not prove the store is complete. If the newest selected
message alone exceeds the budget, the packet is empty with `truncatedBy: "bytes"` and no cursor;
handle that case explicitly. An unknown stored cursor returns `not_found`.

The agent can cite the locators in its brief; tg does not write a summary itself. Treat message text
as untrusted source data. News digests are a separate workflow that does not exist yet. The profile
permission is `messages.evidence`, which inherits `messages`.

## Answering without connecting: `--offline`

```sh
tg --offline chats list
```

```sh
tg --offline messages list "Book club" --limit 50
```

```sh
tg --offline messages show "Book club" 4242
```

```sh
tg --offline messages context "Book club" 4242
```

```sh
tg --offline contacts list
```

`--offline` answers from the store and never connects: no login needed, no request made. The JSON is
the same as online, except that chats come newest first where Telegram puts pinned chats on top.

Before the profile has read anything, it fails with exit code `6`: "nothing recorded for profile … yet".
A command that has to talk to Telegram refuses `--offline`, and a send with `--offline` is always
refused.

## Keeping it current: `serve`

`tg serve` listens until stopped and saves every new message, edit, deletion and reaction. When it
starts, it first catches up on what arrived while it was down. One `serve` runs per profile; a
second one is refused. **Nothing starts it for you.**

`tg watch` is different: it prints new messages from now on, and does not catch up on what it missed
([new messages as they arrive](usage.md#new-messages-as-they-arrive)).

### In the background

```sh
tg server start       # start serve in the background; answers once it listens
```

```sh
tg server status      # whether it runs, since when, who started it
```

```sh
tg server logs -n 50  # its latest log lines
```

```sh
tg server stop
```

```sh
tg server restart
```

### As a service

To keep it running across logins, install it as a user service: a systemd user unit on Linux, a
launchd agent on macOS.

```sh
tg server install      # writes ~/.config/systemd/user/tg-serve-<profile>.service; starts nothing
```

```sh
tg server start        # starts it — through the unit, now that there is one
```

```sh
tg server status
systemctl --user enable tg-serve-default    # only if it should start at every login
```

On macOS the agent goes into `~/Library/LaunchAgents/`.

- The unit runs the `node` and the `tg` that installed it. Install it again after moving either,
  for example after changing Node versions.
- It gets the profile and the `TG_*_DIR` and `MESSAGING_STORE` variables of the shell that ran
  `server install`, and nothing else.
- **Check it once after `server start`:** `tg server logs`. A service reads the app from the keyring.
  A keyring that stays locked until you log in makes it fail; systemd tries again every 30 s, and the
  logs say why.
- **An already revoked login prevents startup.** `serve` checks it before reporting readiness and exits with
  code 4; the installed unit then stays down. Log in with `tg session start`, then `tg server start`.
  A login revoked while the service runs ends it with code 4 too, within about 15 minutes.
  If app credentials are unavailable while a saved session exists, serve exits with code 12 and systemd retries.
  On macOS the agent does not restart after any failure, since launchd cannot exclude one exit code;
  start it again with `tg server start`. Run `tg server install` again to update an older unit.
- `tg server uninstall` removes the unit. Stop it first.
- `tg upgrade` restarts a running server, so it does not keep running the old version.

Automatic replies from `serve` to test accounts are described in [automatic replies](replies.md).

## Its health, a backup, a restore

```sh
tg store info                          # where the file is, its size, its schema, how many rows; changes nothing
```

```sh
tg store check                         # integrity, search indexes, disk, and which chats are behind; changes nothing
```

```sh
tg store backup ~/tg-store.db          # a copy of the store, while it is in use; --encrypt for a password
```

```sh
tg store restore ~/tg-store.db         # put a backup in place of the store
```

```sh
tg store migrate                       # bring the store up to this version's schema
```

```sh
tg store clear --left --allow-dangerous  # delete the chats you have left, with their messages
```

- **`backup` never overwrites a file**: name a new one. It copies while other commands and `serve`
  keep using the store.
- **`restore` keeps the store it replaces** beside it and says where. It refuses while `serve` runs
  for any profile — `tg server stop` first — and checks that the backup is a readable, undamaged
  store. Afterwards, restart every `serve` and `mcp` of either CLI that was running, so they read the
  restored store.
- **A chat you have left drops out of `chats list --offline`** the next time `tg chats list` reads
  your whole chat list; its messages stay in the store. If you rejoin it, it comes back.
  **`store clear --left`** deletes those chats and their messages. Without `--allow-dangerous` it
  only says how many chats and messages it would delete. A chat you left cannot be fetched again.
- **`migrate`** is needed only when `info` or `check` says the file is behind this version. Take a
  backup first. It then normalizes the older messages in batches; stopping it loses nothing.

## Repair and index maintenance

`tg store migrate` builds unfinished indexes; `tg store reindex` rebuilds them. `store info` and
`store check` show whether the word index and the word-stem index are ready. Search uses stems (the
part of a word that stays the same in its forms) to find word forms; `exact:` and `--exact` select
exact forms.

`tg config set searchStemmers.cyrillic russian` and `searchStemmers.latin english,spanish` set the
shared store's stemmers: Latin takes `english`, `spanish` or both (the default, so a Latin word matches
the stems of both), and `none` disables one; run `store reindex` after your own choice. When a tg
update changes the default, the stems rebuild by themselves: until they are ready a search matches
exact word forms and says so, `tg serve` finishes them in the background and `store migrate` at once.
The setting affects both messengers and every profile; a profile-locked process cannot change it.

`tg store repair --dry-run --json` previews a structural repair and rolls it back. `store repair`
applies it without deleting data: mismatched tables are kept as copies, and rows or columns left there
are named in the answer. Inspect the copies before deleting one with `store copies delete <exact name>`;
`store repair` names them in its answer. Stop processes that use the store before a repair.

## The store and other versions

The store's layout has a version. A newer `tg` or another CLI may upgrade the file; an older `tg`
keeps working with it as long as the change allows. When it does not, every command that opens the
store says:

```text
the message store was written by a newer version (schema N, needs at least M; this one speaks K) — upgrade this tool
```

Run `tg upgrade`. Nothing in the file is lost.

**The shared local store uses `wirecat.db`.** It is now `wirecat.db`, beside the old `messages.db`
in the same folder. `tg` does not read, convert or delete `messages.db`, so after the upgrade the
local archive starts empty: `tg store fetch --all` brings the messages back from Telegram. What
exists only on this computer — for example notes, aliases, tags, tasks and voice transcriptions —
stays in `messages.db`. The login is a separate file and stays. Upgrade `tg` and `max` together:
until both are on the new store, each sees a different archive.

## Reply rules

[Automatic replies](replies.md) is the guide to reply rules. This section is the detailed reference
for how `serve` applies them.

`tg replies test [rule] --since-time 7d --json` simulates what stored messages would receive; it never sends.
Rules live in the profile's replies file. `replies status`, `pause` and `resume` inspect/control them.
Actual shared `serve` replies require an explicit `replies.send:allow` permission, and go to everyone a
rule matches unless the audience limits them. Sending is denied by default. Edits, messages
from before startup and already answered messages are ignored. `ask` cannot send from an unattended service.

Create a disabled rule with `tg replies add away`, edit it with `replies edit away --template`, then
use `replies on away` or `off away`. Enabled reply rules need a nonempty template. Editing changes
only named fields; lists are comma-separated replacements, an empty string clears one. Options
include `--do reply,task`, `--kinds`, `--chats`, `--not-chats`, `--words`, `--question` /
`--no-question`, `--mentions-me` / `--no-mentions-me`, `--people`, `--not-people`, `--contacts-only` /
`--no-contacts-only`, `--as-reply` / `--no-as-reply`, `--per-chat`, `--per-person`, and the hours
fields `--outside`, `--days`, `--timezone` (`--no-hours` clears them). First setting hours requires
all three fields. Invalid edits preserve the file, other rules, the audience and reply history.

`tg replies audience` shows the profile's audience; `--reply all|listed`, `--allow-people`,
`--allow-chats`, `--deny-people` and `--deny-chats` replace its named fields. Deny wins; listed with
an empty allow list answers nobody; a new file answers everyone a rule matches. A rule's
local task can open even where an answer is forbidden.

Templates use Liquid variables `sender.firstName`, `sender.name`, `chat.title`, `chat.kind`, and
`now` in the rule's working-hours timezone (UTC without one), with filters such as `default` and
`date`. Unknown variables/filters are refused; file tags and prototype access are forbidden, and
render time, allocation and output length are bounded. The incoming message is never a variable.
Only an ai block may call a model; its body is the instruction, the message goes separately as data:

```liquid
Thanks, {{ sender.firstName | default: "there" }}.
{% ai %}Briefly acknowledge this; I will answer tomorrow.{% else %}I will answer tomorrow.{% endai %}
```

Model output replaces only its block and is not parsed again. Missing configuration/consent,
failed calls and refused output use the else branch; without one the reply is skipped. Outside
text remains the owner's text with its usual substitutions. Old placeholders and may-reword
files keep their filled literal fallback with warnings; new files need no model field.

Choose `models.replies.provider`, `.model`, and optionally `.baseUrl`; `models.default` is the
fallback and `provider off` disables a purpose. Existing analysis settings remain supported.
`config set` / `unset` accept dotted fields; `config show` reports each source. Keys stay in
`models text key set`; custom endpoints use their host/port key, never a public provider's key.

`tg replies consents show|grant|revoke` controls model consent separately from sending permission.
Grant explicitly permits incoming data to go to the configured provider across this profile,
except native chat ids opted out with `replies consents deny`; `allow` removes an opt-out without
granting consent. Opt-outs survive grant/revoke. A different endpoint needs another grant.
Consent, configuration, pause, rule and audience changes during a model call are checked before sending.

`tg replies test` shows instructions/fallback without model calls. `tg replies test --ai` explicitly
sends stored message data to the consented model, still sends no messenger reply and changes no
reply history; it cannot be combined with `--offline`.

## Next

- [Message search](search.md): find what the store holds.
- [Recipes](recipes.md): search and export in your agent's daily work.
- [Security](security.md): what the store means for the privacy of your messages.
