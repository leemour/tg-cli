<!-- Generated from the command tree by scripts/commands.ts. Do not edit; run `pnpm generate`. -->

# Commands

Every command, option and exit code. This page is **generated from the program itself**, so it
cannot describe a version that does not exist.

For the same list as JSON, run `tg commands --json`.

How a command line is built:

```sh
tg [profile] [options] <resource> <verb> [arguments]
```

**The first word is the profile** when it is not a command: `tg work chats list` lists the chats of
profile `work`, and `tg chats list` those of the default profile. `TG_PROFILE` does the same for a
whole shell session; without either, the profile is `default`.

## Options for every command

| Option | What it does |
|---|---|
| `-V, --version` | output the version number. |
| `-v, --verbose` | more detail in what is shown: -v ids, -vv everything we know. Default: `0`. |
| `--json` | machine-readable output: one JSON value on stdout, nothing else. |
| `--agent-json` | JSON for AI agents: invisible controls are visible; ordinary --json preserves text. |
| `--jsonl` | machine-readable output: one JSON object per line, for streaming and jq. |
| `--quiet` | diagnostics off; a failure is still said. |
| `--trace` | the connection's own log lines on stderr — never message content. |
| `--timeout <duration>` | give up on the whole command after this — 30s, 2m, 500ms. |
| `--offline` | answer from what was recorded and never connect; fails if nothing was. |
| `--no-input` | never prompt or open interactive login; piped input remains available. |
| `--max-input-bytes <bytes>` | maximum buffered input bytes (default: 16777216). |
| `--max-output-bytes <bytes>` | maximum machine output bytes (default: 4194304; 0 disables). |
| `--fields <paths>` | comma-separated item or object fields: id,text; preserve pagination and operation ids. |
| `--dry-run` | preview parsed arguments and permissions before running the action. |
| `--yes` | go ahead without the question an ask level puts before a write. |
| `--record` | keep this run — ids and timings, never message content. |
| `--no-record` | do not keep it, whatever the configuration says. |

## `tg session`

log this profile in to Telegram, or out

### `tg session start`

log in by QR code (default) or by phone number, code and 2FA password

```sh
tg session start [method] [options]
```

| Argument | | What it is |
|---|---|---|
| `method` | optional | how to log in. One of: `qr`, `phone`. Default: `qr`. |

| Option | What it does |
|---|---|
| `--app <how>` | the first time only: how to get this profile's app from my.telegram.org. One of: `browser`, `auto`. Default: `browser`. |
| `--qr-file <png>` | write the QR code to this PNG instead of drawing it, for an agent to pass on. |
| `--sms` | phone login: ask Telegram to send the code by SMS, not to the app; Telegram may still refuse. |

### `tg session end`

log this profile out on Telegram's side and forget the session here

**Changes something in Telegram.**

```sh
tg session end
```

## `tg setup`

set up Telegram and connect your agent

**Changes something in Telegram.**

```sh
tg setup [options]
```

| Option | What it does |
|---|---|
| `--agent <agent>` | install the skill for this agent; asks at a terminal, otherwise none. One of: `none`, `codex`, `cursor`, `claude`, `gemini`, `all`. |
| `--app <how>` | how to get your Telegram app credentials the first time. One of: `auto`, `browser`. Default: `auto`. |
| `--method <method>` | how to log in when there is no session. One of: `qr`, `phone`. Default: `qr`. |
| `--qr-file <png>` | write a temporary login QR image for an agent; needs stored app credentials without a terminal. |

## `tg account`

the logged-in account

### `tg account list`

every profile on this computer, and the account each is logged in as; asks the messenger nothing

```sh
tg account list
```

### `tg account show`

who this profile is logged in as; the phone number shows its last four digits

```sh
tg account show [options]
```

| Option | What it does |
|---|---|
| `--show-phone` | print the whole phone number. |

### `tg account update`

change the name, the description or the photo everyone sees on your profile

**Changes something in Telegram.**

```sh
tg account update [options]
```

| Option | What it does |
|---|---|
| `--first-name <name>` | your first name. |
| `--last-name <name>` | your last name. |
| `--description <text>` | about you. |
| `--photo <file>` | a new profile photo — an image file. |

### `tg account sessions`

where else this account is logged in — not `tg session`, which is this tool's own login

#### `tg account sessions list`

every device and app logged in to this account; nothing is ended

```sh
tg account sessions list
```

#### `tg account sessions end`

log out every other device, your phone included; this one stays

**Changes something in Telegram.**

```sh
tg account sessions end [options]
```

| Option | What it does |
|---|---|
| `--others` | every session but this one. |

## `tg chats`

the account's chats

### `tg chats list`

chats, newest first, archived ones included

```sh
tg chats list [options]
```

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |
| `--search <text>` | only chats whose name contains this; at least 3 characters. |
| `--kind <kind>` | only chats of this kind: dialog, group, channel, saved. |
| `--unread` | only chats with unread messages. |

### `tg chats events`

who joined, left, was added or removed, and by whom — from the chat's service messages

```sh
tg chats events <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | ISO 8601, or 2h / 1d ago; 7 days ago if not given. |
| `--type <names>` | only these, comma-separated: join, leave, add, remove, create, title, pin. |

### `tg chats inspect`

what an invite or public link leads to, without joining it

```sh
tg chats inspect <link>
```

| Argument | | What it is |
|---|---|---|
| `link` | required | an invite link or a public one. |

### `tg chats show`

one chat: its kind, unread count, last message time and who is in it

```sh
tg chats show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg chats send-as`

who this account may post as in a chat; changes no saved choice

```sh
tg chats send-as <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg chats members`

who is in a group

#### `tg chats members list`

everyone in a group, a page at a time, with their role and when they were last seen

```sh
tg chats members list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |

#### `tg chats members audit`

members that look like bots, each with its reasons, from the member list and local store; --deep checks selected people individually; removes nobody

```sh
tg chats members audit <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--budget <pages>` | at most this many pages of 200 members, a pause between them (default: 10). |
| `--min-score <n>` | only members scoring at least this; 1 lists everyone with a reason (default: 2). |
| `--deep <n>` | also check the top n profiles, oldest photos, up to 1,000 stored messages each and public ban lists, which are sent their ids — one person a second. |

#### `tg chats members history`

who joined, who left and whose profile changed, oldest first — what chats members fetch recorded in the local store; never asks the messenger

```sh
tg chats members history <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | ISO 8601, or 2h / 1d ago; everything recorded if not given. |

#### `tg chats members fetch`

read a group's whole member list into the local store's member history: who joined, who left, daily counts and profile changes; someone is recorded as gone only when every member was read

```sh
tg chats members fetch <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--track` | also fetch it daily while serve runs; chats tracking lists and edits those chats. |
| `--budget <pages>` | at most this many pages of 200 members, a pause between them (default: 10). |

#### `tg chats members add`

add people; they are told

**Changes something in Telegram.**

```sh
tg chats members add <chat> <person>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | required | an id, or part of a name. |

#### `tg chats members remove`

remove people; their messages stay

**Changes something in Telegram.**

```sh
tg chats members remove <chat> <person>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | required | an id, or part of a name. |

### `tg chats mark-read`

mark a chat read; the other side sees that you read it

**Changes something in Telegram.**

```sh
tg chats mark-read <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--until <message>` | only up to this message id; the newest by default. |
| `--topic <id>` | mark only this forum topic read; unsupported by messengers without topics. |

### `tg chats tracking`

the chats whose member lists serve fetches daily into the local store — chats members fetch --track adds one

#### `tg chats tracking list`

every tracked chat: since when, and its last member count

```sh
tg chats tracking list
```

#### `tg chats tracking show`

one chat: whether it is tracked, and its member count per day for the last 30 days

```sh
tg chats tracking show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

#### `tg chats tracking add`

fetch this chat's member list daily while serve runs, from its next run

```sh
tg chats tracking add <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

#### `tg chats tracking remove`

stop fetching it daily; the history already kept stays

```sh
tg chats tracking remove <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg chats create`

create a group or a channel; the people added are told

**Changes something in Telegram.**

```sh
tg chats create <title> [person] [options]
```

| Argument | | What it is |
|---|---|---|
| `title` | required | the group's name. |
| `person` | optional | people to add: an id, or part of a name. |

| Option | What it does |
|---|---|
| `--channel` | a private channel instead of a group; people join it by its link. |

### `tg chats join`

join a group or channel by its link; the others in it see that you joined

**Changes something in Telegram.**

```sh
tg chats join <link>
```

| Argument | | What it is |
|---|---|---|
| `link` | required | an invite link, or a public one. |

### `tg chats leave`

leave a group or channel; the others in it see that you left

**Changes something in Telegram.**

```sh
tg chats leave <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg chats update`

rename a group or channel, change its description, or turn one of its settings on or off

**Changes something in Telegram.**

```sh
tg chats update <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--title <title>` | the new name. |
| `--description <text>` | the new description. |
| `--all-can-pin <on\|off>` | every member may pin messages. |
| `--only-admins-add <on\|off>` | only admins may add members. |
| `--join-approval <on\|off>` | people ask to join, and an admin lets them in. |

### `tg chats link`

a group's invite link

#### `tg chats link show`

the invite link, if you may see it

```sh
tg chats link show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

#### `tg chats link create`

make another invite link; nobody is told until you share it

**Changes something in Telegram.**

```sh
tg chats link create <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--approval` | who joins by it asks first, and an admin lets them in; it then has no use limit. |
| `--expire-time <time>` | it stops working then: 2026-09-25T09:00 (local time), or 30m, 2h, 7d from now. |
| `--max-uses <n>` | at most this many people join by it, 1 to 99999. |

#### `tg chats link list`

your invite links, newest first, with how many joined and how many wait

```sh
tg chats link list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--revoked` | the links you stopped, instead. |
| `--limit <n>` | how many. |

#### `tg chats link revoke`

stop one link; for the group's own link, the answer is the new one

**Changes something in Telegram.**

```sh
tg chats link revoke <chat> <link>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `link` | required | the link, as `chats link list` shows it. |

#### `tg chats link update`

change one of your invite links, the group's own one too

**Changes something in Telegram.**

```sh
tg chats link update <chat> <link> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `link` | required | the link, as `chats link list` shows it. |

| Option | What it does |
|---|---|
| `--approval` | who joins by it asks first, and an admin lets them in; it then has no use limit. |
| `--no-approval` | anyone with it joins at once. |
| `--expire-time <time>` | it stops working then: 2026-09-25T09:00 (local time), or 30m, 2h, 7d from now; `never` takes the expiry away. |
| `--max-uses <n>` | at most this many people join by it, 1 to 99999. |

#### `tg chats link reset`

replace the invite link; the old one stops working

**Changes something in Telegram.**

```sh
tg chats link reset <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg chats requests`

requests to join a group that needs an admin's approval

#### `tg chats requests list`

who asked to join, newest first; only admins see them, and reading tells nobody

```sh
tg chats requests list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many. |
| `--search <text>` | only people whose name or @username has this. |
| `--link <link>` | only people who asked through this invite link; not with --search. |

#### `tg chats requests accept`

let them in; the group sees them join

**Changes something in Telegram.**

```sh
tg chats requests accept <chat> [person] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | optional | who asked: an id from `chats requests list`. |

| Option | What it does |
|---|---|
| `--all` | every pending request, counted against the hourly limit first. |
| `--link <link>` | with --all: only the requests made by this invite link. |

#### `tg chats requests decline`

turn the request away

**Changes something in Telegram.**

```sh
tg chats requests decline <chat> [person] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | optional | who asked: an id from `chats requests list`. |

| Option | What it does |
|---|---|
| `--all` | every pending request, counted against the hourly limit first. |
| `--link <link>` | with --all: only the requests made by this invite link. |

### `tg chats admins`

give or take back a member's admin rights

#### `tg chats admins add`

make a member an admin with these rights

**Changes something in Telegram.**

```sh
tg chats admins add <chat> <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | required | an id, or part of a name. |

| Option | What it does |
|---|---|
| `--can <rights>` | what they may do, comma-separated: members, admins, info, pin, link, post, edit, delete. |

#### `tg chats admins remove`

take an admin's rights back; they stay a member

**Changes something in Telegram.**

```sh
tg chats admins remove <chat> <person>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `person` | required | an id, or part of a name. |

### `tg chats folders`

your chat folders

#### `tg chats folders list`

your chat folders, in the order the app shows them

```sh
tg chats folders list
```

#### `tg chats folders show`

one chat folder, with the names of the chats in it

```sh
tg chats folders show <folder>
```

| Argument | | What it is |
|---|---|---|
| `folder` | required | the folder's id, or its title exactly. |

#### `tg chats folders create`

create a chat folder

**Changes something in Telegram.**

```sh
tg chats folders create <title> [options]
```

| Argument | | What it is |
|---|---|---|
| `title` | required | the folder's name; the app may refuse a long one. |

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat to put in it, by id or name; repeat it for more. |
| `--include <kinds>` | every chat of these kinds: contacts, non-contacts, groups, channels, bots. |
| `--skip <which>` | leave out chats that are muted, read, archived. |
| `--exclude-chat <chat>` | never show this chat in it; repeat it for more. |
| `--pin <chat>` | pin this chat at the top of the folder; repeat it for more. |
| `--emoji <emoji>` | the folder's icon. |

#### `tg chats folders update`

rename a folder, or change which chats are in it

**Changes something in Telegram.**

```sh
tg chats folders update <folder> [options]
```

| Argument | | What it is |
|---|---|---|
| `folder` | required | folder id, or its title exactly. |

| Option | What it does |
|---|---|
| `--title <title>` | a new name. |
| `--add <chat>` | put a chat in it; repeat it for more. |
| `--remove <chat>` | take a chat out of it, and off its excluded and pinned lists; repeat it for more. |
| `--include <kinds>` | every chat of these kinds: contacts, non-contacts, groups, channels, bots; replaces what it had, none clears it. |
| `--skip <which>` | leave out chats that are muted, read, archived; replaces what it had, none clears it. |
| `--exclude-chat <chat>` | never show this chat in it; repeat it for more. |
| `--pin <chat>` | pin this chat at the top of the folder; repeat it for more. |
| `--emoji <emoji>` | the folder's icon. |

#### `tg chats folders delete`

delete a folder; the chats in it stay

**Changes something in Telegram.**

```sh
tg chats folders delete <folder>
```

| Argument | | What it is |
|---|---|---|
| `folder` | required | folder id, or its title exactly. |

#### `tg chats folders order`

put folders in this order; the ones not named keep theirs after them

**Changes something in Telegram.**

```sh
tg chats folders order <folders>
```

| Argument | | What it is |
|---|---|---|
| `folders` | required | folder ids, or titles exactly, first one first. |

#### `tg chats folders join`

add a folder someone shared by a link; joins every chat in it, and the others there see you joined

**Changes something in Telegram.**

```sh
tg chats folders join <link>
```

| Argument | | What it is |
|---|---|---|
| `link` | required | the folder's link, as t.me/addlist/…. |

### `tg chats rules`

what `chats moderate` judges a group by, kept in a file of this profile

#### `tg chats rules show`

the group's rules; the defaults, marked not saved, if it has none yet

```sh
tg chats rules show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

#### `tg chats rules set`

change one rule; the group's first change writes every rule with its default

**Changes something on this computer only.**

```sh
tg chats rules set <chat> <key> <value>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `key` | required | one of: trusted, blocked, blockedNames, links, invites, forwards, blockedPeople, flood.messages, flood.minutes, flood.action, newAccount.days, newAccount.action, consent.delete, consent.remove. |
| `value` | required | the new value; a list is comma-separated. |

#### `tg chats rules unset`

put one rule back to its default

**Changes something on this computer only.**

```sh
tg chats rules unset <chat> <key>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `key` | required | one of: trusted, blocked, blockedNames, links, invites, forwards, blockedPeople, flood.messages, flood.minutes, flood.action, newAccount.days, newAccount.action, consent.delete, consent.remove. |

### `tg chats moderate`

judge a group's new messages and members by its rules, and act as they allow

**Changes something in Telegram.**

```sh
tg chats moderate <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | judge what came after this ISO 8601 time, or 2h / 1d ago; the saved point stays. |
| `--dry-run` | judge and plan; do nothing. |
| `--allow-dangerous` | yes to every action whose level in the group's rules is ask. |
| `--max-actions <n>` | at most this many actions in one run; 10 if not given. |

## `tg contacts`

people this account has a one-to-one chat with

### `tg contacts list`

people you have a one-to-one chat with

```sh
tg contacts list [options]
```

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |
| `--order <recent\|name>` | newest conversation first, or alphabetical. Default: `recent`. |
| `--search <text>` | only people whose name, local alias or @username contains this. |
| `--search-notes <text>` | only people whose private notes contain this text. |

### `tg contacts show`

one person and the chats you share with them

```sh
tg contacts show <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name. |

| Option | What it does |
|---|---|
| `--with-notes` | include your private notes, subject to contacts.notes.list permission. |

### `tg contacts profile`

everything the messenger says about one person — handles, flags, last seen, when they registered — and how many of their messages the store holds in each chat you share, the first and the last, and the earlier names and usernames the store saw them with

```sh
tg contacts profile <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name. |

| Option | What it does |
|---|---|
| `--show-phone` | print the whole phone number. |

### `tg contacts context`

what the local store holds about a person; --chat --refresh explicitly asks Telegram first

```sh
tg contacts context <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name. |

| Option | What it does |
|---|---|
| `--limit <n>` | at most this many messages in each list; 10 if not given. |
| `--since-time <time>` | nothing older than this ISO 8601 time, or 2h / 1d ago. |
| `--chat <chat>` | a chat, by id or name; repeat it for more — then their newest messages in each, 20 unless --limit, short unless -v. |
| `--refresh` | with --chat, read their newest messages in each from the messenger first. |

### `tg contacts check`

whether one person looks like a bot, a fake or a spammer: their profile, what they wrote in the store, and the public ban lists (Combot Anti-Spam (CAS), lols.bot), which are sent their id — a hint, never a verdict

```sh
tg contacts check <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name. |

| Option | What it does |
|---|---|
| `--no-registries` | skip public ban lists; still ask Telegram for the profile and photos unless --offline. |

### `tg contacts link`

record that two people in the store are one person — the same name is never enough

```sh
tg contacts link <person> <other>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name. |
| `other` | required | the same in another messenger of the store, as <messenger>:<person> — max:Ana. |

### `tg contacts unlink`

undo contacts link for one identity: it is a person of its own again

```sh
tg contacts unlink <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | their id, @username, or part of their name; <messenger>:<person> for another messenger. |

### `tg contacts lookup`

who has this phone number — asks for it, or reads it from stdin; never an argument

```sh
tg contacts lookup
```

### `tg contacts sync`

take the whole contact list from the messenger into the local store

```sh
tg contacts sync
```

### `tg contacts alias`

a private local display name in the selected account

#### `tg contacts alias set`



**Changes something on this computer only.**

```sh
tg contacts alias set <person> <alias>
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |
| `alias` | required |  |

#### `tg contacts alias rm`



**Changes something on this computer only.**

```sh
tg contacts alias rm <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |

### `tg contacts notes`

your private notes on a stored contact, the same in every account that sees them

#### `tg contacts notes list`



```sh
tg contacts notes list <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |

#### `tg contacts notes show`



```sh
tg contacts notes show <person> <id>
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |
| `id` | required |  |

#### `tg contacts notes add`



**Changes something on this computer only.**

```sh
tg contacts notes add <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |

| Option | What it does |
|---|---|
| `--file <path>` | read note text from a file; omitted or - reads stdin. |

#### `tg contacts notes edit`



**Changes something on this computer only.**

```sh
tg contacts notes edit <person> <id> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |
| `id` | required |  |

| Option | What it does |
|---|---|
| `--file <path>` | read note text from a file; omitted or - reads stdin. |
| `--revision <number>` | the revision you read before editing. |

#### `tg contacts notes remove`



**Changes something on this computer only.**

```sh
tg contacts notes remove <person> <id>
```

| Argument | | What it is |
|---|---|---|
| `person` | required |  |
| `id` | required |  |

### `tg contacts add`

add a person to your contacts — `contacts list` still shows only people you have a dialog with

**Changes something in Telegram.**

```sh
tg contacts add <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | person id — `contacts lookup` finds one — or part of a known name. |

### `tg contacts remove`

remove a person from your contacts; the chat stays, a name you gave them may not

**Changes something in Telegram.**

```sh
tg contacts remove <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | person id — `contacts lookup` finds one — or part of a known name. |

### `tg contacts block`

stop a person from writing to you — they need not be a contact

**Changes something in Telegram.**

```sh
tg contacts block <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | person id — `contacts lookup` finds one — or part of a known name. |

### `tg contacts unblock`

let a blocked person write to you again

**Changes something in Telegram.**

```sh
tg contacts unblock <person>
```

| Argument | | What it is |
|---|---|---|
| `person` | required | person id — `contacts lookup` finds one — or part of a known name. |

### `tg contacts rename`

rename the contact in the messenger address book; use contacts alias for a private local name

**Changes something in Telegram.**

```sh
tg contacts rename <person> <first-name> [last-name]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | person id — `contacts lookup` finds one — or part of a known name. |
| `first-name` | required | the name you want to see for them. |
| `last-name` | optional |  |

### `tg contacts import`

upload phone numbers and add the people the messenger has under them

**Changes something in Telegram.**

```sh
tg contacts import <file>
```

| Argument | | What it is |
|---|---|---|
| `file` | required | one person per line: number, then a comma, a tab or a semicolon, then the name. |

## `tg messages`

read and send messages

### `tg messages evidence`

a bounded evidence packet from stored messages, newest first

```sh
tg messages evidence <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many, 1–100. |
| `--before-id <id>` | only messages older than this message id. |

### `tg messages list`

a chat's messages, oldest to newest

```sh
tg messages list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many. |
| `--before-id <id>` | only messages older than this message id. |
| `--before-time <time>` | only messages older than this ISO 8601 time, or 2h / 1d ago. |
| `--after-id <id>` | only messages newer than this message id. |
| `--after-time <time>` | only messages newer than this ISO 8601 time, or 2h / 1d ago. |
| `--topic <id>` | only this forum topic; read back from its newest message or --before-id. |
| `--transcribe` | turn voice messages not heard yet into text — by the messenger, or a model on this machine; can take minutes. |
| `--model <id>` | which downloaded speech model hears them, with --transcribe; `models audio list` shows them. |
| `--mark-read` | also mark the chat read up to the newest message shown; the other person sees it. |

### `tg messages send`

send a text message; without [text], the text is read from stdin

**Changes something in Telegram.**

```sh
tg messages send <chat> [text] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `text` | optional | the message. |

