# Diagnostics: what a command did

Use this page when a command fails, hangs or takes too long, and you want to see why. By the end you
can watch a command's requests as they happen, keep a record of a run, check your installation and
send a problem report that holds no message text.

A few words this page uses:

- A **run** is one call of `tg`, from start to exit.
- A **run record** is a folder that keeps what one run did: its command, its outcome and one line per
  request to Telegram. It never holds message text, names or titles.
- **`tg doctor`** checks the installation: the version, the login, the settings and the local store.
- A **problem report** is one JSON file made from `tg doctor` and a failed run. You attach it to an
  issue.

## What you can do

| Task | Command | Keeps anything? |
|---|---|---|
| See each request as it happens | `tg --trace …` | no, prints to stderr only |
| Keep a record of one run | `tg --record …` | yes, a run record |
| Find a failed run later | `tg runs list` | a failed run is kept by itself |
| Keep a record of every run | `tg config set record true` | yes, every run |
| Check the installation | `tg doctor`, `tg doctor --online` | no |
| Make a problem report | `tg doctor report create` | yes, one file you send |

## Show it: `--trace`

```sh
tg --trace messages list "Book club" --limit 5
```

`--trace` prints each operation on stderr as it happens: `→` what was asked, `←` what came back,
with ids, counts, duration and an error code if there was one.

```text
→ messages.list    chat -1001234567890
← messages.list    chat -1001234567890  118ms  5 messages
```

It also passes on the log lines of the Telegram library underneath. stdout does not change, so a pipe
still gets only data.

## Keep it: `--record`

```sh
tg --record chats list
tg runs list                 # recorded runs, newest first
tg runs show <run-id>        # one run: its outcome, and one line per operation
tg runs path <run-id>        # the folder that holds it
```

A run record is a folder under `runs/<day>/` in the state folder (`~/.local/share/tg-cli/runs/` on
Linux). Its name is the time and the command. It holds two files:

- `run.json` — the command, the profile, the version of `tg`, Node and the system, when it started
  and ended, how many requests it made, the outcome and the error code;
- `events.jsonl` — the same operations `--trace` shows, one per line.

## A failed run is always kept

When a command ends in an error, its run is kept even without `--record`. `run.json` then has
`"keptBecauseFailed": true`. This is true for every command and every error: a bad option, an
unknown command, a check before any work, and commands that never connect (`models`, `server`,
`upgrade`). A failure before the command started, such as a config file that does not load, is kept
as a run named `tg`. The record holds only the command's words, such as `messages list`, never what
followed them.

A fully successful run leaves no record unless you ask for one; partial runs are retained by default too. So a problem report always has a failure to
attach. `--no-record`, or `"record": false` in the settings, turns this off too.

