# dida365-mcp

一个面向国内「滴答清单 / Dida365」账号的通用 [Model Context Protocol](https://modelcontextprotocol.io)（MCP）Server。它调用 Dida365 Open API，把任务、清单、评论、标签、专注、倒计时、习惯等能力暴露给支持 MCP 的 AI Coding Agent——Codex、Claude Code、Cursor、Cline、VS Code、Qoder、Coze / 扣子 等。

当前支持两种传输方式：

- **stdio**：本地进程方式，适合 Codex、Claude Code、Cursor、Cline、VS Code 等本地客户端。
- **Streamable HTTP**：HTTP 端点方式，适合需要 URL 的客户端或平台，例如 Coze / 扣子这类通过 MCP URL 创建插件的场景。

## 功能范围

MCP 工具覆盖 Dida365 Open API 中公开的主要端点，当前共 40 个工具。

任务：

| 工具 | 说明 |
|------|------|
| `list_projects` | 查询所有清单/项目 |
| `get_project_data` | 查询指定清单/项目完整数据 |
| `filter_tasks` | 按条件筛选任务 |
| `get_task` | 查询任务详情 |
| `create_task` | 创建任务 |
| `update_task` | 更新任务 |
| `complete_task` | 完成任务 |
| `delete_task` | 删除任务 |
| `move_task` | 移动任务 |
| `list_completed_tasks` | 查询已完成任务 |
| `batch_add_tasks` | 批量创建任务 |
| `batch_update_tasks` | 批量更新任务 |
| `complete_tasks_in_project` | 批量完成同一清单/项目下任务，每次最多 20 个 |

评论、标签、项目、专注、倒计时和习惯：

| 工具 | 说明 |
|------|------|
| `get_comment` / `add_comment` / `delete_comment` | 任务评论 |
| `list_tags` / `create_tag` | 标签 |
| `get_project` / `create_project` / `update_project` / `delete_project` | 清单/项目 |
| `list_project_groups` / `create_project_group` / `update_project_group` / `delete_project_group` | 清单/项目分组 |
| `list_columns` / `create_column` / `update_column` | 看板列 |
| `get_focus` / `list_focuses` / `create_focus` / `delete_focus` | 专注记录 |
| `list_countdowns` | 倒计时/纪念日 |
| `get_habit` / `list_habits` / `create_habit` / `update_habit` / `checkin_habit` / `list_habit_checkins` | 习惯与打卡 |

官方未公开的高级能力不在本仓库范围内。

## 环境要求

- Node.js 18 或更高版本
- 一个 Dida365 API Token
- 一个支持 MCP 的客户端

## 一分钟安装

克隆本仓库（即 [mcp-servers](https://github.com/spzhang12/mcp-servers)）并运行安装向导：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers
node scripts/install.js
```

安装向导会自动完成 Token 配置和客户端配置写入。

### 手动安装

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure   # 按提示粘贴 DIDA365_ACCESS_TOKEN
```

`npm run configure` 会把 Token 写入本地 `.env`（已被 .gitignore 忽略）。也可以手动复制示例文件：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

然后编辑 `.env`：

```dotenv
DIDA365_ACCESS_TOKEN=YOUR_DIDA365_API_TOKEN
```

## 获取 Dida365 Token

1. 登录网页版滴答清单（dida365.com）。
2. 点击头像。
3. 进入「设置」>「账户与安全」>「API 口令」。
4. 创建并复制 Token。

不要把真实 Token 写进 README、示例配置或 Git 历史。

## 客户端安装

支持命令行一键添加的客户端：

```bash
# Codex CLI
codex mcp add dida365 -- node /绝对路径/mcp-servers/dida365-mcp/src/index.js

# Claude Code
claude mcp add dida365 -- node /绝对路径/mcp-servers/dida365-mcp/src/index.js
```

各客户端详细指南：

- [Codex CLI 安装说明](docs/clients/codex.md)
- [Claude Code 安装说明](docs/clients/claude-code.md)
- [Cursor 安装说明](docs/clients/cursor.md)
- [Cline 安装说明](docs/clients/cline.md)
- [VS Code 安装说明](docs/clients/vscode.md)
- [Coze / 扣子安装说明（HTTP）](docs/clients/coze.md)

可直接使用的 JSON 配置示例见 [examples/](examples/)。

## 配置项

环境变量：

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DIDA365_ACCESS_TOKEN` | 是 | — | Dida365 Open API Bearer Token |
| `DIDA365_API_BASE_URL` | 否 | `https://api.dida365.com` | API 地址 |
| `DIDA365_MCP_HTTP_HOST` | 否 | `127.0.0.1` | HTTP 绑定地址 |
| `DIDA365_MCP_HTTP_PORT` | 否 | `3333` | HTTP 端口 |
| `DIDA365_MCP_HTTP_PATH` | 否 | `/mcp` | HTTP MCP 路径 |
| `DIDA365_MCP_HTTP_AUTH_TOKEN` | 否 | — | HTTP MCP 客户端访问令牌 |

环境变量优先于本地 `.env` 文件。

## HTTP 模式

```bash
npm run start:http
```

默认监听：

```text
http://127.0.0.1:3333/mcp
```

暴露到公网或给 Coze 使用时，请设置访问令牌：

```bash
export DIDA365_MCP_HTTP_AUTH_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

Windows PowerShell：

```powershell
$env:DIDA365_MCP_HTTP_AUTH_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

客户端请求头：

```text
Authorization: Bearer CHANGE_ME_TO_A_LONG_RANDOM_TOKEN
```

## 常用提示词

```text
列出我的所有滴答清单。
```

```text
先查询清单，找到“工作”清单，然后创建任务：今天 18:00 前完成周报，高优先级。
```

```text
查询这周已完成的任务，并按清单汇总。
```

## 安全建议

- 本地 Coding Agent 优先使用 `stdio`，不要把本地服务暴露到公网。
- HTTP 模式只在确实需要 URL 时使用。
- 公开 HTTP 端点必须设置 `DIDA365_MCP_HTTP_AUTH_TOKEN`，并通过 HTTPS 暴露。
- Token 最好只放在 `.env` 或系统环境变量里。
- MCP 工具具备创建、更新、完成、删除任务的能力，使用自动批准前请先确认客户端权限策略。

## 开发

运行测试：

```bash
npm test
```

仓库维护约定见 [docs/maintenance.md](docs/maintenance.md)。

## 许可证

MIT
