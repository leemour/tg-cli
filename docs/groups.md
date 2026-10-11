# Groups you run

Use this page when you are an admin of a Telegram group and want help keeping it in order. You
will learn how to find questions nobody answered, see who joined and who added them, sum up a week,
remove spam by your own rules and keep a history of the member list. Reading marks nothing read,
so checking on a group does not tell its members you looked.

Everything here works from your personal account, in groups where you are an admin. Some words on
this page:

- **An admin** is a member with rights to manage the group. Some commands count only your answers
  and the admins' answers.
- **The local store** is the copy of messages that `tg` keeps on this computer. Reports and tasks
  use it, so they see only what was downloaded.
- **A task** is something that waits on you, such as a question nobody answered. `tg` opens and
  closes tasks in the local store.
- **Rules** say what `tg chats moderate` looks for, such as links or flooding, and what it may do.
- **A member snapshot** is the member list saved on one day. Snapshots over time show who joined
  and who left.

## What you can do

| Task | Command |
| --- | --- |
| Find questions that wait for an answer | `tg review --unanswered` |
| See who joined, left, was added or removed | `tg chats events` |
| Sum up a week: decisions, promises, open questions | `tg review --since-time 7d` |
| Keep a list of what waits on you | `tg tasks list` |
| Remove spam by your own rules | `tg chats rules set`, `tg chats moderate` |
| Replace a leaked invite link | `tg chats link reset` |
| Let people in, or turn them away | `tg chats requests list\|accept\|decline` |
| See the week's activity and Telegram's own statistics | `tg stats chats show`, `tg stats chats official` |
| Save the member list every day | `tg chats members fetch --track` |
| Find members that look like bots or spammers | `tg chats members audit` |

