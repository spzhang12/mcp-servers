import assert from "node:assert/strict";
import test from "node:test";

import { TOOL_DEFINITIONS, callTool } from "../src/tools.js";

test("MVP exposes the expected Dida365 task and project tools", () => {
  assert.deepEqual(
    TOOL_DEFINITIONS.map((tool) => tool.name),
    [
      "list_projects",
      "get_project_data",
      "filter_tasks",
      "create_task",
      "update_task",
      "complete_task",
      "delete_task",
      "move_task",
      "list_completed_tasks",
      "batch_add_tasks",
      "batch_update_tasks",
      "complete_tasks_in_project",
      "get_comment",
      "add_comment",
      "delete_comment",
      "list_tags",
      "create_tag",
      "get_task",
      "get_project",
      "create_project",
      "update_project",
      "delete_project",
      "list_project_groups",
      "create_project_group",
      "update_project_group",
      "delete_project_group",
      "list_columns",
      "create_column",
      "update_column",
      "get_focus",
      "list_focuses",
      "create_focus",
      "delete_focus",
      "list_countdowns",
      "get_habit",
      "list_habits",
      "create_habit",
      "update_habit",
      "checkin_habit",
      "list_habit_checkins",
    ],
  );
});

test("callTool dispatches complete_task to the API client", async () => {
  let received;
  const client = {
    async completeTask(projectId, taskId) {
      received = { projectId, taskId };
      return { ok: true };
    },
  };

  const result = await callTool(
    "complete_task",
    { projectId: "project-1", taskId: "task-1" },
    client,
  );

  assert.deepEqual(received, { projectId: "project-1", taskId: "task-1" });
  assert.deepEqual(result, { ok: true });
});

test("callTool rejects unknown tool names", async () => {
  await assert.rejects(
    () => callTool("unknown_tool", {}, {}),
    /Unknown Dida365 MCP tool: unknown_tool/,
  );
});

test("callTool dispatches comment and tag tools to the API client", async () => {
  const calls = [];
  const client = {
    async getTaskComments(projectId, taskId) {
      calls.push(["getTaskComments", projectId, taskId]);
      return [];
    },
    async addTaskComment(projectId, taskId, title) {
      calls.push(["addTaskComment", projectId, taskId, title]);
      return { id: "comment-1" };
    },
    async deleteTaskComment(projectId, taskId, commentId) {
      calls.push(["deleteTaskComment", projectId, taskId, commentId]);
      return null;
    },
    async listTags() {
      calls.push(["listTags"]);
      return [];
    },
    async createTag(payload) {
      calls.push(["createTag", payload]);
      return payload;
    },
  };

  await callTool("get_comment", { projectId: "project-1", taskId: "task-1" }, client);
  await callTool("add_comment", { projectId: "project-1", taskId: "task-1", title: "评论" }, client);
  await callTool("delete_comment", { projectId: "project-1", taskId: "task-1", commentId: "comment-1" }, client);
  await callTool("list_tags", {}, client);
  await callTool("create_tag", { name: "urgent", label: "urgent" }, client);

  assert.deepEqual(calls, [
    ["getTaskComments", "project-1", "task-1"],
    ["addTaskComment", "project-1", "task-1", "评论"],
    ["deleteTaskComment", "project-1", "task-1", "comment-1"],
    ["listTags"],
    ["createTag", { name: "urgent", label: "urgent" }],
  ]);
});

test("callTool implements batch task helpers with a max of 20 completions", async () => {
  const calls = [];
  const client = {
    async createTask(payload) {
      calls.push(["createTask", payload.title]);
      return { id: payload.title };
    },
    async updateTask(taskId, payload) {
      calls.push(["updateTask", taskId, payload.title]);
      return { id: taskId };
    },
    async completeTask(projectId, taskId) {
      calls.push(["completeTask", projectId, taskId]);
      return { id: taskId };
    },
  };

  await callTool("batch_add_tasks", { tasks: [{ title: "a" }, { title: "b" }] }, client);
  await callTool("batch_update_tasks", { tasks: [{ taskId: "t1", title: "A" }] }, client);
  await callTool("complete_tasks_in_project", { projectId: "p1", taskIds: ["t1", "t2"] }, client);

  assert.deepEqual(calls, [
    ["createTask", "a"],
    ["createTask", "b"],
    ["updateTask", "t1", "A"],
    ["completeTask", "p1", "t1"],
    ["completeTask", "p1", "t2"],
  ]);

  await assert.rejects(
    () => callTool("complete_tasks_in_project", { projectId: "p1", taskIds: Array.from({ length: 21 }, (_, index) => `t${index}`) }, client),
    /complete_tasks_in_project supports at most 20 tasks/,
  );
});

test("callTool dispatches remaining Open API tools to the API client", async () => {
  const calls = [];
  const client = new Proxy({}, {
    get(_target, property) {
      return async (...args) => {
        calls.push([property, ...args]);
        return { ok: true };
      };
    },
  });

  await callTool("get_task", { projectId: "p1", taskId: "t1" }, client);
  await callTool("get_project", { projectId: "p1" }, client);
  await callTool("create_project", { name: "项目" }, client);
  await callTool("update_project", { projectId: "p1", name: "项目2" }, client);
  await callTool("delete_project", { projectId: "p1" }, client);
  await callTool("list_project_groups", {}, client);
  await callTool("create_project_group", { name: "分组" }, client);
  await callTool("update_project_group", { projectGroupId: "g1", name: "分组2" }, client);
  await callTool("delete_project_group", { projectGroupId: "g1" }, client);
  await callTool("list_columns", { projectId: "p1" }, client);
  await callTool("create_column", { projectId: "p1", name: "待办" }, client);
  await callTool("update_column", { projectId: "p1", columnId: "c1", name: "进行中" }, client);
  await callTool("get_focus", { focusId: "f1", type: 0 }, client);
  await callTool("list_focuses", { type: 1 }, client);
  await callTool("create_focus", { title: "Deep Work" }, client);
  await callTool("delete_focus", { focusId: "f1", type: 0 }, client);
  await callTool("list_countdowns", {}, client);
  await callTool("get_habit", { habitId: "h1" }, client);
  await callTool("list_habits", {}, client);
  await callTool("create_habit", { name: "喝水" }, client);
  await callTool("update_habit", { habitId: "h1", name: "早睡" }, client);
  await callTool("checkin_habit", { habitId: "h1", checkinStamp: "20260709" }, client);
  await callTool("list_habit_checkins", { habitIds: ["h1"], from: "20260401", to: "20260407" }, client);

  assert.deepEqual(calls.map((call) => call[0]), [
    "getTask",
    "getProject",
    "createProject",
    "updateProject",
    "deleteProject",
    "listProjectGroups",
    "createProjectGroup",
    "updateProjectGroup",
    "deleteProjectGroup",
    "listColumns",
    "createColumn",
    "updateColumn",
    "getFocus",
    "listFocuses",
    "createFocus",
    "deleteFocus",
    "listCountdowns",
    "getHabit",
    "listHabits",
    "createHabit",
    "updateHabit",
    "checkinHabit",
    "listHabitCheckins",
  ]);

  assert.deepEqual(calls[3], ["updateProject", "p1", { name: "项目2" }]);
  assert.deepEqual(calls[11], ["updateColumn", "p1", "c1", { name: "进行中" }]);
  assert.deepEqual(calls[12], ["getFocus", "f1", { type: 0 }]);
});
