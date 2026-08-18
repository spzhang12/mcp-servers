import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { Dida365Client } from "../src/dida-client.js";
import { parseEnvFile, readDida365Config, writeDida365Env } from "../src/config.js";

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get(name) {
        return name.toLowerCase() === "content-type" ? "application/json" : "";
      },
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

test("parseEnvFile reads unquoted and quoted values while ignoring comments", () => {
  const parsed = parseEnvFile(`
# comment
DIDA365_ACCESS_TOKEN=token-from-file
DIDA365_API_BASE_URL="https://example.test/"
OTHER='kept'
`);

  assert.equal(parsed.DIDA365_ACCESS_TOKEN, "token-from-file");
  assert.equal(parsed.DIDA365_API_BASE_URL, "https://example.test/");
  assert.equal(parsed.OTHER, "kept");
});

test("readDida365Config prefers process env over local .env", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-config-"));
  const envFilePath = join(dir, ".env");
  await writeFile(envFilePath, "DIDA365_ACCESS_TOKEN=token-from-file\n", "utf8");

  const config = readDida365Config({
    env: { DIDA365_ACCESS_TOKEN: "token-from-env" },
    envFilePath,
  });

  assert.equal(config.token, "token-from-env");
  assert.equal(config.apiBaseUrl, "https://api.dida365.com");
});

test("Dida365Client falls back to token from local .env", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-client-"));
  const envFilePath = join(dir, ".env");
  await writeFile(envFilePath, "DIDA365_ACCESS_TOKEN=token-from-file\n", "utf8");
  const calls = [];

  const client = new Dida365Client({
    env: {},
    envFilePath,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([]);
    },
  });

  await client.listProjects();

  assert.equal(calls[0].init.headers.Authorization, "Bearer token-from-file");
});

test("writeDida365Env updates token without removing unrelated values", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-write-"));
  const envFilePath = join(dir, ".env");
  await writeFile(envFilePath, "OTHER=value\nDIDA365_ACCESS_TOKEN=old\n", "utf8");

  await writeDida365Env({ token: "new-token", envFilePath });

  assert.equal(await readFile(envFilePath, "utf8"), "OTHER=value\nDIDA365_ACCESS_TOKEN=new-token\n");
});
