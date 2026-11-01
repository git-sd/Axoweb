"use client";

// Copy-paste setup for the Axolotl MCP server in the agent tools people actually use, plus the
// short instruction that teaches a model when to reach for it.

import { useState } from "react";
import { ICONS } from "@/lib/brand-icons";

const SERVER = "/path/to/Axoweb/mcp/server.mjs";

const json = (key: "mcpServers" | "servers", extra = "") => `{
  "${key}": {
    "axolotl": {${extra}
      "command": "node",
      "args": ["${SERVER}"]
    }
  }
}`;

// Setup needs no keys: the free check runs on your own machine. Full scans add two variables.
const CLIENTS: { name: string; icon: string; where: string; code: string }[] = [
  {
    name: "Claude Code",
    icon: "claude",
    where: "Run in your terminal",
    code: `claude mcp add axolotl -- node ${SERVER}`,
  },
  { name: "Claude Desktop", icon: "claude", where: "claude_desktop_config.json", code: json("mcpServers") },
  {
    name: "Codex",
    icon: "terminal",
    where: "~/.codex/config.toml",
    code: `[mcp_servers.axolotl]
command = "node"
args = ["${SERVER}"]`,
  },
  { name: "Cursor", icon: "cursor", where: ".cursor/mcp.json", code: json("mcpServers") },
  { name: "VS Code", icon: "copilot", where: ".vscode/mcp.json (Copilot agent mode)", code: json("servers", '\n      "type": "stdio",') },
  { name: "Gemini CLI", icon: "gemini", where: "~/.gemini/settings.json", code: json("mcpServers") },
  { name: "Windsurf", icon: "windsurf", where: "~/.codeium/windsurf/mcp_config.json", code: json("mcpServers") },
];

// What to tell a model so it uses the tools well. Goes in CLAUDE.md, AGENTS.md or a rules file.
const TEACH = `## Axolotl (can AI agents use this website?)
When I am building a website, or ask whether it works for AI agents:
1. Run axolotl_check on the dev address (for example localhost:3000). It is free, instant and works on localhost.
2. Tell me the score and the failed checks with their fixes, highest severity first.
3. Apply the fixes I agree to, then run axolotl_check again and tell me what changed.
4. Run axolotl_scan only if I ask for the full scan. It needs a public address, takes 3-8 minutes and spends my TinyFish credits.
5. A task marked not scored or not run was left out for lack of time. It does not count against the site.`;

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
      <p className="mcp-note">
        No keys are needed for the free check, which also works on localhost. For full scans, add your own TinyFish key as <code>TINYFISH_API_KEY</code> and the address of a running Axolotl as <code>AXOLOTL_URL</code>.
      </p>
      <div className="mcp-bar mcp-teach-bar">
        <span>Teach your agent when to use it: add to CLAUDE.md, AGENTS.md or your rules file</span>
        <CopyButton text={TEACH} />
      </div>
      <pre className="mcp-code">{TEACH}</pre>
    </div>
  );
}
