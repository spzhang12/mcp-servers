import assert from "node:assert/strict";
import test from "node:test";

import { formatToolResult } from "../src/server.js";

test("formatToolResult returns MCP text content with pretty JSON", () => {
  const result = formatToolResult({ id: "task-1", title: "写周报" });

  assert.deepEqual(result, {
    content: [
      {
        type: "text",
        text: '{\n  "id": "task-1",\n  "title": "写周报"\n}',
      },
    ],
  });
});
