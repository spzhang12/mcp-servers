import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { isAuthorized, readHttpConfig, startHttpMcpServer } from "../src/http-server.js";

test("readHttpConfig reads defaults and normalizes path", () => {
  const config = readHttpConfig({ env: {}, argv: ["--path", "mcp/"] });

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3333);
  assert.equal(config.path, "/mcp");
});

test("isAuthorized only enforces auth when a token is configured", () => {
  assert.equal(isAuthorized(undefined, undefined), true);
  assert.equal(isAuthorized("Bearer expected", "expected"), true);
  assert.equal(isAuthorized("Bearer wrong", "expected"), false);
});

test("HTTP server exposes MCP tools over Streamable HTTP", async () => {
  const started = await startHttpMcpServer({
    config: {
      host: "127.0.0.1",
      port: 0,
      path: "/mcp",
    },
  });

  try {
    const address = started.httpServer.address();
    assert.equal(typeof address, "object");

    const client = new Client(
      {
        name: "dida365-mcp-test",
        version: "0.0.0",
      },
      {
        capabilities: {},
      },
    );

    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)));
    const tools = await client.listTools();
    await client.close();

    assert.ok(tools.tools.some((tool) => tool.name === "list_projects"));
  } finally {
    await started.close();
  }
});

test("HTTP server rejects unauthenticated requests when auth token is set", async () => {
  const started = await startHttpMcpServer({
    config: {
      host: "127.0.0.1",
      port: 0,
      path: "/mcp",
      authToken: "secret",
    },
  });

  try {
    const address = started.httpServer.address();
    assert.equal(typeof address, "object");

    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });

    assert.equal(response.status, 401);
  } finally {
    await started.close();
  }
});
