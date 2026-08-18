# 仓库维护说明

`dida365-mcp` 是 [mcp-servers](https://github.com/spzhang12/mcp-servers) 集合仓库中的一个独立子模块，保持自包含结构：

```text
mcp-servers/
  README.md               # 集合仓库索引
  README_zh.md
  scripts/install.js      # 跨平台一键安装向导
  dida365-mcp/
    README.md
    README_zh.md
    .env.example
    .gitignore
    package.json
    package-lock.json
    src/
    test/
    docs/
    examples/
```

## 发布前检查

每次提交前执行：

```bash
cd mcp-servers/dida365-mcp
npm install
npm test
```

确认没有提交敏感文件：

```bash
git status --short
git diff -- .env
```

`.env` 不应该出现在 Git 变更中（已被 `.gitignore` 忽略）。

## 推荐提交内容

```text
.env.example
.gitignore
LICENSE
README.md
README_zh.md
package.json
package-lock.json
src/
test/
docs/
examples/
```

不要提交：

```text
.env
node_modules/
npm-debug.log*
```

## 版本升级

升级 MCP SDK：

```bash
npm install @modelcontextprotocol/sdk@latest
npm test
```

升级后重点验证：

- `stdio` 模式能被 Codex / Claude Code / Cursor / Cline 发现工具。
- HTTP 模式能通过 `/mcp` 列出工具。
- HTTP 鉴权仍然能拒绝未带 Bearer Token 的请求。

## 维护原则

- 保持 `src/index.js` 只负责 `stdio`。
- 保持 `src/http.js` 只负责 HTTP 入口。
- 业务能力只放在 `src/tools.js` 和 `src/dida-client.js`。
- 不要在 `stdio` 模式向 stdout 输出日志，否则会破坏 JSON-RPC 通信。
- 新增工具时同步更新 README（中英双语）、测试和客户端提示词示例。
- 新增客户端时，在 `docs/clients/` 增加对应文档，并在两个 README 的客户端列表中登记。
