# Using tg

tg lets you, or your AI agent, read and write your own Telegram account from the terminal. This page
is the tour: from the first login to reading, sending and running groups, in the order you will need
it. Open it when you start with tg, or when you want to know what is possible before you ask your agent.

After reading it you know how to name a chat, how to read and search without anyone seeing that you
looked, how to send safely, and how to get answers a script can use. Every command and option is in
the [command reference](commands.md); this page explains how they fit together.

Terms used on this page:

- **Profile**: one Telegram account set up on this computer, with its own login and settings. The
  first word of a command picks it ([profiles](#profiles-the-first-word)).
- **Chat**: any conversation — a one-to-one chat, a group, a channel or Saved Messages.
- **Local store**: the database on this computer where tg keeps every message it reads
  ([the local store](archive.md)).
- **Send guard**: the checks every send passes — a read-only profile, the list of allowed recipients
  and an hourly limit ([the send guard](security.md#the-send-guard)).

Each command does one thing, prints its answer and exits. Only `tg watch`, `tg serve` and `tg mcp`
stay running, and each of them says so.

```sh
tg [profile] [options] <resource> <action> [arguments]
```

## What you can do

| Area | What you can do | Start with |
|---|---|---|
| Read | chats, messages, one message and its neighbours, forum topics | `tg chats list`, `tg messages list <chat>` |
| Catch up | other people's unread messages; what you promised and what is open | `tg inbox`, `tg review` |
| Voice | turn voice messages into text, on this computer | `tg messages transcribe` |
| Files | download a message's files or a whole chat's | `tg messages download` |
| People | contacts, a person's profile, a bot check | `tg contacts list`, `tg contacts profile` |
| Search | messages, files, dates, people; discussions by meaning | `tg search messages`, `tg search conversations` |
| Send | text, files, voice, replies, scheduled messages | `tg messages send` |
| Change | edit, forward, pin, delete, react, vote, mark read | `tg messages edit`, `tg reactions add` |
| Organize | folders | `tg chats folders list` |
| Groups | members, invite links, join requests, topics, admins | `tg chats members list`, `tg chats link create` |
| Follow | new messages as they arrive; keep the local store current | `tg watch`, `tg server start` |
| Check | what a command did; what a profile may do | `tg runs list`, `tg config show` |

## Read a chat with your agent

Once your account is connected, ask for a short recap. This task reads messages; it sends nothing.

**Your request:**

> Summarise the five latest messages in Book club. Show decisions and open questions. Send nothing.

**Command:**

```sh
tg messages list "Book club" --limit 5 --json
```

**Example agent answer:**

> **Decision:** the next discussion is Thursday at 18:00.
>
> **Still open:** which meeting place to use.
>
> I can show the messages behind this recap. Nothing was sent.

The recap above is fictional. Ask the agent to open the source messages before relying on its
interpretation. Setup, message actions and permissions are explained in the sections below.

## Get started

```sh
npm install -g @wirecat/tg-cli
```

```sh
tg setup                  # guided app registration, login and agent skill
```

```sh
tg chats list --limit 5   # your newest chats
```

```sh
tg messages list me       # Saved Messages, the latest 20
```

Allow about five minutes for setup. History downloads are separate: choose a chat and an amount
before `tg store fetch <chat> --last 100`. An agent can read `tg skill show` without logging in;
`tg setup --agent codex` selects the skill for one agent explicitly. `tg setup --help` explains the
flags. Nothing more is needed to read.

To discover the arguments for a task, use `tg commands search messages --json` for one command
or `tg commands messages --json` for a group. Both include global options and exit codes.
Inspect each command path in a separate call; `tg commands --json` returns the whole tree.

## Log in

`tg setup` is the first-run command. It defaults to automatic app registration and QR login;
`--app browser` and `--method phone` choose the alternatives. For login alone, or to finish an
interrupted or expired login, use:

```sh
tg session start                        # QR code: Settings → Devices → Link Desktop Device
```

```sh
tg session start phone                  # phone number, the code Telegram sends, your 2FA password
```

```sh
tg session start phone --sms            # the same, asking for the code by SMS instead of in the app
```

```sh
tg session start --qr-file login.png    # the QR code as a picture, for an agent to show you
```

The first login also asks for your own Telegram app from my.telegram.org; `--app auto` fills in the
site for you. Both steps, and what is kept where: [login, sessions and profiles](sessions.md).

**No secret is ever an argument.** The app hash and the 2FA password are asked without showing what
you type; the login code and the phone number are asked, or read from stdin. An argument is visible
to every process on the machine in `ps`, and stays in your shell history.

For CI, `TG_API_ID` and `TG_API_HASH` give the app without the keyring; they win over it.

```sh
tg account show                # who this profile is logged in as; the phone as its last four digits
```

```sh
tg account show --show-phone   # the whole phone number
```

```sh
tg account list                # every profile on this computer and the account each is logged in as
```

```sh
tg account sessions list       # every device and app logged in to the account; ends nothing
```

```sh
tg session end                 # log out on Telegram's side, and delete the session here
```

`session end` ends the session on Telegram's side too: the device disappears from the app's list.
To end a session from elsewhere, use the app: Settings → Devices.

## Profiles: the first word

Several accounts live side by side. The profile is the first word, not an option:

```sh
tg chats list             # profile "default"
```

```sh
tg work chats list        # profile "work"
export TG_PROFILE=work    # or for a whole shell session
```

**The first word is the profile whenever it is not a command.** So a profile cannot be called `chats`:
such a name is refused, with the reason. A name is letters, digits, dot, dash and underscore.

Each profile has its own session, its own app, its own settings and its own list of allowed
recipients. `TG_PROFILE_LOCK` pins a process to one profile, so an agent cannot pick one with fewer
limits ([profiles](profiles.md)).

## Naming a chat

Wherever a command takes `<chat>`, it accepts:

- a title, or part of one: `"Book club"`, `book`
- an id: `-1001234567890`
- a username: `@example_channel`
- `me` for Saved Messages

A title that fits more than one chat is an error that lists the candidates with their ids. `tg`
never guesses: a message sent to the wrong conversation cannot be taken back. Take the id and repeat
the command with it. An id never changes, so once you have it, use it.

`messages show` and `messages context` also take a `msg:` locator in place of the chat and the id,
as `search messages --json` prints it for each hit.

A person (`<person>`, in `contacts show`) is an id, an `@username` or part of their name.

## Reading

**Reading marks nothing read.** No command below shows the other side that you looked. Only
`tg chats mark-read` and `tg messages list --mark-read` do ([below](#marking-a-chat-read)).

### Chats

```sh
tg chats list                              # newest first, archived chats included
```

```sh
tg chats list --unread --kind group        # only groups with unread messages
```

```sh
tg chats list --search book                # titles containing "book"; at least 3 characters
```

```sh
tg chats show "Book club"                  # kind, unread count, last message, who is in it
```

`--kind` is one of `dialog` (one-to-one), `group`, `channel` or `saved`. The filters look at
every returned chat. Groups and channels have [their own section](#groups-and-channels).

### Messages

```sh
tg messages list "Book club"                    # the latest 20, oldest first
```

```sh
tg messages list "Book club" --limit 50
```

```sh
tg messages list "Hiking" --topic 12            # one forum topic; topics list shows the ids
```

```sh
tg messages show "Book club" 4242               # one message
```

```sh
tg messages context "Book club" 4242            # it, and 5 messages either side
```

```sh
tg messages context "Book club" 4242 --before-n 2 --after-n 10
```

In `context`, the message you asked for is marked `◀` in the terminal and `"anchor": true` in JSON.

`--topic` reads back from the topic's newest message, or from `--before-id`. The General topic (`1`) is
refused: Telegram gives its messages no topic id, so read the whole chat instead. With `--offline`,
`--topic` keeps the stored messages of that topic.

### Message links

`tg messages link <chat> <message>` or `tg messages link <msg:locator>` returns
`{ locator, url, access, reason }`. Channel and supergroup permalinks can be public or restricted;
a link grants no membership. Dialogs, basic groups and Saved Messages return a locator. Offline
validates the stored target and returns no permalink. A locator for another account is refused.
This singular command differs from `messages links`, which explains conversation relationships
([topic search](topic-search.md)).

### What needs an answer

```sh
tg inbox                     # other people's unread messages, in every chat
```

```sh
tg inbox --since-time 2h     # everything that came in during the last two hours
```

```sh
tg inbox --new               # what arrived since the last --new — for scheduled runs
```

```sh
tg inbox --new --jsonl       # the same for a script: one message per line
```

`inbox` shows other people's messages, never yours, each with its chat. It leaves out muted and
archived chats unless a message mentions you or replies to you; `--all` takes them in. It says on
stderr how many it left out.

**`inbox --new` moves a saved point.** The next `--new` starts from where this one stopped, so each
message is shown once. The first `--new` looks back 24 hours. `inbox` without `--new`, and
`inbox --since-time`, leave the point where it is. Plain `inbox` answers the same until the messages are
read in the app, since it marks nothing read.

One run reads at most 20 chats; the rest are named on stderr and in `skipped`, with the command that
reads one. In a chat with more than `--limit` messages waiting, the newest are shown, and stderr says
how to read the rest.

### Who owes what: `review`

```sh
tg review                                  # the last 3 days
```

```sh
tg review --since-time 2026-09-23T09:00    # from where the last review ended
```

```sh
tg review --chat "Book club" --json
```

Every message — yours and other people's — in every chat where something happened since `--since-time`.
It is for working out what you promised, what you are waiting for and what is still unclear; sorting
it is your job or an agent's. It marks nothing read.

The command ends with a line on stderr: from when to when it read. **Start the next review from
that `--since-time`**, and nothing falls between two reviews. When the review is incomplete — too many
chats at once, or a chat cut short to its newest 300 messages — it says so, and it is better not to
move the boundary. It reads at most 20 chats in one run.

#### Unanswered questions

```sh
tg review --unanswered                     # questions nobody answered in 24 hours
```

```sh
tg review --chat "Neighbours" --unanswered 4h
```

`--unanswered [hours]` keeps only questions waiting for you or for a group's admins. A question is a
message with `?` in it (a link's `?` does not count), or a reply to you or to an admin. It is
answered when you or an admin replied to it, or were the next to speak after the person who asked.
Questions younger than the hours given (24 by default) are left out: nobody has had time to answer.
When a group's admins are not known, the command says so, and only your answers count.

Saved voice transcripts count in this filter too. Add `--transcribe` to transcribe voice messages
that have no saved transcript before the questions are selected. A voice message that could not be
transcribed keeps the review incomplete: an empty result does not prove there are no unanswered
questions. Keep the previous boundary until `complete` is true.

### Voice messages

```sh
tg messages transcribe "Book club" 4242          # by Telegram where it can, else a model here
```

```sh
tg messages transcribe "Book club" 4242 --local  # only the model on this machine
```

```sh
tg messages list "Book club" --transcribe        # every voice message shown that has no text yet
```

```sh
tg inbox --transcribe
```

```sh
tg review --transcribe
```

```sh
tg messages list "Book club" --transcribe --model gigaam-v3
```

Local transcription requires a complete mono or stereo Ogg Opus recording without a fixed
ten-minute cutoff. Longer recordings need more memory and processing time.

Telegram transcribes for Premium accounts, and a few messages a week on the free trial. Without it,
a model on this machine does the work, and the recording never leaves the computer. A model is
downloaded once, and only when you ask:

```sh
tg models audio list                   # the models, which is downloaded, which is the default
```

```sh
tg models audio download parakeet-v3   # once, checked against the sha256 this version expects
```

| Model | Languages | Size |
|---|---|---|
| `parakeet-v3` — the default | 25: Bulgarian, Czech, Danish, German, Greek, English, Spanish, Estonian, Finnish, French, Croatian, Hungarian, Italian, Lithuanian, Latvian, Maltese, Dutch, Polish, Portuguese, Romanian, Russian, Slovak, Slovenian, Swedish, Ukrainian | 670 MB |
| `gigaam-v3` | Russian — the best of the three for Russian | 232 MB |
| `gigaam-v3-ctc` | Russian — a little faster, rougher with capital letters | 225 MB |

`--model` picks another model for one command, beside `--transcribe` or in `messages transcribe`;
`transcribeWith` and `speechModel` in the settings choose the defaults ([configuration](configuration.md)).
A transcript is kept in the local store and reused by message lists, inboxes and reviews. Calling
`messages transcribe` again can request a new transcript or run recognition again. `--transcribe` can
take minutes.

### Files

```sh
tg messages download "Book club" 4242 --output-dir ~/Downloads   # one message's files
```

```sh
tg messages download "Book club" --all --output-dir ~/tg-files   # every file of the chat, newest first
```

Photos, files, videos and voice notes are saved; the folder is created if it is missing. A file
keeps its own name; one without a name gets the message id. **A download never overwrites a file.**
With `--all`, a name already taken gets the message's id in front. `--all` remembers where it stopped
in a small file beside the downloads, and the same command continues from there. Saved files are
readable only by you. Sending files, formats and searchable text: [file attachments](attachments.md).

### People

```sh
tg contacts list                       # people you have a one-to-one chat with, newest first
```

```sh
tg contacts list --order name --search ann
```

```sh
tg contacts show @example_user         # their bio and the chats you share
```

```sh
tg contacts lookup                     # who has a phone number — asks for it, or reads it from stdin
```

```sh
tg contacts sync                       # your whole Telegram contact list into the local store
```

```sh
tg contacts profile @example_user      # flags, last seen, registered, messages per shared chat
```

```sh
tg contacts context @example_user --chat "Book club"   # their latest messages there
```

```sh
tg contacts check @example_user        # does the account look like a bot or a spammer
```

`contacts list` is the people you have a one-to-one chat with. `contacts sync` brings in the rest of
your Telegram contact list too. `contacts lookup` never takes the number as an argument: pipe it in,
or type it when asked. A person's profile, their recent messages, the bot check and what it sends
where: [people](people.md).

Changing the address book and your profile:

```sh
tg contacts add @example_user          # under the name they show
```

```sh
tg contacts rename @example_user Ann "from work"   # a name only you see
```

```sh
tg contacts remove @example_user       # the chat stays
```

```sh
tg contacts block @example_user        # they need not be a contact
```

```sh
tg contacts unblock @example_user
```

```sh
tg contacts import people.txt          # one "number, name" per line; never numbers as arguments
```

```sh
tg account update --first-name Ann --description "about me" --photo me.jpg
```

```sh
tg account sessions end --others       # logs out every other device, your phone too; asks first
```

`contacts import` answers how many it sent and who Telegram knew, never a number. `account sessions
end` asks before it goes; `--yes` answers in a script.

### Pages

A list shows `limit` rows (20 by default). `chats list`, `contacts list`, `chats members list` and
`topics` take `--page` and `--all`:

```sh
tg contacts list --limit 5             # five a page
```

```sh
tg contacts list --limit 5 --page 2    # the sixth to the tenth
```

```sh
tg contacts list --all                 # every row, no paging
```

⚠ **A page number over a live list can repeat or skip a row.** The newest is on top, so a message
that arrives between page one and page two moves someone across the border.

**A chat's messages have no pages: they have `--before-id`, `--after-id` and `--after-time`**, which
page exactly:

```sh
tg messages list "Book club" --before-id 4242   # older than message 4242
```

```sh
tg messages list "Book club" --after-id 4242    # newer than 4242, oldest first
```

```sh
tg messages list "Book club" --after-time 2h    # what came in during the last two hours
```

```sh
tg messages list "Book club" --after-time 2026-09-20T09:00
```

```sh
tg messages list "Book club" --before-time 1d   # what came before this time yesterday
```

In the terminal, the line that names the next page goes to stderr. `--before-id` and `--after-id` take
a message id. `--after-time` takes ISO 8601, or "this long ago": `30m`, `2h`, `1d`. In
`messages context`, `--before-n` and `--after-n` are counts of messages: there the point is already
the message.

### Find a chat, then write to it

```sh
tg chats list --search book --kind group     # groups with "book" in the title
```

```sh
tg contacts list --search ann                # people by name or @username
```

```sh
tg search all "contract"                     # messages, mail and notes this machine has kept
```

```sh
tg search messages "contract"                # the text of every message this machine has kept
```

```sh
tg search messages "contract" --chat "Book club"
```

```sh
tg search messages "invoice.*(march|april)" --regex
```

Chat and contact searches need **at least three characters**. `search messages` uses the
[search query language](query-language.md): `invoice` also finds other forms of the word, `invoic*`
matches beginnings, and `exact:invoice` only that form. It reads what was fetched or kept by `serve`,
and asks Telegram's own search too (`--backend archive` for the store only). `--regex` treats the words
as one JavaScript regular expression instead. More: [message search](search.md). Once you have the
chat, use its id.

## Sending

**Nothing sends unless you typed a command that sends**, and it asks no confirmation: the chat and
the text are already in the line you typed. Every send goes through the send guard: a read-only
profile, the profile's `allow` list, the list of allowed recipients and the hourly limit
([the send guard](security.md#the-send-guard)). Every attempt is logged, never its text:
`tg sends list`.

```sh
tg messages send me "a note to myself"
```

```sh
tg messages send "Book club" "See you at 7" --silent       # no notification
```

```sh
tg messages send "Book club" "a link, no card" --no-preview
```

```sh
tg messages send "Book club" "**Bold** and _italic_" --md  # Telegram Markdown
```

```sh
tg messages send "Book club" "<b>Bold</b> and <i>italic</i>" --html
```

`--md` uses Telegram's formatter: `**bold**` or `*bold*`, `_italic_`, `__underline__`,
`~~struck~~` or `~struck~`, `||spoiler||`, inline code, fenced code with a language,
`[label](https://example.com)` and quote lines starting with `> `. Styles may nest; code/pre
cannot nest with other entities, links cannot nest, and quotes cannot nest. Without the flag text
stays as typed. Backslash escapes a mark; word-internal `_` and `*` stay literal. Unclosed inline marks
stay literal; an unclosed fence is refused. Links support absolute http, https and mailto URLs.
`messages edit` and media captions use the same formatter. Telegram `__text__` is underline;
MAX `__text__` is bold. A single `*text*` is bold in Telegram.

`--html` reads the text as Telegram's HTML, the same as the Bot API's: `<b>`, `<i>`, `<u>`, `<s>`,
`<a href>`, `<code>`, `<pre language="…">`, `<blockquote>` and `<tg-spoiler>`. Line breaks and spaces
stay as typed. A mention link (`tg://user?id=`) or a custom emoji is refused. `--md` and `--html`
cannot go together. `messages edit` takes `--html` too.

### Text from stdin

Leave out the text and it is read from stdin. That is the only way to send several lines, and it
keeps the text out of `ps` and your shell history:

```sh
printf 'first line\n\nthird line' | tg messages send me
tg messages send "Book club" < note.txt
```

### Sending later

```sh
tg messages send "Book club" "Tomorrow" --at-time 2026-10-01T09:00   # local time
```

```sh
tg messages send "Book club" "In two hours" --at-time 2h        # or 30m, 1d from now
```

```sh
tg messages scheduled "Book club"                               # what waits to be sent there
```

`--at-time` hands the message to Telegram, which sends it even with this machine off. The time is rounded
down to the minute. Less than a minute from now, or more than a year, is refused. The guard counts a
scheduled message in the hour Telegram sends it. **Cancel or change one in the Telegram app**; `tg`
does not.

### Files, photos and voice messages

```sh
tg messages send "Book club" "The agenda" --file agenda.pdf   # byte for byte; the text is the caption
```

```sh
tg messages send "Book club" --photo picture.jpg              # recompressed by Telegram
```

```sh
tg messages send "Book club" --file trip.mp4                  # a video plays in the chat
```

```sh
tg messages send "Book club" --file trip.mp4 --as-file        # the same video as a file to download
```

```sh
tg messages send "Book club" --voice note.ogg                 # a voice message, alone, with no text
```

```sh
tg messages send "Book club" --file 3f9a.pdf --filename "Report Q3.pdf"   # the name others see
```

`--photo` takes a `.jpg`, `.png` or `.webp`. A `.mp4` or `.mov` given with `--file` goes as a video
unless you add `--as-file`. `--voice` takes an Ogg Opus file (`.ogg`, `.oga`, `.opus`) and goes alone:
no text, no other file. Known credential files and folders, `tg`'s own folders and the local store
are protected. Ordinary hidden working folders are allowed; CLI `--allow-any-file` overrides
protected paths when the owner intends to send that file.

`--spoiler` blurs a photo or a video until it is tapped; a document or a voice message cannot take one.
`--caption-above` shows the text above the photo or file. Telegram lets only bots stop forwarding of one
message; to protect content, turn on the chat's own setting in Telegram. Formats, downloads and text
search inside files: [file attachments](attachments.md).

### Replying

```sh
tg messages send "Book club" "Agreed" --reply-to 4242
```

A reply is a send, so every send option works with it.

### Reactions and polls

```sh
tg reactions add "Book club" 4242 👍       # replaces the reaction you had
```

```sh
tg reactions remove "Book club" 4242
```

```sh
tg polls show "Book club" 4250             # the poll and its answer ids
```

```sh
tg polls voters "Book club" 4250 --answer <answer id>   # who chose it; not in an anonymous poll
```

```sh
tg polls vote "Book club" 4250 <answer id>
```

```sh
tg polls vote "Book club" 4250 --retract
```

```sh
tg polls create "Book club" "Which day?" Monday Tuesday --anonymous
```

```sh
tg polls create "Book club" "Pizza now?" yes no --close-time 5m   # closes by itself; 5s to 10m
```

```sh
tg polls close "Book club" 4250            # your own poll; it cannot be reopened
```

```sh
tg polls create "Book club" "2+2?" 3 4 5 --quiz --correct 2 --solution "Four."   # a quiz; a vote is final
```

When you read a chat, reactions show under a message — `👍 3  🔥 1  (you: 🔥)`. A vote in a public poll
shows your name to everyone in the chat. Vote by the ids `polls show` prints, never by an answer's
position. `--multiple` lets people pick several answers. People can change their vote only in a poll
made with `--revote`. A vote in a closed poll, two answers in a one-answer poll, a changed or retracted vote
where the vote is final, and `--retract` with no vote are refused before anything is sent; so is closing a
poll someone else made.

### Editing, forwarding, pinning, deleting

```sh
tg messages edit "Book club" 4242 "the corrected text"      # your own message; --md or --html as in a send
```

```sh
tg messages forward "Book club" 4242 --to me                # checked against the chat it goes to
```

```sh
tg messages forward "Book club" 4242 --to "Hiking" --topic 12   # into one topic of a forum
```

```sh
tg messages pin "Book club" 4242                            # quiet unless --notify
```

```sh
tg messages unpin "Book club" 4242
```

```sh
tg messages delete me 4242 4243 --allow-dangerous           # at most 10, for you only
```

```sh
tg messages delete me 4242 --allow-dangerous --for-everyone
```

An edit reaches people who may have read the old text already. A forward is a new message: it goes
through the same guard as a send, against the chat it goes to. A deletion cannot be undone, which is
why it asks first: answer `y`, or add `--allow-dangerous` to skip the question. In a supergroup or a
channel Telegram deletes only for everyone, so there only `--for-everyone` works.

**What counts toward the hourly limit:** a message, a forward, an edit, a pin that notifies, a new poll,
closing a poll, and each deleted message. A reaction, a vote and a quiet pin do not.

### When the outcome is unknown

Exit code `14` means the connection broke after the message left: **it may have gone**. The error
carries a `--send-id`. Repeat with it, and Telegram drops the second copy:

```sh
tg messages send "Book club" "See you at 7" --send-id <id from the error>
```

```sh
tg messages forward "Book club" 4242 --to me --send-id <id from the error>
```

A forward and a poll carry one too. A repeat without it is a second message to a person.
A file is uploaded before the message is sent: tg tries a dropped upload three times, and if it still
fails the error says nothing was sent — that one you can simply run again.
Other writes — pin, react, mark read, delete, vote, folders, contacts — end in exit `14` the same way
when Telegram does not answer; the message says whether repeating is safe. A folder creation is not:
look in `tg chats folders list` first, or you may get two. A message sent with `--at-time` is never repeated:
look in `tg messages scheduled <chat>` instead.

### Marking a chat read

```sh
tg chats mark-read "Book club"               # up to the newest message
```

```sh
tg chats mark-read "Book club" --until 4242  # only up to this one
```

```sh
tg chats mark-read "Hiking" --topic 12       # only this forum topic
```

```sh
tg messages list "Book club" --mark-read     # read it, and mark it read up to the newest shown
```

The other side sees that you read it. It goes through the guard as the action `read`, and does not
count toward the hourly limit.

### Folders

```sh
tg chats folders list                              # your folders, in the order the app shows them
```

```sh
tg chats folders show "Trips"                      # one folder, with the names of its chats
```

```sh
tg chats folders create "Trips" --chat "Hiking" --chat @kate
```

```sh
tg chats folders update "Trips" --title "Travel" --add "Climbing" --remove @kate
```

```sh
tg chats folders delete "Travel"                   # the chats stay
```

```sh
tg chats folders order "Travel" "Work"             # these first; the rest keep their order after them
```

```sh
tg chats folders join https://t.me/addlist/AbCdEf  # a folder someone shared: joins every chat in it
```

```sh
tg chats folders create "Inbox" --include contacts,groups --skip muted,archived --emoji 📥
```

```sh
tg chats folders update "Inbox" --exclude-chat "Noisy group" --pin @kate
```

```sh
tg chats folders update "Inbox" --include none     # no kinds any more; only the chats named in it
```

A folder can take every chat of a kind by itself: `--include` with `contacts`, `non-contacts`,
`groups`, `channels` and `bots`. `--skip` leaves out chats that are `muted`, `read` or `archived`.
`--exclude-chat` keeps one chat out even when a kind takes it, and `--pin` puts a chat at the top. On
`update`, `--include` and `--skip` replace what the folder had; `--remove` takes a chat off every list.
A folder someone shared by a link takes no rules. `--emoji` must be one of the icons the Telegram app
offers for folders; Telegram drops any other without an error, and the answer shows the folder as Telegram
kept it.

A folder is named by its id or its title exactly. Only you see your folders; each change still goes
through the guard, as an `account` change. `join` is different: the people in those chats see that
you joined, as with `tg chats join`. "All chats" keeps its place when you `order`.

### Channel comments

```sh
tg messages comments "Rozetked" 27644              # the comments under post 27644, oldest first
```

```sh
tg messages comments "Rozetked" 27644 --before-id 3732413
```

```sh
tg messages send "My channel" "Thanks!" --comment-to 120
```

Comments live in the channel's discussion group: the answer names it as `discussion`, and a comment is a
reply there, so the recipient list and the hourly limit count it against that group. A post whose channel
has no discussion group, or that is closed to comments, ends in exit `6`.

### Posting as a channel

In a group where you may post as one of your channels, list who you can be, then pick one:

```sh
tg chats send-as "Book club"
```

```sh
tg messages send "Book club" "Meeting moved to 8" --send-as <id from the list>
```

The list always has you, and `default` marks the group's saved choice; reading it changes nothing.
An id not in the list is refused. `--send-as` works with files, `tg messages forward` and
`tg polls create` too — for a forward, the list is the one of the `--to` chat. To repeat an unknown
outcome, give the same `--send-as` with the `--send-id`.

A group can have a channel saved as its default sender — Telegram does this for the discussion group of your
channel. There a send, forward or poll **without** `--send-as` is refused (exit `2`) instead of going out as the
channel: the error names `--send-as <your id>` to post as yourself and `--send-as <channel id>` to post as the
channel.

### Not in tg yet

Several photos in one message remain on the [roadmap](roadmap.md).

## Groups and channels

Everything for a group you run — moderation rules, checks, the full list of settings — is in
[groups you run](groups.md).

```sh
tg chats inspect https://t.me/+AbCdEf              # where an invite or public link leads; does not join
```

```sh
tg chats members list "Hiking" --all               # everyone, with their role and when last seen
```

```sh
tg chats events "Hiking"                           # who joined, left, was added or removed — 7 days
```

```sh
tg chats events "Hiking" --type join,leave --since-time 2026-09-01T00:00
```

```sh
tg topics list "Hiking"                            # a forum group's topics, newest activity first
```

```sh
tg search topics "Hiking" "gear"
```

```sh
tg topics show "Hiking" 12                         # one topic: title, closed or pinned, last activity
```

```sh
tg review --chat "Hiking" --unanswered             # questions nobody answered
```

All of these only read. `events` reads the chat's service messages: who did what, and to whom. The
names are `join`, `leave`, `add`, `remove`, `create`, `title` and `pin`.

These change something, and the people in the chat see it.

For a forum, use `tg topics enable <chat>` and `tg topics create <chat> <title>`. A basic group
requires `--upgrade --yes`; keep the new chat id returned by the upgrade. Read `topics list`
after an unknown creation outcome instead of repeating the creation. Send to its id with
`tg messages send <chat> <text> --topic <id>` or `tg polls create <chat> <question> <answers> --topic <id>`.
`tg topics edit <chat> <id> --title <new>` renames a topic, `--closed on` / `--closed off` closes it to new
messages or reopens it, `--pinned on` / `--pinned off` pins it at the top or unpins it, and on the General
topic (id 1) `--hidden on` / `--hidden off` hides it from the topic list or shows it again.
`tg topics order <chat> <id...>` puts the pinned topics in that order; it pins and unpins nothing.
Repeating any of these is safe.
`tg topics delete <chat> <id>` deletes a topic and every message in it, for everyone; it cannot be undone, so it
asks first by default; an explicit `topics.delete: allow` or `--allow-dangerous` skips the question. The
General topic cannot be deleted.

```sh
tg chats create "Hiking 2027" @olga 12345          # a supergroup; the people added are told
```

```sh
tg chats create "Trail news" --channel             # a channel; people join it by its link
```

```sh
tg chats join https://t.me/+AbCdEf                 # by an invite link, or a public one
```

```sh
tg chats leave "Hiking 2027"
```

```sh
tg chats update "Hiking 2027" --title "Hiking 2028" --description "routes and dates"
```

```sh
tg chats update "Hiking 2027" --all-can-pin off --only-admins-add on
```

```sh
tg chats link show "Hiking 2027"                   # the invite link, if you may see it
```

```sh
tg chats link reset "Hiking 2027"                  # a new one; the old one stops working
```

```sh
tg chats link create "Hiking 2027" --approval --expire-time 7d   # another link; who joins asks first
```

```sh
tg chats link create "Hiking 2027" --max-uses 20   # at most 20 people join by it
```

```sh
tg chats update "Hiking 2027" --join-approval on   # everyone asks first, by any link
```

```sh
tg chats requests list "Hiking 2027"               # who asked to join, newest first
```

```sh
tg chats requests list "Hiking 2027" --search Ana  # by name; or --link <link>, never both
```

```sh
tg chats requests accept "Hiking 2027" 67890       # let them in; decline turns them away
```

```sh
tg chats requests decline "Hiking 2027" --all      # every pending request at once; --link narrows it
```

```sh
tg chats link list "Hiking 2027"                   # your links, with how many joined and how many wait
```

```sh
tg chats link revoke "Hiking 2027" https://t.me/+AbCd   # stop one link
```

```sh
tg chats link update "Hiking 2027" https://t.me/+AbCd --no-approval --max-uses 50   # change only these
```

```sh
tg chats members add "Hiking 2027" @kate 67890     # they are told
```

```sh
tg chats members remove "Hiking 2027" @kate        # their messages stay
```

```sh
tg chats admins add "Hiking 2027" @kate --can pin,delete
```

```sh
tg chats admins remove "Hiking 2027" @kate
```

A new group is always a supergroup. Someone whose privacy settings stop them being added is named
in the answer under `providerMetadata.notAdded`; the group is made anyway. `chats join` to a group whose
admins approve who joins answers `requested: true` and exits `0`: the request is sent, and you are in once an
admin accepts it. Each goes through the guard as a `chat` change,
and each person added counts toward the hourly limit.

`chats link create` makes another invite link and tells nobody: `--approval` makes whoever joins by it ask
first, `--expire-time` stops it at a time (`2026-12-01T09:00`, or `30m`, `2h`, `7d` from now), and
`--max-uses` lets at most that many people in. `chats link update` changes the same three on one of your
links, the group's own one too (`--no-approval` turns approval off, `--expire-time never` takes the expiry
away); what you leave out stays. A link that asks first has no use limit, so `--approval` with `--max-uses` is
refused. `chats update --join-approval on` makes everyone ask first,
whichever link they use.

In a group whose admins approve who joins, `chats requests list` shows the pending requests, with the
note a person sent; only admins see them, and reading tells nobody. `--search` finds people by name or
@username, `--link` keeps those who asked through one invite link; Telegram cannot do both at once.
`accept` and `decline` answer one,
by the id from the list. An accepted request counts toward the hourly limit, a declined one does not;
the recipient list checks the group only. Someone who is already a member is answered with
`already: true`, and a request that is gone ends in exit `6`. `--all` answers every pending request, or
with `--link` those that came by one link; they are counted first, and an accept that would go over the
hourly limit is refused before anyone is let in. `chats link list` shows only your own links; revoking the
group's own link makes Telegram issue a new one, which the answer shows.

`chats update` changes the title, the description and the two settings Telegram has, in one go; the
answer is the group as it stands, and `chats show` shows the same settings. Moderation rules —
`chats rules` and `chats moderate` — are in [moderation rules](groups.md#rules).

<a id="for-scripts-and-agents"></a>

## Output: tables, JSON and exit codes

**At a terminal `tg` prints a table; into a pipe, or with `--json`, it prints one JSON value on
stdout and nothing else** — no spinner, no tick, no warning. Notes, warnings and errors go to stderr
in every mode. This is what lets a script, or your agent, rely on the answer.

```sh
tg chats list --json | jq -r '.items[].id'
```

```sh
tg messages list me --jsonl | jq -r .text     # one message per line
```

- `--json`: one JSON value. **Every list is one object**, always the same shape:
  `{ "items": [...], "page": 1, "limit": 20, "hasMore": true }`. `--all` and `--offline` answer with
  the same object.
- A chat's messages have no page number: `{ "items": [...], "limit": 20, "hasMore": true }`.
- `--jsonl`: one object per line, no wrapper; whether there is more is said on stderr only.
- An error is `{ "error": { "code": "...", "message": "..." } }` on stderr, and stdout is empty, so a
  refusal can never be taken for an empty result.
- **Branch on the exit code, not on the text.** The text changes; the code does not. `0` worked, `2`
  bad input, `4` not logged in, `5` the profile may not do this, `6` not found, `7` not on the list of
  allowed recipients, `8` a limit (the hourly limit, or Telegram's own), `9` Telegram did not answer
  in time, `14` unknown whether a message went. The full table is in
  [exit codes](commands.md#exit-codes).
- **Ids are strings.** Never turn one into a number.
- `--quiet` turns notes off; a failure is still said. `-v` and `-vv` add detail to the table view.
- `--timeout 30s` bounds the whole command (`500ms`, `30s` or `2m`).
- `tg commands --json` is the whole command tree, with `mutates: true` on every command that changes
  something in Telegram.

```sh
if ! tg messages send "Book club" "See you at 7" --json > /dev/null; then
  case $? in
    14) echo "it may have gone — repeat only with the same --send-id" ;;
    4)  echo "run tg session start" ;;
  esac
fi
```

## Connect your AI agent

An AI agent that runs commands in a terminal (for example Claude Code, Codex or Gemini CLI) reads tg's
skill file: the rules and traps that `--help` cannot explain. `tg setup` installs it, and so does
`tg skill install` (`--for claude`, `agents` or `all`, the default). To install it by hand:

```sh
mkdir -p ~/.claude/skills/tg-cli && tg skill show > ~/.claude/skills/tg-cli/SKILL.md   # Claude Code
mkdir -p ~/.agents/skills/tg-cli && tg skill show > ~/.agents/skills/tg-cli/SKILL.md   # Codex, Gemini CLI
```

An agent without a terminal (for example Claude Desktop or Cursor) connects over MCP:
[the MCP server](mcp.md).

## What a conversation looks like

`tg messages list` and `tg search messages` print a transcript at a terminal, not a table:

```text
10:05:12  Anna
          Shall we call on Thursday?

10:09:03  Boris
          ↳ Anna: Shall we call on Thursday?
          Thursday works.
          📎 photo
          edited 10:09:30
```

Times are local, and a line marks each new day. `↳` is what a message answers, `↪` whose message was
forwarded, `📎` an attachment. Control characters in a message or a name are shown as text, never run
by the terminal. `-v` adds the ids of the message, the sender and the chat; `-vv` everything known
about the message.

## New messages as they arrive

```sh
tg watch                           # new messages, until Ctrl-C or --timeout
```

```sh
tg watch --jsonl                   # one message per line, as messages list --jsonl
```

```sh
tg watch --jsonl | ./on-message.sh
```

```sh
tg watch --events --jsonl          # edits, deletions and reactions too
```

```sh
tg watch --jsonl --timeout 2m      # a timeout ends it normally, with exit code 0
```

With `--events` every line names its event: `message`, `edit`, `delete` or `reaction`. Without it,
the lines are bare messages. Telegram does not say in which chat a message was deleted in a private
chat or a small group, so such a line has no chat.

**`watch` starts from now.** What arrived while nothing was listening is not shown. To keep the local
store current, including what came in while this machine was off, use `serve`, in the background or
as a system service ([keeping the store current](archive.md#keeping-it-current-serve)):

```sh
tg server start           # serve in the background; answers once it is connected
```

```sh
tg server status
```

```sh
tg server install         # a systemd user unit or a launchd agent; starts nothing
```

## What a command did

```sh
tg --trace chats list          # show each request on stderr, keep nothing
```

```sh
tg --record chats list         # keep it, show nothing
```

```sh
tg runs list                   # what was kept, newest first
```

A failed run is always kept. A record holds operations, ids, counts and durations — never a message,
a name, a chat title, a phone number or a key. In full: [diagnostics](diagnostics.md).

## The local store

Everything `tg` reads is kept on this machine, so that it can answer without the network:

```sh
tg chats list --offline                           # only from the store, never connect
```

```sh
tg store fetch "Project Alpha" --estimate         # how much a fetch would take
```

```sh
tg store fetch "Project Alpha" --background       # a chat's history, as a job
```

```sh
tg store export "Project Alpha" --format markdown --output alpha.md
```

```sh
tg store backup ~/tg-store.db                     # a copy of the store, while it is in use
```

An ordinary command still asks Telegram. `--offline` is for when there is no network, or when
connecting is not wanted; a send with `--offline` is refused. Fetching, export, search, backup and
the service: [the local store](archive.md).

## Settings, and what a profile may do

Settings live in an optional `config.json`, and every value is decided in one order: **option →
environment variable → the profile in the file → the file's defaults → built in**.

```sh
tg config show                                 # every setting, and where it came from
```

```sh
tg config set limit 50
```

```sh
tg work config set permissions.messages readonly   # profile "work" changes no messages
```

```sh
tg config set permissions.messages.send ask        # a yes or no before each send
```

```sh
tg config set sendsPerHour 10
```

`permissions` says what a profile may do, per command: `deny`, `readonly`, `ask` or `allow`. By
default everything is allowed, and deleting messages and ending sessions ask first. A refusal is
exit code `5`, and the error names the command that allows it. **The file has no field for a
secret.** Every setting and variable: [configuration](configuration.md).

## One person

`tg contacts profile <person>` shows what Telegram says about one person and how active they are in the
chats you share. `tg contacts check <person>` scores them as a possible bot, fake or spammer, with every
reason. `tg contacts context <person>` reads what the store holds about them: without `--chat`, across every
account linked to them with `contacts link`; with `--chat`, their newest messages in each chat you name. What each one asks Telegram or a public spam list, and what it sends where:
[people](people.md).

A few limits to know: an estimated registration date is guessed from the account id with a community
table, and there is no estimate past December 2024. The bot check reads up to 1,000 stored messages.
`contacts context` returns message bodies, so it follows the `messages` permissions; linking and
unlinking identities is controlled by `contacts` and never changes Telegram's address book.

## Next

- [The local store](archive.md): search, fetch a chat's history, export, backup.
- [Configuration](configuration.md): settings, and what a profile may do.
- [Security](security.md): what reaches the disk, and the send guard.
- [Recipes](recipes.md): regular work for your AI agent.
