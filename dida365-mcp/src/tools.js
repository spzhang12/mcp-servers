function objectSchema(properties = {}, required = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: true,
  };
}

const stringField = (description) => ({ type: "string", description });
const booleanField = (description) => ({ type: "boolean", description });
const integerField = (description) => ({ type: "integer", description });
const arrayField = (description, itemSchema = { type: "string" }) => ({
  type: "array",
  description,
  items: itemSchema,
});
const taskPayloadSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    title: stringField("任务标题。"),
    projectId: stringField("清单/项目 ID。"),
  },
};

export const TOOL_DEFINITIONS = [
  {
    name: "list_projects",
    description: "查询当前滴答清单账号下的所有清单/项目。",
    inputSchema: objectSchema(),
  },
  {
    name: "get_project_data",
    description: "查询指定清单/项目的任务、看板列等完整数据。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
      },
      ["projectId"],
    ),
  },
  {
    name: "filter_tasks",
    description: "按滴答清单 Open API 的筛选条件查询任务。",
    inputSchema: objectSchema({
      projectId: stringField("可选，清单/项目 ID。"),
      startDate: stringField("可选，开始时间，格式示例：2026-07-09T00:00:00+0800。"),
      endDate: stringField("可选，结束时间，格式示例：2026-07-09T23:59:59+0800。"),
      tags: arrayField("可选，标签列表。"),
      status: integerField("可选，任务状态。"),
    }),
  },
  {
    name: "create_task",
    description: "创建任务。至少需要 title 和 projectId。",
    inputSchema: objectSchema(
      {
        title: stringField("任务标题。"),
        projectId: stringField("清单/项目 ID。"),
        content: stringField("任务内容。"),
        desc: stringField("清单型任务描述。"),
        isAllDay: booleanField("是否全天。"),
        startDate: stringField("开始时间，格式示例：2026-07-09T15:00:00+0800。"),
        dueDate: stringField("截止时间，格式示例：2026-07-09T15:00:00+0800。"),
        timeZone: stringField("时区，例如 Asia/Shanghai。"),
        reminders: arrayField("提醒规则列表，例如 TRIGGER:PT0S。"),
        tags: arrayField("标签列表。"),
        repeatFlag: stringField("重复规则，例如 RRULE:FREQ=DAILY;INTERVAL=1。"),
        priority: integerField("优先级，0 为无，1/3/5 可分别表示低/中/高。"),
        sortOrder: integerField("排序值。"),
        items: arrayField("子任务列表。", { type: "object" }),
      },
      ["title", "projectId"],
    ),
  },
  {
    name: "update_task",
    description: "更新任务。taskId 用于路径，projectId 和 title 等字段按 Open API 传入。",
    inputSchema: objectSchema(
      {
        taskId: stringField("任务 ID，用于接口路径。"),
        id: stringField("任务 ID；不传时默认使用 taskId。"),
        projectId: stringField("清单/项目 ID。"),
        title: stringField("任务标题。"),
        content: stringField("任务内容。"),
        desc: stringField("清单型任务描述。"),
        isAllDay: booleanField("是否全天。"),
        startDate: stringField("开始时间。"),
        dueDate: stringField("截止时间。"),
        timeZone: stringField("时区。"),
        reminders: arrayField("提醒规则列表。"),
        tags: arrayField("标签列表。"),
        repeatFlag: stringField("重复规则。"),
        priority: integerField("优先级。"),
        sortOrder: integerField("排序值。"),
        items: arrayField("子任务列表。", { type: "object" }),
      },
      ["taskId", "projectId"],
    ),
  },
  {
    name: "complete_task",
    description: "将指定任务标记为完成。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
      },
      ["projectId", "taskId"],
    ),
  },
  {
    name: "delete_task",
    description: "删除指定任务。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
      },
      ["projectId", "taskId"],
    ),
  },
  {
    name: "move_task",
    description: "移动任务到其他清单/项目或看板列。",
    inputSchema: objectSchema({
      projectId: stringField("当前清单/项目 ID。"),
      taskId: stringField("任务 ID。"),
      toProjectId: stringField("目标清单/项目 ID。"),
      toColumnId: stringField("目标看板列 ID。"),
    }),
  },
  {
    name: "list_completed_tasks",
    description: "查询已完成任务列表。",
    inputSchema: objectSchema({
      projectId: stringField("可选，清单/项目 ID。"),
      from: stringField("可选，开始时间。"),
      to: stringField("可选，结束时间。"),
      limit: integerField("可选，返回数量。"),
    }),
  },
  {
    name: "batch_add_tasks",
    description: "批量创建任务。逐个调用 create_task，返回每个任务的创建结果。",
    inputSchema: objectSchema(
      {
        tasks: arrayField("待创建任务列表。", taskPayloadSchema),
      },
      ["tasks"],
    ),
  },
  {
    name: "batch_update_tasks",
    description: "批量更新任务。每个任务需要 taskId，其他字段按 update_task 传入。",
    inputSchema: objectSchema(
      {
        tasks: arrayField("待更新任务列表。", {
          ...taskPayloadSchema,
          properties: {
            ...taskPayloadSchema.properties,
            taskId: stringField("任务 ID。"),
          },
          required: ["taskId"],
        }),
      },
      ["tasks"],
    ),
  },
  {
    name: "complete_tasks_in_project",
    description: "批量完成同一清单/项目下的多个任务，每次最多 20 个。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskIds: arrayField("任务 ID 列表，每次最多 20 个。"),
      },
      ["projectId", "taskIds"],
    ),
  },
  {
    name: "get_comment",
    description: "获取指定任务下的所有评论。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
      },
      ["projectId", "taskId"],
    ),
  },
  {
    name: "add_comment",
    description: "在指定任务下新增评论。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
        title: stringField("评论内容。"),
      },
      ["projectId", "taskId", "title"],
    ),
  },
  {
    name: "delete_comment",
    description: "删除指定任务下的评论。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
        commentId: stringField("评论 ID。"),
        id: stringField("评论 ID；兼容官方 Open API 的 id 命名。"),
      },
      ["projectId", "taskId"],
    ),
  },
  {
    name: "list_tags",
    description: "列出所有标签。",
    inputSchema: objectSchema(),
  },
  {
    name: "create_tag",
    description: "创建新标签。name 和 label 必填，label 小写后需与 name 一致。",
    inputSchema: objectSchema(
      {
        name: stringField("标签名称，最多 64 字符，小写并去除首尾空格。"),
        label: stringField("标签显示名，最多 64 字符，小写后需与 name 一致。"),
      },
      ["name", "label"],
    ),
  },
  {
    name: "get_task",
    description: "按清单/项目 ID 和任务 ID 查询任务详情。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        taskId: stringField("任务 ID。"),
      },
      ["projectId", "taskId"],
    ),
  },
  {
    name: "get_project",
    description: "按 ID 查询清单/项目详情。",
    inputSchema: objectSchema({ projectId: stringField("清单/项目 ID。") }, ["projectId"]),
  },
  {
    name: "create_project",
    description: "创建清单/项目。",
    inputSchema: objectSchema({
      name: stringField("清单/项目名称。"),
      color: stringField("颜色。"),
      viewMode: stringField("视图模式。"),
      kind: stringField("项目类型。"),
      sortOrder: integerField("排序值。"),
    }),
  },
  {
    name: "update_project",
    description: "更新清单/项目。",
    inputSchema: objectSchema({ projectId: stringField("清单/项目 ID。") }, ["projectId"]),
  },
  {
    name: "delete_project",
    description: "删除清单/项目。",
    inputSchema: objectSchema({ projectId: stringField("清单/项目 ID。") }, ["projectId"]),
  },
  {
    name: "list_project_groups",
    description: "查询所有清单/项目分组。",
    inputSchema: objectSchema(),
  },
  {
    name: "create_project_group",
    description: "创建清单/项目分组。",
    inputSchema: objectSchema({ name: stringField("分组名称。"), sortOrder: integerField("排序值。") }),
  },
  {
    name: "update_project_group",
    description: "更新清单/项目分组。",
    inputSchema: objectSchema({ projectGroupId: stringField("分组 ID。") }, ["projectGroupId"]),
  },
  {
    name: "delete_project_group",
    description: "删除清单/项目分组。",
    inputSchema: objectSchema({ projectGroupId: stringField("分组 ID。") }, ["projectGroupId"]),
  },
  {
    name: "list_columns",
    description: "查询指定看板清单/项目下的列。",
    inputSchema: objectSchema({ projectId: stringField("清单/项目 ID。") }, ["projectId"]),
  },
  {
    name: "create_column",
    description: "在指定清单/项目下创建看板列。",
    inputSchema: objectSchema({ projectId: stringField("清单/项目 ID。"), name: stringField("列名称。") }, ["projectId"]),
  },
  {
    name: "update_column",
    description: "更新指定看板列。",
    inputSchema: objectSchema(
      {
        projectId: stringField("清单/项目 ID。"),
        columnId: stringField("列 ID。"),
        name: stringField("列名称。"),
      },
      ["projectId", "columnId"],
    ),
  },
  {
    name: "get_focus",
    description: "按专注记录 ID 查询专注记录。",
    inputSchema: objectSchema({ focusId: stringField("专注记录 ID。"), type: integerField("专注类型。") }, ["focusId"]),
  },
  {
    name: "list_focuses",
    description: "按时间范围查询专注记录。",
    inputSchema: objectSchema({
      from: stringField("开始时间，格式示例：2026-04-01T00:00:00+0800。"),
      to: stringField("结束时间，格式示例：2026-04-02T00:00:00+0800。"),
      type: integerField("专注类型。"),
    }),
  },
  {
    name: "create_focus",
    description: "创建专注记录。",
    inputSchema: objectSchema({}, []),
  },
  {
    name: "delete_focus",
    description: "删除专注记录。",
    inputSchema: objectSchema({ focusId: stringField("专注记录 ID。"), type: integerField("专注类型。") }, ["focusId"]),
  },
  {
    name: "list_countdowns",
    description: "查询倒计时/纪念日列表。",
    inputSchema: objectSchema(),
  },
  {
    name: "get_habit",
    description: "按习惯 ID 查询习惯详情。",
    inputSchema: objectSchema({ habitId: stringField("习惯 ID。") }, ["habitId"]),
  },
  {
    name: "list_habits",
    description: "查询所有习惯。",
    inputSchema: objectSchema(),
  },
  {
    name: "create_habit",
    description: "创建习惯。",
    inputSchema: objectSchema({}, []),
  },
  {
    name: "update_habit",
    description: "更新习惯。",
    inputSchema: objectSchema({ habitId: stringField("习惯 ID。") }, ["habitId"]),
  },
  {
    name: "checkin_habit",
    description: "创建或更新习惯打卡。",
    inputSchema: objectSchema({ habitId: stringField("习惯 ID。") }, ["habitId"]),
  },
  {
    name: "list_habit_checkins",
    description: "查询习惯打卡记录。",
    inputSchema: objectSchema({
      habitIds: arrayField("习惯 ID 列表，接口会用逗号拼接。"),
      from: stringField("开始日期，格式示例：20260401。"),
      to: stringField("结束日期，格式示例：20260407。"),
    }),
  },
];