Successful searches and statistics queries keep their own history, apart from run records. It has its
own controls: see [saved searches and history](search.md#saved-searches-and-history).

## When to record every run

```sh
tg config set record true          # this profile
tg --no-record chats list          # but not this one
```

Then every run is kept. By default a run that worked is not written until you ask. A messenger tool
that keeps a folder of whom you read and when would be a diary of your life that nobody asked for.

## How long it lives

**30 days**, or `keepRunsForDays` in the settings. Old runs are removed only when a new one is kept:
a tool that writes nothing has no reason to walk the folder. They are removed a whole day at a time,
by the folder's name, so nothing has to be opened to decide.

## What is never in a record

A run record and `--trace` carry an operation's name, ids, counts, durations and error codes. They
never carry:

- the text of a message, or a caption;
- a chat title, a person's name or a username;
- **what you typed as `<chat>`**, because a typed chat is often a title;
- a phone number, a login code, a 2FA password, the session or the app hash.

The same is true for a report made from a run.

## Check the installation: `tg doctor`

```sh
tg doctor              # connects to nothing
tg doctor --online     # also connects once and reads the account; sends nothing to Telegram
```

It shows the version, the runtime, the profile, the config file, whether a session and the app
credentials exist (never their values), whether `TG_*_DIR` moved the keyring entry, the local store
(its path, its version, and how many chats and messages it holds), the sends of the last hour, and
the runs kept.

- **`login`** is `not checked` without `--online`. A session file on disk does not mean Telegram
  still accepts it. With `--online` it is `ok` or `failed`, with a hint.
- **`files`** and **`telegram.session.files`** name each private file or folder that other users of
  this machine can read: the session, the store, their SQLite `-wal` and `-shm` files, the send
  journal and the runs folder. Each has the `chmod` command that fixes it. `doctor` never changes a
  file mode itself. Windows is not checked.
- **`online.clock`** (with `--online`) compares this computer's clock with Telegram's.
  `skewMs` is positive when this computer is ahead. It warns (`ok: false`) at 10 seconds. Telegram
  refuses a request stamped more than 30 seconds ahead of its own clock.
- **`online.standing`** (with `--online`) is `active`, `frozen`, `banned`, `deactivated` or
  `revoked`, or `unknown` when Telegram's answer could not tell. A frozen account can read but not
  write. Where Telegram gives them, it comes with the date the account was frozen, the date Telegram
  will delete it, and the appeal link. Logging in again does not reopen an account Telegram closed.
- **`flood`** lists the waits Telegram asked this profile to keep (`deadlines`) and a hold on its
  sends (`sendBlock`). `doctor` only reads, with one exception: **`doctor --online` writes the frozen
  hold.** When it reads the account as frozen, it holds sends until Telegram's date. When it reads it
  as active, it lifts that hold. It never lifts a hold for a spam limit — `tg flood clear` does that.

## A problem report

```sh
tg doctor report create                   # about the newest failed run
tg doctor report create --run <run-id>    # about this one
```

It writes a JSON file — what `tg doctor` shows plus the run — and says where to send it: a new issue
at [github.com/WireCatLabs/tg-cli/issues](https://github.com/WireCatLabs/tg-cli/issues/new). Read it before
you send it. It holds no message text, and every id appears as a label, not as Telegram's number.
[How to report a problem](troubleshooting.md#report-a-problem) lists everything the file holds.

If no failed run is kept, run the failing command again; its failure is kept by itself.

## What to do with runs

The records are JSON, so `jq` answers questions about them. `tg runs list --json` answers
`{ items, page, limit, hasMore }`, and `items` are the runs' `run.json`, newest first:

```sh
tg runs list --limit 100 --json | jq '[.items[] | select(.status == "failed") | {command, errorCode}]'
tg runs list --limit 100 --json | jq '[.items[] | .durationMs] | add / length'    # average duration
tg runs list --limit 100 --json | jq '[.items[] | select(.requests > 10) | {command, requests}]'
```

`tg runs show <run-id>` prints the same events as a table, without the fields every line repeats.
The whole file is in the folder `tg runs path <run-id>` prints.

## Next

- [What an error means and what to do](troubleshooting.md)
- [What reaches the disk at all](security.md)

## Search errors and partial runs

```sh
tg runs search --error-code rate_limited --json
tg runs search --status partial --since-time 2026-10-01 --json
```

`runs search` matches literal diagnostic text in metadata and safe events. Use `--operation`,
`--profile`, `--since-time`, `--limit` and `--page` to narrow it. Each page allows up to 100 runs and
each run returns at most 100 matched events, with `eventsTruncated` for additional events.
A failed batch item or history page creates `status: "partial"` with failed IDs, stages and
codes; message contents and provider error payloads are not copied into that record. Partial
records are kept by default unless recording was explicitly disabled. Search does not record itself.

MCP `tg_read` with `command: "runs search"` accepts these `arguments`: `query`, `status`, `error_code`, `operation`, `since_time`, `limit` and `page`.
It reads only the active profile's diagnostic runs, does not connect to Telegram and does not open
raw background-job logs. The original partial result contains recovery actions; diagnostic records
keep only safe identifiers and codes.
