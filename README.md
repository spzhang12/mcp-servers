# MCP Servers

A collection of [Model Context Protocol](https://modelcontextprotocol.io) (MCP) servers that plug your everyday tools into AI coding agents — Codex, Claude Code, Cursor, Cline, VS Code, Qoder, and any other MCP-capable client.

Each server lives in its own subdirectory with a self-contained `README.md`, so you can use them individually or install everything with a single script.

## Servers

| Server | Description | Transport | Tools |
|--------|-------------|-----------|-------|
| [dida365-mcp](dida365-mcp/) | [Dida365](https://dida365.com) (TickTick China) task manager: tasks, projects, comments, tags, focus sessions, countdowns, habits | stdio + Streamable HTTP | 40 |

> More servers will be added over time. PRs and suggestions welcome.

## Quick Start

Requirements:

- Node.js 18 or later
- A Dida365 API token (see [Getting a Dida365 Token](dida365-mcp/#getting-a-dida365-token))

Clone and run the interactive installer:

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers
node scripts/install.js
```

The installer walks you through:

1. Configuring your Dida365 API token (stored in the local `.env`, never committed).
2. Detecting which clients are installed on your machine (Codex, Claude Code, Cursor, Cline, VS Code).
3. Writing the MCP configuration for each client you choose, with a backup of any existing file.

Or configure a single client manually:

```bash
# Codex CLI
codex mcp add dida365 -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js

# Claude Code
claude mcp add dida365 -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js
```

See [dida365-mcp/README.md](dida365-mcp/README.md) for per-client guides and the full tool list.

## Repository Layout

```text
mcp-servers/
  README.md             # This index
  scripts/install.js    # Cross-platform installer for all servers
  dida365-mcp/          # Dida365 MCP server (self-contained)
    README.md
    src/
    test/
    docs/clients/       # Per-client setup guides
    examples/           # Ready-to-use client configs
```

## License

Each server subdirectory is licensed independently — see the `LICENSE` file inside it.
