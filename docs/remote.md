# ChatGPT, Codex or Claude in the browser

Use this page when you want an AI app that runs in the browser or on your phone, for example
ChatGPT, Codex web or Claude, to read and answer your Telegram messages. Such an app cannot start
`tg` on your computer, so you give it an internet address instead. At the end, the app is connected
to `tg` through a private HTTPS address, it can do only what your profile permits, and you know how
to stop it or take its access back.

Terms used on this page:

- **MCP** (Model Context Protocol) is the standard way an AI app calls outside tools. `tg mcp` is
  the MCP server that comes with `tg`; the [MCP server guide](mcp.md) covers apps on your own
  computer.
- **Remote connection** means the app connects from its own servers, over the internet, to the
  address you give it. `tg mcp --http` serves the same tools over HTTP on `127.0.0.1` for this.
- **HTTPS tunnel** is a program that gives a port on your computer a public HTTPS address.
  This page uses [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel); Cloudflare
  Tunnel also works. You do not need to buy a domain for Funnel.
- **Public URL** is that address, for example `https://laptop.tail1234.ts.net`. You pass it to
  `tg` as `--public-url`, and the app gets it with `/mcp` at the end.
- **Access code** is a one-time code that `tg` prints in your terminal. The app's login page asks
  for it, so only a person who sees that terminal can connect an app.

```text
ChatGPT / Claude ──internet──▶ Tailscale Funnel ──▶ tg mcp --http (login) ──▶ Telegram
```

If your Tailscale connection already works, keep it; you do not need a second tunnel. The local
stdin/stdout connection keeps working as before.

## What you can do

