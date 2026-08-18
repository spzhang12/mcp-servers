# Codex CLI 安装说明

Codex CLI（CLI 和 IDE 扩展）都支持 MCP 服务器。本仓库推荐使用 `stdio` 方式，简单、稳定，Token 不需要暴露到网络。

官方参考：[Codex MCP 文档](https://developers.openai.com/codex/mcp)

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
codex mcp add dida365 -- node /absolute/path/to/mcp-servers/dida365-mcp/src/index.js
```

3. 验证：

```bash
codex mcp
```

4. 在 Codex 中测试：

```text
请使用 dida365 查询我的所有清单。
```

## 方式二：编辑 config.toml

Codex 的 MCP 配置与其它配置一起存放在 `config.toml` 中：

- 用户级（默认）：`~/.codex/config.toml`
- 项目级（仅受信任的项目）：`.codex/config.toml`

CLI 和 IDE 扩展共享这份配置。在 IDE 扩展中：齿轮菜单 > MCP 设置 > 打开 config.toml。

手动添加：

```toml
[mcp_servers.dida365]
command = "node"
args = ["/absolute/path/to/mcp-servers/dida365-mcp/src/index.js"]
```

如果不想使用仓库里的 `.env`，也可以在 Codex 配置中直接转发环境变量：

```toml
[mcp_servers.dida365]
command = "node"
args = ["/absolute/path/to/mcp-servers/dida365-mcp/src/index.js"]
env_vars = ["DIDA365_ACCESS_TOKEN"]
```

这样 Codex 会从它自己的环境中读取 `DIDA365_ACCESS_TOKEN`。

可选配置项：

```toml
[mcp_servers.dida365]
command = "node"
args = ["/absolute/path/to/mcp-servers/dida365-mcp/src/index.js"]
startup_timeout_sec = 15
tool_timeout_sec = 60
default_tools_approval_mode = "prompt"   # auto / prompt / approve
```

## 常见问题

连接不上：

- 确认 `node -v` 是 18 或更高版本。
- 确认 `npm install` 已执行。
- 确认路径是 `src/index.js` 的绝对路径。
- 终端里执行 `npm run start:stdio`，如果报 Token 错误，先执行 `npm run configure`。

看不到工具：

- 重启 Codex，或在 Codex 中执行 `/mcp` 查看服务器状态。
- 检查 `codex mcp` 输出的状态列。

删除服务器：

```bash
codex mcp remove dida365
```
