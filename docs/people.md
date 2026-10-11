# People

Use this page when you want to know more about one person: who they are, what they wrote to you
or in your groups, and whether their account looks like a bot or a spammer. You will learn how to
read a person's profile, collect their messages for a summary, check an account before you trust
it, and keep your own names and notes about people.

Some words on this page:

- **The local store** is the copy of your messages that `tg` keeps on this computer. Counts and
  messages on this page come from it, so they show only what was downloaded.
- **A profile** here is what Telegram says about a person: name, username, bio, photo and flags.
  It is not a `tg` login profile.
- **A person** is named by their id, their `@username`, or part of their name. When part of a name
  matches more than one person, the command stops and lists them; run it again with the id or the
  username.

## What you can do

| Task | Command |
| --- | --- |
| See who a person is and where you talk to them | `tg contacts profile` |
| Read what they said, in every chat or in the chats you name | `tg contacts context` |
| Check whether the account looks like a bot, a fake or a spammer | `tg contacts check` |
| Check the most suspicious members of a group | `tg chats members audit --deep` |
| Record that a Telegram account and a MAX account are the same person | `tg contacts link` |
| Keep your own name and notes for a person | `tg contacts alias`, `tg contacts notes` |

Every option of these commands is in the [command reference for contacts](commands.md#tg-contacts).

## Who they are: `contacts profile`

```sh
tg contacts profile @example_user
tg contacts profile @example_user --json
```

It answers everything Telegram says about the person, and how many of their messages your local
store holds in each chat you share:

```json
{
  "id": "1000001",
  "name": "Example User",
  "usernames": ["example_user"],
  "bio": "Coffee and maps",
  "phone": "***0123",
  "flags": { "bot": false, "verified": false, "premium": true, "scam": false, "fake": false,
             "restricted": false, "deleted": false, "support": false },
  "seen": "recently",
  "contact": true,
  "mutualContact": true,
  "commonChatsCount": 2,
  "registered": { "at": "2019-04-01T00:00:00.000Z", "source": "estimate", "precision": "month" },
  "hasPhoto": true,
  "chats": [
    { "id": "1000001", "title": "Example User", "kind": "dialog", "theirMessages": 412,
      "firstAt": "2023-02-11T09:14:00.000Z", "lastAt": "2026-10-05T18:02:00.000Z", "complete": true },
    { "id": "-1002000002", "title": "Book club", "kind": "group", "theirMessages": 37,
      "firstAt": "2025-06-01T10:00:00.000Z", "lastAt": "2026-09-30T20:41:00.000Z", "complete": false }
  ],
  "aliases": [
    { "name": "Example U.", "username": "example_old", "link": "https://t.me/example_old",
      "firstSeenAt": "2024-03-02T08:00:00.000Z", "lastSeenAt": "2024-03-02T08:00:00.000Z", "source": "profile" }
  ]
}
```

- **`phone`** shows only the last four digits, and only when Telegram shows you their number.
  `--show-phone` prints it whole. The MCP tool always hides it.
- **`flags`** are Telegram's own marks. `scam` and `fake` mean Telegram itself labelled the account.
- **`seen`** is `online`, `recently`, `week`, `month`, `hidden`, or an exact time when their privacy
  settings show it to you.
- **`registered`** always says where the date came from:
  - `telegram` — the month Telegram sends when someone writes to you for the first time;
  - `estimate` — a guess from the account id, using a table that ends at August 2026.
    Newer ids get no estimate at all rather than a date that may be years off.
- **`hasPhoto`** counts their own photo and their public one, never a photo you set for them.
- **`chats`** lists every chat you share, and any other chat where the store holds their messages.
- **`aliases`** are earlier names and usernames your store saw them with, oldest first, each with a
  `t.me` link for an old username. `source: profile` — their profile changed while the store watched;
  `source: messages` — the name on their stored messages, approximate, since a message fetched again
  carries the newest name. It is empty until the store has seen a change.

### Counts are what your store holds

`theirMessages`, `firstAt` and `lastAt` come from your local store, never from Telegram. When
`complete` is `false`, the store does not hold that chat from its start, so the count is a minimum
and `firstAt` may be later than their real first message. Fetch the chat to fill it:

```sh
tg store fetch "Book club"
```

The profile costs no extra requests: it uses the same three calls as `contacts show`. The person
is not told that you looked.

## What they said: `contacts context`

Without `--chat`, it gives an overview from the store: the chats you share, the last message each way,
their recent messages in your direct chat and in groups, and where others mentioned them. Linked
email identities also contribute sent and received mail. It never connects.

```sh
tg contacts context @example_user
```

With `--chat`, it gives their newest messages in each chat you name, oldest first, 20 per chat:

```sh
tg contacts context @example_user --chat "Book club" --chat "Team" --limit 10
tg contacts context @example_user --chat "Book club" --refresh
```

```json
{
  "person": { "uid": "p_7", "provider": "telegram", "id": "1000001", "name": "Example User" },
  "chats": [
    {
      "chat": { "id": "-1002000002", "title": "Book club", "kind": "group" },
      "messages": [
        { "at": "2026-09-29T19:02:00.000Z", "text": "Next one is the short story collection" },
        { "at": "2026-09-30T20:41:00.000Z", "text": "I can host on Thursday" }
      ],
      "complete": false,
      "more": true
    }
  ],
  "limits": { "messages": 10 }
}
```

- Each message is only its time and text, so an agent can read many of them at once. `-v` adds the
  message id, a link to it, the sender and what it replies to; `-vv` gives the whole message.
- `--refresh` asks Telegram first: one search per chat for that person's messages. Without it, the
  answer comes from the store and never connects.
- `more: true` means there are older messages than the limit; `complete: false` means the store does
  not hold the chat from its start.
- A voice message carries `transcript` once it has been turned into text.

## Bot, fake or spammer: `contacts check`

```sh
tg contacts check @example_user
tg contacts check @example_user --no-registries
```

```json
{
  "person": { "id": "1000001", "name": "Example User", "username": "example_user", "provider": "telegram" },
  "score": 3,
  "reasons": [
    { "reason": "no_bio", "weight": 1, "source": "messenger" },
    { "reason": "link_first", "weight": 2, "source": "store" }
  ],
  "registries": [
    { "name": "cas", "answer": "clean", "checkedAt": "2026-10-07T08:00:00.000Z" },
    { "name": "lols", "answer": "clean", "checkedAt": "2026-10-07T08:00:00.000Z" }
  ],
  "unknown": ["new_account"],
  "checkedAt": "2026-10-07T08:00:00.000Z"
}
```

The score adds up the weights of every reason found. It is a hint, never a verdict: plenty of real
people have no photo, no username or no bio, which is why those weigh little.

| Reason | Weight | What it means |
|---|---|---|
| `bot`, `scam`, `fake` | 3 | Telegram itself marked the account |
| `cas_banned`, `lols_banned`, `lols_scammer` | 3 | a public spam list has it |
| `new_account` | 2 | registered less than 30 days ago, by Telegram's month or the id estimate |
| `link_first` | 2 | their first stored message is a link |
| `same_text` | 2 | the same text in several chats |
| `photo_recent` | 1 | their oldest visible photo is less than 30 days old |
| `no_photo`, `no_username`, `no_bio` | 1 | the profile is empty there |
| `odd_name` | 1 | no name, a long run of digits, or a link in the name |
| `never_wrote` | 1 | the store holds no message from them |
| `deleted` | 1 | the account was deleted |

`unknown` lists the signals there was nothing to judge by, so a low score with a long `unknown`
list means little.

### What leaves your computer

`contacts check` asks two public spam lists, [Combot Anti-Spam (CAS)](https://cas.chat/api) and
[lols.bot](https://lols.bot), whether they list the person. **Their Telegram id is sent to both.**
`--no-registries` skips them; Telegram is still asked for the profile and photos unless you add
`--offline`. A list that does not answer shows `unknown`, and the rest of the check still runs.

A key for CAS is optional for now. When you have one from Combot, keep it in your system keyring as
the account `registries:cas` of the `tg-cli` service, or in `TG_CAS_API_KEY`. `tg` sends it only in a
request header, never in the address, and never prints it.

## The members of a group: `chats members audit --deep`

```sh
tg chats members audit "Book club"
tg chats members audit "Book club" --deep 10
```

`chats members audit` scores every member from the member list and the store, without one request per
person, and lists those with a reason, highest first. `--deep 10` then runs the full `contacts check`
on the ten highest, one person a second, spam lists included. It removes nobody. The owner and the
admins are left out.

## One person in two messengers: `contacts link`

Telegram and MAX share one local store on this computer. When you know that a Telegram account and a
MAX account are the same person, record it:

```sh
tg contacts link @example_user max:"Example User"
tg contacts unlink @example_user
```

After that, `contacts context` without `--chat` gathers both accounts: the chats you share and the
messages from the Telegram account and from the MAX account. `contacts profile` and
`contacts context --chat` still show only the account you named. The link is only ever what you
record: the same name in both messengers is never taken as the same person.

## Your own names and notes: `contacts alias`, `contacts notes`

```sh
tg contacts alias set "Bob Synthetic" Bobby            # your own name for a person, on this computer only
tg contacts alias rm "Bob Synthetic"
tg contacts notes add "Bob Synthetic" --file note.txt  # or the text from stdin
tg contacts notes list "Bob Synthetic"
tg contacts notes edit "Bob Synthetic" <id> --revision 1 --file note.txt
tg contacts notes remove "Bob Synthetic" <id>
tg contacts show "Bob Synthetic" --with-notes
tg contacts list --search-notes flat                   # people whose notes contain this text
```

Aliases and notes stay in the local store and never reach Telegram. An alias applies only in the
account you use now; a note about a person shows in every `tg` login profile on this computer that
sees them. `contacts rename` changes
the name in your Telegram contacts — a different thing. A command finds a person by your alias unless it
matches someone else's name; then it needs the id. `--revision` stops an edit of a note that changed since
you read it.

## Next step

To see what a whole group is doing, and who waits for an answer there, read
[groups you run](groups.md). An AI agent can run all the commands on this page for you; to connect
one, see [connect an agent over MCP](mcp.md).
