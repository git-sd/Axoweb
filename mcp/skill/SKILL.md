---
name: axolotl
description: Check how well AI agents can use a website, and fix what stops them. Use when the user is building or reviewing a website and asks whether it works for AI agents, wants an agent-readiness score, or wants their site to be easier for agents to find, navigate and complete tasks on (booking, shop, SaaS, docs or lead-gen forms).
---

# Axolotl: is this site usable by AI agents?

This skill needs the Axolotl MCP server (tools `axolotl_check` and `axolotl_scan`). If the tools are missing, tell the user to add the MCP server (see the `mcp/` folder of the Axolotl repo) and stop.

## The two tools

| Tool | Cost | Needs | Use it for |
| --- | --- | --- | --- |
| `axolotl_check` | Free, a few seconds | Nothing. Works on `localhost`. | Every change while building. |
| `axolotl_scan` | The user's own TinyFish credits (about $1), 3 to 8 minutes | A public address, plus `TINYFISH_API_KEY` and `AXOLOTL_URL` set for the MCP server | A full pass before a release, when the user asks. |

## While the user is building (the loop)

1. Ask what kind of site it is if it is not obvious: `booking`, `shop`, `saas`, `docs`, `lead` (lead-gen forms) or `custom`. Use the dev server address, for example `localhost:3000`.
2. Run `axolotl_check`.
3. Tell the user the score and the four dimension scores (Discoverability, Navigability, Actionability, Reliability). Then list the failed checks, highest severity first, each with its fix. Do not list passed checks.
4. Offer to apply the fixes, and apply the ones the user agrees to. Fix in this order: anything that blocks agents entirely (page does not load, CAPTCHA, `robots.txt` blocking agents, content that needs JavaScript), then forms and buttons (labels, names, autocomplete), then navigation and link text, then metadata.
5. Run `axolotl_check` again and report what changed (for example "58 to 81, three fixes landed, two remain"). Stop when the user is happy or only low-severity items remain.

## Before a release (the full scan)

1. Only run `axolotl_scan` if the user asks for it or agrees. Say it takes several minutes and spends their TinyFish credits.
2. It cannot reach `localhost`. If the site is only local, suggest a deployed preview or a tunnel (`npx localtunnel --port 3000`) and scan that address.
3. If the tool says the TinyFish key or `AXOLOTL_URL` is missing, tell the user which variable to set for the MCP server. Never ask them to paste a key into the chat.
4. Report the score, then each task: passed, failed, or not scored. A task marked not scored or not run was left out because of time or a TinyFish error. It is not a mark against the site, so say so.
5. Use the agents' evidence and problem notes to explain failures in plain words, for example "the agent could not find an add-to-basket button because it has no label".

## How to talk about the results

- The score is a diagnostic, not a certification. Say "here is where an agent got stuck", not "your site is 77% agent-ready".
- `axolotl_check` reads only the page's HTML and root files. A high check score does not prove that checkout or booking works. Only a scan, which has real agents try the tasks, can show that.
- Agent runs vary. The same site can score a few points differently between scans.
- Some checks (such as `llms.txt`) are forward-looking: no agent is guaranteed to read them. Treat them as low priority unless the user cares.
- Do not claim the agents submitted anything. They never submit forms, pay, book or sign up.
