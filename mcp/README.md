# Axolotl MCP server

Lets your coding agent (Claude Code, Codex, Cursor, Gemini CLI, Windsurf, VS Code Copilot) check how well AI agents can use the website you are building, and fix what it finds.

| Tool | Cost | Needs | What it does |
| --- | --- | --- | --- |
| `axolotl_check` | Free, a few seconds | Nothing | Runs the 26 site checks **on your machine** and returns a score, four dimension scores and every failed check with a fix. **Works on `localhost`**, so use it while you build. |
| `axolotl_scan` | Your TinyFish credits (about $1) | `TINYFISH_API_KEY`, `AXOLOTL_URL`, and a **public** address | Full scan: TinyFish web agents try real tasks (find a product, reach checkout, and so on). Takes 3 to 8 minutes. |

`axolotl_check` reads the page's HTML and root files only, so it cannot prove that a task like checkout works. `axolotl_scan` can, but the agents browse from TinyFish's cloud and cannot reach `localhost`: scan a deployed preview or use a tunnel (`npx localtunnel --port 3000`).

## Set up

```bash
cd mcp
npm install
```

That is all `axolotl_check` needs. The bundled checks are already built (`checks.bundle.mjs`). If you change the checks in `../app/lib`, rebuild with `npm run build`.

**Claude Code**

```bash
claude mcp add axolotl -- node /path/to/Axoweb/mcp/server.mjs
```

**Codex** (`~/.codex/config.toml`)

```toml
[mcp_servers.axolotl]
command = "node"
args = ["/path/to/Axoweb/mcp/server.mjs"]
```

**Claude Desktop, Cursor, Gemini CLI and Windsurf** (`mcpServers` in the tool's config)

```json
{
  "mcpServers": {
    "axolotl": {
      "command": "node",
      "args": ["/path/to/Axoweb/mcp/server.mjs"]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`) uses `"servers"` with `"type": "stdio"` added to the entry.

### For full scans, add two environment variables

| Variable | Value |
| --- | --- |
| `TINYFISH_API_KEY` | Your own key from [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys). The scan runs on your TinyFish account. |
| `AXOLOTL_URL` | The address of a running Axolotl website (it drives the agents). The key is sent to that address, so use one you trust, over https. |

For Claude Code: `claude mcp add axolotl --env TINYFISH_API_KEY=... --env AXOLOTL_URL=https://... -- node /path/to/Axoweb/mcp/server.mjs`. In JSON configs add an `"env"` object next to `"args"`.

## Teach your agent when to use it

Claude: copy `skill/SKILL.md` to `~/.claude/skills/axolotl/SKILL.md`. Other tools: paste the contents of `skill/SKILL.md` (without the top block between the `---` lines) into `AGENTS.md`, `GEMINI.md` or your rules file. The skill describes the build loop: check, fix the highest-severity items, check again.

## Limits to know about

- The score is a diagnostic, not a certification. Agent runs vary by a few points between scans, and a few checks (such as `llms.txt`) are forward-looking.
- Page speed is measured from your machine, so that one check can vary run to run.
- Agents never submit forms, pay, book or sign up on the sites they test.