The full list of group commands is [below](#what-there-is). Details of each command are in
[groups and channels in the usage guide](usage.md#groups-and-channels); every option is in the
[command reference](commands.md).

## With an agent

Your AI agent (for example Claude Code, Codex, Cursor or Gemini CLI) can run these checks for you.
An agent with a terminal needs the [tg skill](recipes.md#once-first); an agent in an app without a
terminal needs the [MCP server](mcp.md). Below: what you say, what the agent runs, and what you get
back.

The names, messages and results below are fictional. Commands are separate from the answer: the agent reads the data and presents it for you.

### An admin's morning: who is waiting for an answer

Start with questions that have been waiting for you or the admins.

**Your request:**

> What in Hiking has been waiting for an answer for more than four hours?

**Command:**

```sh
tg review --chat "Hiking" --unanswered 4h --json
```

**Example agent answer:**

> **3 questions are waiting for an answer.**
>
> | Person | Question | Waiting |
> | --- | --- | --- |
> | Lena | What time do we leave on Saturday? | 6 hours |
> | Sam | Are the tents shared? | 12 hours |
> | Ira | Who will bring the cooking pot? | 15 hours |
>
> Open a question to check the surrounding conversation.

These are `review` rules: a question mark outside a link, or a reply to you/an admin, can open a question. Your or an admin’s reply or next message can close it. The [statistics report](rankings.md) counts linked direct answers and can give a different result. If Telegram does not expose the admin list, only your answers count and the result says so.

### Newcomers this week

Review joining events. A new account is a reason to check, not proof of spam.

**Your request:**

> Who joined Hiking this week? Show anyone worth reviewing.

**Command:**

```sh
tg chats events "Hiking" --type join,add --since-time 7d --json
```

**Example agent answer:**

> | Newcomer | How they joined |
> | --- | --- |
> | Kate | Added by Lena |
> | Oleg | Joined himself |
>
> Review Oleg’s available profile information before drawing conclusions. Account age alone is not grounds for removal.

Events cover available history only. The current member list can be checked separately.

### A link that leaked

Replace an invite link only when you have asked for that change.

**Your request:**

> The Hiking invite link leaked. Replace it and let only admins add people.

**Replace the link:**

```sh
tg chats link reset "Hiking" --json
```

**Restrict member additions:**

```sh
tg chats update "Hiking" --only-admins-add on --json
```

**Example agent answer:**

> | Setting | Result |
> | --- | --- |
> | Previous invite link | Replaced |
> | Who can add members | Admins only |
>
> The new private link is in the requested result; share it only with intended recipients.

These commands change the group. The example request authorises both changes; a request to inspect a link would not.

### Spam cleanup with your approval

First see what the rules suggest, without any action.

**Your request:**

> Check Hiking for spam. Do not delete anything yet; show the suggestions.

**Command:**

```sh
tg chats moderate "Hiking" --dry-run --json
```

**Example agent answer:**

> **Suggested action:** delete a message with an invite link.
>
> | Found | Suggestion | Status |
> | --- | --- | --- |
> | Invite link | Delete the message | Preview only |
>
> Nothing was deleted. Confirm the exact message if you want the action applied.

Real actions need your request and the profile's permissions. A preview does not give permission to delete.

### A weekly report

Ask for a short recap of decisions, commitments and open questions.

**Your request:**

> Summarise the week in Hiking.

**Command:**

```sh
tg review --chat "Hiking" --since-time 7d --json
```

**Example agent answer:**

> **Decided:** leave at 7:00 from the station.
>
> **Committed:**
>
> - Lena — food.
> - Sam — tents.
>
> **Still open:** who will bring the cooking pot.
>
> I can show the source messages if you want to verify the recap.

### On a schedule

No agent is needed for a list of open questions: it is an ordinary command.

```cron
0 9,21 * * * tg review --chat "Hiking" --unanswered --json >> ~/hiking-open.jsonl 2>> ~/tg-cron.log
```

cron has no terminal and often no `XDG_RUNTIME_DIR`, without which `tg` cannot reach the keyring:
see [running on a schedule](recipes.md#running-on-a-schedule).

## What there is

| Command | What it does |
|---|---|
| `tg review --chat <chat> --unanswered [duration]` | questions you and the admins have not answered for that long — `4h`, `1d`; 24 hours by default |
| `tg chats events <chat>` | who joined, left, was added or removed, and by whom; 7 days by default |
| `tg chats members list <chat>` | everyone in the group, with their role and when they were last seen |
| `tg topics list <chat>`, `tg search topics <chat> <text>` | a forum group's topics; search finds them by title |
| `tg topics show <chat> <id>` | one topic: title, closed or pinned, unread count, last activity |
| `tg topics enable <chat>` | enable a forum; a basic group requires `--upgrade --yes` and returns a new chat id |
| `tg topics create <chat> <title>` | create a topic; after an unknown outcome check `topics list` instead of repeating |
| `tg messages send <chat> <text> --topic <id>`, `tg polls create <chat> <question> <answers> --topic <id>` | send a message or poll into a forum topic |
| `tg messages forward <chat> <message> --to <forum> --topic <id>` | forward a message into a topic of the `--to` forum |
| `tg chats inspect <link>` | where an invite or public link leads; joins nothing |
| `tg chats create <title> [person...]` | a new group (a supergroup), or a channel with `--channel` |
| `tg chats join <link>`, `tg chats leave <chat>` | join by a link, leave |
| `tg chats update <chat>` | the title, the description, and whether members may pin (`--all-can-pin`) or add people (`--only-admins-add`) |
| `tg chats members add\|remove <chat> <person...>` | add people (they are told; who could not be added is named) or remove them (their messages stay) |
| `tg chats admins add <chat> <person> --can <rights>` | make a member an admin with these rights: members, admins, info, pin, link, post, edit, delete |
| `tg chats admins remove <chat> <person>` | take an admin's rights back; they stay a member |
| `tg chats link update <chat> <link> --approval\|--no-approval --expire-time <time> --max-uses <n>` | change only the supplied approval, expiry or usage limit of your extra invite link; supply at least one change |
| `tg chats link show\|reset <chat>` | the invite link; `reset` makes a new one and the old one stops working |
| `tg chats requests list\|accept\|decline <chat>` | requests to join a group that needs an admin's approval: who asked, let them in, turn them away; `--all` answers every request |
| `tg chats rules show\|set\|unset <chat>` | the group's rules |
| `tg chats moderate <chat>` | check the group by its rules; does what the rules allow |
| `tg messages delete --for-everyone`, `pin`, `unpin` | delete for everyone, pin |

Only the group owner can enable topics. An existing supergroup needs no upgrade. Upgrading a basic
group gives it a new chat id; the local store keeps older messages under the original id and does not
merge the two histories.

In a forum topic, text, photo and file captions and scheduled sends all keep the topic, and an explicit
reply must belong to that topic. A closed or missing topic is refused before anything is sent. When the
outcome of a send is unknown, repeat it with the same `--send-id`, chat and topic; for a scheduled send,
check `tg messages scheduled <chat>` instead of repeating it.

An agent connected over the [MCP server](mcp.md) can run the same commands, as far as the
profile's permissions allow.

`create`, `join`, `leave`, `update`, `link reset`, `members` and `admins` change something the
group's members see: a new group tells the people added, and a join or a leave shows in the chat. Each goes through the profile's permissions and the
send guard, and each person added counts toward the hourly limit
(see [the send guard](security.md#the-send-guard)).

## What waits on you

`review` and `serve` keep a list of tasks in the local store. A question nobody answered, and a message
that mentions you by name, opens a task; your answer closes it. A task points at its message and never
copies it.

See what waits on you, oldest first, then only questions and mentions in one group:

```sh
tg tasks list --state open
```

```sh
tg tasks list --chat "Hiking" --type question,mention
```

Add what the rules cannot see, such as a promise you made, or close a task that needs no answer:

```sh
tg tasks add msg:telegram/<you>/<chat>/<message> --type promise
```

```sh
tg tasks close <task> --as dismissed --reason no-reply-needed
```

See open tasks per chat, the oldest one and the median time to close:

```sh
tg stats tasks show
```

A closed task stays closed, and a dismissed one never comes back. Only your own answers close a
task — an admin's do not — and a mention by `@username` is not seen. An agent connected over MCP
gets the same commands.

## Rules

A group's rules say what `tg chats moderate` looks for and what it may do about it. They live in a
file of this profile, never in Telegram, and nothing watches the group in the background: a rule acts
only when you run `chats moderate`.

Show the rules. Until your first change, they are the defaults, marked as not saved:

```sh
tg chats rules show "Hiking"
```

Delete a message that has a link:

```sh
tg chats rules set "Hiking" links delete
```

Block these people by id…

```sh
tg chats rules set "Hiking" blocked 12345,67890
```

…and remove them when they write or join:

```sh
tg chats rules set "Hiking" blockedPeople remove
```

Delete without asking you first:

```sh
tg chats rules set "Hiking" consent.delete allow
```

See what the check would do, without doing it:

```sh
tg chats moderate "Hiking" --dry-run
```

Check what is new since the last run, and act:

```sh
tg chats moderate "Hiking"
```

| Rule | Default | What it looks for |
|---|---|---|
| `links`, `invites`, `forwards` | `report` | a message with a link, an invite link to another group, a forwarded message |
| `blocked`, `blockedNames` | — | people by id, or by part of their name, comma-separated |
| `blockedPeople` | `report` | what to do with a message or a join of a blocked person |
| `flood.messages`, `flood.minutes`, `flood.action` | 5, 1, `report` | more than so many messages from one person within so many minutes |
| `trusted` | — | people never acted on; the group's admins and you never are either |
| `consent.delete`, `consent.remove` | `ask` | how far you allow each action |

Each rule's action is `report`, `delete` or `remove`. Whether a `delete` or a `remove` happens
is the group's level for it, `consent.delete` and `consent.remove`: `deny` never, `readonly` only
reports, `ask` asks you about each one (the default; `--allow-dangerous` says yes to all), `allow`
does it. Every action still goes through the send guard and its hourly limit, and a run stops after
`--max-actions` (10). The next run starts where this one stopped; `--since-time` looks at a moment
of your own and leaves that point where it is.

An agent connected over MCP acts only where a level is `allow`; what asks is listed for you, not
done. `newAccount` is not offered: Telegram does not say how old an account is.

## With a bot

If your bot is an admin of the group, it can run the same check: `tg <bot> bot chats moderate`. A
person the bot removes cannot come back by the link unless you add `--no-ban`. The bot judges only
messages it saw or imported on this computer, and it does not judge joins. See
[moderating a group with a bot](bot.md#moderating-a-group-by-its-rules).

## Limits

- **Telegram's history is the record.** `chats events` and `review` see what the chat's history still
  holds; a service message an admin deleted is gone for them too.
- **Admins are known only where Telegram says.** Without them, `review --unanswered` counts only your
  answers, and says so.
- **Nothing watches a group by itself.** A check runs when you, an agent at your request, or your
  schedule runs it.
- **Telegram's rate limits apply.** Reading every member of a large group is many requests; a
  `FLOOD_WAIT` answer says how long to wait
  (see [when Telegram asks to wait](troubleshooting.md#telegram-asks-to-wait-n-s-before-the-next-request)).

## Statistics for group admins

See the week’s activity: messages, people who wrote and replies. For more specific questions—who
answers, who needs help and whether newcomers stay—open [Statistics](rankings.md).

**Your request:**

> Show Hiking’s activity this week and point out gaps in the history.

**Command:**

```sh
tg stats chats show "Hiking" --since-time 7d --offline --json
```

**Example agent answer:**

> | Metric | In available history |
> | --- | ---: |
> | Messages | 120 |
> | People who wrote | 18 |
> | Replies | 30 |
>
> History is incomplete: these are observed counts, not the group’s full totals.
> This local request did not fetch joining or leaving events.

Without `--offline`, the CLI also fetches joining and leaving events. Saved daily member observations
remain available locally. Recording start dates and gaps matter: the first report cannot reconstruct
past member lists.

### Telegram's own statistics

```sh
tg stats chats official <chat> --json
```

Telegram computes statistics for admins of large enough supergroups and channels, the same as the Statistics
screen in its apps. `tg stats chats official` asks for them and prints one JSON object. Telegram picks the
period, given as `period`. Each total comes with the value for the period before it.

- A supergroup (`kind: "group"`) has members, messages, viewers and posters, the top posters, admins and
  inviters, and 8 graphs: growth, members, new members by source, languages, messages, actions, hours and
  weekdays.
- A channel (`kind: "channel"`) has followers, views, shares and reactions per post and per story, how many
  followers have notifications on, the recent posts with their counts, and 12 graphs.

Each graph is a list of series over its `x` values: `date` (a day, `YYYY-MM-DD`), `time` (ISO 8601) or
`number`. When Telegram cannot give a graph, it shows as `{ "error": ... }` and the other graphs are still
there. The command only reads: nothing is sent, marked read or changed. `--jsonl` is refused.

Telegram answers this only for a chat where it shows you statistics. In a basic group, in a chat you do not
administer, or in one that is too small, the command fails with a permission or validation error. One run
costs about 10 to 17 requests: the chat card, the statistics, and each graph Telegram sends later. Name the
chat by `@username` or id: a title is first looked up in your chat list, which adds a request for each
100 chats. Telegram keeps statistics on a server of its own, so the first run adds a login key for that server
to the session file; it is never printed.

### Member snapshots and changes

`tg chats members fetch` reads members into the local store, recording profiles, changes, the day's
member count and whether the read was complete. `--budget` caps pages. Nobody is recorded as having
left after a partial read: that requires reading the whole available list and a known group count
no greater than the number read. A larger budget cannot bypass Telegram's member-list limits.

`--track` adds the group to the tracking list. `chats tracking list` shows all tracked groups;
`show` shows one group's tracking state and daily counts for the last 30 days. `add` starts tracking
without fetching immediately; `remove` stops daily fetching and keeps the history already recorded.
While `tg serve` runs, it fetches tracked groups one at a time, starting its first round a minute after
connecting, and skips groups already fetched on the current UTC day. Tracking does not start `serve`;
if it was stopped for several days, the next run records a new snapshot rather than filling missed days.

`tg chats members history` shows recorded joins, leaves and profile changes, oldest first;
`--since-time` limits the period. It never asks Telegram. A join uses Telegram's join time when known,
otherwise the first time the person was seen. A leave is dated at the first complete snapshot without
them, rather than their exact departure. The first fetch records the initial roster: those people did
not necessarily join that day. `chats members list --offline` reads the last completely saved roster;
partial reads do not replace it. Without a complete snapshot, this list can be empty even though some
profiles and events have already been recorded.
Profiles and history stay in the local store alongside messages.

`tg chats members audit` lists members with bot-like signals and reasons; `--budget` caps pages and
`--min-score` sets the threshold. It removes nobody and excludes admins and the owner. `more` means
the list is partial, and `unknown` names unavailable signals. It is unavailable with `--offline`;
scores need human review. Telegram supplies bot, scam, fake, deleted, photo, join and inviter metadata
where available. “Never wrote” means no messages were found in the local history, not proof that the
person never wrote in the group.

`--deep <n>` also checks the top n members in full, one person a second: their profile, their oldest profile
photo, up to 1,000 stored messages each, and two public spam lists — Combot CAS and lols.bot. Each
member's id is sent to those lists. The full check lands in `check` on each of those members.

### A weekly report for your group

“Hiking Club” below is a fictional example group. Download its messages with `store fetch` first if
they are not already stored, then record the current roster and prepare the report:

```sh
tg chats members fetch "Hiking Club" --track --json
```

```sh
tg stats chats show "Hiking Club" --since-time 7d --by day --timezone Europe/Madrid --json
```

```sh
tg chats members history "Hiking Club" --since-time 7d --offline --json
```

```sh
tg chats tracking show "Hiking Club" --offline --json
```

```sh
tg chats members audit "Hiking Club" --json
```

Ask your agent to report messages, active senders, unanswered questions, membership changes and days
with member snapshots. Keep `complete`, `more`, `unknown` and gaps between snapshots visible in the
report. Keep `tg serve` running or repeat member fetches for future reports; the first report cannot
show departures that happened before the first recorded roster.