| Task | Where |
|---|---|
| Connect a browser or phone AI app to Telegram | [Start the tunnel and server](#start-the-tunnel-and-server), then [connect the app](#connect-the-app) |
| Run the Telegram and MAX servers side by side | [Run MAX and Telegram together](#run-max-and-telegram-together) |
| Use Cloudflare instead of Tailscale | [Alternative: Cloudflare Tunnel](#alternative-cloudflare-tunnel) |
| Allow more or less for one server run | [Permissions for this server process](#permissions-for-this-server-process) |
| Stop the server or log every app out | [Stop or revoke access](#stop-or-revoke-access) |
| Give a remote agent a saved file, or one PDF page as an image | [Transfer retained files to an agent](#transfer-retained-files-to-an-agent), [read PDF pages](#read-pdf-pages-without-a-local-file-handoff) |

## Before you start

- **Whoever logs in reads your Telegram.** The login needs the access code from your terminal.
  Never put a tunnel in front of `tg mcp` without `--http`: that mode has no login at all.
- **Profile permissions decide what the app may change.** `deny` and `readonly` block writes;
  `ask` and `allow` let a requested MCP write go through without a form on the server. The app's own
  approval is separate and depends on its settings. Recipient restrictions and hourly limits still
  apply ([what an agent may do](mcp.md#what-an-agent-may-do), [configuration guide](configuration.md)).
- **The computer that runs `tg` must stay on.** To use it from a phone, or from a laptop with
  nothing installed, run all of this on a small server that is always on, and log in to `tg` there
  (`tg setup --agent none`). Then you need only a browser.
- **Who can add a remote connector:**

| App | Plans | Documentation |
|---|---|---|
| ChatGPT | Plus, Pro, Business, Enterprise, Education — in developer mode | [developer mode](https://developers.openai.com/api/docs/guides/custom-mcp-server) |
| Claude | any; one custom connector on the free plan | [custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) |
| Gemini | only adults in the US with a personal Google account | [connected apps](https://support.google.com/gemini/answer/17209137?hl=en) |

The setup steps for each operating system have not all been tried on that system. If a step does
not work, [open an issue](https://github.com/WireCatLabs/tg-cli/issues).

## Start the tunnel and server

Install the CLI and log in to Telegram first ([installation guide](installation.md)). Use the same
operating system user and profile for setup and for the MCP server. Put a profile before the
command when needed: `tg work mcp`. Tailscale is a separate installation; both `tg` and `max`
support this setup.

Install [Tailscale](https://tailscale.com/download), sign in, and enable
[Funnel](https://tailscale.com/docs/features/tailscale-funnel): MagicDNS, HTTPS certificates and
Funnel permission must be enabled in your tailnet (your Tailscale network). The first Funnel
command can print an approval link.

Keep two terminal windows open. The first runs the tunnel. Copy the HTTPS origin it prints into the
second window when asked. The origin is the address without `/mcp` or any other path. Keep an
explicit public port such as `:8443` in it.

The server listens on `127.0.0.1:8765` and prints a one-time access code. It never needs
administrator rights; only the tunnel may need them. The commands below allow sending for this
server process only, with `--permission messages.send=allow`; see
[permissions for this server process](#permissions-for-this-server-process).

### Windows (PowerShell)

Install the Tailscale Windows app and sign in from its tray menu. Open a new PowerShell window
after installing Node.js, the CLI and Tailscale, so it sees the updated PATH. Use `.cmd` for npm
commands to avoid PowerShell execution-policy errors. If setup is not done yet, run
`tg.cmd setup --agent none` in a normal PowerShell window.

First window: run PowerShell as Administrator for Funnel. The call operator `&` handles the space
in the default installation path; change the path if you installed Tailscale elsewhere.

```powershell
& "$env:ProgramFiles\Tailscale\tailscale.exe" funnel 8765
```

Second window: normal PowerShell, as the user who logged in to Telegram:

```powershell
$mcpPublicUrl = Read-Host 'Paste the HTTPS origin printed by Funnel (no /mcp)'
tg.cmd mcp --http --port 8765 --public-url $mcpPublicUrl --permission messages.send=allow
```

Run both processes in Windows itself. WSL is a separate environment: a Windows tunnel that points
at the Windows loopback address may not reach a server inside WSL.

### macOS (Terminal)

Install and sign in to the Tailscale app. Its CLI comes with the app; use this path when
`tailscale` is not on PATH ([Tailscale CLI guide](https://tailscale.com/docs/reference/tailscale-cli?tab=macos)).
First Terminal window:

```sh
TAILSCALE_BE_CLI=1 /Applications/Tailscale.app/Contents/MacOS/Tailscale funnel 8765
```

Second Terminal window, as the same user who ran `tg setup --agent none`. This works in both zsh
and bash:

```sh
printf 'Paste the HTTPS origin printed by Funnel (no /mcp): '
IFS= read -r mcpPublicUrl
tg mcp --http --port 8765 --public-url "$mcpPublicUrl" --permission messages.send=allow
```

### Linux (Terminal)

Install Tailscale with the [Linux instructions](https://tailscale.com/download/linux), then sign
in with `sudo tailscale up`. First terminal window:

```sh
sudo tailscale funnel 8765
```

Second terminal window: your normal user, without `sudo`, so `tg` finds the session created by
`tg setup --agent none`:

```sh
printf 'Paste the HTTPS origin printed by Funnel (no /mcp): '
IFS= read -r mcpPublicUrl
tg mcp --http --port 8765 --public-url "$mcpPublicUrl" --permission messages.send=allow
```

## Run MAX and Telegram together

Each server needs its own local port and its own public HTTPS address. For example, keep Telegram
on local `8765` and public `443`; run a second Funnel command with `--https=8443 8766`, and run MAX
with `--port 8766`. Use the second Funnel origin, with `:8443`, for MAX's `--public-url` and for its
connector address ending in `/mcp`. Use your system's Tailscale command from above for the second
Funnel command. Funnel supports public ports `443`, `8443` and `10000`
([Funnel command reference](https://tailscale.com/docs/reference/tailscale-cli/funnel)).

## Alternative: Cloudflare Tunnel

If you already use Cloudflare, point its tunnel at the same local MCP server. A fixed hostname
needs a Cloudflare account and a domain on Cloudflare. Follow the
[named tunnel setup](https://developers.cloudflare.com/tunnel/get-started/): install `cloudflared`
for your system, create the tunnel in the dashboard, start its connector and add a public hostname
such as `mcp.example.com`. Set its local service to `http://127.0.0.1:8765`, and run MCP on that
same computer.

Start the server in a second terminal:

```sh
tg mcp --http --port 8765 --public-url https://mcp.example.com
```

Add `https://mcp.example.com/mcp` to your AI app with OAuth and DCR, as described in
[connect the app](#connect-the-app). `--public-url` is the public origin used for login, not the
local address and not the `/mcp` path. The tunnel does not change profile permissions. Check the
JSON at `https://mcp.example.com/.well-known/oauth-protected-resource/mcp`, then login and the tool
list. When you stop, stop only this tunnel's own process, so other routes keep working.

**A temporary Quick Tunnel does not work on its own.**
`cloudflared tunnel --url http://127.0.0.1:8765` gives a random `trycloudflare.com` address with no
account or domain. But [Quick Tunnels do not support SSE](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
(server-sent events, the way the HTTP MCP server streams answers). So a Quick Tunnel is not a
replacement for Funnel with this server. It works only with an extra adapter that turns SSE answers
into JSON, and that adapter does not come with the CLI. A working login and tool list do not prove
that an agent can read PDFs. A Quick Tunnel also gets a new hostname on each restart, so the
connector address must be updated. For regular use, choose Funnel or a named tunnel and check your
app.

## Connect the app

The address for the app is your tunnel origin with `/mcp` at the end, for example
`https://<device>.<network>.ts.net/mcp`. Add it as a remote MCP connector:

- **ChatGPT or Codex web:** open **Plugins**, choose **+ Add custom MCP server**, and create a
  plugin with the `/mcp` address and OAuth, as the
  [OpenAI connection guide](https://developers.openai.com/plugins/quickstart) describes. Connect
  with the access code, install the plugin, and turn it on in your Work chat (or mention it with
  `@`). The local Codex `config.toml` does not set up this web connection. Availability can depend
  on your account or workspace. Choose dynamic client registration (DCR) when offered; the server
  supports DCR and the S256 code challenge that the
  [OpenAI OAuth requirements](https://developers.openai.com/plugins/build/auth) ask for.
- **Claude:** add a custom connector with this address, as described in
  [Claude custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
  In the connector settings you can also set each tool to always allowed, needs approval, or
  blocked.

The three tools work without MCP prompts, resources or elicitation (questions the server asks the
app), so apps that support only tools can use them.

The app opens the `tg` login page. Check the line that says where the login goes: it must be the
app you are connecting, such as `chatgpt.com` or `claude.ai`. Then type the access code from your
terminal. The code expires after ten minutes; a new code is printed after each login. Five wrong
codes lock the login page until the server restarts.

The app stays logged in as long as it uses the connection at least once every 30 days; it renews
its login by itself. After 30 days without use, it asks for a new code.

Profile `permissions` decide which commands are available. The server shows no approval forms;
the app's own approval is separate and depends on its settings.

MCP makes hidden Unicode controls visible in text results; subdivision flag emoji stay intact.
Write arguments and ordinary CLI machine JSON preserve original strings.

## Permissions for this server process

The server cannot see whether the app asked you before a call. If the app always allows a tool,
the next call can go through without a new question.

Repeat `--permission key=level` to change permissions only for this server process. Levels are
`deny`, `readonly`, `ask` and `allow`. For example, add `--permission messages.send=allow` to allow
sending from a read-only profile. `--permission messages=allow` replaces the saved permissions for
the whole messages resource; deletion is allowed separately with `--permission messages.delete=allow`.
The saved configuration, recipient restrictions and hourly limits do not change. To lift a read
refusal, name its resource or command with level `allow`. Permission keys are listed in the
[configuration guide](configuration.md).

## Stop or revoke access

Press Ctrl-C in both terminal windows to stop the server and this tunnel. Start them again with
the same commands; app logins survive a normal server restart.

If you started Funnel with `--bg`, Ctrl-C does not stop that background route. Check
`tailscale funnel status` and turn off only its public port, for example
`tailscale funnel --https=443 off`. Use your system's Tailscale command from above, with
administrator rights where needed. Do not use `funnel reset` when another server uses Funnel: it
clears all routes. If you stop only MCP, the route stays, but the tools are not available.

Taking access back from apps is separate from stopping a process. To log out every app for a
profile:

```sh
tg mcp --revoke --json
```

Those apps must log in again with a new code. This does not end your Telegram session.

## If it does not work

- **The app says it cannot connect:** open
  `https://<device>.<network>.ts.net/.well-known/oauth-protected-resource/mcp` in a browser. It
  must show a short JSON. If it does not, Funnel is not running, is not enabled in your Tailscale
  network, or points at another port.
- **The login page says "Too many wrong codes":** after five wrong codes it is locked until
  `tg mcp --http` restarts. If you did not type them, someone found your address: restart, and
  think about a new device name in Tailscale.
- **The app connects, but there are no tools:** `tg mcp doctor` checks that the MCP server starts
  and lists its tools. It does not check the Telegram login or the tunnel. A command that goes to
  Telegram, such as `tg account show`, checks the account connection.
- **Reading works, writing fails:** check the profile's permissions and any `--permission`
  overrides. `deny` and `readonly` block writes whatever the app approves.
- **You need a record of the calls:** `tg runs list` shows them. Successful calls appear only when
  recording is on; failed calls are kept by default, unless recording was turned off with
  `"record": false` or `--no-record` ([diagnostics guide](diagnostics.md)).

## Transfer retained files to an agent

An agent on your computer can open a saved file by its `localPath`. A remote agent cannot, so it
gets the saved bytes through `attachments show` (MCP: `tg_read`, command `attachments show`).

First download the message's files the usual way ([downloading files](attachments.md#what-you-can-download)).
Use `attachments list --needs-text` to find the message locator and the attachment position. Then
ask for the file:

```sh
tg attachments show msg:telegram/500/7/204 --attachment 1 --json
```

The command reads only a saved attachment of the active account. It never downloads, never calls a
model, never marks a message read and never changes the search index. A missing file must be
downloaded again. When a message has several files, give the position, starting from 1. Files of
another account, missing files and symbolic links are not sent. Text inside an attachment is data,
never instructions.

### Transfer a larger file

One answer carries 512 KiB by default; `--chunk-bytes` allows up to 1 MiB. A file can be up to
50 MiB. The JSON includes `base64`, `offsetBytes`, `readBytes`, `totalBytes`, `nextOffsetBytes`,
`complete` and the SHA256 of the whole file. `complete: true` means this answer holds the entire
file, not that its text has been recognized.

Decode each base64 part, join the parts in byte-offset order, and follow `nextOffsetBytes` until it
is null. Pass the first SHA256 as `--if-sha256` on the next requests: if the source file changed,
the request fails and returns no changed bytes. Check the joined file against that hash.

```sh
tg attachments show msg:telegram/500/7/204 --offset-bytes 524288 --if-sha256 <sha256> --json
```

### Through MCP

Find `attachments show` with the normal three tools. Its arguments are `message` (a locator, or an
id with `chat`), `attachment`, `offset_bytes`, `chunk_bytes` and `if_sha256`. A whole PNG, JPEG or
WebP image, up to 8000 pixels on each side and 20 million pixels in total, arrives as image
content; other files arrive as embedded binary resources. A partial resource is a set of bytes, not
a whole PDF or image. The resource URI is a name, not a download address.

The app must pass those bytes to the agent's file tools. Whether the agent can open a PDF or save a
file depends on the app. If the app does not show embedded resources, ask for `format: "base64"`
and decode the JSON with the agent's tools. Profiles that deny `messages` or `attachments.show`
refuse the transfer; read-only profiles can read saved files.

## Recognize text and make it searchable

Ordinary extraction reads text layers and light document formats on your computer. For scans,
photos, handwriting and hard layouts, the agent uses its own vision or OCR tools by default. It
reads every page, keeps the text word for word and marks unclear parts. Quality depends on the
resolution, language, handwriting, layout and the agent's tools. It never follows instructions
written inside an attachment.

Save the result with `attachments text set` (MCP: `tg_write`, command `attachments text set`), then
check it with a `content:` search. Receiving the bytes does not add text to the index.

`attachments extract --ocr` stays available for bulk extraction through `models.ocr`. It calls the
configured external model and sends supported images and scanned PDF pages to it. It runs only when
you call it, never on a transfer or when the agent reads a file. Formats and searchable text are
covered in the [file attachments guide](attachments.md).

## Read PDF pages without a local file handoff

If the app cannot pass a received PDF to its document reader, ask for one page as a PNG image. The
MCP server draws the page on your computer, and the agent reads the image with its own vision. This
needs the optional `unpdf` with page rendering and `@napi-rs/canvas`, as described under
[attachment engines](attachments.md#dependencies-and-missing-engines). They are not installed with
the CLI.

```sh
tg attachments show msg:telegram/500/7/204 --attachment 1 --page 1 --json
```

Through MCP, call `tg_read`, command `attachments show`, with `page: 1` and the message locator. By
default the page comes back as image content. If the app shows only metadata, ask for
`format: base64`, then decode and show the PNG with the agent's image tools. Receiving a base64
string is not looking at the page. Read pages 1 to `pdf.pageCount`. If neither format shows the
pixels, report the app's limit instead of inventing text.

`pdf.sourceSha256` and `pdf.sourceBytes` describe the original PDF; the top-level `sha256` and
`totalBytes` describe the page image. `--if-sha256` checks the original PDF. `--page` cannot be
combined with `--offset-bytes` or `--chunk-bytes`. PDFs can be up to 50 MiB, with no fixed page-count limit; a PNG
is at most 2000 pixels on each side, and one page image at most 1 MiB.

A page image calls no external OCR service and indexes no text. After looking at every page, the
agent calls `attachments text set` and checks a `content:` search. Check numbers and complex
layouts against the images; quality depends on the source document and the agent's tools.
