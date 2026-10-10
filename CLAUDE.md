# tg-cli — working rules

**Start with [`HANDOFF.md`](HANDOFF.md)** — what this is, what to read for your task, and what will
bite. A lane agent starts with its own handoff instead ([`docs/dev/agents.md`](docs/dev/agents.md)). Open work is
[`docs/dev/BACKLOG.md`](docs/dev/BACKLOG.md).

1. **This is the owner's real Telegram account.** Nothing sends unless the command typed asked for
   it; live checks send only to Saved Messages, and go through `bin/tg`, never `node dist/bin/tg.js`.
2. **In machine mode, stdout carries data and nothing else.** Diagnostics go to stderr.
3. **One-shot means the process exits.** Every command closes its Telegram connection in a `finally`.
4. **No mtcute type crosses `src/telegram/`.** A lint rule enforces it.
5. **The session and the app credentials never reach a log, a fixture or a document.**

Conventional commits, a branch and a PR per change. The pre-commit hook checks staged lint and secrets. Comments sparse, only *why*.

## Development check budget

Local commits check only staged lint and secrets. There is no pre-push check.
Config integrity, repository lint, Markdown, and secret detection run in PR CI. Full typechecking, tests,
coverage, builds, parity, browser and platform suites run for releases or an
explicit manual validation. See the
[shared policy](https://github.com/WireCatLabs/community/blob/main/standards/README.md#ci-and-hooks).
