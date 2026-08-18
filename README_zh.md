# MCP Servers 集合仓库

一个 [Model Context Protocol](https://modelcontextprotocol.io)（MCP）服务器集合，把日常工具接入各种 AI Coding Agent——Codex、Claude Code、Cursor、Cline、VS Code、Qoder 以及任何支持 MCP 的客户端。

每个服务器是仓库下的一个独立子目录，自带完整的 `README`，可以单独使用，也可以用一条命令全部安装。

## 服务器列表

| 服务器 | 说明 | 传输方式 | 工具数 |
|--------|------|---------|--------|
| [dida365-mcp](dida365-mcp/) | [滴答清单](https://dida365.com) MCP：任务、清单、评论、标签、专注、倒计时、习惯 | stdio + Streamable HTTP | 40 |

> 后续会持续新增更多服务器，欢迎 PR 和建议。

## 快速开始

前置条件：

- Node.js 18 或更高版本
- 滴答清单 API Token（获取方式见 [获取 Dida365 Token](dida365-mcp/README_zh.md#获取-dida365-token)）

克隆并运行交互式安装向导：

```bash
git clone https://github.com/spzhang12/mcp-servers.git
cd mcp-servers
node scripts/install.js
```

安装向导会引导你完成：

1. 配置滴答清单 API Token（写入本地 `.env`，不会被提交）。
2. 检测你机器上已安装的客户端（Codex、Claude Code、Cursor、Cline、VS Code）。
3. 为你选择的客户端写入 MCP 配置，修改前自动备份原文件。

也可以手动配置单个客户端：

```bash
# Codex CLI
codex mcp add dida365 -- node /绝对路径/mcp-servers/dida365-mcp/src/index.js

# Claude Code
claude mcp add dida365 -- node /绝对路径/mcp-servers/dida365-mcp/src/index.js
```

各客户端的详细安装指南和完整工具列表见 [dida365-mcp/README_zh.md](dida365-mcp/README_zh.md)。

## 仓库结构

```text
mcp-servers/
  README.md             # 本索引文件
  README_zh.md
  scripts/install.js    # 跨平台安装向导（覆盖所有服务器）
  dida365-mcp/          # 滴答清单 MCP（自包含）
    README.md
    README_zh.md
    src/
    test/
    docs/clients/       # 各客户端安装指南
    examples/           # 可直接使用的客户端配置
```

## 许可证

每个服务器子目录独立授权——参见各自目录内的 `LICENSE` 文件。