export async function callTool(name, args = {}, client) {
  switch (name) {
    case "list_projects":
      return client.listProjects();
    case "get_project_data":
      return client.getProjectData(args.projectId);
    case "filter_tasks":
      return client.filterTasks(args);
    case "create_task":
      return client.createTask(args);
    case "update_task": {
      const { taskId, ...payload } = args;
      return client.updateTask(taskId, { ...payload, id: payload.id ?? taskId });
    }
    case "complete_task":
      return client.completeTask(args.projectId, args.taskId);
    case "delete_task":
      return client.deleteTask(args.projectId, args.taskId);
    case "move_task":
      return client.moveTask(args);
    case "list_completed_tasks":
      return client.listCompletedTasks(args);
    case "batch_add_tasks":
      return Promise.all((args.tasks ?? []).map((task) => client.createTask(task)));
    case "batch_update_tasks":
      return Promise.all((args.tasks ?? []).map((task) => {
        const { taskId, ...payload } = task;
        return client.updateTask(taskId, { ...payload, id: payload.id ?? taskId });
      }));
    case "complete_tasks_in_project": {
      const taskIds = args.taskIds ?? [];
      if (taskIds.length > 20) {
        throw new Error("complete_tasks_in_project supports at most 20 tasks per call");
      }
      return Promise.all(taskIds.map((taskId) => client.completeTask(args.projectId, taskId)));
    }
    case "get_comment":
      return client.getTaskComments(args.projectId, args.taskId);
    case "add_comment":
      return client.addTaskComment(args.projectId, args.taskId, args.title);
    case "delete_comment":
      return client.deleteTaskComment(args.projectId, args.taskId, args.commentId ?? args.id);
    case "list_tags":
      return client.listTags();
    case "create_tag":
      return client.createTag(args);
    case "get_task":
      return client.getTask(args.projectId, args.taskId);
    case "get_project":
      return client.getProject(args.projectId);
    case "create_project":
      return client.createProject(args);
    case "update_project":
      return client.updateProject(args.projectId, omitKeys(args, ["projectId"]));
    case "delete_project":
      return client.deleteProject(args.projectId);
    case "list_project_groups":
      return client.listProjectGroups();
    case "create_project_group":
      return client.createProjectGroup(args);
    case "update_project_group":
      return client.updateProjectGroup(args.projectGroupId, omitKeys(args, ["projectGroupId"]));
    case "delete_project_group":
      return client.deleteProjectGroup(args.projectGroupId);
    case "list_columns":
      return client.listColumns(args.projectId);
    case "create_column":
      return client.createColumn(args.projectId, omitKeys(args, ["projectId"]));
    case "update_column":
      return client.updateColumn(args.projectId, args.columnId, omitKeys(args, ["projectId", "columnId"]));
    case "get_focus":
      return client.getFocus(args.focusId, omitKeys(args, ["focusId"]));
    case "list_focuses":
      return client.listFocuses(args);
    case "create_focus":
      return client.createFocus(args);
    case "delete_focus":
      return client.deleteFocus(args.focusId, omitKeys(args, ["focusId"]));
    case "list_countdowns":
      return client.listCountdowns();
    case "get_habit":
      return client.getHabit(args.habitId);
    case "list_habits":
      return client.listHabits();
    case "create_habit":
      return client.createHabit(args);
    case "update_habit":
      return client.updateHabit(args.habitId, omitKeys(args, ["habitId"]));
    case "checkin_habit":
      return client.checkinHabit(args.habitId, omitKeys(args, ["habitId"]));
    case "list_habit_checkins":
      return client.listHabitCheckins(args);
    default:
      throw new Error(`Unknown Dida365 MCP tool: ${name}`);
  }
}

function omitKeys(source, keys) {
  const omitted = new Set(keys);
  return Object.fromEntries(Object.entries(source).filter(([key]) => !omitted.has(key)));
}
