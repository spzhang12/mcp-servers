import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { Dida365Client } from "./dida-client.js";
import { createMcpServer } from "./server.js";

export const DEFAULT_HTTP_HOST = "127.0.0.1";
export const DEFAULT_HTTP_PORT = 3333;
export const DEFAULT_HTTP_PATH = "/mcp";

export function readHttpConfig(options = {}) {
  const env = options.env ?? process.env;
  const argv = options.argv ?? process.argv.slice(2);
  const args = parseHttpArgs(argv);

  return {
    host: args.host ?? env.DIDA365_MCP_HTTP_HOST ?? DEFAULT_HTTP_HOST,
    port: args.port ?? parsePort(env.DIDA365_MCP_HTTP_PORT, DEFAULT_HTTP_PORT),
    path: normalizeHttpPath(args.path ?? env.DIDA365_MCP_HTTP_PATH ?? DEFAULT_HTTP_PATH),
    authToken: args.authToken ?? env.DIDA365_MCP_HTTP_AUTH_TOKEN,
    help: args.help,
  };
}

export function createHttpRequestHandler({ sessionManager, path = DEFAULT_HTTP_PATH, authToken } = {}) {
  const manager = sessionManager ?? createHttpMcpSessionManager();
  const mcpPath = normalizeHttpPath(path);

  return async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, service: "dida365-mcp" });
        return;
      }

      if (url.pathname !== mcpPath) {
        sendJson(res, 404, { error: "not_found", message: `Use ${mcpPath} for MCP requests.` });
        return;
      }

      if (req.method === "OPTIONS") {
        sendCorsPreflight(res);
        return;
      }

      if (!isAuthorized(req.headers.authorization, authToken)) {
        sendJson(res, 401, { error: "unauthorized", message: "Missing or invalid Authorization bearer token." });
        return;
      }

      const sessionId = getHeader(req.headers, "mcp-session-id");
      let session = sessionId ? manager.get(sessionId) : undefined;
      let parsedBody;

      if (req.method === "POST") {
        parsedBody = await readJsonBody(req);

        if (!session) {
          if (!sessionId && isInitializeRequest(parsedBody)) {
            session = await manager.create();
          } else {
            sendMcpJsonError(res, 400, -32000, "Bad Request: No valid MCP session ID provided.");
            return;
          }
        }
      } else if (!session) {
        sendMcpJsonError(res, 400, -32000, "Bad Request: No valid MCP session ID provided.");
        return;
      }

      await session.transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: "internal_error",
          message: error instanceof Error ? error.message : String(error),
        });
      } else {
        res.end();
      }
    }
  };
}

export function createHttpMcpSessionManager(options = {}) {
  const client = options.client ?? new Dida365Client();
  const sessions = new Map();

  return {
    get: (sessionId) => sessions.get(sessionId),
    create: async () => {
      let session;
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (sessionId) => {
          session.id = sessionId;
          sessions.set(sessionId, session);
        },
        onsessionclosed: (sessionId) => {
          sessions.delete(sessionId);
        },
      });
      const mcpServer = createMcpServer(client);
      session = { id: undefined, transport, mcpServer };

      await mcpServer.connect(transport);
      return session;
    },
    closeAll: async () => {
      const activeSessions = [...sessions.values()];
      sessions.clear();
      await Promise.all(
        activeSessions.map(async (session) => {
          await session.transport.close();
          await session.mcpServer.close?.();
        }),
      );
    },
  };
}

export async function startHttpMcpServer(options = {}) {
  const config = options.config ?? readHttpConfig(options);
  if (config.help) {
    return { config };
  }

  const sessionManager = options.sessionManager ?? createHttpMcpSessionManager({ client: options.client });

  const httpServer = createServer(
    createHttpRequestHandler({
      sessionManager,
      path: config.path,
      authToken: config.authToken,
    }),
  );

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(config.port, config.host, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  return {
    config,
    httpServer,
    sessionManager,
    close: async () => {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
      await sessionManager.closeAll();
    },
  };
}

export function formatHttpHelp() {
  return `Usage: dida365-mcp-http [--host HOST] [--port PORT] [--path PATH] [--auth-token TOKEN]

Environment variables:
  DIDA365_ACCESS_TOKEN          Required by Dida365 Open API calls.
  DIDA365_API_BASE_URL          Optional, defaults to https://api.dida365.com.
  DIDA365_MCP_HTTP_HOST         Optional, defaults to 127.0.0.1.
  DIDA365_MCP_HTTP_PORT         Optional, defaults to 3333.
  DIDA365_MCP_HTTP_PATH         Optional, defaults to /mcp.
  DIDA365_MCP_HTTP_AUTH_TOKEN   Optional bearer token for HTTP MCP clients.
`;
}

export function isAuthorized(authorizationHeader, authToken) {
  if (!authToken) {
    return true;
  }

  return authorizationHeader === `Bearer ${authToken}`;
}

function parseHttpArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    const nextValue = () => {
      index += 1;
      if (index >= argv.length || argv[index].startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      return argv[index];
    };

    if (arg === "--host") {
      args.host = nextValue();
    } else if (arg === "--port") {
      args.port = parsePort(nextValue(), DEFAULT_HTTP_PORT);
    } else if (arg === "--path") {
      args.path = nextValue();
    } else if (arg === "--auth-token") {
      args.authToken = nextValue();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parsePort(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid HTTP port: ${value}`);
  }

  return port;
}

function normalizeHttpPath(value) {
  const path = String(value ?? DEFAULT_HTTP_PATH).trim();
  if (!path) {
    return DEFAULT_HTTP_PATH;
  }

  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function sendMcpJsonError(res, statusCode, code, message) {
  sendJson(res, statusCode, {
    jsonrpc: "2.0",
    error: {
      code,
      message,
    },
    id: null,
  });
}

function sendCorsPreflight(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
  });
  res.end();
}

function getHeader(headers, name) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) {
    return undefined;
  }

  return JSON.parse(text);
}
