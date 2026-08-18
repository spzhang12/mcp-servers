# Claude Code 安装说明

Claude Code 支持本地 `stdio` MCP。本仓库推荐使用 `stdio` 方式。

官方参考：[Claude Code MCP 文档](https://code.claude.com/docs/en/mcp)

## 方式一：CLI 命令，推荐

1. 克隆并初始化本仓库：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure
```

2. 添加 MCP 服务器（路径换成你的真实路径）：

```bash
# 用户级（所有项目可用）
claude mcp add dida365 -s user -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js

# 项目级（仅当前项目，需要在项目目录下执行）
claude mcp add dida365 -s project -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js
```

3. 验证：

```bash
claude mcp list
```

4. 在 Claude Code 中测试：

```text
请使用 dida365 查询我的所有清单。
```

## 方式二：.mcp.json 项目级配置

在项目根目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "dida365": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-servers/dida365-mcp/src/index.js"
      ]
    }
  }
}
```

保存后在 Claude Code 中执行 `/mcp` 查看并允许该服务器，或重启会话。

用户级配置存放在 `~/.claude.json` 的 `mcpServers` 字段中，一般用 `claude mcp add -s user` 维护，不建议手改。

## 常见问题

连接不上：

- 确认 `node -v` 是 18 或更高版本。
- 确认 `npm install` 已执行。
- 确认 `.env` 中有 `DIDA365_ACCESS_TOKEN`，或执行过 `npm run configure`。
- 用绝对路径，不要用 `~` 或相对路径。

看不到工具：

- 执行 `/mcp` 查看服务器状态。
- 重启 Claude Code 会话。
- 检查是否需要在 `/mcp` 中手动允许服务器。

移除服务器：

```bash
claude mcp remove dida365 -s user
```
