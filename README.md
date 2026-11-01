<div align="center">

<pre>
    _    __  __  ___   _       ___   _____  _
   / \   \ \/ / / _ \ | |     / _ \ |_   _|| |
  / _ \   \  / | | | || |    | | | |  | |  | |
 / ___ \  /  \ | |_| || |___ | |_| |  | |  | |___
/_/   \_\/_/\_\ \___/ |_____| \___/   |_|  |_____|
</pre>

<b>AXO: Agent eXperience Optimization</b><br>
SEO for AI agents. Real <a href="https://tinyfish.ai">TinyFish</a> web agents try your site,<br>
then tell you what stopped them, with a score and ranked fixes.

</div>

<h1 align="center"><a href="https://axolotl-eosin.vercel.app">axolotl-eosin.vercel.app</a></h1>
<p align="center"><b>Live website: try Axolotl here</b></p>

# Axolotl

Agent experience optimization: SEO for AI agents. Axolotl sends real [TinyFish](https://tinyfish.ai) web agents to a website, has them try the tasks that matter for that kind of site (booking, e-commerce, SaaS, docs, lead-gen forms), runs 26 free checks on its files and HTML, and scores it out of 100 with ranked fixes.

This repository has three parts:

| Folder | What it is |
| --- | --- |
| [`website/`](website) | The landing page and a browser version of the scanner (Next.js). Deployed on Vercel with **Root Directory** set to `website`. |
| [`app/`](app) | The product as a desktop app (Electron, Windows `.exe`). Asks for your own TinyFish key on first launch and runs scans on your account. |
| [`mcp/`](mcp) | An MCP server so other agents (Claude Code, Codex, Cursor and others) can call Axolotl. Paused for now. |

Also: [`docs/AGENT-PROMPTS.md`](docs/AGENT-PROMPTS.md) explains exactly what each TinyFish agent is told to do and how reports become a score.

## Quick start

Desktop app:

```bash
cd app
npm install
npm run dist
```

Then open `app/dist/win-unpacked/Axolotl.exe`.

Website:

```bash
cd website
npm install
npm run dev
```

Both need Node 18+. Scans need a TinyFish API key from [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys); never commit it.

## Use it from your coding agent (MCP)

The MCP server lets Claude Code, Claude Desktop, Codex, Cursor and other agents check a website while you build it. Two tools:

- **`axolotl_check`**: free, instant, no keys. Runs the 26 site checks on your own machine, so it works on `localhost`. Returns a score, four dimension scores, and every failed check with a fix.
- **`axolotl_scan`**: the full scan. TinyFish web agents try real tasks on a public address (3 to 8 minutes, uses your own TinyFish credits). Needs `TINYFISH_API_KEY` and `AXOLOTL_URL` set for the server.

Set up once:

```bash
git clone https://github.com/git-sd/Axoweb.git
cd Axoweb/mcp
npm install
```

**Claude Code**

```bash
claude mcp add axolotl -- node /path/to/Axoweb/mcp/server.mjs
```

**Claude Desktop** (add to `claude_desktop_config.json`), and the same block works for **Cursor** (`.cursor/mcp.json`), **Gemini CLI** and **Windsurf**:

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

**Codex** (`~/.codex/config.toml`)

```toml
[mcp_servers.axolotl]
command = "node"
args = ["/path/to/Axoweb/mcp/server.mjs"]
```

Then teach your agent the loop (check, fix, check again) with the skill: copy `mcp/skill/SKILL.md` to `~/.claude/skills/axolotl/SKILL.md` for Claude, or paste it into `AGENTS.md` or your rules file for other tools. Try it by asking: "Check localhost:3000 for agent readiness and fix what you find."

Full setup, scan variables and limits are in [`mcp/README.md`](mcp/README.md).

Agents never submit, pay, book, sign up or type personal details on the sites they test.

The name "Axolotl" and all three parts are described in the table above; each folder has its own README with details.
