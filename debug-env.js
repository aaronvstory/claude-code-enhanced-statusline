#!/usr/bin/env node
console.log(
  JSON.stringify(
    {
      TERM: process.env.TERM,
      COLORTERM: process.env.COLORTERM,
      TERM_PROGRAM: process.env.TERM_PROGRAM,
      CLAUDE_CODE_WINDOWS: process.env.CLAUDE_CODE_WINDOWS,
      PATH_HAS_NODE: process.env.PATH?.includes("nodejs") || false,
      cwd: process.cwd(),
      stdin_isTTY: process.stdin.isTTY,
      stdout_isTTY: process.stdout.isTTY,
    },
    null,
    2,
  ),
);
