# Cursor 安装说明

Cursor 支持 `stdio`、`SSE` 和 `Streamable HTTP` 三类 MCP 传输。这个仓库推荐在 Cursor 本地使用 `stdio`，简单、稳定，也不用把滴答清单 Token 暴露到网络。

官方参考：[Cursor MCP 文档](https://cursor.com/docs/mcp)

## 方式一：项目级配置，推荐

适合把这个 MCP 仓库作为某个项目里的工具一起维护。

1. 克隆并初始化本仓库：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure
```

2. 在你的项目根目录创建文件：

```text
.cursor/mcp.json
```

3. 写入配置。把路径替换成你的真实路径：

```json
{
  "mcpServers": {
    "dida365": {
      "type": "stdio",
      "command": "node",
      "args": [
        "D:/path/to/mcp-servers/dida365-mcp/src/index.js"
      ]
    }
  }
}
```

如果你不想使用仓库里的 `.env`，也可以在 Cursor 配置里直接传环境变量：

```json
{
  "mcpServers": {
    "dida365": {
      "type": "stdio",
      "command": "node",
      "args": [
        "D:/path/to/mcp-servers/dida365-mcp/src/index.js"
      ],
      "env": {
        "DIDA365_ACCESS_TOKEN": "${env:DIDA365_ACCESS_TOKEN}"
      }
    }
  }
}
```

4. 重启 Cursor，或在 Cursor 的 MCP 设置页刷新服务。

5. 在 Cursor 里测试：

```text
请使用 dida365 查询我的所有清单。
```

## 方式二：全局配置

适合让所有 Cursor 项目都能使用滴答清单 MCP。

Windows 路径：

```text
%USERPROFILE%\.cursor\mcp.json
```

macOS / Linux 路径：

```text
~/.cursor/mcp.json
```

配置内容与项目级配置相同。

## 方式三：HTTP 模式

只有在你需要把 MCP 服务部署成 URL 时才使用。先启动 HTTP 服务：

```bash
cd mcp-servers/dida365-mcp
export DIDA365_MCP_HTTP_AUTH_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http
```

Windows PowerShell：

```powershell
cd mcp-servers/dida365-mcp
$env:DIDA365_MCP_HTTP_AUTH_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http
```

Cursor 配置：

```json
{
  "mcpServers": {
    "dida365": {
      "url": "http://127.0.0.1:3333/mcp",
      "headers": {
        "Authorization": "Bearer CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
      }
    }
  }
}
```

如果是远程部署，请把 `url` 换成 HTTPS 地址。

## 常见问题

连接不上：

- 确认 `node -v` 是 18 或更高版本。
- 确认 `npm install` 已执行。
- 确认 `D:/path/to/mcp-servers/dida365-mcp/src/index.js` 是真实路径。
- 在终端里执行 `npm run start:stdio`，如果报 Token 错误，先执行 `npm run configure`。

看不到工具：

- 重启 Cursor。
- 打开 Cursor 输出面板，查看 MCP 日志。
- 确认 JSON 没有尾逗号和注释。
