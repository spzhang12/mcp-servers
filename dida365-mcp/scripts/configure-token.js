#!/usr/bin/env node

import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { DEFAULT_ENV_FILE_PATH, writeDida365Env } from "../src/config.js";

export async function configureToken(options = {}) {
  const envFilePath = options.envFilePath ?? DEFAULT_ENV_FILE_PATH;
  const writeLine = options.writeLine ?? ((message) => console.log(message));
  const askToken = options.askToken ?? askTokenFromTerminal;

  const token = String(await askToken()).trim();
  if (!token) {
    throw new Error("Token cannot be empty");
  }

  await writeDida365Env({ token, envFilePath });
  writeLine(`Dida365 token saved to ${envFilePath}`);
  writeLine("You can now start the MCP server without passing DIDA365_ACCESS_TOKEN explicitly.");
}

async function askTokenFromTerminal() {
  const rl = createInterface({ input, output });
  try {
    return await rl.question("Paste DIDA365_ACCESS_TOKEN: ");
  } finally {
    rl.close();
  }
}

export function isMainModule(moduleUrl, argvPath) {
  return Boolean(argvPath) && fileURLToPath(moduleUrl) === resolve(argvPath);
}

if (isMainModule(import.meta.url, process.argv[1])) {
  configureToken().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
