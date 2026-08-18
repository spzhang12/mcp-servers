#!/usr/bin/env node

import { formatHttpHelp, readHttpConfig, startHttpMcpServer } from "./http-server.js";

async function main() {
  const config = readHttpConfig();

  if (config.help) {
    console.error(formatHttpHelp());
    return;
  }

  const started = await startHttpMcpServer({ config });
  const address = started.httpServer.address();
  const host = typeof address === "object" && address ? address.address : config.host;
  const port = typeof address === "object" && address ? address.port : config.port;

  console.error(`Dida365 MCP HTTP server listening at http://${host}:${port}${config.path}`);
  if (!config.authToken) {
    console.error("Warning: DIDA365_MCP_HTTP_AUTH_TOKEN is not set. Do not expose this endpoint publicly.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