| Option | What it does |
|---|---|
| `--topic <id>` | send to this forum topic; unsupported by messengers without topics. |
| `--reply-to <message>` | answer this message, by its id in the same chat. |
| `--comment-to <post>` | comment on this post of the channel; it goes to the post's discussion group. |
| `--send-as <id>` | post as one of the identities `chats send-as` lists; required where the chat posts as someone else by default. |
| `--send-id <id>` | repeat a send whose outcome was unknown, without risking a second copy. |
| `--silent` | deliver without a notification. |
| `--no-preview` | no preview card for a link in the text. |
| `--md` | read this messenger's Markdown; see its formatting guide for supported syntax. |
| `--file <file>` | attach a file; the text becomes its caption. |
| `--photo <file>` | attach a .jpg, .png or .webp as a photo; the text becomes its caption. |
| `--as-file` | send the --file as a file to download, a video included. |
| `--voice <file>` | send an Ogg Opus file as a voice message, alone, with no text. |
| `--allow-any-file` | send a file even from credential folders or this CLI's own folders. |
| `--at-time <time>` | let the messenger send it later, even with this machine off: 2026-09-25T09:00 (local time), or 30m, 2h, 1d from now. |
| `--spoiler` | hide the --photo or video behind a spoiler until tapped. |
| `--caption-above` | show the text above the --photo or --file, not below it. |
| `--filename <name>` | the name others see for the --file, instead of its name on disk. |
| `--html` | the text is HTML: <b>, <i>, <a href>, <code>. |

### `tg messages show`

one message, by its chat and id or by its msg: locator

```sh
tg messages show <chat> [message]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; or a msg: locator, with no message id after it. |
| `message` | optional | the message id. |

### `tg messages context`

a message and what came either side of it, oldest first

```sh
tg messages context <chat> [message] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; or a msg: locator, with no message id after it. |
| `message` | optional | the message id. |

| Option | What it does |
|---|---|
| `--thread` | the stored reply chain and replies instead of time neighbours; falls back when no graph exists. |
| `--thread-hops <n>` | at most this many links from the hit (default: 8). |
| `--thread-messages <n>` | at most this many messages in each thread context (default: 50). |
| `--thread-bytes <n>` | at most this many bytes of whole messages and links in each context (default: 65536). |
| `--thread-within <duration>` | messages within this long either side of the hit (default: 1d). |
| `--before-n <n>` | how many before it. Default: `5`. |
| `--after-n <n>` | how many after it. Default: `5`. |

### `tg messages download`

save a message's photos, files, videos and voice notes to a folder — or a whole chat's with --all

```sh
tg messages download <chat> [message] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | optional | the message id; left out with --all. |

| Option | What it does |
|---|---|
| `--output-dir <dir>` | where to save them; created if missing. Default: `.`. |
| `--all` | every file of the chat, newest first; run it again to continue where it stopped. |
| `--pause <duration>` | with --all, a pause between pages, to stay under the provider's limits. Default: `1s`. |
| `--extract` | read text layers from the files this download maps into the local content index. |

### `tg messages transcribe`

a voice message as text — by Telegram where it can, else by a model on this machine

```sh
tg messages transcribe <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of a voice message. |

| Option | What it does |
|---|---|
| `--local` | use the model on this machine, never the messenger. |
| `--model <id>` | which downloaded model; implies --local (`models audio list`). |

### `tg messages edit`

change the text of your own message; the other side may have read it already

**Changes something in Telegram.**

```sh
tg messages edit <chat> <message> [text] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of your own message. |
| `text` | optional | the new text; without it, read from stdin. |

| Option | What it does |
|---|---|
| `--md` | read this messenger's Markdown; see its formatting guide for supported syntax. |
| `--html` | the text is HTML: <b>, <i>, <a href>, <code>. |

### `tg messages delete`

delete messages for you only; with --for-everyone, for everyone in the chat

**Changes something in Telegram.**

```sh
tg messages delete <chat> <messages> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `messages` | required | the message ids, at most 10. |

| Option | What it does |
|---|---|
| `--for-everyone` | delete for everyone in the chat, not only for you — they cannot get it back. |
| `--allow-dangerous` | go ahead without the question an ask level puts before a deletion. |

### `tg messages forward`

forward one message to another chat

**Changes something in Telegram.**

```sh
tg messages forward <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | the chat the message is in: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |

| Option | What it does |
|---|---|
| `--to <chat>` | where it goes: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--silent` | deliver it without a notification. |
| `--send-as <id>` | post as one of the identities `chats send-as` lists for the --to chat; required where the chat posts as someone else by default. |
| `--send-id <id>` | repeat a forward whose outcome was unknown, without risking a second copy. |
| `--topic <id>` | forward into this forum topic of the --to chat. |

### `tg messages pin`

pin a message in a chat, quietly unless --notify

**Changes something in Telegram.**

```sh
tg messages pin <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |

| Option | What it does |
|---|---|
| `--notify` | tell the chat's members about the pin. |

### `tg messages unpin`

unpin a message in a chat

**Changes something in Telegram.**

```sh
tg messages unpin <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |

### `tg messages scheduled`

messages waiting to be sent later in a chat, soonest first; cancel one in the app

```sh
tg messages scheduled <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg messages link`

a message permalink when supported, and its account-scoped locator

```sh
tg messages link <chat> [message]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; or a msg: locator, with no message id after it. |
| `message` | optional | the message id. |

### `tg messages comments`

the comments under a channel post, oldest to newest; they live in its discussion group

```sh
tg messages comments <chat> <post> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | the channel: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `post` | required | the post's message id in the channel. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many. |
| `--before-id <id>` | only comments older than this comment id. |

### `tg messages links`

why a message is in its conversation: each link it has, and the chain of answers back to the start

```sh
tg messages links <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |

## `tg reactions`

react to messages

### `tg reactions add`

put your reaction on a message; it replaces the one you had

**Changes something in Telegram.**

```sh
tg reactions add <chat> <message> <emoji>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |
| `emoji` | required | one emoji, for example 👍. |

### `tg reactions remove`

take your reaction off a message

**Changes something in Telegram.**

```sh
tg reactions remove <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the message id. |

## `tg polls`

read a poll, vote in it, close your own, create one

### `tg polls show`

a poll and its answer ids, as the message carries it now

```sh
tg polls show <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of the message that carries the poll. |

### `tg polls voters`

who voted for what, newest first; not in an anonymous poll

```sh
tg polls voters <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of the message that carries the poll. |

| Option | What it does |
|---|---|
| `--answer <id>` | only those who chose this answer, as `polls show` prints it. |
| `--limit <n>` | how many. |

### `tg polls vote`

vote in a poll, or take your vote back; the others see it unless the poll is anonymous

**Changes something in Telegram.**

```sh
tg polls vote <chat> <message> [answers] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of the message that carries the poll. |
| `answers` | optional | answer ids, as `polls show` prints them. |

| Option | What it does |
|---|---|
| `--retract` | take your vote back. |

### `tg polls close`

close your own poll; nobody can vote after that, and it cannot be reopened

**Changes something in Telegram.**

```sh
tg polls close <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | the id of your own message that carries the poll. |

### `tg polls create`

send a poll to a chat, as a message of its own; public unless --anonymous

**Changes something in Telegram.**

```sh
tg polls create <chat> <question> <answers> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `question` | required | the question. |
| `answers` | required | two answers or more. |

| Option | What it does |
|---|---|
| `--topic <id>` | send to this forum topic; unsupported by messengers without topics. |
| `--multiple` | people may pick several answers. |
| `--anonymous` | nobody sees who voted for what. |
| `--revote` | people may change their vote. |
| `--silent` | send without a notification. |
| `--send-as <id>` | post as one of the identities `chats send-as` lists; required where the chat posts as someone else by default. |
| `--send-id <id>` | repeat a create whose outcome was unknown, without risking a second poll. |
| `--quiz` | a quiz: one answer is right, and a vote is final. |
| `--correct <n>` | with --quiz: the right answer's position, from 1. |
| `--solution <text>` | with --quiz: what people see once they answered. |
| `--close-time <delay>` | it closes by itself this long after sending: 5s to 10m, like 90s or 5m. |

## `tg models`

models that run on this machine

### `tg models audio`

speech models for transcribing voice messages

#### `tg models audio list`

the speech models, most suitable first, which are downloaded, and which one is the default

```sh
tg models audio list
```

#### `tg models audio download`

download a speech model once, checked against the sha256 this version expects

```sh
tg models audio download <model>
```

| Argument | | What it is |
|---|---|---|
| `model` | required | a model id from `models audio list`. |

### `tg models text`

embedding models for searching conversations by meaning

#### `tg models text list`

the embedding models, most suitable first, which are downloaded, and which one is the default

```sh
tg models text list
```

#### `tg models text download`

download an embedding model once, checked against the sha256 this version expects

```sh
tg models text download <model> [options]
```

| Argument | | What it is |
|---|---|---|
| `model` | required | a model id from `models text list`. |

| Option | What it does |
|---|---|
| `--accept-terms` | accept the model's licence terms, for a model that has its own. |

#### `tg models text key`

API keys for embedding and analysis providers

#### `tg models text key set`

store a key, typed at a hidden prompt or piped on stdin — never as an argument

```sh
tg models text key set <provider>
```

| Argument | | What it is |
|---|---|---|
| `provider` | required | openai, anthropic, or the host of a --base-url server that wants a key. |

#### `tg models text key remove`

forget a stored key

```sh
tg models text key remove <provider>
```

| Argument | | What it is |
|---|---|---|
| `provider` | required | openai, anthropic, or a server's host. |

## `tg inbox`

other people's unread messages in every chat; --new for what arrived since the last check

```sh
tg inbox [options]
```

| Option | What it does |
|---|---|
| `--new` | what arrived since the last check, each message once — for scheduled runs. |
| `--since-time <time>` | what arrived after this ISO 8601 time, or 2h / 1d ago; the saved point stays put. |
| `--limit <n>` | at most this many per chat, the newest. |
| `--all` | muted and archived chats too — left out unless they mention you or reply to you. |
| `--kind <kinds>` | only chats of these kinds, comma-separated: dialog, group, channel, saved. |
| `--transcribe` | turn voice messages not heard yet into text — by the messenger, or a model on this machine; can take minutes. |
| `--model <id>` | which downloaded speech model hears them, with --transcribe; `models audio list` shows them. |
| `--mark-read` | also mark each chat shown read, up to the newest message shown; the other side sees it. |
| `--no-mark-read` | do not, whatever the catchUpMarksRead setting says. |

## `tg review`

every message, yours too, in chats that changed since a point — for reviewing who owes what

```sh
tg review [options]
```

| Option | What it does |
|---|---|
| `--since-time <time>` | where the last review ended — ISO 8601, or 2h / 1d ago; 3 days ago if not given. |
| `--chat <chat>` | only this chat: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--kind <kinds>` | only chats of these kinds, comma-separated: dialog, group, channel, saved. |
| `--unanswered [duration]` | only questions to you or a group's admins that nobody answered, asked at least this long ago — 4h, 1d; 24h if not given. |
| `--all` | muted and archived chats too — left out unless they mention you or reply to you. |
| `--transcribe` | turn voice messages not heard yet into text — by the messenger, or a model on this machine; can take minutes. |
| `--model <id>` | which downloaded speech model hears them, with --transcribe; `models audio list` shows them. |
| `--new` | what changed since the last `review --new`, a point per chat — for scheduled runs. |
| `--mark-read` | also mark each chat shown read, up to the newest message shown; the other side sees it. |
| `--no-mark-read` | do not, whatever the catchUpMarksRead setting says. |

## `tg topics`

the topics of a forum group

### `tg topics list`

a forum group's topics, newest activity first

```sh
tg topics list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |

### `tg topics show`

one forum topic: its title, state and last activity

```sh
tg topics show <chat> <topic>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `topic` | required | the topic id, from `topics list`. |

### `tg topics enable`

enable forum topics; only the owner, with an explicit upgrade for a basic group

**Changes something in Telegram.**

```sh
tg topics enable <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--upgrade` | upgrade a basic group to a supergroup first; its chat id changes. |

### `tg topics create`

create a named topic in an existing forum; never enable or upgrade a group implicitly

**Changes something in Telegram.**

```sh
tg topics create <chat> <title> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `title` | required | the topic title, at most 128 UTF-8 bytes. |

| Option | What it does |
|---|---|
| `--send-id <id>` | identify this creation attempt; an already sent or unknown id is refused. |

### `tg topics edit`

rename, close or reopen a forum topic

**Changes something in Telegram.**

```sh
tg topics edit <chat> <topic> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `topic` | required | the topic id, from `topics list`. |

| Option | What it does |
|---|---|
| `--title <title>` | the new title, at most 128 UTF-8 bytes. |
| `--closed <on\|off>` | on closes the topic to new messages, off reopens it. |
| `--pinned <on\|off>` | on pins the topic at the top of the list, off unpins it. |
| `--hidden <on\|off>` | on hides the General topic from the topic list, off shows it. |

### `tg topics delete`

delete a forum topic and every message in it, for everyone; it cannot be undone

**Changes something in Telegram.**

```sh
tg topics delete <chat> <topic> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `topic` | required | the topic id, from `topics list`. |

| Option | What it does |
|---|---|
| `--allow-dangerous` | go ahead without the question an ask level puts before a deletion. |

### `tg topics order`

put the pinned topics in this order; it pins and unpins nothing

**Changes something in Telegram.**

```sh
tg topics order <chat> <topic>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `topic` | required | the pinned topics' ids, first to last. |

## `tg watch`

print new messages as they arrive, until Ctrl-C or --timeout (either ends it normally)

```sh
tg watch [options]
```

| Option | What it does |
|---|---|
| `--events` | also edits, deletions and reactions; every line then names its event. |

## `tg serve`

keep the local store current until stopped — what a systemd or launchd unit runs

```sh
tg serve
```

## `tg server`

`tg serve` in the background: start, stop, restart, status, logs; install adds a systemd or launchd unit

### `tg server start`

start serve in the background — through the unit if one is installed — and answer once it connects

```sh
tg server start
```

### `tg server stop`

stop this profile's serve — through the unit if it runs under one

```sh
tg server stop
```

### `tg server restart`

stop it and start it again

```sh
tg server restart
```

### `tg server status`

whether serve runs for this profile, since when, who started it, and the unit if there is one

```sh
tg server status
```

### `tg server logs`

serve's latest log lines — from the journal under systemd, else its log file

```sh
tg server logs [options]
```

| Option | What it does |
|---|---|
| `-n, --lines <n>` | how many lines. Default: `50`. |

### `tg server install`

write a systemd user unit or a launchd agent for this profile; starts nothing

```sh
tg server install
```

### `tg server uninstall`

remove this profile's unit; stop it first

```sh
tg server uninstall
```

## `tg store`

the local store of messages

### `tg store status`

per chat: messages stored, the oldest and newest, and the stretches held completely

```sh
tg store status [chat]
```

| Argument | | What it is |
|---|---|---|
| `chat` | optional | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg store fetch`

fetch a chat's history into the local store, newest first; run it again to continue; --all fetches every chat

```sh
tg store fetch [chat] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | optional | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--all` | every chat, most recently active first — what search needs; the last 90d unless --since-time or --last. |
| `--limit <n>` | at most this many messages in this run, per chat with --all; 1000 if not given. |
| `--page-size <n>` | how many messages one request asks for; 100 if not given. |
| `--pause <duration>` | pause between pages, to stay under the provider's limits. Default: `1s`. |
| `--since-time <time>` | stop once it reaches messages older than this: ISO 8601, or 2h / 1d ago. |
| `--last <n>` | stop once the newest n messages are held. |
| `--catch-up` | prepare local search after fetch; overrides searchCatchUp. |
| `--no-catch-up` | skip local preparation after this fetch. |
| `--catch-up-chunks <n>` | at most this many local vector chunks. |
| `--catch-up-messages <n>` | skip a graph rebuild larger than this many messages. |
| `--catch-up-time <duration>` | local preparation time budget, 30s by default. |
| `--background` | run as a job that outlives this command; `store jobs show` follows it. |
| `--estimate` | only estimate how many messages, requests and minutes a full fetch would still take — from the store, no request. |

### `tg store gaps`

inspect recorded interior coverage gaps and explicitly fetch them

#### `tg store gaps plan`

local coverage plan; missing message ids alone do not imply missing history

