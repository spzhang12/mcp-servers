import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_API_BASE_URL = "https://api.dida365.com";

const sourceDir = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENV_FILE_PATH = resolve(sourceDir, "..", ".env");

export function parseEnvFile(content = "") {
  const parsed = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (!key) {
      continue;
    }

    parsed[key] = unquoteEnvValue(value);
  }

  return parsed;
}

export function readDida365Config(options = {}) {
  const env = options.env ?? process.env;
  const envFilePath = options.envFilePath ?? DEFAULT_ENV_FILE_PATH;
  const fileEnv = readEnvFileIfPresent(envFilePath);
  const apiBaseUrl = env.DIDA365_API_BASE_URL ?? fileEnv.DIDA365_API_BASE_URL ?? DEFAULT_API_BASE_URL;

  return {
    token: env.DIDA365_ACCESS_TOKEN ?? fileEnv.DIDA365_ACCESS_TOKEN,
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
    envFilePath,
  };
}

export async function writeDida365Env(options = {}) {
  const envFilePath = options.envFilePath ?? DEFAULT_ENV_FILE_PATH;
  const token = normalizeRequiredValue(options.token, "Token");
  const updates = {
    DIDA365_ACCESS_TOKEN: token,
  };

  if (options.apiBaseUrl) {
    updates.DIDA365_API_BASE_URL = normalizeRequiredValue(options.apiBaseUrl, "API base URL");
  }

  const existing = await readTextIfPresent(envFilePath);
  const lines = existing ? existing.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n") : [];
  const nextLines = upsertEnvLines(lines, updates);

  await mkdir(dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, `${nextLines.join("\n")}\n`, "utf8");
}

function readEnvFileIfPresent(envFilePath) {
  if (!existsSync(envFilePath)) {
    return {};
  }

  return parseEnvFile(readFileSync(envFilePath, "utf8"));
}

async function readTextIfPresent(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

function unquoteEnvValue(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function normalizeRequiredValue(value, label) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${label} cannot be empty`);
  }
  if (/[\r\n]/.test(normalized)) {
    throw new Error(`${label} cannot contain line breaks`);
  }
  return normalized;
}

function upsertEnvLines(lines, updates) {
  const nextLines = [...lines];
  for (const [key, value] of Object.entries(updates)) {
    const newLine = `${key}=${value}`;
    const index = nextLines.findIndex((line) => {
      const trimmed = line.trimStart();
      return trimmed.startsWith(`${key}=`) || trimmed.startsWith(`${key} =`);
    });

    if (index >= 0) {
      nextLines[index] = newLine;
    } else {
      nextLines.push(newLine);
    }
  }

  return nextLines;
}
