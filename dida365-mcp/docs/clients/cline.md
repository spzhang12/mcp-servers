# Cline 安装说明

Cline 支持本地 `stdio` MCP，也支持远程 `Streamable HTTP`。这个仓库推荐本地使用 `stdio`。

官方参考：[Cline MCP 文档](https://docs.cline.bot/mcp/mcp-overview)

## 方式一：通过 Cline 面板配置，推荐

1. 克隆并初始化本仓库：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure
```

2. 打开 VS Code / Cursor 中的 Cline 面板。

3. 点击顶部的 MCP Servers 图标。

4. 进入 `Configure`。

5. 点击 `Configure MCP Servers`。

6. 在打开的 JSON 文件中加入：

```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": [
        "D:/path/to/mcp-servers/dida365-mcp/src/index.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

如果你已经有其它 MCP Server，只需要把 `"dida365": { ... }` 这一段加到原来的 `mcpServers` 里面。

7. 保存配置并重启 MCP Server。

8. 在 Cline 中测试：

```text
请使用 dida365 查询我的所有清单。
```

## 方式二：Cline CLI 向导

Cline CLI 可以通过向导添加 MCP：

```bash
cline mcp
```

按向导选择：

- Action：`Add server`
- Server name：`dida365`
- Transport：`stdio`
- Command：`node`
- Args：`D:/path/to/mcp-servers/dida365-mcp/src/index.js`

## 配置文件位置

Cline CLI 常见配置路径：

```text
~/.cline/mcp.json
```

IDE 扩展请优先从 Cline 面板里的 `Configure MCP Servers` 打开配置文件，因为不同安装方式的实际路径可能不同。

## HTTP 模式

先启动 HTTP MCP 服务：

```bash
cd mcp-servers/dida365-mcp
export DIDA365_MCP_HTTP_AUTH_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http
```

Cline 远程配置示例：

```json
{
  "mcpServers": {
    "dida365": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:3333/mcp",
      "headers": {
        "Authorization": "Bearer CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

如果是远程部署，请把 `url` 换成 HTTPS 地址。

## 常见问题

Server won't connect：

- 确认命令是 `node`，参数是 `src/index.js` 的绝对路径。
- 确认 `npm install` 已执行。
- 确认 `.env` 中有 `DIDA365_ACCESS_TOKEN`。

Missing tools：

- 保存配置后重启 MCP Server。
- 检查 Cline MCP 面板里的状态。

Auth errors：

- 重新执行 `npm run configure`。
- 确认没有把 `DIDA365_ACCESS_TOKEN=` 留空。
