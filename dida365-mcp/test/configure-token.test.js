import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { configureToken, isMainModule } from "../scripts/configure-token.js";

test("configureToken writes the provided token and does not echo the secret", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-configure-"));
  const envFilePath = join(dir, ".env");
  const messages = [];

  await configureToken({
    askToken: async () => "secret-token",
    envFilePath,
    writeLine: (message) => messages.push(message),
  });

  assert.equal(await readFile(envFilePath, "utf8"), "DIDA365_ACCESS_TOKEN=secret-token\n");
  assert.ok(messages.some((message) => message.includes(".env")));
  assert.ok(messages.every((message) => !message.includes("secret-token")));
});

test("configureToken rejects an empty token before writing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-empty-"));
  const envFilePath = join(dir, ".env");

  await assert.rejects(
    () => configureToken({
      askToken: async () => "   ",
      envFilePath,
      writeLine: () => {},
    }),
    /Token cannot be empty/,
  );
});

test("isMainModule detects direct script execution from a file URL and argv path", () => {
  const scriptPath = join(process.cwd(), "scripts", "configure-token.js");

  assert.equal(isMainModule(pathToFileURL(scriptPath).href, scriptPath), true);
  assert.equal(isMainModule(pathToFileURL(scriptPath).href, join(process.cwd(), "other.js")), false);
});
