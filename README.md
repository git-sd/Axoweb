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

Agents never submit, pay, book, sign up or type personal details on the sites they test.

The name "Axolotl" and all three parts are described in the table above; each folder has its own README with details.
