# Limits, waits and background jobs

Use this page when a command waits, stops with a rate-limit error, or when you plan to download a lot
of history or run several commands at once. It explains how fast `tg` talks to Telegram, why it
sometimes waits, and what to do when it stops. By the end you will know which waits are normal, how
to change the pace, and when to try again.

Words this page uses:

- **Pace**: how many requests a profile may send to Telegram per minute. `tg` keeps every profile
  under it.
- **FLOOD_WAIT**: Telegram's answer "wait N seconds". If you keep asking during the wait, the waits
  grow.
- **Spam limit** (PEER_FLOOD): Telegram limits an account that writes to too many strangers.
- **Background job**: a download that keeps running after the command that started it ends.

`tg` waits out short waits from Telegram and stops when a wait is long.

## The pace: one allowance per profile

Every request `tg` makes for a profile — from a command, `tg mcp`, `tg serve` or a background job —
takes a turn in one pace for that profile:

- a burst of **20 requests** goes at once, so ordinary commands never wait;
- after the burst, **one request a second** (60 a minute), until the allowance refills while idle.

**Two commands at once share the same pace.** The turns are kept in a file under the state folder
(`pace/<profile>.json`), so two terminals, several `store fetch --background` jobs and `serve` line up
behind each other instead of each going at full speed. Running five fetches in parallel is no faster
than running them one after another, and it is no riskier either. Different profiles — different
Telegram accounts — have their own pace each.

A command that has to wait more than 5 seconds for its turn says so on stderr:

```text
waiting 12 s to keep this profile's pace with Telegram
```

Change the pace in the config file, or for one shell with an environment variable:

```json
{ "defaults": { "requestsPerMinute": 30 } }
```

```sh
TG_REQUESTS_PER_MINUTE=30 tg store fetch "Book club"
```

`0` turns the pace off. Do that only for a profile you can afford to have limited.

## When Telegram asks to wait

| How long Telegram asks | What `tg` does |
|---|---|
| up to 10 s, in a one-shot command | waits, at most twice, and says so on stderr |
| up to 2 min, in `serve` and `watch` | waits, at most three times |
| longer | stops with exit code `8` (`rate_limited`) and `retryAfterMs` in the JSON |

`store fetch` and `messages download --all` wait out a wait of up to 5 minutes between pages and go on;
a longer one stops the run, and the next run resumes from what was already saved. `store fetch --all`
also waits through short Telegram waits while listing chats.

**A wait holds the whole profile.** Until it ends, every process's next request waits past it, and one
that would have to wait more than 5 minutes fails at once with exit code `8` without asking Telegram.
`tg doctor` and `tg server status` list what is held under `flood`. Once the wait is over, nothing needs
to be done; `tg flood clear` lifts it early if you know Telegram no longer limits the account.

## Writes

- **30 sends an hour** per profile by default (`sendsPerHour`), counted across processes; see
  [the send guard](security.md#the-send-guard).
- **Spam limit (PEER_FLOOD)** and a frozen account hold every write; reads still work. See
  [troubleshooting](troubleshooting.md).
- A send that may or may not have arrived is never repeated by `tg`; see
  [when the outcome is unknown](usage.md#when-the-outcome-is-unknown).

## Bulk reads

- `store fetch`: pages of up to 100 messages, `--pause` between pages (1 s by default), 1000 messages a
  run unless `--limit` says otherwise. `--estimate` counts the requests first and sends none.
- `messages download --all`: one request per page and per file; files are paced too.
- `chats members list --all`, `chats list --all` and gap repair are paced the same way.

## Background jobs

`store fetch --background` and `store gaps repair --background` start a job that outlives the command:
one job per chat at a time, each in its own process, all on the profile's one pace. `tg store jobs
list` shows them, `tg store jobs cancel <job>` stops one after its current page. See
[downloading in the background](archive.md#in-the-background).

## Bots

A bot's own Bot API limits are separate from the account's. `tg` respects the `retry_after` Telegram
sends back; a long one ends the run. See [bots](bot.md).

## One login, several processes

Each `tg` process opens its own connection with the profile's login. Several at once work, but every
one of them is a request source for the same account — which is why they share the pace.
