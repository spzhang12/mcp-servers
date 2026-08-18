# dida365-mcp

A universal [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for [Dida365](https://dida365.com) (TickTick China). It exposes the Dida365 Open API — tasks, projects, comments, tags, focus sessions, countdowns and habits — to any MCP-capable AI coding agent: Codex, Claude Code, Cursor, Cline, VS Code, Qoder, Coze, and more.

Two transports are supported:

- **stdio** — a local process, ideal for Codex, Claude Code, Cursor, Cline, VS Code and other local clients.
- **Streamable HTTP** — an HTTP endpoint, ideal for clients and platforms that need a URL, e.g. Coze / 扣子.

## Features

- 40 MCP tools covering the public Dida365 Open API surface.
- Minimal dependencies: only `@modelcontextprotocol/sdk` at runtime — the HTTP layer is built on Node's native `http` module.
- Token management via local `.env` (never committed) or environment variables.
- HTTP mode with optional Bearer auth, CORS and a `/health` endpoint.
- Tested with the Node.js built-in test runner.

## Tools

Tasks:

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects/lists |
| `get_project_data` | Full data of a project (tasks, columns, ...) |
| `filter_tasks` | Filter tasks by conditions |
| `get_task` | Task details |
| `create_task` | Create a task |
| `update_task` | Update a task |
| `complete_task` | Complete a task |
| `delete_task` | Delete a task |
| `move_task` | Move a task to another project/column |
| `list_completed_tasks` | List completed tasks |
| `batch_add_tasks` | Batch-create tasks |
| `batch_update_tasks` | Batch-update tasks |
| `complete_tasks_in_project` | Complete up to 20 tasks in one project per call |

Comments, tags, projects, focus, countdowns and habits:

| Tool | Description |
|------|-------------|
| `get_comment` / `add_comment` / `delete_comment` | Task comments |
| `list_tags` / `create_tag` | Tags |
| `get_project` / `create_project` / `update_project` / `delete_project` | Projects |
| `list_project_groups` / `create_project_group` / `update_project_group` / `delete_project_group` | Project groups |
| `list_columns` / `create_column` / `update_column` | Kanban columns |
| `get_focus` / `list_focuses` / `create_focus` / `delete_focus` | Focus sessions |
| `list_countdowns` | Countdowns / anniversaries |
| `get_habit` / `list_habits` / `create_habit` / `update_habit` / `checkin_habit` / `list_habit_checkins` | Habits |

Non-public Dida365 capabilities are out of scope.

## Requirements

- Node.js 18 or later
- A Dida365 API token
- An MCP-capable client

## Quick Start

Clone this repository (or [mcp-servers](https://github.com/spzhang12/mcp-servers)) and run the installer:

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers
node scripts/install.js
```

The installer configures your token and writes the client configs for you.

### Manual setup

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure   # prompts for your DIDA365_ACCESS_TOKEN
```

`npm run configure` writes the token into the local `.env` file (git-ignored). Alternatively copy the example file and edit it:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then set in `.env`:

```dotenv
DIDA365_ACCESS_TOKEN=YOUR_DIDA365_API_TOKEN
```

### Getting a Dida365 Token

1. Sign in to [dida365.com](https://dida365.com) (web).
2. Click your avatar.
3. Go to **Settings > Account & Security > API Token** (设置 > 账户与安全 > API 口令).
4. Create and copy the token.

Never commit a real token to README, examples or Git history.

## Client Configuration

One-liners for CLI-based clients (run from anywhere, using the absolute path to `src/index.js`):

```bash
# Codex CLI
codex mcp add dida365 -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js

# Claude Code
claude mcp add dida365 -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js
```

Per-client guides:

- [Codex CLI](docs/clients/codex.md)
- [Claude Code](docs/clients/claude-code.md)
- [Cursor](docs/clients/cursor.md)
- [Cline](docs/clients/cline.md)
- [VS Code](docs/clients/vscode.md)
- [Coze / 扣子 (HTTP)](docs/clients/coze.md)

Ready-to-use JSON examples live in [examples/](examples/).

## Configuration

Environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DIDA365_ACCESS_TOKEN` | Yes | — | Dida365 Open API bearer token |
| `DIDA365_API_BASE_URL` | No | `https://api.dida365.com` | API base URL |
| `DIDA365_MCP_HTTP_HOST` | No | `127.0.0.1` | HTTP bind host |
| `DIDA365_MCP_HTTP_PORT` | No | `3333` | HTTP port |
| `DIDA365_MCP_HTTP_PATH` | No | `/mcp` | HTTP MCP path |
| `DIDA365_MCP_HTTP_AUTH_TOKEN` | No | — | Bearer token for HTTP MCP clients |

Environment variables take precedence over the local `.env` file.

## HTTP Mode

```bash
npm run start:http
```

Listens on `http://127.0.0.1:3333/mcp` by default.

Before exposing the endpoint publicly (or to Coze), set an access token:

```bash
export DIDA365_MCP_HTTP_AUTH_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

Windows PowerShell:

```powershell
$env:DIDA365_MCP_HTTP_AUTH_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

Clients then send:

```text
Authorization: Bearer CHANGE_ME_TO_A_LONG_RANDOM_TOKEN
```

## Security

- Prefer `stdio` for local agents; do not expose the local service to the public internet.
- Use HTTP mode only when a URL is actually needed.
- Public HTTP endpoints must set `DIDA365_MCP_HTTP_AUTH_TOKEN` and be served over HTTPS.
- Keep tokens in `.env` or system environment variables only.
- The MCP tools can create, update, complete and delete tasks — review your client's approval policy before enabling auto-approve.

## Development

```bash
npm test
```

See [docs/maintenance.md](docs/maintenance.md) for repository conventions.

## License

MIT