```sh
tg store gaps plan <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

#### `tg store gaps repair`

fetch bounded interior gaps and recheck coverage; never delete unseen messages

```sh
tg store gaps repair <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--limit <n>` | total messages in this repair, 500 by default. |
| `--max-gaps <n>` | at most this many gaps, 5 by default. |
| `--repair-time <duration>` | time budget for the repair, 30s by default. Default: `30s`. |
| `--page-size <n>` | messages per provider page. |
| `--pause <duration>` | provider pause between pages. Default: `1s`. |
| `--fingerprint <hash>` | refuse if this previously inspected coverage plan changed. |
| `--catch-up` | prepare local search after repair; overrides searchCatchUp. |
| `--no-catch-up` | skip local search preparation after repair. |
| `--catch-up-chunks <n>` | maximum local chunks prepared. |
| `--catch-up-messages <n>` | maximum stored messages read for preparation. |
| `--catch-up-time <duration>` | preparation time within the repair's remaining budget. |
| `--background` | repair as an existing store job; inspect store jobs show. |

### `tg store jobs`

background fetch jobs

#### `tg store jobs list`

background fetch jobs, newest first

```sh
tg store jobs list [options]
```

| Option | What it does |
|---|---|
| `--state <state>` | only jobs in this state. One of: `running`, `done`, `failed`, `cancelled`, `died`. |

#### `tg store jobs show`

one background job — the newest when none is named — and what the store now holds of its chat

```sh
tg store jobs show [job]
```

| Argument | | What it is |
|---|---|---|
| `job` | optional | the job id `store fetch --background` printed. |

#### `tg store jobs cancel`

stop a running background job after its current page; a later fetch resumes where it stopped

```sh
tg store jobs cancel <job>
```

| Argument | | What it is |
|---|---|---|
| `job` | required | the job id. |

#### `tg store jobs retry`

start a failed or died job again, as a new job; the fetch resumes where the store stopped

```sh
tg store jobs retry [job] [options]
```

| Argument | | What it is |
|---|---|---|
| `job` | optional | the job id. |

| Option | What it does |
|---|---|
| `--failed` | every chat whose newest job failed or died. |

#### `tg store jobs clear`

forget finished jobs and remove their logs; a running job is kept

**Changes something on this computer only.**

```sh
tg store jobs clear
```

### `tg store export`

a chat's stored messages as JSON lines, oldest first; never asks the messenger

```sh
tg store export [chats] [options]
```

| Argument | | What it is |
|---|---|---|
| `chats` | optional | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; several with --to. |

| Option | What it does |
|---|---|
| `--format <format>` | jsonl (the default): one message per line; markdown: a transcript with a heading per day, replies and forwards quoted. |
| `--since-time <time>` | only from this ISO 8601 time, or 30m / 2h / 1d ago, on. |
| `--output <file>` | write JSON lines, or the transcript, to this new file, readable only by you. |
| `--to <dir>` | write into this folder, a file per chat and a manifest; run again on it for only what changed since. |
| `--kind <kinds>` | with --to: every stored chat of these kinds, comma-separated: dialog, group, channel, saved. |
| `--all` | with --to: every stored chat of this account. |
| `--encrypt` | compress and encrypt with a password, typed at a hidden prompt or piped on stdin; it is never kept — lose it and the file cannot be opened. |

### `tg store clear`

delete from the store the chats this account has left, with their messages

```sh
tg store clear [options]
```

| Option | What it does |
|---|---|
| `--left` | the chats this account has left — the only thing this clears. |
| `--allow-dangerous` | yes, delete — it cannot be undone, and a chat you left cannot be fetched again. |

### `tg store info`

the store file: where it is, its size, its schema and how many rows it holds; changes nothing

```sh
tg store info
```

### `tg store check`

whether the store is healthy — integrity, search indexes, disk, and which chats are behind

```sh
tg store check
```

### `tg store migrate`

bring the store up to this build's schema, then normalize, index and stem the messages and notes stored before it

```sh
tg store migrate
```

### `tg store reindex`

rebuild the word index, its typo vocabulary, the stems, the files' word index and the notes' indexes from what is stored; loses nothing

```sh
tg store reindex
```

### `tg store backup`

copy the store into a new file, while it is in use; never overwrites a file

```sh
tg store backup <file> [options]
```

| Argument | | What it is |
|---|---|---|
| `file` | required | the new file. |

| Option | What it does |
|---|---|
| `--encrypt` | compress and encrypt with a password, typed at a hidden prompt or piped on stdin; it is never kept — lose it and the file cannot be opened. |

### `tg store restore`

put a backup in place of the store; the store it replaces is kept beside it, never deleted

```sh
tg store restore <file>
```

| Argument | | What it is |
|---|---|---|
| `file` | required | a file `store backup` wrote; one written with --encrypt asks for its password. |

### `tg store decrypt`

open a file written with --encrypt into a new file; asks for its password

```sh
tg store decrypt <file> [options]
```

| Argument | | What it is |
|---|---|---|
| `file` | required | a file `store backup --encrypt` or `store export --encrypt` wrote. |

| Option | What it does |
|---|---|
| `--output <file>` | the new file, readable only by you. |

### `tg store repair`

bring every table to this build's shape, deleting nothing: a table of the wrong shape is kept as a copy beside a new one

```sh
tg store repair [options]
```

| Option | What it does |
|---|---|
| `--dry-run` | say what it would do, and change nothing. |

### `tg store copies`

the tables `store repair` kept as copies

#### `tg store copies delete`

delete one copy `store repair` kept, named exactly; refuses any other table

```sh
tg store copies delete <name>
```

| Argument | | What it is |
|---|---|---|
| `name` | required | the copy's name, as `store repair` printed it. |

## `tg conversations`

the conversations inside a chat, found in the stored messages by replies, mentions and who wrote next

### `tg conversations build`

find a chat's conversations in what the store holds, replacing the last build; without --chat, every chat that changed since its build and every group never built; never asks the messenger

```sh
tg conversations build [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--analyze` | link batches using the configured analysis provider; requires --chat and remembers consent for this chat/provider. |
| `--provider <provider>` | analysis: agent, openai or anthropic. |
| `--model <model>` | analysis model; overrides analysisModel. |
| `--base-url <url>` | analysis API endpoint; overrides analysisBaseUrl. |
| `--size <n>` | analysis answer messages per batch, 10–200; default 50. |
| `--max-tokens <n>` | analysis input/output reservation cap per run; default 100000. |
| `--max-chats <n>` | at most this many chats in one run; 20 if not given. |

### `tg conversations list`

a chat's conversations, the newest first: when, how many messages, how many people

```sh
tg conversations list [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--since-time <time>` | only those that started at this ISO 8601 time, or 30m / 2h / 1d ago, or later. |
| `--limit <n>` | how many. |

### `tg conversations show`

one conversation's messages, oldest first — by its id, or the one a message is in

```sh
tg conversations show <conversation> [message]
```

| Argument | | What it is |
|---|---|---|
| `conversation` | required | a conversation id from `conversations list`; or a chat: its title or part of it, its id, @username, or `me` for Saved Messages, with a message. |
| `message` | optional | a message id in that chat: show the conversation it is in. |

### `tg conversations related`

the conversations nearest in meaning to the one a message is in, in every built chat, best first — from the vectors `conversations embed` stored; runs no model

```sh
tg conversations related <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `message` | required | a message id in that chat. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many. |
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |

### `tg conversations status`

how fresh each built chat's conversations and vectors are: messages the build has not seen, chunks with a current, stale or missing vector

```sh
tg conversations status [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |

### `tg conversations batches`

windows of a chat for your own AI agent to link: which earlier message each one answers

#### `tg conversations batches status`

how many messages still wait for an answer, in how many batches, and how much text

```sh
tg conversations batches status [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--size <n>` | messages to answer per batch, 10–200; 50 by default. |

#### `tg conversations batches next`

the next window to answer, with the messages before it; message text goes to stdout only

```sh
tg conversations batches next [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--size <n>` | messages to answer per batch, 10–200; 50 by default. |

### `tg conversations links`

your agent's answers: which earlier message each message of a batch answers

#### `tg conversations links add`

store your agent's answer to a batch, read as JSON from stdin: { "model", "answers": [{ "message", "parent", "confidence" }] }; all or nothing

```sh
tg conversations links add [options]
```

| Option | What it does |
|---|---|
| `--batch <id>` | the batch id `conversations batches next` printed. |

#### `tg conversations links clear`

drop your agent's answers for a chat, or only one model's; messages are never touched

```sh
tg conversations links clear [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--model <model>` | only the answers this model gave. |

### `tg conversations consents`

remembered analysis permissions for this account's chats and provider endpoints

#### `tg conversations consents list`



```sh
tg conversations consents list
```

#### `tg conversations consents revoke`



```sh
tg conversations consents revoke [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | revoke only this chat's consents; defaults to every chat. |
| `--provider <identity>` | exact provider identity from consents list; defaults to every provider. |

### `tg conversations embed`

compute a vector for each chunk of a chat's conversations for search by meaning — on this machine, or with --provider through a service and your key; resumes where it stopped; without --chat, every built chat with chunks left, on this machine only

```sh
tg conversations embed [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |
| `--workers <n>` | local: sessions in parallel, each with its own copy of the model (\~0.7 GB each). |
| `--threads <n>` | local: threads in all (default: min(8, cores)). |
| `--concurrency <n>` | remote: requests at once (default: 4). |
| `--max-tokens <n>` | remote: stop before a run that could send more tokens than this. |
| `--max-chats <n>` | at most this many chats in one run; 20 if not given. |
| `--max-chunks <n>` | at most this many chunks embedded in one run; 2000 if not given, and no limit with --chat. |

#### `tg conversations embed status`

how many chunks of a chat have a vector of the model, how many are left, and what is left costs

```sh
tg conversations embed status [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |

#### `tg conversations embed clear`

drop a chat's vectors, or only one model's; messages and conversations are never touched

```sh
tg conversations embed clear [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |

## `tg attachments`

the files of stored messages: their text in the local store, for content: in a search

### `tg attachments extract`

read the text of downloaded files — text, PDF/DOCX text layers, ODT/ODS/XLSX/PPTX/EPUB — into the local store, for content: in a search

```sh
tg attachments extract [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat's files; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--from-dir <dir>` | match files in this nonrecursive directory; needs --chat. |
| `--cursor <cursor>` | continue from the cursor returned by a bounded extraction. |
| `--download` | first save the files no download saved yet, from the messenger, into --output-dir. |
| `--output-dir <dir>` | with --download, where to save them; created if missing. |
| `--limit <n>` | read at most this many files; run it again to continue. |
| `--ocr` | explicitly call models.ocr for bulk image and scanned-PDF text extraction. |
| `--concurrency <n>` | remote: requests at once (default: 4). |

### `tg attachments list`

files of stored messages, where each was saved and whether its text is held — never the text

```sh
tg attachments list [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat's files; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--needs-text` | only files saved here whose text nobody has yet: what an agent reads and writes back. |
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |

### `tg attachments show`

read a bounded chunk of one retained attachment; JSON includes base64 bytes

```sh
tg attachments show <chat> [message] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; or a msg: locator alone. |
| `message` | optional | the message id. |

| Option | What it does |
|---|---|
| `--attachment <n>` | file position from 1; required for several files. |
| `--page <n>` | render one PDF page as PNG, from 1; optional unpdf/canvas, no OCR. |
| `--offset-bytes <n>` | byte offset from 0. |
| `--chunk-bytes <n>` | bytes to return, 1–1048576 (default524288). |
| `--if-sha256 <hash>` | require the whole file SHA-256 from the preceding chunk. |

### `tg attachments text`

the text of one file, as an agent read it

#### `tg attachments text set`

keep the text an agent read from a file — a scan, a photo — so content: finds it; nothing is sent

```sh
tg attachments text set <chat> [message] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages; or a msg: locator, with no message id after it. |
| `message` | optional | the message id. |

| Option | What it does |
|---|---|
| `--attachment <n>` | which file of the message, from 1; needed when it has more than one. |
| `--text-file <path>` | read the text from this file; - or none reads stdin. |

## `tg tags`

your own labels on chats, people and messages, kept in the local store and never sent; tag: in a search finds them

### `tg tags auto`

derive local group/channel tags from cached metadata using keyword rules

**Changes something on this computer only.**

```sh
tg tags auto [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a stored group/channel; repeat to select several. Default: ``. |
| `--limit <number>` | process at most 1–500 chats. Default: `50`. |
| `--refresh-metadata` | read current descriptions from the messenger before classifying. |
| `--dry-run` | preview cached classification without changing the store. |

### `tg tags add`

put tags on one chat, person or message

**Changes something on this computer only.**

```sh
tg tags add <tag> [options]
```

| Argument | | What it is |
|---|---|---|
| `tag` | required | one or more tags: 1–32 letters a–z, digits and hyphens; upper case is lowered. |

| Option | What it does |
|---|---|
| `--chat <chat>` | the chat to tag, or the chat of --message; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--contact <person>` | the person to tag: their id, @username or name, as the local store knows them. |
| `--message <message>` | the message to tag: its id in --chat, or a msg: locator alone. |

### `tg tags remove`

take tags off one chat, person or message

**Changes something on this computer only.**

```sh
tg tags remove <tag> [options]
```

| Argument | | What it is |
|---|---|---|
| `tag` | required | one or more tags: 1–32 letters a–z, digits and hyphens; upper case is lowered. |

| Option | What it does |
|---|---|
| `--chat <chat>` | the chat to untag, or the chat of --message; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--contact <person>` | the person to untag: their id, @username or name, as the local store knows them. |
| `--message <message>` | the message to untag: its id in --chat, or a msg: locator alone. |
| `--source <manual\|auto>` | remove only this ownership claim. |

### `tg tags list`

what is tagged: this account's chats and messages, and the people of its messenger

```sh
tg tags list [options]
```

| Option | What it does |
|---|---|
| `--tag <tag>` | only this tag. |
| `--source <manual\|auto>` | only labels with this ownership claim. |
| `--type <names>` | only what is tagged of this type: chat, contact or message. |

## `tg metadata`

cached group/channel descriptions for local automatic tags

### `tg metadata get`



```sh
tg metadata get [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | a stored chat. |

### `tg metadata refresh`



**Changes something on this computer only.**

```sh
tg metadata refresh [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | stored group/channel; repeat for several. Default: ``. |
| `--only-missing` | only chats with no metadata yet; without --chat, every stored group/channel. |
| `--limit <number>` | process at most 1–500 chats. Default: `50`. |

## `tg stats`

statistics about messages, chats and their authors

### `tg stats messages`

message statistics from the local store

#### `tg stats messages show`

how many stored messages match, by chat, sender, day or hour — the local store only; optionally fetches new messages with --sync-first

```sh
tg stats messages show [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query, as for search messages; none counts every stored message; with --saved, more words AND-ed to it. |

| Option | What it does |
|---|---|
| `--sync-first` | first fetch new messages within the chat, time and message bounds. |
| `--max-chats <n>` | refresh at most this many chats (default: 5). |
| `--sync-time <duration>` | stop fetching after this long (default: 30s). |
| `--max-messages <n>` | fetch at most this many messages total (default: 500). |
| `--by <chat\|sender\|day\|hour>` | what to count by (default: chat). |
| `--chat <chat>` | only this chat — the same as chat: in the query; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every account of this messenger held in the store; personal, bots or all — the same as in: in the query. |
| `--limit <n>` | how many rows. |
| `--timezone <zone>` | the IANA timezone for calendar days and hours. |
| `--exact` | bare words and quotes match their exact form only, as exact:word does; text: still matches every form. |
| `--saved <name\|id>` | count what a saved search or an earlier run matches; options typed here replace its own. |

#### `tg stats messages counters`

per-counter observations and bounded remote refresh

#### `tg stats messages counters show`

show saved counter values and their observation freshness

```sh
tg stats messages counters show [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | strict Lucene query over stored messages. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | held accounts of this messenger; refresh uses the active account. |
| `--exact` | bare words match exact forms. |
| `--timezone <zone>` | IANA timezone for query dates. |
| `--selection <json>` | pinned counter-targets selection from counters show; conflicts with query and scope. |
| `--counters <names>` | distinct views,reactions,comments fields; all three by default. |
| `--limit <n>` | messages, 1–100; 20 by default. |
| `--max-age <duration>` | maximum fresh observation age; 24h by default. |

#### `tg stats messages counters refresh`

read authoritative counters for bounded messages and update their local observations

**Changes something on this computer only.**

```sh
tg stats messages counters refresh [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | strict Lucene query over stored messages. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | held accounts of this messenger; refresh uses the active account. |
| `--exact` | bare words match exact forms. |
| `--timezone <zone>` | IANA timezone for query dates. |
| `--selection <json>` | pinned counter-targets selection from counters show; conflicts with query and scope. |
| `--counters <names>` | distinct views,reactions,comments fields; all three by default. |
| `--limit <n>` | messages, 1–100; 20 by default. |
| `--max-messages <n>` | maximum messages to refresh, 1–100. |
| `--sync-time <duration>` | remote refresh budget; 30s by default, maximum 5m. |
| `--dry-run` | preview exact stored targets and counter capabilities without connecting. |

#### `tg stats messages unanswered`

oldest detected questions without an observed qualifying explicit reply

```sh
tg stats messages unanswered [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query; none selects every stored message. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every held account of this messenger; personal, bots or all. |
| `--exact` | bare words match exact forms rather than stems. |
| `--saved <name\|id>` | run a saved report of this kind; typed report options replace stored options. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--limit <n>` | report rows, 1–100; 20 if not given. |
| `--answerer <person>` | stored name, alias, @username, ID or person:provider/account/id; ambiguous names require a choice; repeat for more. |
| `--older-than <duration>` | minimum age of a question without an observed qualifying answer. |

#### `tg stats messages discussion`

viewed posts with little recorded discussion

```sh
tg stats messages discussion [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query; none selects every stored message. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every held account of this messenger; personal, bots or all. |
| `--exact` | bare words match exact forms rather than stems. |
| `--saved <name\|id>` | run a saved report of this kind; typed report options replace stored options. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--limit <n>` | report rows, 1–100; 20 if not given. |
| `--min-views <n>` | minimum known cumulative views. |
| `--max-replies <n>` | maximum observed discussion replies. |

#### `tg stats messages top`

rank stored messages by a measure or explainable score; counters are snapshots with per-field observation freshness

```sh
tg stats messages top [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query; none selects every stored message. |

| Option | What it does |
|---|---|
| `--sync-first` | first fetch new messages within the chat, time and message bounds. |
| `--max-chats <n>` | refresh at most this many chats (default: 5). |
| `--sync-time <duration>` | stop fetching after this long (default: 30s). |
| `--max-messages <n>` | fetch at most this many messages total (default: 500). |
| `--measure <name>` | the ranking metric; not with score or weights. One of: `views`, `reactions`, `forwards`, `comments`, `replies`, `thread-size`. |
| `--score <preset>` | helpful/active for authors; engaging for either target. One of: `helpful`, `active`, `engaging`. |
| `--weights <json>` | the complete component weights; replaces preset weights. |
| `--message-kind <kind>` | select proven all, posts or comments before ranking. One of: `all`, `posts`, `comments`. |
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every held account of this messenger; personal, bots or all. |
| `--timezone <zone>` | the IANA timezone for dates and active days. |
| `--exact` | bare words match exact forms rather than stems. |
| `--limit <n>` | ranked rows, 1–100. |
| `--saved <name\|id>` | run a saved query or ranking run; typed options replace stored options. |

#### `tg stats messages evidence`

bounded messages, answer pairs or retention members from an exact drilldown selection

```sh
tg stats messages evidence <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `message` | required | the canonical message locator, or retention cohort reference, from drilldown. |

| Option | What it does |
|---|---|
| `--selection <json>` | the resolved ranking selection returned in drilldown. |
| `--component <name>` | the exposed ranking component. |
| `--limit <n>` | evidence rows, 1–100; 20 if not given. |
| `--cursor <cursor>` | continue the same component and stored-evidence fingerprint. |

### `tg stats contacts`

statistics about human authors

#### `tg stats contacts responses`

counts and median/p90 latency for selected human answering identities

```sh
tg stats contacts responses [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query; none selects every stored message. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every held account of this messenger; personal, bots or all. |
| `--exact` | bare words match exact forms rather than stems. |
| `--saved <name\|id>` | run a saved report of this kind; typed report options replace stored options. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--limit <n>` | report rows, 1–100; 20 if not given. |
| `--answerer <person>` | stored name, alias, @username, ID or person:provider/account/id; ambiguous names require a choice; repeat for more. |

#### `tg stats contacts top`

rank the human authors of stored messages by a measure or explainable score; counters are snapshots with per-field observation freshness

```sh
tg stats contacts top [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | a strict Lucene query; none selects every stored message. |

| Option | What it does |
|---|---|
| `--sync-first` | first fetch new messages within the chat, time and message bounds. |
| `--max-chats <n>` | refresh at most this many chats (default: 5). |
| `--sync-time <duration>` | stop fetching after this long (default: 30s). |
| `--max-messages <n>` | fetch at most this many messages total (default: 500). |
| `--measure <name>` | the ranking metric; not with score or weights. One of: `messages`, `words`, `reactions`, `replies`, `answers`, `answer-time`, `threads`, `active-days`. |
| `--score <preset>` | helpful/active for authors; engaging for either target. One of: `helpful`, `active`, `engaging`. |
| `--weights <json>` | the complete component weights; replaces preset weights. |
| `--message-kind <kind>` | select proven all, posts or comments before ranking. One of: `all`, `posts`, `comments`. |
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every held account of this messenger; personal, bots or all. |
| `--timezone <zone>` | the IANA timezone for dates and active days. |
| `--exact` | bare words match exact forms rather than stems. |
| `--limit <n>` | ranked rows, 1–100. |
| `--saved <name\|id>` | run a saved query or ranking run; typed options replace stored options. |
| `--min-messages <n>` | minimum selected messages per author; 1, or 5 for engaging. |

#### `tg stats contacts evidence`

bounded messages, answer pairs or retention members from an exact drilldown selection

```sh
tg stats contacts evidence <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `person` | required | the exact native person id from the ranking row. |

| Option | What it does |
|---|---|
| `--selection <json>` | the resolved ranking selection returned in drilldown. |
| `--component <name>` | the exposed ranking component. |
| `--limit <n>` | evidence rows, 1–100; 20 if not given. |
| `--cursor <cursor>` | continue the same component and stored-evidence fingerprint. |

### `tg stats chats`

statistics about one chat

#### `tg stats chats show`

a group's or channel's numbers for a period: messages, active members, replies, reactions, questions answered, joins and leaves — counted from the local store; joins and leaves are asked of the messenger

```sh
tg stats chats show <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | ISO 8601, or 2h / 1d ago; 7 days ago if not given. |
| `--by <day\|week>` | also one row per calendar day or week (weeks start on Monday). |
| `--timezone <zone>` | the IANA timezone for calendar days. |

#### `tg stats chats newcomers`

known-join members and their help within a join window

```sh
tg stats chats newcomers <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | from this ISO 8601 time, or 2h / 1d ago; 30d ago if not given. |
| `--until-time <time>` | through this ISO 8601 time, or 2h / 1d ago. |
| `--within <duration>` | the help window after a known newcomer join. |
| `--saved <name\|id>` | run a saved report of this kind; typed report options replace stored options. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--limit <n>` | report rows, 1–100; 20 if not given. |
| `--answerer <person>` | stored name, alias, @username, ID or person:provider/account/id; ambiguous names require a choice; repeat for more. |

#### `tg stats chats retention`

joining cohorts and observed checkpoint membership from saved roster observations

```sh
tg stats chats retention <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--since-time <time>` | joining period starts at ISO 8601 or a relative time; last 90 days by default. |
| `--until-time <time>` | joining period ends at this time; now by default. |
| `--checkpoints <durations>` | up to 10 increasing joining ages, comma separated; 1d,7d,30d by default. |
| `--within <duration>` | activity and early departure window after joining; 7d by default. |
| `--by <day\|week>` | group joining dates by calendar day or Monday week. One of: `day`, `week`. |
| `--timezone <zone>` | IANA timezone for joining cohorts. |
| `--limit <n>` | cohorts and member evidence, 1–100. |

#### `tg stats chats official`

what Telegram itself computed for a group or channel you administer: totals against the previous period, top people and every graph as JSON series; the messenger picks the period

```sh
tg stats chats official <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg stats tasks`

task statistics

#### `tg stats tasks show`

per chat: how many tasks are open, the oldest open one, the median time to close

```sh
tg stats tasks show [options]
```

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--type <name>` | only this type: question, request, mention or promise. |

### `tg stats charts`

a chart's data from a chat's statistics, and optionally a dark SVG or PNG image

```sh
tg stats charts <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

| Option | What it does |
|---|---|
| `--chart-kind <messages\|active\|membership>` | what to draw: messages, active authors, or joins and leaves. Default: `messages`. |
| `--by <day\|week>` | one point per calendar day or week (weeks start on Monday). Default: `day`. |
| `--since-time <time>` | ISO 8601, or 2h / 1d ago; 7 days ago if not given. |
| `--timezone <zone>` | the IANA timezone for calendar days. |
| `--output <file>` | write a dark image to a new .svg or .png file. |

## `tg tasks`

what waits on you — unanswered questions, mentions, requests, promises — kept in the local store; review and serve add them

### `tg tasks list`

tasks, oldest first, with their message or note source

```sh
tg tasks list [options]
```

| Option | What it does |
|---|---|
| `--state <state>` | only tasks in this state: open, done or dismissed. |
| `--chat <chat>` | only this chat's tasks; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--type <names>` | only these types, comma-separated: question, request, mention, promise. |
| `--before-time <time>` | only tasks opened before this ISO 8601 time, or 2h / 1d ago. |
| `--limit <n>` | how many. |

### `tg tasks add`

add a task for a stored message or note — a promise, a request

```sh
tg tasks add <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `message` | required | a message locator, msg:<provider>/<account>/<chat>/<message>, or note:<id>. |

| Option | What it does |
|---|---|
| `--type <name>` | the task's type: question, request, mention or promise. |

### `tg tasks close`

close a task: done, or dismissed when it needs no answer; a closed task stays closed

```sh
tg tasks close <task> [options]
```

| Argument | | What it is |
|---|---|---|
| `task` | required | the task's id, as tasks list shows it. |

| Option | What it does |
|---|---|
| `--as <state>` | how it is closed: done, or dismissed — it needs no answer. |
| `--reason <text>` | why, kept with the task — no-reply-needed, for example. |

## `tg search`

find things by text: search all for everything the local store holds, or one resource

### `tg search all`

search everything the local store holds — messenger messages, mail and notes — best match first; start here when you do not know where something was written

```sh
tg search all <query> [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | required | strict Lucene query: words, "phrases", AND/OR/NOT, field groups and date ranges. |

| Option | What it does |
|---|---|
| `--only <resources>` | only these, separated by commas: messages, mail, notes. |
| `--limit <n>` | how many. |
| `--exact` | bare words and quotes match their exact form only, as exact:word does. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |

### `tg search messages`

search messenger messages in the local store and on the messenger's server (--backend); optionally fetches new messages with --sync-first; --discover searches the archive only

```sh
tg search messages [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | strict Lucene query: words, "phrases", AND/OR/NOT, field groups and date ranges; --language legacy keeps discovery; with --saved, more words AND-ed to it. |

| Option | What it does |
|---|---|
| `--sync-first` | first fetch new messages within the chat, time and message bounds. |
| `--max-chats <n>` | refresh at most this many chats (default: 5). |
| `--sync-time <duration>` | stop fetching after this long (default: 30s). |
| `--max-messages <n>` | fetch at most this many messages total (default: 500). |
| `--thread` | the stored reply chain and replies instead of time neighbours; falls back when no graph exists. |
| `--thread-hops <n>` | at most this many links from the hit (default: 8). |
| `--thread-messages <n>` | at most this many messages in each thread context (default: 50). |
| `--thread-bytes <n>` | at most this many bytes of whole messages and links in each context (default: 65536). |
| `--thread-within <duration>` | messages within this long either side of the hit (default: 1d). |
| `--backend <archive\|server\|both>` | where to search: the local archive, the messenger's server, or both (default: both; message discovery uses archive only). |
| `--server-time <duration>` | stop waiting for the server after this long (default: 5s). |
| `--chat <chat>` | only this chat — the same as chat: in the query; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every account of this messenger held in the store; personal, bots or all — the same as in: in the query. |
| `--type <text\|voice\|file>` | only messages of this type: text alone, a voice message, or a file. |
| `--limit <n>` | how many. |
| `--newest` | newest first instead of best first. |
| `--exact` | bare words and quotes match their exact form only, as exact:word does; text: still matches every form. |
| `--context <n>` | messages before and after each hit; 2 in the terminal, 0 otherwise. |
| `--discover` | find partial lexical matches and eligible replies in the local archive; results are evidence, not confirmed answers. |
| `--language <lucene\|legacy>` | the query language: strict Lucene or legacy discovery. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--regex` | the words are one regular expression, case-insensitive, tested against every stored text. |
| `--saved <name\|id>` | run a saved search or an earlier run; options typed here replace its own. |

### `tg search mail`

search the mail imported into the local store — memo mail import brings it in

```sh
tg search mail [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | strict Lucene query: words, "phrases", AND/OR/NOT, field groups and date ranges. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this mail thread, by id or subject. |
| `--limit <n>` | how many. |
| `--newest` | newest first instead of best first. |
| `--exact` | bare words and quotes match their exact form only, as exact:word does; text: still matches every form. |
| `--context <n>` | messages before and after each hit; 2 in the terminal, 0 otherwise. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |

### `tg search notes`

search the notes — written in memo, or imported from a notes folder — by words and, with the local text model, by meaning; each hit says which found it and what it links to

```sh
tg search notes <query> [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | required | strict Lucene query: words, "phrases", AND/OR/NOT, tag: and date ranges. |

| Option | What it does |
|---|---|
| `--type <internal\|file>` | only notes written in memo, or only notes from a folder. |
| `--folder <id>` | only this notes folder, by its id; repeat it for more. |
| `--tag <tag>` | only notes with this tag. |
| `--filter <query>` | a query every hit must also match; it does not change the search by meaning. |
| `--limit <n>` | how many. |
| `--offset <n>` | skip this many, for the next page. |
| `--exact` | words as written only; meaning is not searched. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |

### `tg search conversations`

the conversations nearest to a query in meaning and in words, best first, in one chat or every one — meaning after `conversations embed`; runs on this machine

```sh
tg search conversations <query> [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | required | what to look for, in your own words, in any language the model reads. |

| Option | What it does |
|---|---|
| `--model <model>` | local: a model id from `models text list` (default: e5-small); remote: the provider's model. |
| `--provider <provider>` | embedding provider: local or openai; flags override profile settings. |
| `--base-url <url>` | a server with OpenAI's /v1/embeddings: Gemini, Jina, or Ollama and LM Studio on this machine. |
| `--dims <n>` | remote: the vector size — needed with --base-url; shortens an OpenAI model's. |
| `--max-chats <n>` | at most this many chats; 5 with --sync-first, 20 with --refresh if not given. |
| `--max-chunks <n>` | at most this many chunks embedded in one run; 2000 if not given. |
| `--sync-first` | first fetch new messages within the chat, time and message bounds. |
| `--sync-time <duration>` | stop fetching after this long (default: 30s). |
| `--max-messages <n>` | fetch at most this many messages total (default: 500). |
| `--chat <chat>` | only this chat: a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--since-time <time>` | only those still going at this ISO 8601 time, or 30m / 2h / 1d ago, or later. |
| `--filter <query>` | strict Lucene filter: any message in a conversation must match; does not change the meaning query. |
| `--source <source>` | accounts to search: personal, bots, all, or a provider; defaults to the active account. |
| `--timezone <zone>` | IANA timezone for filter dates; system timezone by default. |
| `--limit <n>` | how many. |
| `--refresh` | first build and embed, on this machine, the chats in scope that changed or were never built — within --max-chats and --max-chunks. |

### `tg search topics`

a forum group's topics whose title matches

```sh
tg search topics <chat> <text> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `text` | required | words from the topic's title. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |
| `--page <n>` | which page, starting at 1. |
| `--all` | every row, no paging. |

## `tg searches`

saved searches and the history of search messages and stats messages show, kept in the local store; --saved runs one

### `tg searches create`

save a search under a name without running it; search messages --saved <name> runs it

```sh
tg searches create <name> [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `name` | required | up to 64 letters a–z, digits and hyphens, not only digits. |
| `query` | optional | the query, as for search messages; none matches every stored message. |

| Option | What it does |
|---|---|
| `--chat <chat>` | only this chat — the same as chat: in the query; a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |
| `--source <messenger>` | every account of this messenger held in the store; personal, bots or all — the same as in: in the query. |
| `--limit <n>` | how many. |
| `--newest` | newest first instead of best first. |
| `--exact` | bare words and quotes match their exact form only, as exact:word does; text: still matches every form. |
| `--context <n>` | messages before and after each hit. |
| `--language <lucene\|legacy>` | the query language: strict Lucene or legacy discovery. |
| `--timezone <zone>` | the IANA timezone for calendar date boundaries. |
| `--regex` | the words are one regular expression, case-insensitive, tested against every stored text. |
| `--by <chat\|sender\|day\|hour>` | what stats messages show --saved counts by. |
| `--selection <json>` | save the resolved parent ranking query and options from a drilldown. |
| `--replace` | overwrite a saved search of the same name. |

### `tg searches show`

one saved search or earlier run: its query, options and how often it ran

```sh
tg searches show <name|id>
```

| Argument | | What it is |
|---|---|---|
| `name\|id` | required | a saved search's name, or the id of any row of searches history. |

### `tg searches list`

the saved searches, by name

```sh
tg searches list
```

### `tg searches history`

the searches and counts that ran, newest first — saved ones included; never their results

```sh
tg searches history [options]
```

| Option | What it does |
|---|---|
| `--limit <n>` | how many. |

### `tg searches delete`

delete a saved search, or one run from the history

```sh
tg searches delete <name|id>
```

| Argument | | What it is |
|---|---|---|
| `name\|id` | required | a saved search's name, or the id of any row of searches history. |

### `tg searches clear`

empty the history; saved searches stay

```sh
tg searches clear
```

## `tg flood`

the waits Telegram asked this profile to keep, and a hold on its writes

### `tg flood clear`

forget them, lift the hold and the profile's pace, once Telegram no longer limits the account; changes nothing there

```sh
tg flood clear
```

## `tg replies`

rules that answer messages for you, kept in a file of this profile

### `tg replies add`

add a rule with every default written out, off until you edit and enable it

**Changes something on this computer only.**

```sh
tg replies add <id>
```

| Argument | | What it is |
|---|---|---|
| `id` | required | lower-case letters, digits and -; unique in this profile. |

### `tg replies on`

enable one reply rule; its template must be ready

**Changes something on this computer only.**

```sh
tg replies on <id>
```

| Argument | | What it is |
|---|---|---|
| `id` | required | the rule's id. |

### `tg replies off`

disable one reply rule

**Changes something on this computer only.**

```sh
tg replies off <id>
```

| Argument | | What it is |
|---|---|---|
| `id` | required | the rule's id. |

### `tg replies edit`

change only the named fields of a reply rule; lists replace the whole list

**Changes something on this computer only.**

```sh
tg replies edit <id> [options]
```

| Argument | | What it is |
|---|---|---|
| `id` | required | the rule's id. |

| Option | What it does |
|---|---|
| `--do <actions>` | actions: reply, task, or both, comma-separated. |
| `--kinds <kinds>` | chat kinds: dialog, group; comma-separated, empty for any. |
| `--chats <ids>` | only these chat ids, comma-separated; empty for any. |
| `--not-chats <ids>` | leave these chat ids out, comma-separated; empty clears. |
| `--words <words>` | match any of these whole words, comma-separated; empty clears. |
| `--question` | match only questions. |
| `--no-question` | do not require a question. |
| `--mentions-me` | require a mention of you or a reply to you. |
| `--no-mentions-me` | do not require a mention of you or a reply to you. |
| `--people <ids>` | only these sender ids, comma-separated; empty for any. |
| `--not-people <ids>` | leave these sender ids out, comma-separated; empty clears. |
| `--contacts-only` | match only contacts. |
| `--no-contacts-only` | do not require a contact. |
| `--template <text>` | the reply template. |
| `--model <mode>` | legacy template mode: fill-only or may-reword; use ai blocks instead. |
| `--as-reply` | send as a reply to the matched message. |
| `--no-as-reply` | send without linking to the matched message. |
| `--per-chat <limit>` | at most this many per chat, such as 1/12h. |
| `--per-person <limit>` | at most this many per person, such as 1/1d. |
| `--outside <hours>` | answer outside this 24-hour window, such as 09:00-19:00. |
| `--days <days>` | days of the working window, such as mon-fri or sat,sun. |
| `--timezone <zone>` | the IANA timezone for the working window. |
| `--no-hours` | clear the working window. |

### `tg replies audience`

show the reply audience, who the rules may answer, or replace its named fields; a new file answers everyone a rule matches

**Changes something on this computer only.**

```sh
tg replies audience [options]
```

| Option | What it does |
|---|---|
| `--reply <mode>` | answer all or only listed senders and chats: all, listed. |
| `--allow-people <ids>` | replace allowed sender ids, comma-separated; empty clears. |
| `--allow-chats <ids>` | replace allowed chat ids, comma-separated; empty clears. |
| `--deny-people <ids>` | replace denied sender ids, comma-separated; empty clears; deny wins. |
| `--deny-chats <ids>` | replace denied chat ids, comma-separated; empty clears; deny wins. |

### `tg replies consents`

consent for reply models once per profile and endpoint, with chat opt-outs

#### `tg replies consents show`

show the reply model consent and chat opt-outs; never calls a model

```sh
tg replies consents show
```

#### `tg replies consents grant`

allow incoming message data to go to the configured reply model for this profile; chat opt-outs remain

**Changes something on this computer only.**

```sh
tg replies consents grant
```

#### `tg replies consents revoke`

revoke the profile's reply model consent immediately; chat opt-outs remain

**Changes something on this computer only.**

```sh
tg replies consents revoke
```

#### `tg replies consents deny`

keep this chat's incoming data away from the reply model

**Changes something on this computer only.**

```sh
tg replies consents deny <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | the native chat id, used as written; never resolved over the network. |

#### `tg replies consents allow`

remove this chat's model opt-out; does not grant profile consent

**Changes something on this computer only.**

```sh
tg replies consents allow <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | the native chat id, used as written; never resolved over the network. |

### `tg replies test`

what the rules would have answered in the stored messages, to whom and why — sends nothing, changes nothing, never connects

```sh
tg replies test [rule] [options]
```

| Argument | | What it is |
|---|---|---|
| `rule` | optional | only this rule, by its id; every rule in file order if not given. |

| Option | What it does |
|---|---|
| `--since-time <time>` | from this ISO 8601 time, or 2h / 1d ago; 7d ago if not given. |
| `--ai` | call the configured reply model with stored message data; requires reply consent, otherwise uses fallback. |

### `tg replies pause`

stop every reply rule of this profile at once, a running serve too; resume undoes it

```sh
tg replies pause
```

### `tg replies resume`

let the reply rules answer again after pause

```sh
tg replies resume
```

### `tg replies status`

whether the rules may send, which are on, and who they may answer

```sh
tg replies status
```

## `tg recipients`

the chats this profile may send to, when the list is on

### `tg recipients list`

the chats on the list; empty and off until the first add

```sh
tg recipients list
```

### `tg recipients add`

allow sending to this chat; the first add turns the list on

**Changes something on this computer only.**

```sh
tg recipients add <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat: its title or part of it, its id, @username, or `me` for Saved Messages. |

### `tg recipients remove`

stop allowing this chat; the list stays on

**Changes something on this computer only.**

```sh
tg recipients remove <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | chat id, or the title as the list shows it. |

### `tg recipients clear`

delete the list, which turns it off: this profile may send to any chat again

**Changes something on this computer only.**

```sh
tg recipients clear
```

## `tg sends`

every attempt to send from this profile — never the text

### `tg sends list`

attempts to send, newest first: sent, refused, failed, or not known

```sh
tg sends list [options]
```

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. |

## `tg runs`

recorded runs — what this tool did, and when

### `tg runs list`

recorded runs, newest first

```sh
tg runs list [options]
```

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. Default: `20`. |

### `tg runs show`

one run: what it was, and one line per operation

```sh
tg runs show <run-id>
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `tg runs list`. |

### `tg runs path`

the directory holding one run

```sh
tg runs path <run-id>
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `tg runs list`. |

## `tg config`

the settings in force, and where each one came from

### `tg config migrate`

replace legacy access settings with permissions, preserving this file's effective levels

**Changes something on this computer only.**

```sh
tg config migrate [options]
```

| Option | What it does |
|---|---|
| `--dry-run` | show the migration without writing the file. |

### `tg config show`

the profile, the profiles that exist, and each setting with where it came from

```sh
tg config show [options]
```

| Option | What it does |
|---|---|
| `--bot` | the settings a bot command on this profile gets, rather than the personal account's. |

### `tg config set`

save a setting to the configuration file

**Changes something on this computer only.**

```sh
tg config set <setting> <value> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeoutMs, color, senderColors, record, keepRunsForDays, readOnly, allow, permissions, sendsPerHour, requestsPerMinute, transcribeWith, speechModel, catchUpMarksRead, searchCatchUp, embeddingProvider, embeddingModel, embeddingBaseUrl, embeddingDims, analysisProvider, analysisModel, analysisBaseUrl, models, proxy, readOtherBots, updateCheck, skillHint, searchStemmers.cyrillic, searchStemmers.latin. |
| `value` | required | a number, true or false, or for allow a list like send,reaction. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |
| `--personal` | only for personal accounts — the personal section of the file. |
| `--bot` | only for bots — the bot section of the file. |

### `tg config unset`

remove a setting from the configuration file

**Changes something on this computer only.**

```sh
tg config unset <setting> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeoutMs, color, senderColors, record, keepRunsForDays, readOnly, allow, permissions, sendsPerHour, requestsPerMinute, transcribeWith, speechModel, catchUpMarksRead, searchCatchUp, embeddingProvider, embeddingModel, embeddingBaseUrl, embeddingDims, analysisProvider, analysisModel, analysisBaseUrl, models, proxy, readOtherBots, updateCheck, skillHint, searchStemmers.cyrillic, searchStemmers.latin. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |
| `--personal` | only for personal accounts — the personal section of the file. |
| `--bot` | only for bots — the bot section of the file. |

## `tg doctor`

the state this installation is in, without connecting unless --online

```sh
tg doctor [options]
```

| Option | What it does |
|---|---|
| `--online` | also connect once and read the account; sends nothing. |

### `tg doctor report`

what a problem report holds; writes nothing

#### `tg doctor report create`

write a problem report to a file, and say where to send it

```sh
tg doctor report create [options]
```

| Option | What it does |
|---|---|
| `--run <id>` | the run the report is about; the newest failed one if not given. |
| `--output <file>` | where to write it; a new file in this directory if not given. |

## `tg commands`

commands, options and exit codes as JSON — inspect one command path per call

### `tg commands schema`

one command's argv and result schemas, effects, permissions and retry guidance

```sh
tg commands schema <path>
```

| Argument | | What it is |
|---|---|---|
| `path` | required | one command path, for example: stats messages show. |

## `tg complete`

shell completion: `tg complete zsh` prints the script to source

```sh
tg complete [words]
```

| Argument | | What it is |
|---|---|---|
| `words` | optional |  |

## `tg upgrade`

upgrade tg with the package manager that installed it; --check only looks

```sh
tg upgrade [options]
```

| Option | What it does |
|---|---|
| `--check` | say whether a newer version exists, and install nothing. |

## `tg mcp`

serve this profile to an agent over MCP, on stdin and stdout — `claude mcp add tg -- tg mcp`

```sh
tg mcp [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | override a permission for this server only; repeat for more keys. |
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-mark-read` | no longer used — the profile's permissions decide. |
| `--allow-delete` | no longer used — the profile's permissions decide. |
| `--http` | serve over HTTP on 127.0.0.1 for ChatGPT and Claude in the browser, behind your tunnel; the profile's permissions decide. |
| `--http-confirmation <mode>` | no longer used — writes show no form; the profile's permissions decide. |
| `--port <port>` | the local port for --http (default 8765). |
| `--public-url <url>` | the tunnel's https address the browser apps use, e.g. https://<name>.ts.net. |
| `--revoke` | forget every login given to a browser app; each must log in again. |

### `tg mcp config`

print the mcpServers entry for Claude Desktop, Cursor and others, with full paths; writes nothing

```sh
tg mcp config [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | override a permission for this server only; repeat for more keys. |
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-mark-read` | no longer used — the profile's permissions decide. |
| `--allow-delete` | no longer used — the profile's permissions decide. |

### `tg mcp setup`

add this profile's local MCP server to Codex or Claude Code

**Changes something on this computer only.**

```sh
tg mcp setup <client> [options]
```

| Argument | | What it is |
|---|---|---|
| `client` | required | codex or claude-code. |

| Option | What it does |
|---|---|
| `--allow-writes` | acknowledge that this profile offers writing tools. |
| `--permission <key=level>` | override a permission for this server only; repeat for more keys. |
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-mark-read` | no longer used — the profile's permissions decide. |
| `--allow-delete` | no longer used — the profile's permissions decide. |

### `tg mcp doctor`

check this profile's local MCP handshake and tool list

```sh
tg mcp doctor [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | override a permission for this server only; repeat for more keys. |
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-mark-read` | no longer used — the profile's permissions decide. |
| `--allow-delete` | no longer used — the profile's permissions decide. |

## `tg bot`

a Telegram bot, through the official Bot API and a bot token — not your personal account

### `tg bot auth`

the bot token this profile uses

#### `tg bot auth set`

check a bot token with Telegram, then keep it — typed at a hidden prompt or piped on stdin

**Changes something on this computer only.**

```sh
tg bot auth set
```

#### `tg bot auth show`

where this profile's bot token comes from, and which bot it is

```sh
tg bot auth show
```

#### `tg bot auth remove`

forget this profile's bot token

**Changes something on this computer only.**

```sh
tg bot auth remove
```

### `tg bot list`

every name on this machine that has a bot token; --check asks Telegram which bot each is

```sh
tg bot list [options]
```

| Option | What it does |
|---|---|
| `--check` | ask the messenger who each bot is, with its token. |

### `tg bot chats`

the chats this bot is in — Telegram gives a bot no list of them, so `list` shows the ones it has seen

#### `tg bot chats list`

chats this bot has seen on this machine — not a complete list from Telegram

```sh
tg bot chats list
```

#### `tg bot chats show`

one chat from Telegram, and remember it

```sh
tg bot chats show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |

#### `tg bot chats leave`

take the bot out of a chat; only an admin of the chat can bring it back

**Changes something in Telegram.**

```sh
tg bot chats leave <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |

#### `tg bot chats action`

show what the bot is doing in a chat — typing, sending a photo — for a few seconds

**Changes something in Telegram.**

```sh
tg bot chats action <chat> <action>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `action` | required | what the chat sees. One of: `typing`, `photo`, `video`, `voice`, `file`. |

#### `tg bot chats admins`

the admins of a chat the bot is an admin in

#### `tg bot chats admins list`

the chat's admins and what each may do

```sh
tg bot chats admins list <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |

#### `tg bot chats admins add`

make a member an admin with these rights

**Changes something in Telegram.**

```sh
tg bot chats admins add <chat> <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |
| `person` | required | the person's user id. |

| Option | What it does |
|---|---|
| `--can <rights>` | what they may do, comma-separated: members, admins, info, pin, link, post, edit, delete. |
| `--title <title>` | the title shown beside their name. |

#### `tg bot chats admins remove`

take an admin's rights back; they stay a member

**Changes something in Telegram.**

```sh
tg bot chats admins remove <chat> <person>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |
| `person` | required | the person's user id. |

#### `tg bot chats members`

the people in a chat the bot is an admin in

#### `tg bot chats members remove`

take a person out of a chat; their messages stay

**Changes something in Telegram.**

```sh
tg bot chats members remove <chat> <person> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |
| `person` | required | the person's user id. |

| Option | What it does |
|---|---|
| `--block` | also keep them from coming back by the chat's link. |

#### `tg bot chats rules`

a chat's moderation rules for this bot, kept on this machine

#### `tg bot chats rules show`

the chat's rules; the defaults, marked not saved, if it has none yet

```sh
tg bot chats rules show <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a group's id, or the title of a group this bot has seen. |

#### `tg bot chats rules set`

change one rule — trusted, blocked, blockedNames, links, invites, forwards, blockedPeople, flood.messages, flood.minutes, flood.action, newAccount.days, newAccount.action, consent.delete, consent.remove

**Changes something on this computer only.**

```sh
tg bot chats rules set <chat> <key> <value>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a group's id, or the title of a group this bot has seen. |
| `key` | required | the rule. |
| `value` | required | its new value. |

#### `tg bot chats rules unset`

put one rule back to its default

**Changes something on this computer only.**

```sh
tg bot chats rules unset <chat> <key>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a group's id, or the title of a group this bot has seen. |
| `key` | required | the rule. |

#### `tg bot chats moderate`

judge a group's new messages and joins by its rules, and act as they allow — as the bot

**Changes something in Telegram.**

```sh
tg bot chats moderate <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a group's id, or the title of a group this bot has seen. |

| Option | What it does |
|---|---|
| `--since-time <time>` | judge what came after this ISO 8601 time, or 2h / 1d ago; the saved point stays. |
| `--dry-run` | judge and plan; do nothing. |
| `--allow-dangerous` | yes to every action whose level in the group's rules is ask. |
| `--no-ban` | remove without banning; by default a removed person cannot come back by the link. |
| `--max-actions <n>` | at most this many actions in one run; 10 if not given. |

### `tg bot messages`

the messages in the chats this bot is in

#### `tg bot messages send`

send a message as the bot; without [text], the text is read from stdin

**Changes something in Telegram.**

```sh
tg bot messages send <chat> [text] [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `text` | optional | the message. |

| Option | What it does |
|---|---|
| `--reply-to <message>` | answer this message, by its id in the same chat. |
| `--silent` | deliver without a notification. |
| `--md` | read this messenger's Markdown; see its formatting guide for supported syntax. |
| `--html` | the text is HTML: <b>, <i>, <a href>, <code>. |
| `--file <file>` | attach a file; the text becomes its caption. |
| `--photo <file>` | attach a .jpg, .png or .webp as a photo; the text becomes its caption. |
| `--as-file` | send the --file as a file to download, a video included. |
| `--voice <file>` | send an Ogg Opus file as a voice message, alone, with no text. |
| `--allow-any-file` | send a file even from credential folders or this CLI's own folders. |

#### `tg bot messages list`

the latest messages in a chat; where Telegram gives a bot no history, and with --offline, the ones this bot has seen on this machine

```sh
tg bot messages list <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many, the newest. |

#### `tg bot messages show`

one message by its id in a chat

```sh
tg bot messages show <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `message` | required | message id. |

#### `tg bot messages edit`

replace the text of a message the bot sent

**Changes something in Telegram.**

```sh
tg bot messages edit <chat> <message> <text> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `message` | required | message id. |
| `text` | required | the new text. |

| Option | What it does |
|---|---|
| `--md` | read this messenger's Markdown; see its formatting guide for supported syntax. |
| `--html` | the text is HTML: <b>, <i>, <a href>, <code>. |

#### `tg bot messages delete`

delete messages in a chat the bot can delete in; it cannot be undone

**Changes something in Telegram.**

```sh
tg bot messages delete <chat> <messages> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `messages` | required | message ids. |

| Option | What it does |
|---|---|
| `--allow-dangerous` | delete without asking. |

#### `tg bot messages pin`

pin a message in a chat; quietly unless --notify

**Changes something in Telegram.**

```sh
tg bot messages pin <chat> <message> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `message` | required | message id. |

| Option | What it does |
|---|---|
| `--notify` | tell the chat's members. |

#### `tg bot messages unpin`

unpin a message in a chat

**Changes something in Telegram.**

```sh
tg bot messages unpin <chat> <message>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, user:<id> for a person, or the title of a chat this bot has seen. |
| `message` | required | message id. |

#### `tg bot messages between`

what two or more people wrote in the chats they have all written in — from the local copy, grouped by chat, oldest first; --limit counts per chat. Common chats are the ones this copy saw each of them write in, not a member list from Telegram

```sh
tg bot messages between <people> [options]
```

| Argument | | What it is |
|---|---|---|
| `people` | required | two or more people — an id, @username or part of a name each. |

| Option | What it does |
|---|---|
| `--all-bots` | also read every other bot's copy on this machine that readOtherBots allows. |
| `--bots <profiles>` | also read these bots' copies, comma separated — each allowed by readOtherBots. |
| `--limit <n>` | how many of the latest messages from each chat. |

### `tg bot search`

find what this bot's local copy holds, by text

#### `tg bot search messages`

search the messages this bot has read, sent or received on this machine — the local copy only, best match first; every word must appear; "a phrase", -word, a OR b, from: chat: after: before: has:; by text, by --from, or both

```sh
tg bot search messages [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | the words to find. |

| Option | What it does |
|---|---|
| `--all-bots` | also read every other bot's copy on this machine that readOtherBots allows. |
| `--bots <profiles>` | also read these bots' copies, comma separated — each allowed by readOtherBots. |
| `--limit <n>` | how many. |
| `--newest` | newest first instead of best first. |
| `--from <who>` | only what this person wrote — an id, @username or part of a name; repeat it for any of several. |

### `tg bot recipients`

the chats this bot may write to; with no list, every chat — `clear` removes the list

#### `tg bot recipients list`

the chats on the list, or nothing when there is no list

```sh
tg bot recipients list
```

#### `tg bot recipients add`

allow a chat: its id, `user:<id>`, or the title of a chat this bot has seen

**Changes something on this computer only.**

```sh
tg bot recipients add <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required |  |

#### `tg bot recipients remove`

take a chat off the list

**Changes something on this computer only.**

```sh
tg bot recipients remove <chat>
```

| Argument | | What it is |
|---|---|---|
| `chat` | required |  |

#### `tg bot recipients clear`

remove the list: the bot may write to any chat again

**Changes something on this computer only.**

```sh
tg bot recipients clear
```

### `tg bot sends`

what this bot sent, edited and deleted from this machine — ids and outcomes, never text

#### `tg bot sends list`



```sh
tg bot sends list
```

### `tg bot watch`

print new messages as they arrive and keep them, until Ctrl-C or --timeout (either ends it normally)

```sh
tg bot watch [options]
```

| Option | What it does |
|---|---|
| `--events` | also edits, deletions, buttons pressed and people coming and going; every line names its event. |
| `--types <types>` | only these update types, comma-separated, in the messenger's words. |

### `tg bot callbacks`

answers to the buttons people press under the bot's messages

#### `tg bot callbacks answer`

answer a pressed button by its callback id: --notification shows the person a one-time note, --text replaces the message the button was on

**Changes something in Telegram.**

```sh
tg bot callbacks answer <callback> [options]
```

| Argument | | What it is |
|---|---|---|
| `callback` | required | the callback id `bot watch` printed. |

| Option | What it does |
|---|---|
| `--text <text>` | the message's new text. |
| `--notification <text>` | a note only the person who pressed sees. |

### `tg bot commands`

the bot's command menu — what people see after /

#### `tg bot commands list`

the commands in the menu now

```sh
tg bot commands list
```

#### `tg bot commands set`

replace the whole menu: each command as name=description, e.g. start=Begin

**Changes something in Telegram.**

```sh
tg bot commands set <commands>
```

| Argument | | What it is |
|---|---|---|
| `commands` | required | name=description, one per command. |

#### `tg bot commands clear`

empty the menu

**Changes something in Telegram.**

```sh
tg bot commands clear
```

### `tg bot webhooks`

where the messenger pushes this bot's updates — while one is set, `bot watch` gets nothing

#### `tg bot webhooks list`

the webhooks this bot has

```sh
tg bot webhooks list
```

#### `tg bot webhooks set`

send this bot's updates to an HTTPS address; refused while another is set

**Changes something in Telegram.**

```sh
tg bot webhooks set <url> [options]
```

| Argument | | What it is |
|---|---|---|
| `url` | required | the HTTPS address. |

| Option | What it does |
|---|---|
| `--types <types>` | only these update types, comma-separated, in the messenger's words. |
| `--secret-stdin` | a secret the messenger sends back with each update — asked for, or read from a pipe. |

#### `tg bot webhooks delete`

stop sending updates to this address; with none left, `bot watch` works again

**Changes something in Telegram.**

```sh
tg bot webhooks delete <url>
```

| Argument | | What it is |
|---|---|---|
| `url` | required | the address. |

### `tg bot contacts`

people this bot has seen write — from the local copy on this machine, never asking Telegram unless told to

#### `tg bot contacts show`

one person: the chats they wrote in (with their last message there) and the latest messages of their private chat with the bot

```sh
tg bot contacts show <who> [options]
```

| Argument | | What it is |
|---|---|---|
| `who` | required | an id, @username or part of a name. |

| Option | What it does |
|---|---|
| `--all-bots` | also read every other bot's copy on this machine that readOtherBots allows. |
| `--bots <profiles>` | also read these bots' copies, comma separated — each allowed by readOtherBots. |
| `--limit <n>` | how many messages from the private chat. |
| `--refresh` | read the private chat with them again from the messenger first — one request. |

### `tg bot me`

the bot this profile's token belongs to: id, name and username

```sh
tg bot me
```

### `tg bot store`

the bot's local copy on this machine

#### `tg bot store fetch`

fetch a chat's history into the bot's local copy, newest first; run it again to continue

```sh
tg bot store fetch <chat> [options]
```

| Argument | | What it is |
|---|---|---|
| `chat` | required | a chat id, or the title of a chat this bot has seen. |

| Option | What it does |
|---|---|
| `--limit <n>` | at most this many messages in this run; 1000 if not given. |
| `--page-size <n>` | how many messages one request asks for; 100 if not given. |
| `--pause <duration>` | pause between pages, to stay under the messenger's limits. Default: `1s`. |
| `--since-time <time>` | stop once it reaches messages older than this: ISO 8601, or 2h / 1d ago. |
| `--last <n>` | stop once the newest n messages are held. |
| `--from <link>` | start at this message link, inclusive; otherwise use the newest message already known. |

### `tg bot mcp`

serve this bot to an agent over MCP, on stdin and stdout — `claude mcp add sales-bot -- tg sales bot mcp`

```sh
tg bot mcp [options]
```

| Option | What it does |
|---|---|
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-delete` | no longer used — the profile's permissions decide. |
| `--allow-moderate` | no longer used — the profile's permissions decide. |

#### `tg bot mcp config`

print the mcpServers entry for Claude Desktop, Cursor and others, with full paths; writes nothing

```sh
tg bot mcp config [options]
```

| Option | What it does |
|---|---|
| `--confirm-send` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-dangerous` | no longer used — writes show no form; the profile's permissions decide. |
| `--allow-send` | no longer used — the profile's permissions decide; kept so an old setup still starts. |
| `--allow-delete` | no longer used — the profile's permissions decide. |
| `--allow-moderate` | no longer used — the profile's permissions decide. |

### `tg bot api`

every operation of the official Bot API, generated from its schema

```sh
tg bot api [options]
```

| Option | What it does |
|---|---|
| `--store-token <profile>` | keep a returned authentication token only in this bot profile's OS keyring; never print it. |

#### `tg bot api get-updates`

Use this method to receive incoming updates using long polling (wiki). Returns an Array of Update objects. — destructive (getUpdates)

**Changes something in Telegram.**

```sh
tg bot api get-updates [options]
```

| Option | What it does |
|---|---|
| `--offset <value>` | Identifier of the first update to be returned. Must be greater by one than the highest among the identifiers of previously received updates. By default, updates starting with the earliest unconfirmed update are returned. An update is considered confirmed as soon as getUpdates is called with an offset higher than its update_id. The negative offset can be specified to retrieve updates starting from -offset update from the end of the updates queue. All previous updates will be forgotten. |
| `--limit <value>` | Limits the number of updates to be retrieved. Values between 1-100 are accepted. Defaults to 100. |
| `--poll-timeout <value>` | Timeout in seconds for long polling. Defaults to 0, i.e. usual short polling. Should be positive, short polling should be used for testing purposes only. |
| `--allowed-updates <value>` | A JSON-serialized list of the update types you want your bot to receive. For example, specify ["message", "edited_channel_post", "callback_query"] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used. Please note that this parameter doesn't affect updates created before the call to getUpdates, so unwanted updates may be received for a short period of time. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-webhook`

Use this method to specify a URL and receive incoming updates via an outgoing webhook. Whenever there is an update for the bot, we will send an HTTPS POST request to the specified URL, containing a JSON-serialized Update. In case of an unsuccessful request (a request with response HTTP status code different from 2XY), we will repeat the request and give up after a reasonable amount of attempts. Returns True on success. — write (setWebhook)

**Changes something in Telegram.**

```sh
tg bot api set-webhook [options]
```

| Option | What it does |
|---|---|
| `--url <value>` | HTTPS URL to send updates to. Use an empty string to remove webhook integration. |
| `--certificate <value>` | Upload your public key certificate so that the root certificate in use can be checked. See our self-signed guide for details. |
| `--ip-address <value>` | The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS. |
| `--max-connections <value>` | The maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40. Use lower values to limit the load on your bot's server, and higher values to increase your bot's throughput. |
| `--allowed-updates <value>` | A JSON-serialized list of the update types you want your bot to receive. For example, specify ["message", "edited_channel_post", "callback_query"] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used. Please note that this parameter doesn't affect updates created before the call to the setWebhook, so unwanted updates may be received for a short period of time. |
| `--drop-pending-updates <value>` | Pass True to drop all pending updates. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-webhook`

Use this method to remove webhook integration if you decide to switch back to getUpdates. Returns True on success. — destructive (deleteWebhook)

**Changes something in Telegram.**

```sh
tg bot api delete-webhook [options]
```

| Option | What it does |
|---|---|
| `--drop-pending-updates <value>` | Pass True to drop all pending updates. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-webhook-info`

Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty. — read (getWebhookInfo)

```sh
tg bot api get-webhook-info
```

#### `tg bot api get-me`

A simple method for testing your bot's authentication token. Requires no parameters. Returns basic information about the bot in form of a User object. — read (getMe)

```sh
tg bot api get-me
```

#### `tg bot api log-out`

Use this method to log out from the cloud Bot API server before launching the bot locally. You must log out the bot before running it locally, otherwise there is no guarantee that the bot will receive updates. After a successful call, you can immediately log in on a local server, but will not be able to log in back to the cloud Bot API server for 10 minutes. Returns True on success. Requires no parameters. — destructive (logOut)

**Changes something in Telegram.**

```sh
tg bot api log-out
```

#### `tg bot api close`

Use this method to close the bot instance before moving it from one local server to another. You need to delete the webhook before calling this method to ensure that the bot isn't launched again after server restart. The method will return error 429 in the first 10 minutes after the bot is launched. Returns True on success. Requires no parameters. — destructive (close)

**Changes something in Telegram.**

```sh
tg bot api close
```

#### `tg bot api send-message`

Use this method to send text messages. On success, the sent Message is returned. — write (sendMessage)

**Changes something in Telegram.**

```sh
tg bot api send-message [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--text <value>` | Text of the message to be sent, 1-4096 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the message text. See formatting options for more details. |
| `--entities <value>` | A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode. |
| `--link-preview-options <value>` | Link preview generation options for the message. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api forward-message`

Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned. — write (forwardMessage)

**Changes something in Telegram.**

```sh
tg bot api forward-message [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be forwarded; required if the message is forwarded to a direct messages chat. |
| `--from-chat-id <value>` | Unique identifier for the chat where the original message was sent (or username of the target bot, supergroup or channel in the format @username). |
| `--video-start-timestamp <value>` | New start timestamp for the forwarded video in the message. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the forwarded message from forwarding and saving. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; only available when forwarding to private chats. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. |
| `--message-id <value>` | Message identifier in the chat specified in from_chat_id. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api forward-messages`

Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an Array of MessageId of the sent messages is returned. — write (forwardMessages)

**Changes something in Telegram.**

```sh
tg bot api forward-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the messages will be forwarded; required if the messages are forwarded to a direct messages chat. |
| `--from-chat-id <value>` | Unique identifier for the chat where the original messages were sent (or username of the target bot, supergroup or channel in the format @username). |
| `--message-ids <value>` | A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order. |
| `--disable-notification <value>` | Sends the messages silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the forwarded messages from forwarding and saving. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api copy-message`

Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_ids is known to the bot. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success. — write (copyMessage)

**Changes something in Telegram.**

```sh
tg bot api copy-message [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--from-chat-id <value>` | Unique identifier for the chat where the original message was sent (or username of the target bot, supergroup or channel in the format @username). |
| `--message-id <value>` | Message identifier in the chat specified in from_chat_id. |
| `--video-start-timestamp <value>` | New start timestamp for the copied video in the message. |
| `--caption <value>` | New caption for media, 0-1024 characters after entities parsing. If not specified, the original caption is kept. |
| `--parse-mode <value>` | Mode for parsing entities in the new caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the new caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. Ignored if a new caption isn't specified. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; only available when copying to private chats. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api copy-messages`

Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_ids is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages. On success, an Array of MessageId of the sent messages is returned. — write (copyMessages)

**Changes something in Telegram.**

```sh
tg bot api copy-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the messages will be sent; required if the messages are sent to a direct messages chat. |
| `--from-chat-id <value>` | Unique identifier for the chat where the original messages were sent (or username of the target bot, supergroup or channel in the format @username). |
| `--message-ids <value>` | A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order. |
| `--disable-notification <value>` | Sends the messages silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent messages from forwarding and saving. |
| `--remove-caption <value>` | Pass True to copy the messages without their captions. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-photo`

Use this method to send photos. On success, the sent Message is returned. — write (sendPhoto)

**Changes something in Telegram.**

```sh
tg bot api send-photo [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--photo <value>` | Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--caption <value>` | Photo caption (may also be used when resending photos by file_id), 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the photo caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. |
| `--has-spoiler <value>` | Pass True if the photo needs to be covered with a spoiler animation. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-live-photo`

Use this method to send live photos. On success, the sent Message is returned. — write (sendLivePhoto)

**Changes something in Telegram.**

```sh
tg bot api send-live-photo [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel (in the format @channelusername). |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--live-photo <value>` | Live photo video to send. The video must be no longer than 10 seconds and must not exceed 10 MB in size. Pass a file_id as String to send a video that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. Sending live photos by a URL is currently unsupported. |
| `--photo <value>` | The static photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. Sending live photos by a URL is currently unsupported. |
| `--caption <value>` | Video caption (may also be used when resending videos by file_id), 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the video caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. |
| `--has-spoiler <value>` | Pass True if the video needs to be covered with a spoiler animation. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-audio`

Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future. — write (sendAudio)

**Changes something in Telegram.**

```sh
tg bot api send-audio [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--audio <value>` | Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--caption <value>` | Audio caption, 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the audio caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--duration <value>` | Duration of the audio in seconds. |
| `--performer <value>` | Performer. |
| `--title <value>` | Track name. |
| `--thumbnail <value>` | Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-document`

Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future. — write (sendDocument)

**Changes something in Telegram.**

```sh
tg bot api send-document [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--document <value>` | File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--thumbnail <value>` | Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--caption <value>` | Document caption (may also be used when resending documents by file_id), 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the document caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--disable-content-type-detection <value>` | Disables automatic server-side content type detection for files uploaded using multipart/form-data. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-video`

Use this method to send video files, Telegram clients support MPEG4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future. — write (sendVideo)

**Changes something in Telegram.**

```sh
tg bot api send-video [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--video <value>` | Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--duration <value>` | Duration of sent video in seconds. |
| `--width <value>` | Video width. |
| `--height <value>` | Video height. |
| `--thumbnail <value>` | Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--cover <value>` | Cover for the video in the message. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--start-timestamp <value>` | Start timestamp for the video in the message. |
| `--caption <value>` | Video caption (may also be used when resending videos by file_id), 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the video caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. |
| `--has-spoiler <value>` | Pass True if the video needs to be covered with a spoiler animation. |
| `--supports-streaming <value>` | Pass True if the uploaded video is suitable for streaming. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-animation`

Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future. — write (sendAnimation)

**Changes something in Telegram.**

```sh
tg bot api send-animation [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--animation <value>` | Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--duration <value>` | Duration of sent animation in seconds. |
| `--width <value>` | Animation width. |
| `--height <value>` | Animation height. |
| `--thumbnail <value>` | Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--caption <value>` | Animation caption (may also be used when resending animation by file_id), 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the animation caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. |
| `--has-spoiler <value>` | Pass True if the animation needs to be covered with a spoiler animation. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-voice`

Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS, or in .MP3 format, or in .M4A format (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future. — write (sendVoice)

**Changes something in Telegram.**

```sh
tg bot api send-voice [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--voice <value>` | Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--caption <value>` | Voice message caption, 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the voice message caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--duration <value>` | Duration of the voice message in seconds. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-video-note`

Use this method to send a rounded square MPEG4 video of up to 1 minute long. On success, the sent Message is returned. — write (sendVideoNote)

**Changes something in Telegram.**

```sh
tg bot api send-video-note [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--video-note <value>` | Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. Sending video notes by a URL is currently unsupported. |
| `--duration <value>` | Duration of sent video in seconds. |
| `--length <value>` | Video width and height, i.e. diameter of the video message. |
| `--thumbnail <value>` | Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-paid-media`

Use this method to send paid media. On success, the sent Message is returned. — write (sendPaidMedia)

**Changes something in Telegram.**

```sh
tg bot api send-paid-media [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. If the chat is a channel, all Telegram Star proceeds from this media will be credited to the chat's balance. Otherwise, they will be credited to the bot's balance. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--star-count <value>` | The number of Telegram Stars that must be paid to buy access to the media; 1-25000. |
| `--media <value>` | A JSON-serialized Array describing the media to be sent; up to 10 items. |
| `--payload <value>` | Bot-defined paid media payload, 0-128 bytes. This will not be displayed to the user, use it for your internal processes. |
| `--caption <value>` | Media caption, 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the media caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-media-group`

Use this method to send a group of photos, live photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an Array of Message objects that were sent is returned. — write (sendMediaGroup)

**Changes something in Telegram.**

```sh
tg bot api send-media-group [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the messages will be sent; required if the messages are sent to a direct messages chat. |
| `--media <value>` | A JSON-serialized Array describing messages to be sent, must include 2-10 items. |
| `--disable-notification <value>` | Sends messages silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent messages from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-location`

Use this method to send point on the map. On success, the sent Message is returned. — write (sendLocation)

**Changes something in Telegram.**

```sh
tg bot api send-location [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--latitude <value>` | Latitude of the location. |
| `--longitude <value>` | Longitude of the location. |
| `--horizontal-accuracy <value>` | The radius of uncertainty for the location, measured in meters; 0-1500. |
| `--live-period <value>` | Period in seconds during which the location will be updated (see Live Locations), must be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. Must be 0 for ephemeral messages. |
| `--heading <value>` | For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. |
| `--proximity-alert-radius <value>` | For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-venue`

Use this method to send information about a venue. On success, the sent Message is returned. — write (sendVenue)

**Changes something in Telegram.**

```sh
tg bot api send-venue [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--latitude <value>` | Latitude of the venue. |
| `--longitude <value>` | Longitude of the venue. |
| `--title <value>` | Name of the venue. |
| `--address <value>` | Address of the venue. |
| `--foursquare-id <value>` | Foursquare identifier of the venue. |
| `--foursquare-type <value>` | Foursquare type of the venue, if known. (For example, "arts_entertainment/default", "arts_entertainment/aquarium" or "food/icecream".). |
| `--google-place-id <value>` | Google Places identifier of the venue. |
| `--google-place-type <value>` | Google Places type of the venue. (See supported types.). |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-contact`

Use this method to send phone contacts. On success, the sent Message is returned. — write (sendContact)

**Changes something in Telegram.**

```sh
tg bot api send-contact [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--phone-number <value>` | Contact's phone number. |
| `--first-name <value>` | Contact's first name. |
| `--last-name <value>` | Contact's last name. |
| `--vcard <value>` | Additional data about the contact in the form of a vCard, 0-2048 bytes. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-poll`

Use this method to send a native poll. On success, the sent Message is returned. — write (sendPoll)

**Changes something in Telegram.**

```sh
tg bot api send-poll [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. Polls can't be sent to channel direct messages chats. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--question <value>` | Poll question, 1-300 characters. |
| `--question-parse-mode <value>` | Mode for parsing entities in the question. See formatting options for more details. Currently, only custom emoji entities are allowed. |
| `--question-entities <value>` | A JSON-serialized list of special entities that appear in the poll question. It can be specified instead of question_parse_mode. |
| `--options <value>` | A JSON-serialized list of 1-12 answer options. |
| `--is-anonymous <value>` | True, if the poll needs to be anonymous, defaults to True. |
| `--type <value>` | Poll type, "quiz" or "regular", defaults to "regular". |
| `--allows-multiple-answers <value>` | Pass True if the poll allows multiple answers, defaults to False. |
| `--allows-revoting <value>` | Pass True if the poll allows to change chosen answer options, defaults to False for quizzes and to True for regular polls. |
| `--shuffle-options <value>` | Pass True if the poll options must be shown in random order. |
| `--allow-adding-options <value>` | Pass True if answer options can be added to the poll after creation; not supported for anonymous polls and quizzes. |
| `--hide-results-until-closes <value>` | Pass True if poll results must be shown only after the poll closes. |
| `--members-only <value>` | Pass True if voting is limited to users who have been members of the chat where the poll is being sent for more than 24 hours; for channel chats only. |
| `--country-codes <value>` | A JSON-serialized list of 0-12 two-letter ISO 3166-1 alpha-2 country codes indicating the countries from which users can vote in the poll; for channel chats only. Use "FT" as a country code to allow users with anonymous numbers to vote. If omitted or empty, then users from any country can participate in the poll. |
| `--correct-option-ids <value>` | A JSON-serialized list of monotonically increasing 0-based identifiers of the correct answer options, required for polls in quiz mode. |
| `--explanation <value>` | Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters with at most 2 line feeds after entities parsing. |
| `--explanation-parse-mode <value>` | Mode for parsing entities in the explanation. See formatting options for more details. |
| `--explanation-entities <value>` | A JSON-serialized list of special entities that appear in the poll explanation. It can be specified instead of explanation_parse_mode. |
| `--explanation-media <value>` | Media added to the quiz explanation. |
| `--open-period <value>` | Amount of time in seconds the poll will be active after creation, 5-2628000. Can't be used together with close_date. |
| `--close-date <value>` | Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 2628000 seconds in the future. Can't be used together with open_period. |
| `--is-closed <value>` | Pass True if the poll needs to be immediately closed. This can be useful for poll preview. |
| `--description <value>` | Description of the poll to be sent, 0-1024 characters after entities parsing. |
| `--description-parse-mode <value>` | Mode for parsing entities in the poll description. See formatting options for more details. |
| `--description-entities <value>` | A JSON-serialized list of special entities that appear in the poll description, which can be specified instead of description_parse_mode. |
| `--media <value>` | Media added to the poll description. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-checklist`

Use this method to send a checklist on behalf of a connected business account. On success, the sent Message is returned. — write (sendChecklist)

**Changes something in Telegram.**

```sh
tg bot api send-checklist [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot in the format @username. |
| `--checklist <value>` | A JSON-serialized object for the checklist to send. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message. |
| `--reply-parameters <value>` | A JSON-serialized object for description of the message to reply to. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-dice`

Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned. — write (sendDice)

**Changes something in Telegram.**

```sh
tg bot api send-dice [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--emoji <value>` | Emoji on which the dice throw animation is based. Currently, must be one of "🎲", "🎯", "🏀", "⚽", "🎳", or "🎰". Dice can have values 1-6 for "🎲", "🎯" and "🎳", values 1-5 for "🏀" and "⚽", and values 1-64 for "🎰". Defaults to "🎲". |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-message-draft`

Use this method to stream a partial message to a user while the message is being generated. Note that the streamed draft is ephemeral and acts as a temporary 30-second preview - once the output is finalized, you must call sendMessage with the complete message to persist it in the user's chat. Returns True on success. — write (sendMessageDraft)

**Changes something in Telegram.**

```sh
tg bot api send-message-draft [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target private chat. |
| `--message-thread-id <value>` | Unique identifier for the target message thread. |
| `--draft-id <value>` | Unique identifier of the message draft; must be non-zero. Changes to drafts with the same identifier are animated. Otherwise, the draft is replaced without animation. |
| `--text <value>` | Text of the message to be sent, 0-4096 characters after entities parsing. Pass an empty text to show a "Thinking..." placeholder. |
| `--parse-mode <value>` | Mode for parsing entities in the message text. See formatting options for more details. |
| `--entities <value>` | A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode. |
| `--can-stop <value>` | Pass True to show the user a button to stop further drafts. The bot will receive an Update "stopped_message_generation" if the user presses the button. |
| `--keep-on-stop <value>` | Pass True to keep the draft in the chat when the button is pressed. The draft will still disappear after a short time or if the bot sends a message. To fully preserve the partial draft, the bot should send it as a new message. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-chat-action`

Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success. — write (sendChatAction)

**Changes something in Telegram.**

```sh
tg bot api send-chat-action [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the action will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot or supergroup in the format @username. Channel chats and channel direct messages chats aren't supported. |
| `--message-thread-id <value>` | Unique identifier for the target message thread or topic of a forum; for supergroups and private chats of bots with forum topic mode enabled only. |
| `--action <value>` | Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-message-reaction`

Use this method to change the chosen reactions on a message. Service messages of some types can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. Bots can't use paid reactions. Returns True on success. — write (setMessageReaction)

**Changes something in Telegram.**

```sh
tg bot api set-message-reaction [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Identifier of the target message. If the message belongs to a media group, the reaction is set to the first non-deleted message in the group instead. |
| `--reaction <value>` | A JSON-serialized list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators. Paid reactions can't be used by bots. |
| `--is-big <value>` | Pass True to set the reaction with a big animation. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-user-profile-photos`

Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object. — read (getUserProfilePhotos)

```sh
tg bot api get-user-profile-photos [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user. |
| `--offset <value>` | Sequential number of the first photo to be returned. By default, all photos are returned. |
| `--limit <value>` | Limits the number of photos to be retrieved. Values between 1-100 are accepted. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-user-profile-audios`

Use this method to get a list of profile audios for a user. Returns a UserProfileAudios object. — read (getUserProfileAudios)

```sh
tg bot api get-user-profile-audios [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user. |
| `--offset <value>` | Sequential number of the first audio to be returned. By default, all audios are returned. |
| `--limit <value>` | Limits the number of audios to be retrieved. Values between 1-100 are accepted. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-user-emoji-status`

Changes the emoji status for a given user that previously allowed the bot to manage their emoji status via the Mini App method requestEmojiStatusAccess. Returns True on success. — write (setUserEmojiStatus)

**Changes something in Telegram.**

```sh
tg bot api set-user-emoji-status [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user. |
| `--emoji-status-custom-emoji-id <value>` | Custom emoji identifier of the emoji status to set. Pass an empty string to remove the status. |
| `--emoji-status-expiration-date <value>` | Expiration date of the emoji status, if any. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-file`

Use this method to get basic information about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a File object is returned. The file can then be downloaded via the link https://api.telegram.org/file/bot<token>/<file_path>, where <file_path> is taken from the response. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile again. — read (getFile)

```sh
tg bot api get-file [options]
```

| Option | What it does |
|---|---|
| `--file-id <value>` | File identifier to get information about. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api ban-chat-member`

Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success. — destructive (banChatMember)

**Changes something in Telegram.**

```sh
tg bot api ban-chat-member [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target group or username of the target supergroup or channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--until-date <value>` | Date when the user will be unbanned; Unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever. Applied for supergroups and channels only. |
| `--revoke-messages <value>` | Pass True to delete all messages from the chat for the user that is being removed. If False, the user will be able to see messages in the group that were sent before the user was removed. Always True for supergroups and channels. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unban-chat-member`

Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success. — destructive (unbanChatMember)

**Changes something in Telegram.**

```sh
tg bot api unban-chat-member [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target group or username of the target supergroup or channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--only-if-banned <value>` | Do nothing if the user is not banned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api restrict-chat-member`

Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success. — write (restrictChatMember)

**Changes something in Telegram.**

```sh
tg bot api restrict-chat-member [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--permissions <value>` | A JSON-serialized object for new user permissions. |
| `--use-independent-chat-permissions <value>` | Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. |
| `--until-date <value>` | Date when restrictions will be lifted for the user; Unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api promote-chat-member`

Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success. — write (promoteChatMember)

**Changes something in Telegram.**

```sh
tg bot api promote-chat-member [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--is-anonymous <value>` | Pass True if the administrator's presence in the chat is hidden. |
| `--can-manage-chat <value>` | Pass True if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages, ignore slow mode, and send messages to the chat without paying Telegram Stars. Implied by any other administrator privilege. |
| `--can-delete-messages <value>` | Pass True if the administrator can delete messages of other users. |
| `--can-manage-video-chats <value>` | Pass True if the administrator can manage video chats. |
| `--can-restrict-members <value>` | Pass True if the administrator can restrict, ban or unban chat members, or access supergroup statistics. For backward compatibility, defaults to True for promotions of channel administrators. |
| `--can-promote-members <value>` | Pass True if the administrator can add new administrators with a subset of their own privileges or demote administrators that they have promoted, directly or indirectly (promoted by administrators that were appointed by him). |
| `--can-change-info <value>` | Pass True if the administrator can change chat title, photo and other settings. |
| `--can-invite-users <value>` | Pass True if the administrator can invite new users to the chat. |
| `--can-post-stories <value>` | Pass True if the administrator can post stories to the chat. |
| `--can-edit-stories <value>` | Pass True if the administrator can edit stories posted by other users, post stories to the chat page, pin chat stories, and access the chat's story archive. |
| `--can-delete-stories <value>` | Pass True if the administrator can delete stories posted by other users. |
| `--can-post-messages <value>` | Pass True if the administrator can post messages in the channel, approve suggested posts, or access channel statistics; for channels only. |
| `--can-edit-messages <value>` | Pass True if the administrator can edit messages of other users and can pin messages; for channels only. |
| `--can-pin-messages <value>` | Pass True if the administrator can pin messages; for supergroups only. |
| `--can-manage-topics <value>` | Pass True if the user is allowed to create, rename, close, and reopen forum topics; for supergroups only. |
| `--can-manage-direct-messages <value>` | Pass True if the administrator can manage direct messages within the channel and decline suggested posts; for channels only. |
| `--can-manage-tags <value>` | Pass True if the administrator can edit the tags of regular members; for groups and supergroups only. |
| `--can-send-welcome-messages <value>` | Pass True if the administrator can manage chat welcome messages or directly send them in the case of bots. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-administrator-custom-title`

Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success. — write (setChatAdministratorCustomTitle)

**Changes something in Telegram.**

```sh
tg bot api set-chat-administrator-custom-title [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--custom-title <value>` | New custom title for the administrator; 0-16 characters, emoji are not allowed. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-member-tag`

Use this method to set a tag for a regular member in a group or a supergroup. The bot must be an administrator in the chat for this to work and must have the can_manage_tags administrator right. Returns True on success. — write (setChatMemberTag)

**Changes something in Telegram.**

```sh
tg bot api set-chat-member-tag [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--tag <value>` | New tag for the member; 0-16 characters, emoji are not allowed. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api ban-chat-sender-chat`

Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success. — destructive (banChatSenderChat)

**Changes something in Telegram.**

```sh
tg bot api ban-chat-sender-chat [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--sender-chat-id <value>` | Unique identifier of the target sender chat. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unban-chat-sender-chat`

Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success. — write (unbanChatSenderChat)

**Changes something in Telegram.**

```sh
tg bot api unban-chat-sender-chat [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--sender-chat-id <value>` | Unique identifier of the target sender chat. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-permissions`

Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success. — write (setChatPermissions)

**Changes something in Telegram.**

```sh
tg bot api set-chat-permissions [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--permissions <value>` | A JSON-serialized object for new default chat permissions. |
| `--use-independent-chat-permissions <value>` | Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api export-chat-invite-link`

Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success. — destructive (exportChatInviteLink)

**Changes something in Telegram.**

```sh
tg bot api export-chat-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api create-chat-invite-link`

Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object. — write (createChatInviteLink)

**Changes something in Telegram.**

```sh
tg bot api create-chat-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--name <value>` | Invite link name; 0-32 characters. |
| `--expire-date <value>` | Point in time (Unix timestamp) when the link will expire. |
| `--member-limit <value>` | The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999. |
| `--creates-join-request <value>` | True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-chat-invite-link`

Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object. — write (editChatInviteLink)

**Changes something in Telegram.**

```sh
tg bot api edit-chat-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--invite-link <value>` | The invite link to edit. |
| `--name <value>` | Invite link name; 0-32 characters. |
| `--expire-date <value>` | Point in time (Unix timestamp) when the link will expire. |
| `--member-limit <value>` | The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999. |
| `--creates-join-request <value>` | True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api create-chat-subscription-invite-link`

Use this method to create a subscription invite link for a channel chat. The bot must have the can_invite_users administrator rights. The link can be edited using the method editChatSubscriptionInviteLink or revoked using the method revokeChatInviteLink. Returns the new invite link as a ChatInviteLink object. — write (createChatSubscriptionInviteLink)

**Changes something in Telegram.**

```sh
tg bot api create-chat-subscription-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target channel chat or username of the target channel in the format @username. |
| `--name <value>` | Invite link name; 0-32 characters. |
| `--subscription-period <value>` | The number of seconds the subscription will be active for before the next payment. Currently, it must always be 2592000 (30 days). |
| `--subscription-price <value>` | The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to be a member of the chat; 1-10000. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-chat-subscription-invite-link`

Use this method to edit a subscription invite link created by the bot. The bot must have the can_invite_users administrator rights. Returns the edited invite link as a ChatInviteLink object. — write (editChatSubscriptionInviteLink)

**Changes something in Telegram.**

```sh
tg bot api edit-chat-subscription-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--invite-link <value>` | The invite link to edit. |
| `--name <value>` | Invite link name; 0-32 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api revoke-chat-invite-link`

Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object. — destructive (revokeChatInviteLink)

**Changes something in Telegram.**

```sh
tg bot api revoke-chat-invite-link [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier of the target chat or username of the target channel in the format @username. |
| `--invite-link <value>` | The invite link to revoke. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api approve-chat-join-request`

Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success. — write (approveChatJoinRequest)

**Changes something in Telegram.**

```sh
tg bot api approve-chat-join-request [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api decline-chat-join-request`

Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success. — destructive (declineChatJoinRequest)

**Changes something in Telegram.**

```sh
tg bot api decline-chat-join-request [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-chat-join-request-query`

Use this method to process a received chat join request query. Returns True on success. — write (answerChatJoinRequestQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-chat-join-request-query [options]
```

| Option | What it does |
|---|---|
| `--chat-join-request-query-id <value>` | Unique identifier of the join request query. |
| `--result <value>` | Result of the query. Must be either "approve" to allow the user to join the chat, "decline" to disallow the user to join the chat, or "queue" to leave the decision to other administrators. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-chat-join-request-web-app`

Use this method to process a received chat join request query by showing a Mini App to the user before deciding the outcome. Call answerChatJoinRequestQuery to resolve the join request query based on the user interaction with the Mini App. Returns True on success. — write (sendChatJoinRequestWebApp)

**Changes something in Telegram.**

```sh
tg bot api send-chat-join-request-web-app [options]
```

| Option | What it does |
|---|---|
| `--chat-join-request-query-id <value>` | Unique identifier of the join request query. |
| `--web-app-url <value>` | An HTTPS URL of a Web App to be opened with additional data as specified in Initializing Web Apps. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-photo`

Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success. — write (setChatPhoto)

**Changes something in Telegram.**

```sh
tg bot api set-chat-photo [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--photo <value>` | New chat photo, uploaded using multipart/form-data. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-chat-photo`

Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success. — destructive (deleteChatPhoto)

**Changes something in Telegram.**

```sh
tg bot api delete-chat-photo [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-title`

Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success. — write (setChatTitle)

**Changes something in Telegram.**

```sh
tg bot api set-chat-title [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--title <value>` | New chat title, 1-128 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-description`

Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success. — write (setChatDescription)

**Changes something in Telegram.**

```sh
tg bot api set-chat-description [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--description <value>` | New chat description, 0-255 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api pin-chat-message`

Use this method to add a message to the list of pinned messages in a chat. In private chats and channel direct messages chats, all non-service messages can be pinned. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to pin messages in groups and channels respectively. Returns True on success. — write (pinChatMessage)

**Changes something in Telegram.**

```sh
tg bot api pin-chat-message [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be pinned. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--message-id <value>` | Identifier of a message to pin. |
| `--disable-notification <value>` | Pass True if it is not necessary to send a notification to all chat members about the new pinned message. Notifications are always disabled in channels and private chats. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unpin-chat-message`

Use this method to remove a message from the list of pinned messages in a chat. In private chats and channel direct messages chats, all messages can be unpinned. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to unpin messages in groups and channels respectively. Returns True on success. — write (unpinChatMessage)

**Changes something in Telegram.**

```sh
tg bot api unpin-chat-message [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be unpinned. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--message-id <value>` | Identifier of the message to unpin. Required if business_connection_id is specified. If not specified, the most recent pinned message (by sending date) will be unpinned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unpin-all-chat-messages`

Use this method to clear the list of pinned messages in a chat. In private chats and channel direct messages chats, no additional rights are required to unpin all pinned messages. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to unpin all pinned messages in groups and channels respectively. Returns True on success. — destructive (unpinAllChatMessages)

**Changes something in Telegram.**

```sh
tg bot api unpin-all-chat-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api leave-chat`

Use this method for your bot to leave a group, supergroup or channel. Returns True on success. — destructive (leaveChat)

**Changes something in Telegram.**

```sh
tg bot api leave-chat [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup or channel in the format @username. Channel direct messages chats aren't supported; leave the corresponding channel instead. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat`

Use this method to get up-to-date information about the chat. Returns a ChatFullInfo object on success. — read (getChat)

```sh
tg bot api get-chat [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup or channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat-administrators`

Use this method to get a list of administrators in a chat. Returns an Array of ChatMember objects. — read (getChatAdministrators)

```sh
tg bot api get-chat-administrators [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup or channel in the format @username. |
| `--return-bots <value>` | Pass True to additionally receive all bots that are administrators of the chat. By default, bots other than the current bot are omitted. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat-member-count`

Use this method to get the number of members in a chat. Returns Integer on success. — read (getChatMemberCount)

```sh
tg bot api get-chat-member-count [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup or channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat-member`

Use this method to get information about a member of a chat. The method is only guaranteed to work for other users if the bot is an administrator in the chat. Returns a ChatMember object on success. — read (getChatMember)

```sh
tg bot api get-chat-member [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup or channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-user-personal-chat-messages`

Use this method to get the last messages from the personal chat (i.e., the chat currently added to their profile) of a given user. On success, an Array of Message objects is returned. — read (getUserPersonalChatMessages)

```sh
tg bot api get-user-personal-chat-messages [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier for the target user. |
| `--limit <value>` | The maximum number of messages to return; 1-20. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-chat-sticker-set`

Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method. Returns True on success. — write (setChatStickerSet)

**Changes something in Telegram.**

```sh
tg bot api set-chat-sticker-set [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--sticker-set-name <value>` | Name of the sticker set to be set as the group sticker set. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-chat-sticker-set`

Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method. Returns True on success. — destructive (deleteChatStickerSet)

**Changes something in Telegram.**

```sh
tg bot api delete-chat-sticker-set [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-forum-topic-icon-stickers`

Use this method to get custom emoji stickers, which can be used as a forum topic icon by any user. Requires no parameters. Returns an Array of Sticker objects. — read (getForumTopicIconStickers)

```sh
tg bot api get-forum-topic-icon-stickers
```

#### `tg bot api create-forum-topic`

Use this method to create a topic in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator right. Returns information about the created topic as a ForumTopic object. — write (createForumTopic)

**Changes something in Telegram.**

```sh
tg bot api create-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--name <value>` | Topic name, 1-128 characters. |
| `--icon-color <value>` | Color of the topic icon in RGB format. Currently, must be one of 7322096 (0x6FB9F0), 16766590 (0xFFD67E), 13338331 (0xCB86DB), 9367192 (0x8EEE98), 16749490 (0xFF93B2), or 16478047 (0xFB6F5F). |
| `--icon-custom-emoji-id <value>` | Unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-forum-topic`

Use this method to edit name and icon of a topic in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success. — write (editForumTopic)

**Changes something in Telegram.**

```sh
tg bot api edit-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread of the forum topic. |
| `--name <value>` | New topic name, 0-128 characters. If not specified or empty, the current name of the topic will be kept. |
| `--icon-custom-emoji-id <value>` | New unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. Pass an empty string to remove the icon. If not specified, the current icon will be kept. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api close-forum-topic`

Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success. — write (closeForumTopic)

**Changes something in Telegram.**

```sh
tg bot api close-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread of the forum topic. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api reopen-forum-topic`

Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success. — write (reopenForumTopic)

**Changes something in Telegram.**

```sh
tg bot api reopen-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread of the forum topic. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-forum-topic`

Use this method to delete a forum topic along with all its messages in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success. — destructive (deleteForumTopic)

**Changes something in Telegram.**

```sh
tg bot api delete-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread of the forum topic. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unpin-all-forum-topic-messages`

Use this method to clear the list of pinned messages in a forum topic in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success. — destructive (unpinAllForumTopicMessages)

**Changes something in Telegram.**

```sh
tg bot api unpin-all-forum-topic-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread of the forum topic. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-general-forum-topic`

Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success. — write (editGeneralForumTopic)

**Changes something in Telegram.**

```sh
tg bot api edit-general-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--name <value>` | New topic name, 1-128 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api close-general-forum-topic`

Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success. — write (closeGeneralForumTopic)

**Changes something in Telegram.**

```sh
tg bot api close-general-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api reopen-general-forum-topic`

Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success. — write (reopenGeneralForumTopic)

**Changes something in Telegram.**

```sh
tg bot api reopen-general-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api hide-general-forum-topic`

Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success. — write (hideGeneralForumTopic)

**Changes something in Telegram.**

```sh
tg bot api hide-general-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unhide-general-forum-topic`

Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success. — write (unhideGeneralForumTopic)

**Changes something in Telegram.**

```sh
tg bot api unhide-general-forum-topic [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api unpin-all-general-forum-topic-messages`

Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success. — destructive (unpinAllGeneralForumTopicMessages)

**Changes something in Telegram.**

```sh
tg bot api unpin-all-general-forum-topic-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-callback-query`

Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned. — write (answerCallbackQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-callback-query [options]
```

| Option | What it does |
|---|---|
| `--callback-query-id <value>` | Unique identifier for the query to be answered. |
| `--text <value>` | Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters. |
| `--show-alert <value>` | If True, an alert will be shown by the client instead of a notification at the top of the chat screen. Defaults to False. |
| `--url <value>` | URL that will be opened by the user's client. If you have created a Game and accepted the conditions via @BotFather, specify the URL that opens your game - note that this will only work if the query comes from a callback_game button. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter. |
| `--cache-time <value>` | The maximum amount of time in seconds that the result of the callback query may be cached client-side. Defaults to 0. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-guest-query`

Use this method to reply to a received guest message. On success, a SentGuestMessage object is returned. — write (answerGuestQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-guest-query [options]
```

| Option | What it does |
|---|---|
| `--guest-query-id <value>` | Unique identifier for the query to be answered. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-user-chat-boosts`

Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object. — read (getUserChatBoosts)

```sh
tg bot api get-user-chat-boosts [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the chat or username of the channel in the format @username. |
| `--user-id <value>` | Unique identifier of the target user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-business-connection`

Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success. — read (getBusinessConnection)

```sh
tg bot api get-business-connection [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-managed-bot-token`

Use this method to get the token of a managed bot. Returns the token as String on success. — read (getManagedBotToken)

```sh
tg bot api get-managed-bot-token [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of the managed bot whose token will be returned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api replace-managed-bot-token`

Use this method to revoke the current token of a managed bot and generate a new one. Returns the new token as String on success. — destructive (replaceManagedBotToken)

**Changes something in Telegram.**

```sh
tg bot api replace-managed-bot-token [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of the managed bot whose token will be replaced. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-managed-bot-access-settings`

Use this method to get the access settings of a managed bot. Returns a BotAccessSettings object on success. — read (getManagedBotAccessSettings)

```sh
tg bot api get-managed-bot-access-settings [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of the managed bot whose access settings will be returned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-managed-bot-access-settings`

Use this method to change the access settings of a managed bot. Returns True on success. — write (setManagedBotAccessSettings)

**Changes something in Telegram.**

```sh
tg bot api set-managed-bot-access-settings [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of the managed bot whose access settings will be changed. |
| `--is-access-restricted <value>` | Pass True if only selected users can access the bot. The bot's owner can always access it. |
| `--added-user-ids <value>` | A JSON-serialized list of up to 10 identifiers of users who will have access to the bot in addition to its owner. Ignored if is_access_restricted is False. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-commands`

Use this method to change the list of the bot's commands. See this manual for more details about bot commands. Returns True on success. — write (setMyCommands)

**Changes something in Telegram.**

```sh
tg bot api set-my-commands [options]
```

| Option | What it does |
|---|---|
| `--commands <value>` | A JSON-serialized list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified. |
| `--scope <value>` | A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. |
| `--language-code <value>` | A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-my-commands`

Use this method to delete the list of the bot's commands for the given scope and user language. After deletion, higher level commands will be shown to affected users. Returns True on success. — destructive (deleteMyCommands)

**Changes something in Telegram.**

```sh
tg bot api delete-my-commands [options]
```

| Option | What it does |
|---|---|
| `--scope <value>` | A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. |
| `--language-code <value>` | A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-commands`

Use this method to get the current list of the bot's commands for the given scope and user language. Returns an Array of BotCommand objects. If commands aren't set, an empty list is returned. — read (getMyCommands)

```sh
tg bot api get-my-commands [options]
```

| Option | What it does |
|---|---|
| `--scope <value>` | A JSON-serialized object, describing scope of users. Defaults to BotCommandScopeDefault. |
| `--language-code <value>` | A two-letter ISO 639-1 language code or an empty string. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-name`

Use this method to change the bot's name. Returns True on success. — write (setMyName)

**Changes something in Telegram.**

```sh
tg bot api set-my-name [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language. |
| `--language-code <value>` | A two-letter ISO 639-1 language code. If empty, the name will be shown to all users for whose language there is no dedicated name. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-name`

Use this method to get the current bot name for the given user language. Returns BotName on success. — read (getMyName)

```sh
tg bot api get-my-name [options]
```

| Option | What it does |
|---|---|
| `--language-code <value>` | A two-letter ISO 639-1 language code or an empty string. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-description`

Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty. Returns True on success. — write (setMyDescription)

**Changes something in Telegram.**

```sh
tg bot api set-my-description [options]
```

| Option | What it does |
|---|---|
| `--description <value>` | New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language. |
| `--language-code <value>` | A two-letter ISO 639-1 language code. If empty, the description will be applied to all users for whose language there is no dedicated description. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-description`

Use this method to get the current bot description for the given user language. Returns BotDescription on success. — read (getMyDescription)

```sh
tg bot api get-my-description [options]
```

| Option | What it does |
|---|---|
| `--language-code <value>` | A two-letter ISO 639-1 language code or an empty string. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-short-description`

Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot. Returns True on success. — write (setMyShortDescription)

**Changes something in Telegram.**

```sh
tg bot api set-my-short-description [options]
```

| Option | What it does |
|---|---|
| `--short-description <value>` | New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language. |
| `--language-code <value>` | A two-letter ISO 639-1 language code. If empty, the short description will be applied to all users for whose language there is no dedicated short description. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-short-description`

Use this method to get the current bot short description for the given user language. Returns BotShortDescription on success. — read (getMyShortDescription)

```sh
tg bot api get-my-short-description [options]
```

| Option | What it does |
|---|---|
| `--language-code <value>` | A two-letter ISO 639-1 language code or an empty string. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-profile-photo`

Changes the profile photo of the bot. Returns True on success. — write (setMyProfilePhoto)

**Changes something in Telegram.**

```sh
tg bot api set-my-profile-photo [options]
```

| Option | What it does |
|---|---|
| `--photo <value>` | The new profile photo to set. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api remove-my-profile-photo`

Removes the profile photo of the bot. Requires no parameters. Returns True on success. — destructive (removeMyProfilePhoto)

**Changes something in Telegram.**

```sh
tg bot api remove-my-profile-photo
```

#### `tg bot api set-chat-menu-button`

Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success. — write (setChatMenuButton)

**Changes something in Telegram.**

```sh
tg bot api set-chat-menu-button [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target private chat. If not specified, the bot's default menu button will be changed. |
| `--menu-button <value>` | A JSON-serialized object for the bot's new menu button. Defaults to MenuButtonDefault. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat-menu-button`

Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success. — read (getChatMenuButton)

```sh
tg bot api get-chat-menu-button [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target private chat. If not specified, the bot's default menu button will be returned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-my-default-administrator-rights`

Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are free to modify the list before adding the bot. Returns True on success. — write (setMyDefaultAdministratorRights)

**Changes something in Telegram.**

```sh
tg bot api set-my-default-administrator-rights [options]
```

| Option | What it does |
|---|---|
| `--rights <value>` | A JSON-serialized object describing new default administrator rights. If not specified, the default administrator rights will be cleared. |
| `--for-channels <value>` | Pass True to change the default administrator rights of the bot in channels. Otherwise, the default administrator rights of the bot for groups and supergroups will be changed. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-default-administrator-rights`

Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success. — read (getMyDefaultAdministratorRights)

```sh
tg bot api get-my-default-administrator-rights [options]
```

| Option | What it does |
|---|---|
| `--for-channels <value>` | Pass True to get default administrator rights of the bot in channels. Otherwise, default administrator rights of the bot for groups and supergroups will be returned. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-available-gifts`

Returns the list of gifts that can be sent by the bot to users and channel chats. Requires no parameters. Returns a Gifts object. — read (getAvailableGifts)

```sh
tg bot api get-available-gifts
```

#### `tg bot api send-gift`

Sends a gift to the given user or channel chat. The gift can't be converted to Telegram Stars by the receiver. Returns True on success. — destructive (sendGift)

**Changes something in Telegram.**

```sh
tg bot api send-gift [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Required if chat_id is not specified. Unique identifier of the target user who will receive the gift. |
| `--chat-id <value>` | Required if user_id is not specified. Unique identifier for the chat or username of the channel (in the format @username) that will receive the gift. |
| `--gift-id <value>` | Identifier of the gift; limited gifts can't be sent to channel chats. |
| `--pay-for-upgrade <value>` | Pass True to pay for the gift upgrade from the bot's balance, thereby making the upgrade free for the receiver. |
| `--text <value>` | Text that will be shown along with the gift; 0-128 characters. |
| `--text-parse-mode <value>` | Mode for parsing entities in the text. See formatting options for more details. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", "custom_emoji", and "date_time" are ignored. |
| `--text-entities <value>` | A JSON-serialized list of special entities that appear in the gift text. It can be specified instead of text_parse_mode. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", "custom_emoji", and "date_time" are ignored. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api gift-premium-subscription`

Gifts a Telegram Premium subscription to the given user. Returns True on success. — destructive (giftPremiumSubscription)

**Changes something in Telegram.**

```sh
tg bot api gift-premium-subscription [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user who will receive a Telegram Premium subscription. |
| `--month-count <value>` | Number of months the Telegram Premium subscription will be active for the user; must be one of 3, 6, or 12. |
| `--star-count <value>` | Number of Telegram Stars to pay for the Telegram Premium subscription; must be 1000 for 3 months, 1500 for 6 months, and 2500 for 12 months. |
| `--text <value>` | Text that will be shown along with the service message about the subscription; 0-128 characters. |
| `--text-parse-mode <value>` | Mode for parsing entities in the text. See formatting options for more details. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", "custom_emoji", and "date_time" are ignored. |
| `--text-entities <value>` | A JSON-serialized list of special entities that appear in the gift text. It can be specified instead of text_parse_mode. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", "custom_emoji", and "date_time" are ignored. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api verify-user`

Verifies a user on behalf of the organization which is represented by the bot. Returns True on success. — write (verifyUser)

**Changes something in Telegram.**

```sh
tg bot api verify-user [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user. |
| `--custom-description <value>` | Custom description for the verification; 0-70 characters. Must be empty if the organization isn't allowed to provide a custom verification description. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api verify-chat`

Verifies a chat on behalf of the organization which is represented by the bot. Returns True on success. — write (verifyChat)

**Changes something in Telegram.**

```sh
tg bot api verify-chat [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. Channel direct messages chats can't be verified. |
| `--custom-description <value>` | Custom description for the verification; 0-70 characters. Must be empty if the organization isn't allowed to provide a custom verification description. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api remove-user-verification`

Removes verification from a user who is currently verified on behalf of the organization represented by the bot. Returns True on success. — destructive (removeUserVerification)

**Changes something in Telegram.**

```sh
tg bot api remove-user-verification [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api remove-chat-verification`

Removes verification from a chat that is currently verified on behalf of the organization represented by the bot. Returns True on success. — destructive (removeChatVerification)

**Changes something in Telegram.**

```sh
tg bot api remove-chat-verification [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot or channel in the format @username. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api read-business-message`

Marks incoming message as read on behalf of a business account. Requires the can_read_messages business bot right. Returns True on success. — write (readBusinessMessage)

**Changes something in Telegram.**

```sh
tg bot api read-business-message [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which to read the message. |
| `--chat-id <value>` | Unique identifier of the chat in which the message was received. The chat must have been active in the last 24 hours. |
| `--message-id <value>` | Unique identifier of the message to mark as read. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-business-messages`

Delete messages on behalf of a business account. Requires the can_delete_sent_messages business bot right to delete messages sent by the bot itself, or the can_delete_all_messages business bot right to delete any message. Returns True on success. — destructive (deleteBusinessMessages)

**Changes something in Telegram.**

```sh
tg bot api delete-business-messages [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which to delete the messages. |
| `--message-ids <value>` | A JSON-serialized list of 1-100 identifiers of messages to delete. All messages must be from the same chat. See deleteMessage for limitations on which messages can be deleted. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-business-account-name`

Changes the first and last name of a managed business account. Requires the can_change_name business bot right. Returns True on success. — write (setBusinessAccountName)

**Changes something in Telegram.**

```sh
tg bot api set-business-account-name [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--first-name <value>` | The new value of the first name for the business account; 1-64 characters. |
| `--last-name <value>` | The new value of the last name for the business account; 0-64 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-business-account-username`

Changes the username of a managed business account. Requires the can_change_username business bot right. Returns True on success. — write (setBusinessAccountUsername)

**Changes something in Telegram.**

```sh
tg bot api set-business-account-username [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--username <value>` | The new value of the username for the business account; 0-32 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-business-account-bio`

Changes the bio of a managed business account. Requires the can_change_bio business bot right. Returns True on success. — write (setBusinessAccountBio)

**Changes something in Telegram.**

```sh
tg bot api set-business-account-bio [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--bio <value>` | The new value of the bio for the business account; 0-140 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-business-account-profile-photo`

Changes the profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success. — write (setBusinessAccountProfilePhoto)

**Changes something in Telegram.**

```sh
tg bot api set-business-account-profile-photo [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--photo <value>` | The new profile photo to set. |
| `--is-public <value>` | Pass True to set the public photo, which will be visible even if the main photo is hidden by the business account's privacy settings. An account can have only one public photo. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api remove-business-account-profile-photo`

Removes the current profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success. — destructive (removeBusinessAccountProfilePhoto)

**Changes something in Telegram.**

```sh
tg bot api remove-business-account-profile-photo [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--is-public <value>` | Pass True to remove the public photo, which is visible even if the main photo is hidden by the business account's privacy settings. After the main photo is removed, the previous profile photo (if present) becomes the main photo. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-business-account-gift-settings`

Changes the privacy settings pertaining to incoming gifts in a managed business account. Requires the can_change_gift_settings business bot right. Returns True on success. — write (setBusinessAccountGiftSettings)

**Changes something in Telegram.**

```sh
tg bot api set-business-account-gift-settings [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--show-gift-button <value>` | Pass True if a button for sending a gift to the user or by the business account must always be shown in the input field. |
| `--accepted-gift-types <value>` | Types of gifts accepted by the business account. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-business-account-star-balance`

Returns the amount of Telegram Stars owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns StarAmount on success. — read (getBusinessAccountStarBalance)

```sh
tg bot api get-business-account-star-balance [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api transfer-business-account-stars`

Transfers Telegram Stars from the business account balance to the bot's balance. Requires the can_transfer_stars business bot right. Returns True on success. — destructive (transferBusinessAccountStars)

**Changes something in Telegram.**

```sh
tg bot api transfer-business-account-stars [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--star-count <value>` | Number of Telegram Stars to transfer; 1-10000. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-business-account-gifts`

Returns the gifts received and owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns OwnedGifts on success. — read (getBusinessAccountGifts)

```sh
tg bot api get-business-account-gifts [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--exclude-unsaved <value>` | Pass True to exclude gifts that aren't saved to the account's profile page. |
| `--exclude-saved <value>` | Pass True to exclude gifts that are saved to the account's profile page. |
| `--exclude-unlimited <value>` | Pass True to exclude gifts that can be purchased an unlimited number of times. |
| `--exclude-limited-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can be upgraded to unique. |
| `--exclude-limited-non-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can't be upgraded to unique. |
| `--exclude-unique <value>` | Pass True to exclude unique gifts. |
| `--exclude-from-blockchain <value>` | Pass True to exclude gifts that were assigned from the TON blockchain and can't be resold or transferred in Telegram. |
| `--sort-by-price <value>` | Pass True to sort results by gift price instead of send date. Sorting is applied before pagination. |
| `--offset <value>` | Offset of the first entry to return as received from the previous request; use empty string to get the first chunk of results. |
| `--limit <value>` | The maximum number of gifts to be returned; 1-100. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-user-gifts`

Returns the gifts owned and hosted by a user. Returns OwnedGifts on success. — read (getUserGifts)

```sh
tg bot api get-user-gifts [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the user. |
| `--exclude-unlimited <value>` | Pass True to exclude gifts that can be purchased an unlimited number of times. |
| `--exclude-limited-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can be upgraded to unique. |
| `--exclude-limited-non-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can't be upgraded to unique. |
| `--exclude-from-blockchain <value>` | Pass True to exclude gifts that were assigned from the TON blockchain and can't be resold or transferred in Telegram. |
| `--exclude-unique <value>` | Pass True to exclude unique gifts. |
| `--sort-by-price <value>` | Pass True to sort results by gift price instead of send date. Sorting is applied before pagination. |
| `--offset <value>` | Offset of the first entry to return as received from the previous request; use an empty string to get the first chunk of results. |
| `--limit <value>` | The maximum number of gifts to be returned; 1-100. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-chat-gifts`

Returns the gifts owned by a chat. Returns OwnedGifts on success. — read (getChatGifts)

```sh
tg bot api get-chat-gifts [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target channel in the format @username. |
| `--exclude-unsaved <value>` | Pass True to exclude gifts that aren't saved to the chat's profile page. Always True, unless the bot has the can_post_messages administrator right in the channel. |
| `--exclude-saved <value>` | Pass True to exclude gifts that are saved to the chat's profile page. Always False, unless the bot has the can_post_messages administrator right in the channel. |
| `--exclude-unlimited <value>` | Pass True to exclude gifts that can be purchased an unlimited number of times. |
| `--exclude-limited-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can be upgraded to unique. |
| `--exclude-limited-non-upgradable <value>` | Pass True to exclude gifts that can be purchased a limited number of times and can't be upgraded to unique. |
| `--exclude-from-blockchain <value>` | Pass True to exclude gifts that were assigned from the TON blockchain and can't be resold or transferred in Telegram. |
| `--exclude-unique <value>` | Pass True to exclude unique gifts. |
| `--sort-by-price <value>` | Pass True to sort results by gift price instead of send date. Sorting is applied before pagination. |
| `--offset <value>` | Offset of the first entry to return as received from the previous request; use an empty string to get the first chunk of results. |
| `--limit <value>` | The maximum number of gifts to be returned; 1-100. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api convert-gift-to-stars`

Converts a given regular gift to Telegram Stars. Requires the can_convert_gifts_to_stars business bot right. Returns True on success. — destructive (convertGiftToStars)

**Changes something in Telegram.**

```sh
tg bot api convert-gift-to-stars [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--owned-gift-id <value>` | Unique identifier of the regular gift that should be converted to Telegram Stars. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api upgrade-gift`

Upgrades a given regular gift to a unique gift. Requires the can_transfer_and_upgrade_gifts business bot right. Additionally requires the can_transfer_stars business bot right if the upgrade is paid. Returns True on success. — destructive (upgradeGift)

**Changes something in Telegram.**

```sh
tg bot api upgrade-gift [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--owned-gift-id <value>` | Unique identifier of the regular gift that should be upgraded to a unique one. |
| `--keep-original-details <value>` | Pass True to keep the original gift text, sender and receiver in the upgraded gift. |
| `--star-count <value>` | The amount of Telegram Stars that will be paid for the upgrade from the business account balance. If gift.prepaid_upgrade_star_count > 0, then pass 0, otherwise, the can_transfer_stars business bot right is required and gift.upgrade_star_count must be passed. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api transfer-gift`

Transfers an owned unique gift to another user. Requires the can_transfer_and_upgrade_gifts business bot right. Requires can_transfer_stars business bot right if the transfer is paid. Returns True on success. — destructive (transferGift)

**Changes something in Telegram.**

```sh
tg bot api transfer-gift [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--owned-gift-id <value>` | Unique identifier of the regular gift that should be transferred. |
| `--new-owner-chat-id <value>` | Unique identifier of the chat which will own the gift. The chat must be active in the last 24 hours. |
| `--star-count <value>` | The amount of Telegram Stars that will be paid for the transfer from the business account balance. If positive, then the can_transfer_stars business bot right is required. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api post-story`

Posts a story on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns Story on success. — write (postStory)

**Changes something in Telegram.**

```sh
tg bot api post-story [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--content <value>` | Content of the story. |
| `--active-period <value>` | Period after which the story is moved to the archive, in seconds; must be one of 6 * 3600, 12 * 3600, 86400, or 2 * 86400. |
| `--caption <value>` | Caption of the story, 0-2048 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the story caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--areas <value>` | A JSON-serialized list of clickable areas to be shown on the story. |
| `--post-to-chat-page <value>` | Pass True to keep the story accessible after it expires. |
| `--protect-content <value>` | Pass True if the content of the story must be protected from forwarding and screenshotting. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api repost-story`

Reposts a story on behalf of a business account from another business account. Both business accounts must be managed by the same bot, and the story on the source account must have been posted (or reposted) by the bot. Requires the can_manage_stories business bot right for both business accounts. Returns Story on success. — write (repostStory)

**Changes something in Telegram.**

```sh
tg bot api repost-story [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--from-chat-id <value>` | Unique identifier of the chat which posted the story that should be reposted. |
| `--from-story-id <value>` | Unique identifier of the story that should be reposted. |
| `--active-period <value>` | Period after which the story is moved to the archive, in seconds; must be one of 6 * 3600, 12 * 3600, 86400, or 2 * 86400. |
| `--post-to-chat-page <value>` | Pass True to keep the story accessible after it expires. |
| `--protect-content <value>` | Pass True if the content of the story must be protected from forwarding and screenshotting. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-story`

Edits a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns Story on success. — write (editStory)

**Changes something in Telegram.**

```sh
tg bot api edit-story [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--story-id <value>` | Unique identifier of the story to edit. |
| `--content <value>` | Content of the story. |
| `--caption <value>` | Caption of the story, 0-2048 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the story caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--areas <value>` | A JSON-serialized list of clickable areas to be shown on the story. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-story`

Deletes a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns True on success. — destructive (deleteStory)

**Changes something in Telegram.**

```sh
tg bot api delete-story [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection. |
| `--story-id <value>` | Unique identifier of the story to delete. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-web-app-query`

Use this method to set the result of an interaction with a Web App and send a corresponding message on behalf of the user to the chat from which the query originated. On success, a SentWebAppMessage object is returned. — write (answerWebAppQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-web-app-query [options]
```

| Option | What it does |
|---|---|
| `--web-app-query-id <value>` | Unique identifier for the query to be answered. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api save-prepared-inline-message`

Stores a message that can be sent by a user of a Mini App. Returns a PreparedInlineMessage object. — write (savePreparedInlineMessage)

**Changes something in Telegram.**

```sh
tg bot api save-prepared-inline-message [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user that can use the prepared message. |
| `--allow-user-chats <value>` | Pass True if the message can be sent to private chats with users. |
| `--allow-bot-chats <value>` | Pass True if the message can be sent to private chats with bots. |
| `--allow-group-chats <value>` | Pass True if the message can be sent to group and supergroup chats. |
| `--allow-channel-chats <value>` | Pass True if the message can be sent to channel chats. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api save-prepared-keyboard-button`

Stores a keyboard button that can be used by a user within a Mini App. Returns a PreparedKeyboardButton object. — write (savePreparedKeyboardButton)

**Changes something in Telegram.**

```sh
tg bot api save-prepared-keyboard-button [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Unique identifier of the target user that can use the button. |
| `--button <value>` | A JSON-serialized object describing the button to be saved. The button must be of the type request_users, request_chat, or request_managed_bot. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-text`

Use this method to edit text, rich and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent. — write (editMessageText)

**Changes something in Telegram.**

```sh
tg bot api edit-message-text [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message to edit. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--text <value>` | New text of the message, 1-4096 characters after entity parsing; required if rich_message isn't specified. |
| `--parse-mode <value>` | Mode for parsing entities in the message text. See formatting options for more details. |
| `--entities <value>` | A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode. |
| `--link-preview-options <value>` | Link preview generation options for the message. |
| `--rich-message <value>` | New rich content of the message; required if text isn't specified. Direct upload of new files and explicit upload of files by a URL isn't supported when an inline message is edited. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-caption`

Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent. — write (editMessageCaption)

**Changes something in Telegram.**

```sh
tg bot api edit-message-caption [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message to edit. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--caption <value>` | New caption of the message, 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the message caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. Supported only for animation, photo and video messages. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-media`

Use this method to edit animation, audio, document, live photo, photo, or video messages, or to replace a text or a rich message with a media. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo, a live photo, or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent. — write (editMessageMedia)

**Changes something in Telegram.**

```sh
tg bot api edit-message-media [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message to edit. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--media <value>` | A JSON-serialized object for the new media content of the message. |
| `--reply-markup <value>` | A JSON-serialized object for a new inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-live-location`

Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. — write (editMessageLiveLocation)

**Changes something in Telegram.**

```sh
tg bot api edit-message-live-location [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message to edit. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--latitude <value>` | Latitude of new location. |
| `--longitude <value>` | Longitude of new location. |
| `--live-period <value>` | New period in seconds during which the location can be updated, starting from the message send date. If 0x7FFFFFFF is specified, then the location can be updated forever. Otherwise, the new value must not exceed the current live_period by more than a day, and the live location expiration date must remain within the next 90 days. If not specified, then live_period remains unchanged. |
| `--horizontal-accuracy <value>` | The radius of uncertainty for the location, measured in meters; 0-1500. |
| `--heading <value>` | Direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. |
| `--proximity-alert-radius <value>` | The maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. |
| `--reply-markup <value>` | A JSON-serialized object for a new inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api stop-message-live-location`

Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned. — write (stopMessageLiveLocation)

**Changes something in Telegram.**

```sh
tg bot api stop-message-live-location [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message with live location to stop. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--reply-markup <value>` | A JSON-serialized object for a new inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-checklist`

Use this method to edit a checklist on behalf of a connected business account. On success, the edited Message is returned. — write (editMessageChecklist)

**Changes something in Telegram.**

```sh
tg bot api edit-message-checklist [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot in the format @username. |
| `--message-id <value>` | Unique identifier for the target message. |
| `--checklist <value>` | A JSON-serialized object for the new checklist. |
| `--reply-markup <value>` | A JSON-serialized object for the new inline keyboard for the message. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-message-reply-markup`

Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent. — write (editMessageReplyMarkup)

**Changes something in Telegram.**

```sh
tg bot api edit-message-reply-markup [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the message to edit. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api stop-poll`

Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned. — write (stopPoll)

**Changes something in Telegram.**

```sh
tg bot api stop-poll [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message to be edited was sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Identifier of the original message with the poll. |
| `--reply-markup <value>` | A JSON-serialized object for a new message inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-ephemeral-message-text`

Use this method to edit an ephemeral text or rich message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, True is returned. — write (editEphemeralMessageText)

**Changes something in Telegram.**

```sh
tg bot api edit-ephemeral-message-text [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--receiver-user-id <value>` | Identifier of the user who received the message. |
| `--ephemeral-message-id <value>` | Identifier of the ephemeral message to edit. |
| `--text <value>` | New text of the message, 1-4096 characters after entity parsing; required if rich_message isn't specified. |
| `--parse-mode <value>` | Mode for parsing entities in the message text. See formatting options for more details. |
| `--entities <value>` | A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode. |
| `--rich-message <value>` | New rich content of the message; required if text isn't specified. |
| `--link-preview-options <value>` | Link preview generation options for the message. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-ephemeral-message-media`

Use this method to edit the media of an ephemeral message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, True is returned. — write (editEphemeralMessageMedia)

**Changes something in Telegram.**

```sh
tg bot api edit-ephemeral-message-media [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--receiver-user-id <value>` | Identifier of the user who received the message. |
| `--ephemeral-message-id <value>` | Identifier of the ephemeral message to edit. |
| `--media <value>` | A JSON-serialized object for the new media content of the message. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-ephemeral-message-caption`

Use this method to edit the caption of an ephemeral message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, True is returned. — write (editEphemeralMessageCaption)

**Changes something in Telegram.**

```sh
tg bot api edit-ephemeral-message-caption [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--receiver-user-id <value>` | Identifier of the user who received the message. |
| `--ephemeral-message-id <value>` | Identifier of the ephemeral message to edit. |
| `--caption <value>` | New caption of the message, 0-1024 characters after entities parsing. |
| `--parse-mode <value>` | Mode for parsing entities in the message caption. See formatting options for more details. |
| `--caption-entities <value>` | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode. |
| `--show-caption-above-media <value>` | Pass True if the caption must be shown above the message media. Supported only for animation, photo and video messages. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-ephemeral-message-reply-markup`

Use this method to edit only the reply markup of an ephemeral message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, True is returned. — write (editEphemeralMessageReplyMarkup)

**Changes something in Telegram.**

```sh
tg bot api edit-ephemeral-message-reply-markup [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--receiver-user-id <value>` | Identifier of the user who received the message. |
| `--ephemeral-message-id <value>` | Identifier of the ephemeral message to edit. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api approve-suggested-post`

Use this method to approve a suggested post in a direct messages chat. The bot must have the 'can_post_messages' administrator right in the corresponding channel chat. Returns True on success. — destructive (approveSuggestedPost)

**Changes something in Telegram.**

```sh
tg bot api approve-suggested-post [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target direct messages chat. |
| `--message-id <value>` | Identifier of a suggested post message to approve. |
| `--send-date <value>` | Point in time (Unix timestamp) when the post is expected to be published; omit if the date has already been specified when the suggested post was created. If specified, then the date must be not more than 2678400 seconds (30 days) in the future. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api decline-suggested-post`

Use this method to decline a suggested post in a direct messages chat. The bot must have the 'can_manage_direct_messages' administrator right in the corresponding channel chat. Returns True on success. — destructive (declineSuggestedPost)

**Changes something in Telegram.**

```sh
tg bot api decline-suggested-post [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target direct messages chat. |
| `--message-id <value>` | Identifier of a suggested post message to decline. |
| `--comment <value>` | Comment for the creator of the suggested post; 0-128 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-message`

Use this method to delete a message, including service messages, with the following limitations: — destructive (deleteMessage)

**Changes something in Telegram.**

```sh
tg bot api delete-message [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-id <value>` | Identifier of the message to delete. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-messages`

Use this method to delete multiple messages simultaneously. If some of the specified messages can't be found, they are skipped. Returns True on success. — destructive (deleteMessages)

**Changes something in Telegram.**

```sh
tg bot api delete-messages [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-ids <value>` | A JSON-serialized list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-ephemeral-message`

Use this method to delete an ephemeral message. Note that it is not guaranteed that the user will receive the message deletion event, especially if they are offline. Returns True on success. — destructive (deleteEphemeralMessage)

**Changes something in Telegram.**

```sh
tg bot api delete-ephemeral-message [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--receiver-user-id <value>` | Identifier of the user who received the message. |
| `--ephemeral-message-id <value>` | Identifier of the ephemeral message to delete. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-message-reaction`

Use this method to remove a reaction from a message in a group or a supergroup chat. The bot must have the 'can_delete_messages' administrator right in the chat. Returns True on success. — destructive (deleteMessageReaction)

**Changes something in Telegram.**

```sh
tg bot api delete-message-reaction [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--message-id <value>` | Identifier of the target message. |
| `--user-id <value>` | Identifier of the user whose reaction will be removed, if the reaction was added by a user. |
| `--actor-chat-id <value>` | Identifier of the chat whose reaction will be removed, if the reaction was added by a chat. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-all-message-reactions`

Use this method to remove up to 10000 recent reactions in a group or a supergroup chat added by a given user or chat. The bot must have the 'can_delete_messages' administrator right in the chat. Returns True on success. — destructive (deleteAllMessageReactions)

**Changes something in Telegram.**

```sh
tg bot api delete-all-message-reactions [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target supergroup in the format @username. |
| `--user-id <value>` | Identifier of the user whose reactions will be removed, if the reactions were added by a user. |
| `--actor-chat-id <value>` | Identifier of the chat whose reactions will be removed, if the reactions were added by a chat. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-sticker`

Use this method to send static .WEBP, animated .TGS, or video .WEBM stickers. On success, the sent Message is returned. — write (sendSticker)

**Changes something in Telegram.**

```sh
tg bot api send-sticker [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--sticker <value>` | Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. Video and animated stickers can't be sent via an HTTP URL. |
| `--emoji <value>` | Emoji associated with the sticker; only for just uploaded stickers. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-sticker-set`

Use this method to get a sticker set. On success, a StickerSet object is returned. — read (getStickerSet)

```sh
tg bot api get-sticker-set [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | Name of the sticker set. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-custom-emoji-stickers`

Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects. — read (getCustomEmojiStickers)

```sh
tg bot api get-custom-emoji-stickers [options]
```

| Option | What it does |
|---|---|
| `--custom-emoji-ids <value>` | A JSON-serialized list of custom emoji identifiers. At most 200 custom emoji identifiers can be specified. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api upload-sticker-file`

Use this method to upload a file with a sticker for later use in the createNewStickerSet, addStickerToSet, or replaceStickerInSet methods (the file can be used multiple times). Returns the uploaded File on success. — write (uploadStickerFile)

**Changes something in Telegram.**

```sh
tg bot api upload-sticker-file [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of sticker file owner. |
| `--sticker <value>` | A file with the sticker in .WEBP, .PNG, .TGS, or .WEBM format. See https://core.telegram.org/stickers for technical requirements. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. |
| `--sticker-format <value>` | Format of the sticker, must be one of "static", "animated", "video". |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api create-new-sticker-set`

Use this method to create a new sticker set owned by a user. The bot will be able to edit the sticker set thus created. Returns True on success. — write (createNewStickerSet)

**Changes something in Telegram.**

```sh
tg bot api create-new-sticker-set [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of created sticker set owner. |
| `--name <value>` | Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only English letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in "_by_<bot_username>". <bot_username> is case insensitive. 1-64 characters. |
| `--title <value>` | Sticker set title, 1-64 characters. |
| `--stickers <value>` | A JSON-serialized list of 1-50 initial stickers to be added to the sticker set. |
| `--sticker-type <value>` | Type of stickers in the set, pass "regular", "mask", or "custom_emoji". By default, a regular sticker set is created. |
| `--needs-repainting <value>` | Pass True if stickers in the sticker set must be repainted to the color of text when used in messages, the accent color if used as emoji status, white on chat photos, or another appropriate color based on context; for custom emoji sticker sets only. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api add-sticker-to-set`

Use this method to add a new sticker to a set created by the bot. Emoji sticker sets can have up to 200 stickers. Other sticker sets can have up to 120 stickers. Returns True on success. — write (addStickerToSet)

**Changes something in Telegram.**

```sh
tg bot api add-sticker-to-set [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of sticker set owner. |
| `--name <value>` | Sticker set name. |
| `--sticker <value>` | A JSON-serialized object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set isn't changed. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-position-in-set`

Use this method to move a sticker in a set created by the bot to a specific position. Returns True on success. — write (setStickerPositionInSet)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-position-in-set [options]
```

| Option | What it does |
|---|---|
| `--sticker <value>` | File identifier of the sticker. |
| `--position <value>` | New sticker position in the set, zero-based. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-sticker-from-set`

Use this method to delete a sticker from a set created by the bot. Returns True on success. — destructive (deleteStickerFromSet)

**Changes something in Telegram.**

```sh
tg bot api delete-sticker-from-set [options]
```

| Option | What it does |
|---|---|
| `--sticker <value>` | File identifier of the sticker. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api replace-sticker-in-set`

Use this method to replace an existing sticker in a sticker set with a new one. The method is equivalent to calling deleteStickerFromSet, then addStickerToSet, then setStickerPositionInSet. Returns True on success. — write (replaceStickerInSet)

**Changes something in Telegram.**

```sh
tg bot api replace-sticker-in-set [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier of the sticker set owner. |
| `--name <value>` | Sticker set name. |
| `--old-sticker <value>` | File identifier of the replaced sticker. |
| `--sticker <value>` | A JSON-serialized object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set remains unchanged. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-emoji-list`

Use this method to change the list of emoji assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success. — write (setStickerEmojiList)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-emoji-list [options]
```

| Option | What it does |
|---|---|
| `--sticker <value>` | File identifier of the sticker. |
| `--emoji-list <value>` | A JSON-serialized list of 1-20 emoji associated with the sticker. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-keywords`

Use this method to change search keywords assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success. — write (setStickerKeywords)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-keywords [options]
```

| Option | What it does |
|---|---|
| `--sticker <value>` | File identifier of the sticker. |
| `--keywords <value>` | A JSON-serialized list of 0-20 search keywords for the sticker with total length of up to 64 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-mask-position`

Use this method to change the mask position of a mask sticker. The sticker must belong to a sticker set that was created by the bot. Returns True on success. — write (setStickerMaskPosition)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-mask-position [options]
```

| Option | What it does |
|---|---|
| `--sticker <value>` | File identifier of the sticker. |
| `--mask-position <value>` | A JSON-serialized object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-set-title`

Use this method to set the title of a created sticker set. Returns True on success. — write (setStickerSetTitle)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-set-title [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | Sticker set name. |
| `--title <value>` | Sticker set title, 1-64 characters. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-sticker-set-thumbnail`

Use this method to set the thumbnail of a regular or mask sticker set. The format of the thumbnail file must match the format of the stickers in the set. Returns True on success. — write (setStickerSetThumbnail)

**Changes something in Telegram.**

```sh
tg bot api set-sticker-set-thumbnail [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | Sticker set name. |
| `--user-id <value>` | User identifier of the sticker set owner. |
| `--thumbnail <value>` | A .WEBP or .PNG image with the thumbnail, must be up to 128 kilobytes in size and have a width and height of exactly 100px, or a .TGS animation with a thumbnail up to 32 kilobytes in size (see https://core.telegram.org/stickers#animation-requirements for animated sticker technical requirements), or a .WEBM video with the thumbnail up to 32 kilobytes in size; see https://core.telegram.org/stickers#video-requirements for video sticker technical requirements. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files: https://core.telegram.org/bots/api#sending-files. Animated and video sticker set thumbnails can't be uploaded via HTTP URL. If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail. |
| `--format <value>` | Format of the thumbnail, must be one of "static" for a .WEBP or .PNG image, "animated" for a .TGS animation, or "video" for a .WEBM video. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-custom-emoji-sticker-set-thumbnail`

Use this method to set the thumbnail of a custom emoji sticker set. Returns True on success. — write (setCustomEmojiStickerSetThumbnail)

**Changes something in Telegram.**

```sh
tg bot api set-custom-emoji-sticker-set-thumbnail [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | Sticker set name. |
| `--custom-emoji-id <value>` | Custom emoji identifier of a sticker from the sticker set; pass an empty string to drop the thumbnail and use the first sticker as the thumbnail. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api delete-sticker-set`

Use this method to delete a sticker set that was created by the bot. Returns True on success. — destructive (deleteStickerSet)

**Changes something in Telegram.**

```sh
tg bot api delete-sticker-set [options]
```

| Option | What it does |
|---|---|
| `--name <value>` | Sticker set name. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-rich-message`

Use this method to send rich messages. If the message contains a block with a media element, then the bot must have the right to send the media to the chat. On success, the sent Message is returned. — write (sendRichMessage)

**Changes something in Telegram.**

```sh
tg bot api send-rich-message [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. Bot can send rich messages on behalf of a business account only if the corresponding user can send rich messages. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--ephemeral-message-parameters <value>` | A JSON-serialized object containing the parameters of the ephemeral message to send. |
| `--rich-message <value>` | The message to be sent. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-rich-message-draft`

Use this method to stream a partial rich message to a user while the message is being generated. Note that the streamed draft is ephemeral and acts as a temporary 30-second preview - once the output is finalized, you must call sendRichMessage with the complete message to persist it in the user's chat. Returns True on success. — write (sendRichMessageDraft)

**Changes something in Telegram.**

```sh
tg bot api send-rich-message-draft [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target private chat. |
| `--message-thread-id <value>` | Unique identifier for the target message thread. |
| `--draft-id <value>` | Unique identifier of the message draft; must be non-zero. Changes to drafts with the same identifier are animated. Otherwise, the draft is replaced without animation. |
| `--rich-message <value>` | The partial message to be streamed. Direct upload of new files and explicit upload of files by a URL isn't supported. |
| `--can-stop <value>` | Pass True to show the user a button to stop further drafts. The bot will receive an Update "stopped_message_generation" if the user presses the button. |
| `--keep-on-stop <value>` | Pass True to keep the draft in the chat when the button is pressed. The draft will still disappear after a short time or if the bot sends a message. To fully preserve the partial draft, the bot should send it as a new message. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-inline-query`

Use this method to send answers to an inline query. On success, True is returned. — write (answerInlineQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-inline-query [options]
```

| Option | What it does |
|---|---|
| `--inline-query-id <value>` | Unique identifier for the answered query. |
| `--cache-time <value>` | The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300. |
| `--is-personal <value>` | Pass True if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query. |
| `--next-offset <value>` | Pass the offset that a client should send in the next query with the same text to receive more results. Pass an empty string if there are no more results or if you don't support pagination. Offset length can't exceed 64 bytes. |
| `--button <value>` | A JSON-serialized object describing a button to be shown above inline query results. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-invoice`

Use this method to send invoices. On success, the sent Message is returned. — write (sendInvoice)

**Changes something in Telegram.**

```sh
tg bot api send-invoice [options]
```

| Option | What it does |
|---|---|
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--direct-messages-topic-id <value>` | Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat. |
| `--title <value>` | Product name, 1-32 characters. |
| `--description <value>` | Product description, 1-255 characters. |
| `--payload <value>` | Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. |
| `--currency <value>` | Three-letter ISO 4217 currency code, see more on currencies. Pass "XTR" for payments in Telegram Stars. |
| `--prices <value>` | Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in Telegram Stars. |
| `--max-tip-amount <value>` | The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0. Not supported for payments in Telegram Stars. |
| `--suggested-tip-amounts <value>` | A JSON-serialized Array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. |
| `--start-parameter <value>` | Unique deep-linking parameter. If left empty, forwarded copies of the sent message will have a Pay button, allowing multiple users to pay directly from the forwarded message, using the same invoice. If non-empty, forwarded copies of the sent message will have a URL button with a deep link to the bot (instead of a Pay button), with the value used as the start parameter. |
| `--provider-data <value>` | JSON-serialized data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. |
| `--photo-url <value>` | URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. People like it better when they see what they are paying for. |
| `--photo-size <value>` | Photo size in bytes. |
| `--photo-width <value>` | Photo width. |
| `--photo-height <value>` | Photo height. |
| `--need-name <value>` | Pass True if you require the user's full name to complete the order. Ignored for payments in Telegram Stars. |
| `--need-phone-number <value>` | Pass True if you require the user's phone number to complete the order. Ignored for payments in Telegram Stars. |
| `--need-email <value>` | Pass True if you require the user's email address to complete the order. Ignored for payments in Telegram Stars. |
| `--need-shipping-address <value>` | Pass True if you require the user's shipping address to complete the order. Ignored for payments in Telegram Stars. |
| `--send-phone-number-to-provider <value>` | Pass True if the user's phone number should be sent to the provider. Ignored for payments in Telegram Stars. |
| `--send-email-to-provider <value>` | Pass True if the user's email address should be sent to the provider. Ignored for payments in Telegram Stars. |
| `--is-flexible <value>` | Pass True if the final price depends on the shipping method. Ignored for payments in Telegram Stars. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--suggested-post-parameters <value>` | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. If empty, one 'Pay total price' button will be shown. If not empty, the first button must be a Pay button. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api create-invoice-link`

Use this method to create a link for an invoice. Returns the created invoice link as String on success. — write (createInvoiceLink)

**Changes something in Telegram.**

```sh
tg bot api create-invoice-link [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the link will be created. For payments in Telegram Stars only. |
| `--title <value>` | Product name, 1-32 characters. |
| `--description <value>` | Product description, 1-255 characters. |
| `--payload <value>` | Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. |
| `--currency <value>` | Three-letter ISO 4217 currency code, see more on currencies. Pass "XTR" for payments in Telegram Stars. |
| `--prices <value>` | Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in Telegram Stars. |
| `--subscription-period <value>` | The number of seconds the subscription will be active for before the next payment. The currency must be set to "XTR" (Telegram Stars) if the parameter is used. Currently, it must always be 2592000 (30 days) if specified. Any number of subscriptions can be active for a given bot at the same time, including multiple concurrent subscriptions from the same user. Subscription price must no exceed 10000 Telegram Stars. |
| `--max-tip-amount <value>` | The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0. Not supported for payments in Telegram Stars. |
| `--suggested-tip-amounts <value>` | A JSON-serialized Array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. |
| `--provider-data <value>` | JSON-serialized data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. |
| `--photo-url <value>` | URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. |
| `--photo-size <value>` | Photo size in bytes. |
| `--photo-width <value>` | Photo width. |
| `--photo-height <value>` | Photo height. |
| `--need-name <value>` | Pass True if you require the user's full name to complete the order. Ignored for payments in Telegram Stars. |
| `--need-phone-number <value>` | Pass True if you require the user's phone number to complete the order. Ignored for payments in Telegram Stars. |
| `--need-email <value>` | Pass True if you require the user's email address to complete the order. Ignored for payments in Telegram Stars. |
| `--need-shipping-address <value>` | Pass True if you require the user's shipping address to complete the order. Ignored for payments in Telegram Stars. |
| `--send-phone-number-to-provider <value>` | Pass True if the user's phone number should be sent to the provider. Ignored for payments in Telegram Stars. |
| `--send-email-to-provider <value>` | Pass True if the user's email address should be sent to the provider. Ignored for payments in Telegram Stars. |
| `--is-flexible <value>` | Pass True if the final price depends on the shipping method. Ignored for payments in Telegram Stars. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-shipping-query`

If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned. — write (answerShippingQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-shipping-query [options]
```

| Option | What it does |
|---|---|
| `--shipping-query-id <value>` | Unique identifier for the query to be answered. |
| `--ok <value>` | Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible). |
| `--shipping-options <value>` | Required if ok is True. A JSON-serialized Array of available shipping options. |
| `--error-message <value>` | Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable"). Telegram will display this message to the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api answer-pre-checkout-query`

Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent. — destructive (answerPreCheckoutQuery)

**Changes something in Telegram.**

```sh
tg bot api answer-pre-checkout-query [options]
```

| Option | What it does |
|---|---|
| `--pre-checkout-query-id <value>` | Unique identifier for the query to be answered. |
| `--ok <value>` | Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems. |
| `--error-message <value>` | Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-my-star-balance`

A method to get the current Telegram Stars balance of the bot. Requires no parameters. On success, returns a StarAmount object. — read (getMyStarBalance)

```sh
tg bot api get-my-star-balance
```

#### `tg bot api get-star-transactions`

Returns the bot's Telegram Star transactions in chronological order. On success, returns a StarTransactions object. — read (getStarTransactions)

```sh
tg bot api get-star-transactions [options]
```

| Option | What it does |
|---|---|
| `--offset <value>` | Number of transactions to skip in the response. |
| `--limit <value>` | The maximum number of transactions to be retrieved. Values between 1-100 are accepted. Defaults to 100. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api refund-star-payment`

Refunds a successful payment in Telegram Stars. Returns True on success. — destructive (refundStarPayment)

**Changes something in Telegram.**

```sh
tg bot api refund-star-payment [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Identifier of the user whose payment will be refunded. |
| `--telegram-payment-charge-id <value>` | Telegram payment identifier. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api edit-user-star-subscription`

Allows the bot to cancel or re-enable extension of a subscription paid in Telegram Stars. Returns True on success. — destructive (editUserStarSubscription)

**Changes something in Telegram.**

```sh
tg bot api edit-user-star-subscription [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Identifier of the user whose subscription will be edited. |
| `--telegram-payment-charge-id <value>` | Telegram payment identifier for the subscription. |
| `--is-canceled <value>` | Pass True to cancel extension of the user subscription; the subscription must be active up to the end of the current subscription period. Pass False to allow the user to re-enable a subscription that was previously canceled by the bot. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-passport-data-errors`

Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success. — write (setPassportDataErrors)

**Changes something in Telegram.**

```sh
tg bot api set-passport-data-errors [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier. |
| `--errors <value>` | A JSON-serialized Array describing the errors. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api send-game`

Use this method to send a game. On success, the sent Message is returned. — write (sendGame)

**Changes something in Telegram.**

```sh
tg bot api send-game [options]
```

| Option | What it does |
|---|---|
| `--business-connection-id <value>` | Unique identifier of the business connection on behalf of which the message will be sent. |
| `--chat-id <value>` | Unique identifier for the target chat or username of the target bot in the format @username. Games can't be sent to channel direct messages chats and channel chats. |
| `--message-thread-id <value>` | Unique identifier for the target message thread (topic) of a forum; for forum supergroups and private chats of bots with forum topic mode enabled only. |
| `--game-short-name <value>` | Short name of the game, serves as the unique identifier for the game. Set up your games via @BotFather. |
| `--disable-notification <value>` | Sends the message silently. Users will receive a notification with no sound. |
| `--protect-content <value>` | Protects the contents of the sent message from forwarding and saving. |
| `--allow-paid-broadcast <value>` | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance. |
| `--message-effect-id <value>` | Unique identifier of the message effect to be added to the message; for private chats only. |
| `--reply-parameters <value>` | Description of the message to reply to. |
| `--reply-markup <value>` | A JSON-serialized object for an inline keyboard. If empty, one 'Play game_title' button will be shown. If not empty, the first button must launch the game. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api set-game-score`

Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False. — write (setGameScore)

**Changes something in Telegram.**

```sh
tg bot api set-game-score [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | User identifier. |
| `--score <value>` | New score, must be non-negative. |
| `--force <value>` | Pass True if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters. |
| `--disable-edit-message <value>` | Pass True if the game message should not be automatically edited to include the current scoreboard. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the sent message. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

#### `tg bot api get-game-high-scores`

Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in a game. Returns an Array of GameHighScore objects. — read (getGameHighScores)

```sh
tg bot api get-game-high-scores [options]
```

| Option | What it does |
|---|---|
| `--user-id <value>` | Target user id. |
| `--chat-id <value>` | Required if inline_message_id is not specified. Unique identifier for the target chat. |
| `--message-id <value>` | Required if inline_message_id is not specified. Identifier of the sent message. |
| `--inline-message-id <value>` | Required if chat_id and message_id are not specified. Identifier of the inline message. |
| `--body <json>` | the request body as JSON; - reads it from stdin. |
| `--body-file <path>` | the request body from a JSON file; - is stdin. |

## `tg skill`

the instructions an agent is given for this tool

### `tg skill show`

print SKILL.md — `tg skill install` puts it where Claude Code, Codex and Gemini CLI look for it

```sh
tg skill show [name]
```

| Argument | | What it is |
|---|---|---|
| `name` | optional | one of the skills shipped for a task: link-conversations. |

### `tg skill install`

write SKILL.md to \~/.claude/skills/tg-cli/ (Claude Code) and \~/.agents/skills/tg-cli/ (Codex, Gemini CLI)

```sh
tg skill install [options]
```

| Option | What it does |
|---|---|
| `--for <agents>` | which agents to install for. One of: `claude`, `agents`, `all`. Default: `all`. |

## Exit codes

Branch on the code, not on the text: the text can change, the code does not.

| Code | When |
|---|---|
| `0` | it worked |
| `2` | `validation_error` |
| `3` | `configuration_error` |
| `4` | `authentication_error` |
| `5` | `permission_error` |
| `6` | `not_found` |
| `7` | `confirmation_required` |
| `8` | `rate_limited` |
| `9` | `timeout` |
| `10` | `network_error` |
| `11` | `provider_error` |
| `12` | `provider_unavailable` |
| `13` | `invalid_response` |
| `14` | `outcome_unknown` |
| `130` | `cancelled` |
| `1` | anything else |

`0` and only `0` means the operation was done. `14` (`outcome_unknown`) means a message **may**
have gone: repeat it only with the same `--send-id`, which Telegram uses to drop a second copy.
