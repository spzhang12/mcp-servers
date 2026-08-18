import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { Dida365Client } from "../src/dida-client.js";

function jsonResponse(body, options = {}) {
  const status = options.status ?? 200;
  const statusText = options.statusText ?? "OK";
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
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

test("listProjects calls the domestic Dida365 project endpoint with bearer token", async () => {
  const calls = [];
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([{ id: "project-1", name: "工作" }]);
    },
  });

  const result = await client.listProjects();

  assert.deepEqual(result, [{ id: "project-1", name: "工作" }]);
  assert.equal(calls[0].url, "https://api.dida365.com/open/v1/project");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.headers.Authorization, "Bearer token-123");
});

test("createTask posts JSON to the Open API task endpoint", async () => {
  const calls = [];
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ id: "task-1", title: "写周报" });
    },
  });

  const result = await client.createTask({
    projectId: "project-1",
    title: "写周报",
    priority: 1,
  });

  assert.equal(result.id, "task-1");
  assert.equal(calls[0].url, "https://api.dida365.com/open/v1/task");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    projectId: "project-1",
    title: "写周报",
    priority: 1,
  });
});

test("missing access token fails before making API calls", async () => {
  const dir = await mkdtemp(join(tmpdir(), "dida365-missing-token-"));
  const client = new Dida365Client({
    env: {},
    envFilePath: join(dir, ".env"),
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
  });

  await assert.rejects(
    () => client.listProjects(),
    /DIDA365_ACCESS_TOKEN is required/,
  );
});

test("API errors include status and response body", async () => {
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async () => jsonResponse({ error: "bad token" }, { status: 401, statusText: "Unauthorized" }),
  });

  await assert.rejects(
    () => client.listProjects(),
    /Dida365 API request failed: GET \/open\/v1\/project returned 401 Unauthorized: \{"error":"bad token"\}/,
  );
});

test("comment methods call Dida365 task comment endpoints", async () => {
  const calls = [];
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ ok: true });
    },
  });

  await client.getTaskComments("project-1", "task-1");
  await client.addTaskComment("project-1", "task-1", "需要补充附件");
  await client.deleteTaskComment("project-1", "task-1", "comment-1");

  assert.equal(calls[0].url, "https://api.dida365.com/open/v1/project/project-1/task/task-1/comments");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[1].url, "https://api.dida365.com/open/v1/project/project-1/task/task-1/comment");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].init.body), { title: "需要补充附件" });
  assert.equal(calls[2].url, "https://api.dida365.com/open/v1/project/project-1/task/task-1/comment/comment-1");
  assert.equal(calls[2].init.method, "DELETE");
});

test("tag methods call Dida365 tag endpoints", async () => {
  const calls = [];
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ ok: true });
    },
  });

  await client.listTags();
  await client.createTag({ name: "urgent", label: "urgent" });

  assert.equal(calls[0].url, "https://api.dida365.com/open/v1/tag");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[1].url, "https://api.dida365.com/open/v1/tag");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].init.body), { name: "urgent", label: "urgent" });
});

test("remaining Open API methods call project, column, focus, countdown and habit endpoints", async () => {
  const calls = [];
  const client = new Dida365Client({
    token: "token-123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ ok: true });
    },
  });

  await client.getTask("project-1", "task-1");
  await client.getProject("project-1");
  await client.createProject({ name: "新项目" });
  await client.updateProject("project-1", { name: "新名称" });
  await client.deleteProject("project-1");
  await client.listProjectGroups();
  await client.createProjectGroup({ name: "分组" });
  await client.updateProjectGroup("group-1", { name: "新分组" });
  await client.deleteProjectGroup("group-1");
  await client.listColumns("project-1");
  await client.createColumn("project-1", { name: "待办" });
  await client.updateColumn("project-1", "column-1", { name: "进行中" });
  await client.getFocus("focus-1", { type: 0 });
  await client.listFocuses({ from: "2026-04-01T00:00:00+0800", to: "2026-04-02T00:00:00+0800", type: 1 });
  await client.createFocus({ title: "Deep Work" });
  await client.deleteFocus("focus-1", { type: 0 });
  await client.listCountdowns();
  await client.getHabit("habit-1");
  await client.listHabits();
  await client.createHabit({ name: "喝水" });
  await client.updateHabit("habit-1", { name: "早睡" });
  await client.checkinHabit("habit-1", { checkinStamp: "20260709" });
  await client.listHabitCheckins({ habitIds: ["habit-1", "habit-2"], from: "20260401", to: "20260407" });

  assert.equal(new URL(calls[0].url).pathname, "/open/v1/project/project-1/task/task-1");
  assert.equal(new URL(calls[1].url).pathname, "/open/v1/project/project-1");
  assert.equal(calls[2].url, "https://api.dida365.com/open/v1/project");
  assert.equal(calls[2].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[2].init.body), { name: "新项目" });
  assert.equal(new URL(calls[3].url).pathname, "/open/v1/project/project-1");
  assert.equal(calls[3].init.method, "POST");
  assert.equal(new URL(calls[4].url).pathname, "/open/v1/project/project-1");
  assert.equal(calls[4].init.method, "DELETE");
  assert.equal(calls[5].url, "https://api.dida365.com/open/v1/project/group");
  assert.equal(new URL(calls[8].url).pathname, "/open/v1/project/group/group-1");
  assert.equal(calls[8].init.method, "DELETE");
  assert.equal(new URL(calls[9].url).pathname, "/open/v1/project/project-1/column");
  assert.equal(new URL(calls[11].url).pathname, "/open/v1/project/project-1/column/column-1");
  assert.equal(new URL(calls[12].url).pathname, "/open/v1/focus/focus-1");
  assert.equal(new URL(calls[12].url).searchParams.get("type"), "0");
  assert.equal(new URL(calls[13].url).pathname, "/open/v1/focus");
  assert.equal(new URL(calls[13].url).searchParams.get("type"), "1");
  assert.equal(new URL(calls[15].url).pathname, "/open/v1/focus/focus-1");
  assert.equal(new URL(calls[16].url).pathname, "/open/v1/countdown");
  assert.equal(new URL(calls[17].url).pathname, "/open/v1/habit/habit-1");
  assert.equal(new URL(calls[18].url).pathname, "/open/v1/habit");
  assert.equal(calls[19].init.method, "POST");
  assert.equal(new URL(calls[21].url).pathname, "/open/v1/habit/habit-1/checkin");
  assert.equal(new URL(calls[22].url).pathname, "/open/v1/habit/checkins");
  assert.equal(new URL(calls[22].url).searchParams.get("habitIds"), "habit-1,habit-2");
});
