#!/usr/bin/env node
/**
 * MCP Servers — cross-platform one-command installer.
 *
 * Usage:
 *   node scripts/install.js                 Interactive wizard
 *   node scripts/install.js --token XXX     Provide the Dida365 token non-interactively
 *   node scripts/install.js --client codex  Configure a single client (codex|claude|cursor|cline|vscode)
 *   node scripts/install.js --yes           Non-interactive: configure every detected client
 *
 * What it does:
 *   1. Discovers MCP server modules under the repository root.
 *   2. Ensures npm dependencies are installed for each module.
 *   3. Configures the Dida365 API token in the module's local .env (never committed).
 *   4. Detects installed clients (Codex, Claude Code, Cursor, Cline, VS Code).
 *   5. Writes MCP configs for the chosen clients, backing up existing files first.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { spawnSync } from "node:child_process";

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DIDA365_ENV_TOKEN_KEY = "DIDA365_ACCESS_TOKEN";
const SERVER_NAME = "dida365"; // server key used in client configs
const HTTP_AUTH_TOKEN_HINT =
  "DIDA365_MCP_HTTP_AUTH_TOKEN=CHANGE_ME_TO_A_LONG_RANDOM_TOKEN";

const CLIENTS = [
  { id: "codex", label: "Codex CLI", configKind: "cli", command: "codex" },
  { id: "claude", label: "Claude Code", configKind: "cli", command: "claude" },
  { id: "cursor", label: "Cursor", configKind: "json", path: () => join(homedir(), ".cursor", "mcp.json") },
  { id: "cline", label: "Cline", configKind: "json", path: () => join(homedir(), ".cline", "mcp.json") },
  { id: "vscode", label: "VS Code", configKind: "json", path: () => join(process.cwd(), ".vscode", "mcp.json") },
];

function parseArgs(argv) {
  const args = { clientIds: [], token: undefined, yes: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--token") {
      args.token = argv[++i];
    } else if (arg === "--client") {
      args.clientIds.push(argv[++i]);
    } else if (arg === "--yes") {
      args.yes = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}\n`);
      printHelp();
      process.exit(1);
    }
  }
  return args;
}

function printHelp() {
  console.log(`MCP Servers installer\n\nUsage:\n  node scripts/install.js                 Interactive wizard\n  node scripts/install.js --token XXX     Provide the Dida365 token non-interactively\n  node scripts/install.js --client codex  Configure a single client (codex|claude|cursor|cline|vscode)\n  node scripts/install.js --yes           Non-interactive: configure every detected client`);
}

// ---------- helpers ----------

function commandExists(command) {
  const probe = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(probe, [command], { stdio: "ignore" });
  return result.status === 0;
}

function runCommand(commandString) {
  const result = spawnSync(commandString, { shell: true, stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 0;
}

function quotePath(filePath) {
  return `"${String(filePath).replace(/"/g, '\\"')}"`;
}

async function ask(question, fallback = "") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question)).trim();
    return answer || fallback;
  } finally {
    rl.close();
  }
}

// ---------- server modules ----------

function discoverServers() {
  const servers = [];
  for (const entry of readdirSync(ROOT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    const moduleDir = join(ROOT_DIR, entry.name);
    if (!existsSync(join(moduleDir, "package.json")) || !existsSync(join(moduleDir, "src", "index.js"))) {
      continue;
    }
    servers.push({
      dir: moduleDir,
      name: entry.name,
      indexPath: join(moduleDir, "src", "index.js"),
      envFilePath: join(moduleDir, ".env"),
    });
  }
  return servers;
}

function ensureDependencies(server) {
  if (existsSync(join(server.dir, "node_modules"))) {
    return;
  }
  console.log(`\nDependencies missing for ${server.name} — running npm install...`);
  const result = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: server.dir, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`npm install failed for ${server.name}. Aborting.`);
    process.exit(1);
  }
}

// ---------- .env / token ----------

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }
  const parsed = {};
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    if (key) {
      parsed[key] = line.slice(equalsIndex + 1).trim();
    }
  }
  return parsed;
}

function upsertEnvFile(filePath, updates) {
  const existing = readEnvFile(filePath);
  const lines = existsSync(filePath) ? readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n") : [];
  for (const [key, value] of Object.entries(updates)) {
    const newLine = `${key}=${value}`;
    const index = lines.findIndex((line) => line.trimStart().startsWith(`${key}=`) || line.trimStart().startsWith(`${key} =`));
    if (index >= 0) {
      lines[index] = newLine;
    } else {
      lines.push(newLine);
    }
    existing[key] = value;
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
  return existing;
}

function isValidToken(token) {
  return Boolean(token) && !/[\r\n]/.test(token);
}

async function configureToken(server, providedToken) {
  const env = readEnvFile(server.envFilePath);
  if (isValidToken(env[DIDA365_ENV_TOKEN_KEY])) {
    console.log(`✓ ${server.name}: token already configured in .env`);
    return;
  }

  let token = providedToken;
  if (!isValidToken(token)) {
    token = await ask(`\nPaste your Dida365 API token for ${server.name} (required): `);
  }
  if (!isValidToken(token)) {
    console.error("Token cannot be empty. Aborting.");
    process.exit(1);
  }

  upsertEnvFile(server.envFilePath, { [DIDA365_ENV_TOKEN_KEY]: token });
  console.log(`✓ ${server.name}: token saved to ${server.envFilePath}`);
}

// ---------- client detection ----------

function detectClients(onlyIds) {
  const detected = [];
  for (const client of CLIENTS) {
    if (onlyIds.length > 0 && !onlyIds.includes(client.id)) {
      continue;
    }
    const available = client.configKind === "cli" ? commandExists(client.command) : Boolean(client.path());
    detected.push({ ...client, available });
  }
  return detected;
}

function normalizeClientIds(rawIds, detected) {
  const valid = new Set(CLIENTS.map((client) => client.id));
  return rawIds
    .flatMap((raw) => raw.split(","))
    .map((id) => id.trim())
    .filter((id) => id && valid.has(id))
    .filter((id, index, all) => all.indexOf(id) === index);
}

async function chooseClients(detected, yes) {
  const available = detected.filter((client) => client.available);
  if (available.length === 0) {
    console.log("\nNo supported clients detected on this machine.");
    console.log("Configure clients manually — see each server's README (docs/clients).");
    return [];
  }

  console.log("\nDetected clients:");
  available.forEach((client, index) => console.log(`  ${index + 1}. ${client.label}`));
  const missing = detected.filter((client) => !client.available);
  for (const client of missing) {
    console.log(`  - ${client.label} (not detected)`);
  }

  if (yes) {
    return available;
  }

  const answer = await ask("\nWhich clients should be configured? (comma-separated numbers, 'all', or 'none'): ", "all");
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === "none" || trimmed === "") {
    return [];
  }
  if (trimmed === "all") {
    return available;
  }
  return available.filter((_, index) => answer.split(",").map((part) => Number(part.trim())).includes(index + 1));
}

// ---------- config writers ----------

function writeJsonConfig(filePath, serverConfig) {
  const existing = existsSync(filePath) ? JSON.parse(readFileSync(filePath, "utf8")) : {};
  const mcpServers = existing.mcpServers ?? {};
  if (mcpServers[SERVER_NAME]) {
    console.log(`  - ${SERVER_NAME} already present in ${filePath} — leaving unchanged`);
    return;
  }
  mcpServers[SERVER_NAME] = serverConfig;
  if (existsSync(filePath)) {
    copyFileSync(filePath, `${filePath}.bak`);
    console.log(`  - backup written to ${filePath}.bak`);
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`  ✓ ${SERVER_NAME} added to ${filePath}`);
}

function stdioConfig(indexPath) {
  return {
    type: "stdio",
    command: "node",
    args: [indexPath],
  };
}

function installForClient(client, server, yes) {
  console.log(`\nConfiguring ${client.label}...`);

  if (client.configKind === "cli") {
    const commandLine = `${client.command} mcp add ${SERVER_NAME} -- node ${quotePath(server.indexPath)}`;
    if (yes) {
      console.log(`  running: ${commandLine}`);
      runCommand(commandLine);
      return;
    }
    const answer = ask(`  run: ${commandLine}\n  [y/N]: `, "n");
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      runCommand(commandLine);
    } else {
      console.log("  skipped — run it manually later.");
    }
    return;
  }

  if (client.id === "cline") {
    writeJsonConfig(client.path(), { ...stdioConfig(server.indexPath), disabled: false, autoApprove: [] });
  } else {
    writeJsonConfig(client.path(), stdioConfig(server.indexPath));
  }
}

// ---------- main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const servers = discoverServers();

  if (servers.length === 0) {
    console.error("No MCP server modules found under this repository. Aborting.");
    process.exit(1);
  }

  console.log("MCP Servers installer\n");
  console.log(`Repository: ${ROOT_DIR}`);
  console.log(`Found modules: ${servers.map((server) => server.name).join(", ")}`);

  for (const server of servers) {
    ensureDependencies(server);
    await configureToken(server, args.token);
  }

  const onlyIds = normalizeClientIds(args.clientIds, CLIENTS);
  const detected = detectClients(onlyIds);
  const chosen = await chooseClients(detected, args.yes);

  for (const client of chosen) {
    for (const server of servers) {
      installForClient(client, server, args.yes);
    }
  }

  console.log("\nNext steps:");
  console.log("  1. Restart your AI coding agent (or reload its MCP settings).");
  console.log("  2. Ask something like: \"list my Dida365 projects\".");
  console.log("  3. For remote/HTTP usage (e.g. Coze), see docs/clients/coze.md and set:");
  console.log(`     ${HTTP_AUTH_TOKEN_HINT}`);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
