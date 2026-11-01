"use client";

// Copy-paste setup for the Axolotl MCP server in the agent tools people actually use, plus the
// short instruction that teaches a model when to reach for it.

import { useState } from "react";
import { ICONS } from "@/lib/brand-icons";

const URL_PLACEHOLDER = "https://your-axolotl.app";
const SERVER = "/path/to/axolotl/mcp/server.mjs";

const json = (key: "mcpServers" | "servers", extra = "") => `{
  "${key}": {
    "axolotl": {${extra}
      "command": "node",
      "args": ["${SERVER}"],
      "env": {
        "AXOLOTL_URL": "${URL_PLACEHOLDER}",
        "TINYFISH_API_KEY": "your-tinyfish-key"
      }
    }
  }
}`;

const CLIENTS: { name: string; icon: string; where: string; code: string }[] = [
  {
    name: "Claude Code",
    icon: "claude",
    where: "Run in your terminal",
    code: `claude mcp add axolotl \
  --env AXOLOTL_URL=${URL_PLACEHOLDER} \
  --env TINYFISH_API_KEY=your-tinyfish-key \
  -- node ${SERVER}`,
  },
  { name: "Claude Desktop", icon: "claude", where: "claude_desktop_config.json", code: json("mcpServers") },
  {
    name: "Codex",
    icon: "terminal",
    where: "~/.codex/config.toml",
    code: `[mcp_servers.axolotl]
command = "node"
args = ["${SERVER}"]

[mcp_servers.axolotl.env]
AXOLOTL_URL = "${URL_PLACEHOLDER}"
TINYFISH_API_KEY = "your-tinyfish-key"`,
  },
  { name: "Cursor", icon: "cursor", where: ".cursor/mcp.json", code: json("mcpServers") },
  { name: "VS Code", icon: "copilot", where: ".vscode/mcp.json (Copilot agent mode)", code: json("servers", '\n      "type": "stdio",') },
  { name: "Gemini CLI", icon: "gemini", where: "~/.gemini/settings.json", code: json("mcpServers") },
  { name: "Windsurf", icon: "windsurf", where: "~/.codeium/windsurf/mcp_config.json", code: json("mcpServers") },
];

// What to tell a model so it uses the tools well. Goes in CLAUDE.md, AGENTS.md or a rules file.
const TEACH = `## Axolotl (agent-readiness checks)
When asked whether a website works for AI agents, or to improve it for them:
1. Run axolotl_check on the site first. It is free and takes seconds.
2. Report the score, the four dimension scores and the failed checks with their fixes.
3. Run axolotl_scan only if the user wants proof that real tasks (checkout, booking, sign-up) work.
   It takes 3-4 minutes and spends their TinyFish credits, so ask first.
4. A task marked not scored or not run was left out for lack of time, not counted against the site.`;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // Clipboard blocked: the text is still selectable.
    }
  }
  return (
    <button type="button" className="mcp-copy-btn" onClick={copy}>
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export default function McpInstall() {
  const [i, setI] = useState(0);
  const c = CLIENTS[i];
  return (
    <div className="mcp-install">
      <div className="mcp-tabs" role="tablist" aria-label="Choose your agent">
        {CLIENTS.map((x, k) => (
          <button key={x.name} type="button" role="tab" id={`mcp-tab-${k}`} aria-selected={k === i} aria-controls="mcp-panel" onClick={() => setI(k)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d={ICONS[x.icon]} />
            </svg>
            {x.name}
          </button>
        ))}
      </div>
      <div id="mcp-panel" role="tabpanel" aria-labelledby={`mcp-tab-${i}`}>
        <div className="mcp-bar">
          <span>{c.where}</span>
          <CopyButton text={c.code} />
        </div>
        <pre className="mcp-code">{c.code}</pre>
      </div>
      <div className="mcp-bar mcp-teach-bar">
        <span>Teach your agent when to use it: add to CLAUDE.md, AGENTS.md or your rules file</span>
        <CopyButton text={TEACH} />
      </div>
      <pre className="mcp-code">{TEACH}</pre>
    </div>
  );
}
