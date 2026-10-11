# Search

You need to find something that was written: a message, an agreement, a file someone sent, a code from
months ago. This page shows how to search everything tg has saved on this computer — Telegram messages,
and the mail and notes that [memo](https://github.com/WireCatLabs/cli-memo) imported — and how to ask
Telegram's own search at the same time.

After reading it you can find messages by words, people, chats, dates, files and links, save a search
and run it again, count matches, and tell a real "not found" from a gap in the saved history.
Searching marks nothing read.

Terms used on this page:

- **Local store** (also called the archive): the database on this computer where tg keeps every
  message it has read or downloaded ([the local store](archive.md)). Most searches read only this.
- **Query**: what you search for. It can be plain words, or words with fields such as `from:` and
  `date:`. Your AI agent writes queries for you; the full language is in the
  [query language reference](query-language.md).
- **Coverage**: what a search could see — how many chats and messages were saved, and which chats were
  never downloaded or are behind.

## When you remember the question rather than its wording

Ask your agent to find messages answering a question and show the supporting messages. For example:
“Find when the Helix daily export runs in the project chat, and check whether the schedule changed.”
The agent can use archive discovery to find partial word matches and direct replies, then inspect
those messages before answering. This needs downloaded history; it does not download a model.

For command-line control:

```sh
tg search messages 'What time does Helix export run?' --discover --chat 990 --json
```

This searches the local archive only. Chat, sender and date filters still apply. In MCP, pass
`discover: true` to the message-search tool. `query.discovery` describes the bounded candidate pool;
`items[].discovery.missingTerms` names unmatched terms, and `parent` links a reply to its matching
parent. A high score is not answer confidence: a question, proposal or old decision can rank first.
Read the evidence and check [archive coverage](archive.md) before concluding that a fact is absent.

Without `--discover`, the usual strict search remains. Boolean syntax, quoted phrases, wildcards,
AST requests, `--exact` and `--newest` keep strict behavior. Discovery does not combine with legacy,
regular-expression search or `--backend server`. Meaning-based conversation search remains a
separate [topic-search option](topic-search.md).

## What you can do

Every search is under one group of commands, `tg search`. When you don't know where something was
written, start with `search all`.

| Task | Command |
|---|---|
| Search messages, mail and notes in one answer | `tg search all '<query>'` |
| Search Telegram messages only; without `--discover`, also on Telegram's server | `tg search messages '<query>'` |
| Search only the mail memo imported | `tg search mail '<query>'` |
| Search notes written in memo or imported from a folder | `tg search notes '<query>'` |
| Find a discussion by what it was about | `tg search conversations '<question>'` ([topic search](topic-search.md)) |
| Find a topic in a forum group by its title | `tg search topics <chat> '<words>'` |
| Count matches by chat, sender, day or hour | `tg stats messages show '<query>'` |
| Save a search and run it again later | `tg searches create`, `tg search messages --saved <name>` |

```sh
tg search all 'lease agreement'                   # messages, mail and notes, best match first
```

```sh
tg search all 'lease' --only messages,notes       # without mail
```

```sh
tg search messages 'lease' --chat "Book club"     # Telegram messages only, never mail
```

```sh
tg search mail 'invoice'                          # only the mail memo mail import brought in
```

```sh
tg search notes 'budget' --type internal          # only notes written in memo
```

```sh
tg search conversations 'moving to the country'   # conversations close in meaning
```

```sh
tg search topics "Hiking" "gear"                  # topic titles in one forum group
```

`search all` says what each hit is — a message (`msg:…`) or a note (`note:…`). `search messages` never
returns mail, and `search mail` never returns Telegram messages; only `search all` covers both. `--type`
narrows `search messages` to text, voice or files (`text|voice|file`) and `search notes` to notes
written in memo or imported from a folder (`internal|file`). Mail supports `chat:` for an email thread
and `from:` for its sender. When a field does not apply — `kind:`/`topic:` for mail, or `chat:`/`from:`
for notes — `search all` skips that resource and explains why.

Mail and notes reach the store through memo: `memo mail import` and `memo import`. Without them,
`search all` searches messages only.

The rest of this page is about searching messages, `tg search messages`. It reads the local store;
ordinary search also asks Telegram ([below](#asking-telegram-too---backend)); discovery searches only the archive, even with `--backend both`.

## Try a focused search

Start with a phrase and one chat. This example searches saved history without asking the messenger.

**Your request:**

> Find the message saying “invoice paid” in Book club. Show the match and any gaps in the history.

**Command:**

```sh
tg search messages '"invoice paid"' --chat "Book club" --backend archive --json
```

**Example agent answer:**

> **One matching message in saved history.**
>
> | Person | Message |
> | --- | --- |
> | Alice Synthetic | Invoice paid yesterday. |
>
> History is incomplete: other matches may be missing. I can open this message and its surrounding conversation.

An empty result is not proof that the message never existed. Check the reported history gaps before
broadening the search. The examples on this page are fictional.

## Prepare your archive first

Good search needs your chats downloaded. Telegram's search finds a message by its words even if tg never
fetched it, but everything else reads only the store: counting with `stats`, topic search, `has:`,
`filename:`, regex, presets, tags, and the ranking of word forms. Start by downloading every chat:

```sh
tg store fetch --all --background     # the last 90 days of every chat, as a background job
```

```sh
tg store jobs show                    # how far it got
```

Each run fetches at most 1,000 messages per chat by default; repeat it to continue busy chats.
Add `--since-time 365d` to go further back, or fetch one chat with `tg store fetch "Book club"`
([download a chat's history](archive.md#fetch-a-chats-history)). After that, `tg serve` keeps the
store current.

Every search says what it searched. In the terminal, when the store could hold more or nothing was
found, one line says how many messages and chats were searched, how many chats were never fetched or
are behind, and the command that fixes it:

```text
searched 12,430 messages in 37 chats — 5 never fetched; `tg store fetch --all --background` fetches them
```

With `--json`, `coverage` carries the same: `messages`, `chats`, up to ten `attention` chats and `next`.
When nothing is found and `next` is set, run that command, or ask your agent to, before you decide the
message does not exist.

Put the query in single quotes, so the shell leaves its quotes and brackets alone. The names below are
examples; use your own chats and people.

## Words and phrases

```sh
tg search messages invoice
```

```sh
tg search messages '"invoice paid"'              # words together
```

```sh
tg search messages 'cafe OR library'
```

```sh
tg search messages '(cafe OR library) NOT loud'
```

```sh
tg search messages 'invoic*'                     # every word that starts with "invoic"
```

Words next to each other must all be in the message. Search includes word forms, according to
the store's language settings: `piso` can find `pisos`. Quotes keep words together and also allow
word forms. Use `exact:piso` or add `--exact` for words without an explicit field. An explicit
`text:` still matches forms. Case and accents are ignored. Typos are not corrected automatically.

## People and chats

```sh
tg search messages 'from:"Alice Synthetic" invoice'
```

```sh
tg search messages 'from:("Alice Synthetic" OR "Bob Synthetic") library'
```

```sh
tg search messages 'from:me date:7d'             # what you wrote this week
```

```sh
tg search messages 'chat:"Book club" library'
```

```sh
tg search messages library --chat "Book club"    # the same, as an option
```

```sh
tg search messages 'passport kind:private'       # one-to-one chats only
```

`kind:` takes `private`, `group`, `channel`, `saved` (Saved Messages) and `bot`. `topic:` keeps to one
forum topic of a group; it needs that group in `chat:` or `--chat`. To search every account in the
store, add `--source all`.

## Dates

```sh
tg search messages 'date:today'
```

```sh
tg search messages 'library date:yesterday'
```

```sh
tg search messages 'invoice date:7d'             # from 7 days ago until now; also 30m, 2h
```

```sh
tg search messages 'invoice date:[2026-01-01 TO 2026-02-01}' --timezone Europe/Madrid
```

`today`, `yesterday` and calendar dates are days in your computer's time zone; `--timezone` picks
another. In a range, `[` and `]` include that day, `{` and `}` exclude it.

## Files and links

```sh
tg search messages 'has:file'
```

```sh
tg search messages 'filename:*.pdf'
```

```sh
tg search messages 'filename:*contract*'         # part of the name
```

```sh
tg search messages 'size>10MB'
```

```sh
tg search messages 'mime:image'                  # any picture sent as a file
```

```sh
tg search messages 'mime:"application/pdf"'      # quote a full type
```

```sh
tg search messages 'has:photo chat:"Book club"'
```

```sh
tg search messages 'has:link AND "github.com"'   # a link to a site
```

A file is found by its name, size and type even when the message has no text. `filename:` compares the
whole name, ignoring case and accents. Sizes use KB, MB and GB of 1,024. `has:` also takes `attachment`,
`video`, `audio`, `voice`, `sticker`, `contact`, `location` and `poll`. A link counts when it is in the
text or only in its preview card.

<a id="files-preparation-and-archive-gaps"></a>

## Text inside files

`content:` searches the text inside attachments: a PDF, a Word file, a scan. The text must first be
extracted into the store, by tg or by your agent. More about files: [file attachments](attachments.md).

```sh
tg attachments extract --chat "Book club" --download --output-dir ./files
```

```sh
tg search messages 'content:invoice'
```

```sh
tg attachments list --chat "Book club" --needs-text
```

```sh
tg attachments text set "Book club" 204 --text-file ./scan.txt
```

`attachments extract` reads plain text, Word files and PDFs with a text layer on this computer.
`--download` requires `--output-dir`; without them extraction reads files already saved. With several
attachments in one message, choose one with `--attachment`, starting at 1.

Local extraction also reads BOM-marked UTF-16, high-confidence legacy encodings, ODT, ODS, XLSX, PPTX
and EPUB without a model or extra installation. It keeps the order of sheets, slides and chapters and
the saved cell values; it does not calculate formulas or read text inside images. Ambiguous encodings
need inspection or conversion by your agent. The source files stay unchanged. ODT, ODS, XLSX, PPTX and
EPUB are limited to 1,000 archive parts and 50 MiB expanded, with at most 10 MiB per text XML/HTML part;
malformed or partial results are not indexed as complete text. A failed local read can be retried; text
your agent wrote and text indexed earlier stay protected.

PDF extraction needs the optional package `unpdf`; Word needs `mammoth`, installed where `tg` is. For a
global npm install: `npm install -g unpdf mammoth`. A missing package is reported; your agent can supply
the text instead.

**Photos and scans** have no text layer. Your agent normally reads them with its own OCR or vision
tools and writes the text with `attachments text set`. `attachments list --needs-text` gives it the
saved path, the message locator and the attachment number; it shows paths and text status, never the
text itself. Check the result with a `content:` search. A path on an MCP server does not move the file
to an agent on another computer: the agent needs access to the file. Such an agent can receive the
saved file's bytes in bounded parts and check their hash through
[attachments show](attachments.md); delivering the file does not recognize or index text, so it still
writes the text back with `attachments text set`.

**Many scans at once** can go to a model service that you choose. Configure a vision model under
`models.ocr` and keep its key with the usual `models text key set`. Replace `your-vision-model` with
your model's name.

```sh
tg config set models.ocr.provider openai
```

```sh
tg config set models.ocr.model your-vision-model
```

```sh
tg models text key set openai
```

```sh
tg attachments extract --chat "Book club" --ocr --concurrency 4 --limit 100 --json
```

`--ocr` sends images to that service; without it no model is called. Concurrency is 1–8, default 4; the
file limit is 1–500, default 100. Pass the returned cursor to continue a bounded scan. Scanned PDFs need
the optional `unpdf` and `@napi-rs/canvas`, with at most 20 pages per document; pages with a text layer
stay local. A repeat reuses the file hash and the model identity. Text your agent wrote and earlier
indexed text survive a failed or cancelled OCR run. Check the failed count and each file's status; a
provider rate limit stops later calls in that run. `--offline` cannot be combined with `--ocr`.

**Files you already have.** `tg attachments extract --chat <chat> --from-dir ./files` reads one folder,
without its subfolders. A file needs a unique original name or a complete set of downloader names. Do
not combine `--from-dir` with `--download` or `--output-dir`. `tg messages download <chat> <id> --extract`
extracts only the files this run downloaded; `--all --extract` does the same for the whole batch.
Extraction notices changed files by their hash and keeps text your agent wrote. Over MCP, a bounded
extraction returns a continuation `cursor` and metadata, without file text.

`--from-dir` protects known credential files and folders, the CLI's own folders and the message store.
Ordinary hidden working folders are allowed. MCP extraction downloads also require `output_dir`
outside protected locations. Local PDF text extraction has no fixed page-count limit or separate
30-second cutoff; command cancellation and file/text budgets still apply.

## Passwords, codes and cards

```sh
tg search messages 'preset:secret kind:saved'    # something that looks like a password or token
```

```sh
tg search messages 'preset:card'
```

A preset finds messages that *look like* a password, a login code, an API key, a card or IBAN number, a
passport, a phone, an email or a link. It checks the shape only: it does not prove that a password
works or a card is real. The full list is in the [query language](query-language.md#presets).

## Tags

```sh
tg tags add work --chat "Book club"
```

```sh
tg tags add work --contact "Bob Synthetic"
```

```sh
tg tags list --tag work --type chat
```

```sh
tg search messages 'tag:work invoice'
```

```sh
tg search messages 'invoice NOT tag:work'
```

```sh
tg tags remove work --chat "Book club"
```

A tag is your own label on a chat, a person or one message (`--message <id> --chat <chat>`). It is kept
in the local store only and is never sent to Telegram. `tag:work` finds messages tagged `work`,
messages in a chat tagged `work` and messages from a person tagged `work`. A tag is 1–32 letters a–z,
digits and hyphens.

Groups and channels can be tagged automatically, from their title, username and description — no messages
and no model:

```sh
tg metadata refresh --chat "Book club"   # read the chat's description from Telegram; the chat is not changed
```

```sh
tg metadata refresh --only-missing       # every stored group and channel with no description read yet
```

```sh
tg tags auto --dry-run                   # what it would tag, without writing
```

```sh
tg tags auto                             # write the automatic tags
```

```sh
tg tags list --source auto               # only the automatic ones
```

Automatic tags never touch yours: a rerun removes only stale automatic ones. Adding a tag the automatic
run already gave makes it yours.

## Saved searches and history

```sh
tg searches create meetings 'library OR cafe' --chat "Book club"
```

```sh
tg search messages --saved meetings
```

```sh
tg search messages --saved meetings 'date:today'  # extra words are added with AND
```

```sh
tg stats messages show --saved meetings --by day
```

```sh
tg searches list
```

```sh
tg searches history --limit 10
```

```sh
tg search messages --saved 42                    # a row of the history, by its number
```

`searches create` saves a query with its options and runs nothing; an existing name needs `--replace`.
Options you type with `--saved` replace the saved ones. The saved text is read again on every run, so
`date:7d` always means the last 7 days. `searches show` prints one, `searches delete` removes one.

Every search and count that succeeds is written to the history: the query and its options, never the
messages it found. The newest 1,000 runs are kept. `--no-record` keeps one run out of it; for MCP,
`tg mcp --no-record` or `record` set to `false` keeps the server's calls out. `searches clear` empties
the history and keeps the saved searches. This history is separate from the run records of `tg runs`.

Saved searches and the history live in the store that tg and max share: both see the same ones, and
`delete` or `clear` in one changes the other. Tags stay with their account.

## Counting: `stats messages show`

```sh
tg stats messages show invoice                        # how many in each chat
```

```sh
tg stats messages show 'date:7d' --by sender
```

```sh
tg stats messages show 'from:me' --by day --timezone Europe/Madrid
```

```sh
tg stats messages show --by hour                      # every stored message
```

`stats messages show` counts the messages `search messages` would find with the same query, each one once.
`--by chat` (the default) and `--by sender` put the largest first; `--by day` and `--by hour` go in
order. When some chats are not stored in full, the numbers are a lower bound, and stderr says how
many chats that is.

## Asking Telegram too: `--backend`

Telegram can search its own copy of your chats, including messages tg never fetched. Without `--discover`, tg asks
Telegram and the store by default in one run (`--backend both`). `--backend server` shows Telegram's results alone,
and `--backend archive` searches only the store.

```sh
tg search messages 'invoice' --backend both
```

```sh
tg search messages 'invoice chat:"Book club" from:Olga' --backend both
```

```sh
tg search messages 'invoice date:2026-09' --backend server --server-time 10s
```

Telegram decides on its own what matches a word, and does not document it. So tg treats its answer as
candidates: it saves them in the store and runs your query over them with the store's own rules.
`exact:`, `-word`, quotes and the ranking mean the same as without `--backend`, and a message is never
listed twice. A message Telegram returned but your query rejects is not shown; it stays in the store.

Telegram gets only the words your query requires, one chat, a sender together with a chat, and dates.
`OR` makes up to three searches. Negations, wildcards, `has:`, `tag:` and presets are applied by tg
afterwards. A query without words does not ask Telegram. tg waits at most 5 seconds (`--server-time`,
up to 60 s) and takes up to 100 messages per search; a later answer is dropped. Nothing is marked read.

With `--json`, each message says where it came from (`source`: `archive`, `server` or `both`) and a
`server` block says what Telegram returned and what failed. `--backend both` never fails because of
Telegram: offline, without permission or with no words it answers from the store and says why.
`--backend server` refuses instead. The permission is `messages.server-search`; a read-only profile
answers from the store. `stats messages show` counts the store only: Telegram's counts follow its
own rules, not your query.

## Fetch new messages first: `--sync-first`

```sh
tg search messages 'invoice' --chat "Book club" --sync-first
```

`--sync-first` downloads new messages before it searches, and marks nothing read. It takes at most 5
chats, 500 messages and 30 seconds; change these bounds with `--max-chats`, `--max-messages` and
`--sync-time`. When the download fails or stops early, you still get the results from the store, marked
with stale coverage and the details of the download.

## Messages around a hit

`--newest` orders by time instead of by relevance, and `--context 2` shows two messages before and
after each one found (2 in the terminal, 0 otherwise by default).

`--thread` shows the reply chain and the replies around each hit instead of its neighbours in time. It
follows the reply links saved in the store, and in `messages context` it replaces the neighbours in
time too. Defaults are 8 links from the hit, 50 messages, 65,536 bytes and one day either side; change
them with `--thread-hops`, `--thread-messages`, `--thread-bytes` and `--thread-within`. Without saved
links it falls back to neighbours in time; links that are out of date are marked and not followed.
`messages context` with `--offline` reads only saved messages.

## Results as JSON

At a terminal tg prints a readable transcript. `--json` returns one object with the messages and what
was searched; `--jsonl` streams the messages only, one per line. The fields of the answer are in the
[query language reference](query-language.md#the-answer).

## When nothing is found

An empty answer means "not in the store you searched", not "never sent". Check what is stored with
`tg store status` and fetch more with `tg store fetch`. With `--json` the answer says which chats were
searched and how complete they are, even when nothing matched. If tg asks for `tg store migrate`, the
word index is still being built; searches without words (`has:file`, `date:today`) already work.

**Gaps in a chat's history.** `tg store gaps plan <chat>` looks, on this computer, for gaps between the
stretches of history the store holds. Missing message ids and quiet periods alone do not prove missing
history; the edges of the saved history stay `unknown`. Check the plan, then run
`tg store gaps repair <chat> --fingerprint <hash>` to download the gaps. Defaults are five gaps, 500
messages and 30 seconds; `--max-gaps`, `--limit`, `--repair-time`, `--page-size` and `--pause` set the
bounds. A repeat repairs the remaining gaps and never deletes a message because Telegram did not return
it. Pages where several messages share one timestamp stay pending. `--background` runs it as a job that
`store jobs show`, `store jobs list` and `store jobs cancel` follow. Repair needs the `store.gaps.repair`
write permission and permission to read messages. Over MCP the same commands are found through
`tg_tools_search` and run through `tg_read` or `tg_write`; jobs belong to one profile.

**Prepare topic search while you fetch.** `tg store fetch <chat> --catch-up` builds that chat's
conversations and computes its local vectors right after fetching, for
[topic search](topic-search.md). It is off by default; the profile setting `searchCatchUp: true` turns it
on, and `--no-catch-up` turns it off for one run. Bounds are
`--catch-up-chunks 500 --catch-up-messages 10000 --catch-up-time 30s`. It never downloads a model or
calls a remote service. A separate `prepared` result reports when preparation is incomplete; the
fetched history is saved either way. During a gap repair, catch-up shares the repair's time budget.

## Next

- [Topic search](topic-search.md): find a discussion by what it was about, when you do not remember
  its words.
- [Query language](query-language.md): every field, operator, limit and the JSON answer.
- [How search works](https://wirecat.dev/en/docs/search-architecture): the technical page — the word
  index, the conversation graph, vectors and how results are ranked.
