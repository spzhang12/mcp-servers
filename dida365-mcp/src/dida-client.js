import { readDida365Config } from "./config.js";

export class Dida365Client {
  constructor(options = {}) {
    const config = readDida365Config({
      env: options.env,
      envFilePath: options.envFilePath,
    });

    this.token = options.token ?? config.token;
    this.baseUrl = (options.baseUrl ?? config.apiBaseUrl).replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  async listProjects() {
    return this.#request("GET", "/open/v1/project");
  }

  async getTask(projectId, taskId) {
    return this.#request("GET", `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}`);
  }

  async getProject(projectId) {
    return this.#request("GET", `/open/v1/project/${encodeURIComponent(projectId)}`);
  }

  async getProjectData(projectId) {
    return this.#request("GET", `/open/v1/project/${encodeURIComponent(projectId)}/data`);
  }

  async createProject(payload) {
    return this.#request("POST", "/open/v1/project", { body: payload });
  }

  async updateProject(projectId, payload) {
    return this.#request("POST", `/open/v1/project/${encodeURIComponent(projectId)}`, { body: payload });
  }

  async deleteProject(projectId) {
    return this.#request("DELETE", `/open/v1/project/${encodeURIComponent(projectId)}`);
  }

  async listProjectGroups() {
    return this.#request("GET", "/open/v1/project/group");
  }

  async createProjectGroup(payload) {
    return this.#request("POST", "/open/v1/project/group", { body: payload });
  }

  async updateProjectGroup(projectGroupId, payload) {
    return this.#request("POST", `/open/v1/project/group/${encodeURIComponent(projectGroupId)}`, { body: payload });
  }

  async deleteProjectGroup(projectGroupId) {
    return this.#request("DELETE", `/open/v1/project/group/${encodeURIComponent(projectGroupId)}`);
  }

  async listColumns(projectId) {
    return this.#request("GET", `/open/v1/project/${encodeURIComponent(projectId)}/column`);
  }

  async createColumn(projectId, payload) {
    return this.#request("POST", `/open/v1/project/${encodeURIComponent(projectId)}/column`, { body: payload });
  }

  async updateColumn(projectId, columnId, payload) {
    return this.#request(
      "POST",
      `/open/v1/project/${encodeURIComponent(projectId)}/column/${encodeURIComponent(columnId)}`,
      { body: payload },
    );
  }

  async filterTasks(payload) {
    return this.#request("POST", "/open/v1/task/filter", { body: payload });
  }

  async createTask(payload) {
    return this.#request("POST", "/open/v1/task", { body: payload });
  }

  async updateTask(taskId, payload) {
    return this.#request("POST", `/open/v1/task/${encodeURIComponent(taskId)}`, { body: payload });
  }

  async completeTask(projectId, taskId) {
    return this.#request(
      "POST",
      `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/complete`,
    );
  }

  async deleteTask(projectId, taskId) {
    return this.#request(
      "DELETE",
      `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}`,
    );
  }

  async moveTask(payload) {
    return this.#request("POST", "/open/v1/task/move", { body: payload });
  }

  async listCompletedTasks(payload) {
    return this.#request("POST", "/open/v1/task/completed", { body: payload });
  }

  async getTaskComments(projectId, taskId) {
    return this.#request(
      "GET",
      `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/comments`,
    );
  }

  async addTaskComment(projectId, taskId, title) {
    return this.#request(
      "POST",
      `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/comment`,
      { body: { title } },
    );
  }

  async deleteTaskComment(projectId, taskId, commentId) {
    return this.#request(
      "DELETE",
      `/open/v1/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/comment/${encodeURIComponent(commentId)}`,
    );
  }

  async listTags() {
    return this.#request("GET", "/open/v1/tag");
  }

  async createTag(payload) {
    return this.#request("POST", "/open/v1/tag", { body: payload });
  }

  async getFocus(focusId, query = {}) {
    return this.#request("GET", `/open/v1/focus/${encodeURIComponent(focusId)}`, { query });
  }

  async listFocuses(query = {}) {
    return this.#request("GET", "/open/v1/focus", { query });
  }

  async createFocus(payload) {
    return this.#request("POST", "/open/v1/focus", { body: payload });
  }

  async deleteFocus(focusId, query = {}) {
    return this.#request("DELETE", `/open/v1/focus/${encodeURIComponent(focusId)}`, { query });
  }

  async listCountdowns() {
    return this.#request("GET", "/open/v1/countdown");
  }

  async getHabit(habitId) {
    return this.#request("GET", `/open/v1/habit/${encodeURIComponent(habitId)}`);
  }

  async listHabits() {
    return this.#request("GET", "/open/v1/habit");
  }

  async createHabit(payload) {
    return this.#request("POST", "/open/v1/habit", { body: payload });
  }

  async updateHabit(habitId, payload) {
    return this.#request("POST", `/open/v1/habit/${encodeURIComponent(habitId)}`, { body: payload });
  }

  async checkinHabit(habitId, payload) {
    return this.#request("POST", `/open/v1/habit/${encodeURIComponent(habitId)}/checkin`, { body: payload });
  }

  async listHabitCheckins(query = {}) {
    return this.#request("GET", "/open/v1/habit/checkins", { query });
  }

  async #request(method, path, options = {}) {
    if (!this.token) {
      throw new Error("DIDA365_ACCESS_TOKEN is required to call Dida365 Open API");
    }
    if (!this.fetchImpl) {
      throw new Error("A fetch implementation is required to call Dida365 Open API");
    }

    const url = `${this.baseUrl}${path}${formatQuery(options.query)}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
    };
    const init = { method, headers };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(url, init);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Dida365 API request failed: ${method} ${path} returned ${response.status} ${response.statusText}: ${text}`,
      );
    }

    if (!text) {
      return null;
    }

    const contentType = response.headers?.get?.("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return JSON.parse(text);
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

function formatQuery(query = {}) {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }

  return `?${params.toString()}`;
}
