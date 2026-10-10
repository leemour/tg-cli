/**
 * What `tg` cannot test offline, each with the reason and where it is checked instead. An entry
 * that names a command or option the program no longer has fails `pnpm test:matrix`.
 * `command` ending in ` *` covers every subcommand under it.
 */
export interface Untested {
  command: string
  option?: string
  reason: string
}

export const UNTESTED: Untested[] = [
  {
    command: "attachments show",
    option: "--page",
    reason:
      "cli-messaging 0.207.0 src/cli/messenger/attachments.test.ts renders a retained PDF page and refuses non-PDFs; it needs the optional unpdf and @napi-rs/canvas, which tg does not install",
  },
  ...["--search", "--link"].map((option) => ({
    command: "chats requests list",
    option,
    reason:
      "cli-messaging 0.178.0 src/cli/messenger/admin-commands.test.ts covers shared name/link filtering and rejects their combination; src/telegram/adapter.test.ts covers Telegram joinRequests with its link filter",
  })),

  ...[
    ["stats chats newcomers", "--saved"],
    ["stats messages discussion", "--saved"],
  ].map(([command, option]) => ({
    command: command as string,
    option,
    reason:
      "cli-messaging src/services/admin-statistics.test.ts covers shared report saved-run scope and typed overrides; native admin-statistics-adoption.test.ts checks mounted report paths and both evidence targets without connecting",
  })),

  ...[
    ["metadata get"],
    ["metadata get", "--chat"],
    ["metadata refresh", "--chat"],
    ["metadata refresh", "--limit"],
  ].map(([command, option]) => ({
    command: command as string,
    ...(option ? { option } : {}),
    reason:
      "cli-messaging src/services/private-people.test.ts («refreshes supported metadata through a read capability…», «bounds work…») covers the shared metadata command this consumer mounts (cli-messaging 0.174.0)",
  })),
  {
    command: "store fetch",
    option: "--all",
    reason:
      "cli-messaging src/services/archive.test.ts («walks the chats most recently active first…») and src/cli/messenger/backfill.test.ts («--all fetches every chat in a job…») cover the shared command (cli-messaging 0.174.0)",
  },
  {
    command: "stats messages top",
    option: "--sync-first",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--max-chats",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--sync-time",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--max-messages",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--measure",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--score",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--weights",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--message-kind",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--chat",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--source",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--timezone",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--exact",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages top",
    option: "--saved",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages evidence",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages evidence",
    option: "--selection",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages evidence",
    option: "--component",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages evidence",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats messages evidence",
    option: "--cursor",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--sync-first",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--max-chats",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--sync-time",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--max-messages",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--measure",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--score",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--weights",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--message-kind",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--chat",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--source",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--timezone",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--exact",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--saved",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts top",
    option: "--min-messages",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts evidence",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts evidence",
    option: "--selection",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts evidence",
    option: "--component",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts evidence",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "stats contacts evidence",
    option: "--cursor",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  {
    command: "searches create",
    option: "--selection",
    reason:
      "cli-messaging src/cli/messenger/rankings-command.test.ts, src/services/rankings.test.ts and src/store/rankings.test.ts cover the rankings over the local store; tg mounts the shared stats and searches commands and reads only its store",
  },
  ...["--backend", "--server-time"].map((option) => ({
    command: "search messages",
    option,
    reason:
      "cli-messaging src/services/server-search.test.ts and src/cli/messenger/messenger.test.ts cover the server step and the flags; this consumer mounts the shared command, and src/telegram/adapter.test.ts covers its searchMessages",
  })),
  {
    command: "messages download",
    option: "--extract",
    reason:
      "cli-messaging src/cli/messenger/attachments.test.ts covers reading text layers after a download; this consumer mounts the shared command (cli-messaging 0.162.0)",
  },
  ...["--catch-up", "--no-catch-up", "--catch-up-chunks", "--catch-up-messages", "--catch-up-time"].map((option) => ({
    command: "store fetch",
    option,
    reason:
      "cli-messaging src/cli/messenger/backfill.test.ts covers the bounded local catch-up after a fetch; this consumer mounts the shared command (cli-messaging 0.162.0)",
  })),
  ...[
    "--limit",
    "--max-gaps",
    "--repair-time",
    "--page-size",
    "--pause",
    "--fingerprint",
    "--catch-up",
    "--no-catch-up",
    "--catch-up-chunks",
    "--catch-up-messages",
    "--catch-up-time",
    "--background",
  ].map((option) => ({
    command: "store gaps repair",
    option,
    reason:
      "cli-messaging src/cli/messenger/gaps.test.ts and src/services/archive-gaps.test.ts cover planning and repairing archive gaps; this consumer mounts the shared command (cli-messaging 0.162.0)",
  })),
  ...["--from-dir", "--cursor"].map((option) => ({
    command: "attachments extract",
    option,
    reason:
      "cli-messaging src/cli/messenger/attachments.test.ts covers extraction from a directory and its cursor; this consumer mounts the shared command (cli-messaging 0.162.0)",
  })),
  ...["mcp setup", "mcp doctor"].map((command) => ({
    command,
    option: "--permission",
    reason:
      "cli-messaging src/cli/messenger/mcp-command-http.test.ts covers permission override serialization; cli-core checks the external child handshake and registration",
  })),

  {
    command: "chats members audit",
    option: "--deep",
    reason:
      'cli-messaging src/cli/messenger/messenger.test.ts ("chats members audit 7 --deep 1") and src/services/members-audit.test.ts cover the deep check of the top flagged members; this consumer mounts the shared command',
  },
  {
    command: "chats members history",
    option: "--since-time",
    reason:
      'cli-messaging src/services/members-fetch.test.ts ("chats members history") covers the recorded joins, leaves and changes since a time; shared option parsing',
  },
  {
    command: "chats members fetch",
    option: "--track",
    reason:
      'cli-messaging src/cli/messenger/messenger.test.ts ("chats members fetch 7 --track") covers adding a chat to the daily member fetch; this consumer mounts the shared command',
  },
  {
    command: "chats members fetch",
    option: "--budget",
    reason:
      "cli-messaging src/services/members-fetch.test.ts covers the page budget and the pause between pages; shared option parsing",
  },
  {
    command: "contacts check",
    option: "--no-registries",
    reason:
      'cli-messaging src/cli/messenger/messenger.test.ts ("contacts check 40 --no-registries") covers scoring from local signals alone, no registry asked; this consumer mounts the shared command',
  },
  {
    command: "contacts context",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/messenger.test.ts and src/store/contacts.test.ts cover local identity context and archive gaps; this consumer mounts the shared command",
  },
  {
    command: "contacts context",
    option: "--since-time",
    reason:
      "cli-messaging src/cli/messenger/messenger.test.ts and src/store/contacts.test.ts cover local identity context and stored-message filtering; shared option parsing",
  },
  {
    command: "stats messages show",
    option: "--saved",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts covers saved query execution and src/services/searches.test.ts validates shared query parameters",
  },
  {
    command: "store repair",
    option: "--dry-run",
    reason:
      "cli-messaging src/cli/messenger/store-maintenance.test.ts and src/store/repair.test.ts cover preview rollback and retained data",
  },
  {
    command: "store reset",
    option: "--no-backup",
    reason: "cli-messaging src/cli/messenger/store-maintenance.test.ts resets without a copy and checks backup: null",
  },
  {
    command: "tags add",
    option: "--contact",
    reason:
      "cli-messaging src/cli/messenger/tags.test.ts covers chat, contact and message targets through the shared command; consumer integration tests cover mounting, account isolation and permissions",
  },
  {
    command: "tags add",
    option: "--message",
    reason:
      "cli-messaging src/cli/messenger/tags.test.ts covers chat, contact and message targets through the shared command; consumer integration tests cover mounting, account isolation and permissions",
  },
  {
    command: "tags remove",
    option: "--contact",
    reason:
      "cli-messaging src/cli/messenger/tags.test.ts covers chat, contact and message targets through the shared command; consumer integration tests cover mounting, account isolation and permissions",
  },
  {
    command: "tags remove",
    option: "--message",
    reason:
      "cli-messaging src/cli/messenger/tags.test.ts covers chat, contact and message targets through the shared command; consumer integration tests cover mounting, account isolation and permissions",
  },
  {
    command: "searches create",
    option: "--source",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--limit",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--newest",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--context",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--language",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--timezone",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--regex",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--by",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches create",
    option: "--replace",
    reason:
      "cli-messaging src/cli/messenger/searches.test.ts and src/services/searches.test.ts cover named queries, parameter validation and replacement; consumer integration tests cover saved execution and no-record",
  },
  {
    command: "searches history",
    option: "--limit",
    reason:
      "cli-messaging src/services/searches.test.ts covers bounded newest history and pruning; consumer integration tests cover no-record and named-query preservation",
  },
  ...["--budget", "--min-score"].map((option) => ({
    command: "chats members audit",
    ...(option ? { option } : {}),
    reason:
      "shared member audit; cli-messaging src/cli/messenger/messenger.test.ts drives the command and src/services/members-audit.test.ts covers page budgets, thresholds and unavailable signals with synthetic members",
  })),
  {
    command: "chats moderate",
    option: "--since-time",
    reason:
      "P2's shared command; cli-messaging's moderation tests drive it through the port, and tg's own test " +
      "comes with P2's Telegram moderation work",
  },
  {
    command: "chats moderate",
    option: "--dry-run",
    reason:
      "P2's shared command; cli-messaging's moderation tests drive it through the port, and tg's own test " +
      "comes with P2's Telegram moderation work",
  },
  {
    command: "chats moderate",
    option: "--allow-dangerous",
    reason:
      "P2's shared command; cli-messaging's moderation tests drive it through the port, and tg's own test " +
      "comes with P2's Telegram moderation work",
  },
  {
    command: "chats moderate",
    option: "--max-actions",
    reason:
      "P2's shared command; cli-messaging's moderation tests drive it through the port, and tg's own test " +
      "comes with P2's Telegram moderation work",
  },
  ...["", "--confirm-send", "--allow-dangerous", "--allow-send", "--allow-delete", "--allow-moderate"].map(
    (option) => ({
      command: "bot mcp",
      ...(option ? { option } : {}),
      reason:
        "serves MCP on stdin until the client closes; cli-messaging's src/mcp/bot/server.test.ts drives the server, " +
        "src/bot.test.ts the tools tg offers, and bot mcp config there the flags",
    }),
  ),
  {
    command: "mcp",
    reason:
      "serves MCP on the process's own stdin until the client closes; cli-messaging's src/mcp/mcp.test.ts drives " +
      "the server — tools offered by the profile's permissions — and HANDOFF.md §3b names the live check",
  },
  {
    command: "mcp",
    option: "--confirm-send",
    reason:
      "serves MCP on stdin, as mcp does; cli-messaging's src/mcp/mcp.test.ts drives the server with confirmSend, " +
      "and mcp config below shows the flag reaching the server's arguments",
  },
  {
    command: "mcp",
    option: "--allow-dangerous",
    reason:
      "serves MCP on stdin, as mcp does; cli-messaging's src/mcp/mcp.test.ts drives the server with allowDangerous, " +
      "and mcp config below shows the flag reaching the server's arguments",
  },
  {
    command: "mcp",
    option: "--allow-send",
    reason:
      "decides nothing since the profile's permissions do, and is accepted with a warning so an old setup starts; " +
      "mcp config below shows the warning",
  },
  {
    command: "mcp",
    option: "--allow-mark-read",
    reason: "decides nothing, as --allow-send; mcp config below shows the warning",
  },
  {
    command: "mcp",
    option: "--allow-delete",
    reason: "decides nothing, as --allow-send; mcp config below shows the warning",
  },
  ...[
    "--allow-writes",
    "--confirm-send",
    "--allow-dangerous",
    "--allow-send",
    "--allow-mark-read",
    "--allow-delete",
  ].map((option) => ({
    command: "mcp setup",
    option,
    reason:
      "registers an external client's local configuration; cli-core's src/mcp/index.test.ts checks registration and the handshake, and tg setup was checked with an isolated Codex home",
  })),
  ...["--confirm-send", "--allow-dangerous", "--allow-send", "--allow-mark-read", "--allow-delete"].map((option) => ({
    command: "mcp doctor",
    option,
    reason:
      "starts a separate MCP process; cli-core's src/mcp/index.test.ts checks its handshake and tools, and tg doctor was checked without an account",
  })),
  {
    command: "store fetch",
    option: "--background",
    reason:
      "spawns a detached process that outlives the test; cli-messaging's src/cli/messenger/backfill.test.ts " +
      "drives it with a stand-in spawnJob, and lane L5 owns the live check",
  },
  {
    command: "models text download",
    option: "--accept-terms",
    reason:
      "phase 5's shared command; it downloads a model over the network, and cli-messaging's tests drive it offline",
  },
  {
    command: "contacts list",
    option: "--search-notes",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "contacts show",
    option: "--with-notes",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags auto",
    option: "--chat",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags auto",
    option: "--limit",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags auto",
    option: "--refresh-metadata",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags auto",
    option: "--dry-run",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags remove",
    option: "--source",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "tags list",
    option: "--source",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "contacts notes add",
    option: "--file",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "contacts notes edit",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "contacts notes edit",
    option: "--file",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
  {
    command: "contacts notes edit",
    option: "--revision",
    reason:
      "cli-messaging src/services/private-people.test.ts covers scoped notes search/exposure, offline note CRUD with file/revision, tag provenance filters, bounded metadata auto tagging, dry-run and retained metadata after failed refresh; this consumer mounts the shared handlers",
  },
]
