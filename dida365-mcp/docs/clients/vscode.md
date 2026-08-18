# VS Code 安装说明

VS Code 通过 MCP 扩展支持 MCP 服务器（stdio 或 Streamable HTTP）。本仓库推荐使用 `stdio` 方式。

官方参考：[VS Code MCP 文档](https://code.visualstudio.com/docs/copilot/mcp)

## 方式一：.vscode/mcp.json 项目级配置，推荐

1. 克隆并初始化本仓库：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure
```

2. 在项目根目录创建 `.vscode/mcp.json`：

```json
{
  "servers": {
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

3. 重启 VS Code，或在命令面板执行 `MCP: List Servers` 查看。

4. 在 VS Code 中测试：

```text
请使用 dida365 查询我的所有清单。
```

## 方式二：用户级配置

让所有项目都能使用：

1. 命令面板执行 `MCP: Open User Configuration`。
2. 在打开的 `mcp.json` 中加入与上面相同的 `servers` 配置。
3. 保存并执行 `MCP: Reload Servers`。

## 常见问题

连接不上：

- 确认 `node -v` 是 18 或更高版本。
- 确认 `npm install` 已执行。
- 确认路径是 `src/index.js` 的绝对路径。
- 终端里执行 `npm run start:stdio`，如果报 Token 错误，先执行 `npm run configure`。

看不到工具：

- 执行 `MCP: List Servers` 检查服务器状态。
- 执行 `MCP: Reload Servers` 重载。
- 查看 MCP 输出面板中的日志。
