# Coze / 扣子安装说明

Coze / 扣子基于 MCP 服务创建插件时，需要填写 MCP 工具的 URL 等配置信息，并且插件 URL 要使用 HTTPS 域名地址。因此这里使用本仓库的 `Streamable HTTP` 模式，而不是本地 `stdio` 模式。

官方参考：[扣子：基于 MCP 服务创建插件](https://docs.coze.cn/guides_create_a_plugin_based_on_mcp)

## 整体流程

1. 在本地或服务器上启动 `dida365-mcp` HTTP 服务。
2. 给服务配置访问令牌。
3. 通过 HTTPS 域名暴露 `/mcp`。
4. 在扣子里创建 MCP 类型插件。
5. 填写插件 URL 和 Header。
6. 发布插件，在智能体或工作流里调用。

## 第一步：启动 HTTP MCP 服务

安装并配置：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm install
npm run configure
```

设置 HTTP 访问令牌并启动：

```bash
export DIDA365_MCP_HTTP_AUTH_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

Windows PowerShell：

```powershell
$env:DIDA365_MCP_HTTP_AUTH_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_TOKEN"
npm run start:http -- --host 127.0.0.1 --port 3333 --path /mcp
```

本地地址是：

```text
http://127.0.0.1:3333/mcp
```

## 第二步：变成 HTTPS 地址

扣子要求插件 URL 是 HTTPS 域名地址，不支持直接填写本地 IP。开发测试时可以用隧道工具，生产使用时建议部署到自己的服务器或云服务。

开发测试示例，使用 Cloudflare Tunnel：

```bash
cloudflared tunnel --url http://127.0.0.1:3333
```

它会给你一个类似下面的 HTTPS 地址：

```text
https://example.trycloudflare.com
```

最终 MCP URL 是：

```text
https://example.trycloudflare.com/mcp
```

也可以使用 ngrok、frp、Nginx 反向代理或自己的 HTTPS 服务。生产环境不要长期依赖临时隧道地址。

## 第三步：在扣子创建 MCP 插件

1. 进入扣子工作空间。
2. 打开插件管理或资源管理入口。
3. 创建自定义插件。
4. 类型选择 `MCP`。
5. 插件 URL 填写：

```text
https://example.your-domain.com/mcp
```

6. Header 列表添加：

```text
Authorization: Bearer CHANGE_ME_TO_A_LONG_RANDOM_TOKEN
```

7. 保存并测试工具发现。
8. 发布插件。
9. 在低代码智能体或工作流中选择该插件。

## 服务器部署建议

如果你准备长期维护给自己或团队使用，推荐用服务器部署：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers/dida365-mcp
npm ci
cp .env.example .env
```

编辑 `.env`：

```dotenv
DIDA365_ACCESS_TOKEN=YOUR_DIDA365_API_TOKEN
DIDA365_MCP_HTTP_AUTH_TOKEN=CHANGE_ME_TO_A_LONG_RANDOM_TOKEN
DIDA365_MCP_HTTP_HOST=127.0.0.1
DIDA365_MCP_HTTP_PORT=3333
DIDA365_MCP_HTTP_PATH=/mcp
```

启动：

```bash
npm run start:http
```

然后用 Nginx、Caddy、Cloudflare Tunnel 或其它反向代理把公网 HTTPS 域名转发到：

```text
http://127.0.0.1:3333/mcp
```

## 安全检查清单

- 必须设置 `DIDA365_MCP_HTTP_AUTH_TOKEN`。
- 必须使用 HTTPS。
- 不要把 Dida365 Token 放到扣子的 Header 里，扣子只需要访问你的 MCP 服务。
- Dida365 Token 只保存在 MCP 服务所在机器的 `.env` 或系统环境变量中。
- 如果面向团队使用，建议给 MCP 服务单独部署，避免和其它业务服务混在一起。

## 常见问题

扣子提示 URL 不合法：

- 确认 URL 是 `https://` 开头。
- 确认不是 IP 地址。
- 确认路径包含 `/mcp`。

工具发现失败：

- 确认本地服务还在运行。
- 确认隧道或反向代理还有效。
- 确认 Header 里带了正确的 `Authorization`。

调用工具时报滴答清单鉴权错误：

- 重新执行 `npm run configure`。
- 确认 `.env` 里的 `DIDA365_ACCESS_TOKEN` 没有过期或粘贴错误。
