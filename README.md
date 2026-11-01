# Axolotl × TinyFish

Agent experience optimization: SEO for AI agents. Axolotl sends real [TinyFish](https://tinyfish.ai) web agents to a website, has six of them each attempt a task that matters for that kind of site (booking, e-commerce, SaaS, docs or lead-gen forms), and scores how well they got through on four dimensions: Discoverability, Navigability, Actionability and Reliability. It finishes with a ranked list of fixes.

Agents never submit, pay, book, sign up or type personal details on the sites they test.

This repository is the website (landing page and scanner). The scanner on its own, without the landing page, is at [github.com/git-sd/axolotl](https://github.com/git-sd/axolotl), which is the one to clone if you want to run it yourself.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without a TinyFish key the scanner replays bundled sample results.

## Configuration

Set these in `.env.local` locally, or in your host's environment variables (Vercel: Project → Settings → Environment Variables).

| Variable | Default | Purpose |
| --- | --- | --- |
| `TINYFISH_API_KEY` | none | Enables live scans. Server-only; never sent to the browser. |
| `SCAN_LIMIT_PER_HOUR` | `3` | Scans each visitor (by IP) can start per hour |
| `SCAN_DAILY_BUDGET` | `20` | Scans everyone together can start per day |
| `SCAN_MAX_CONCURRENT` | `3` | Scans running at the same time |
| `SCAN_CACHE_MINUTES` | `60` | Re-scanning the same site within this window reuses the result |
| `SCAN_AGENT_CONCURRENCY` | `2` | Agents running at once within one scan (TinyFish allows 2 per run on the standard plan) |
| `SCAN_AGENT_SECONDS` | `230` | The longest one agent may work before it is stopped |
| `SCAN_TOTAL_SECONDS` | `270` | Time budget for the whole scan (Vercel free plan allows 300) |
| `SCAN_MIN_AGENT_SECONDS` | `110` | The least time worth giving an agent; with the settings above this fits 4 of the 6 tasks, the most important first |

Setting any of the first three limits to `0` pauses live scans. A scan takes about three to four minutes and uses roughly 40 to 80 TinyFish agent steps (about $0.70 to $1.30). Two agents run at a time, and only as many tasks as fit the time are run, most important first; the rest are marked "not run" and left out of the score.

The limits are kept in server memory, so on hosts that run several instances (such as Vercel) each instance counts separately.

## Where things are

- `components/landing.tsx`: landing page, including the Glyph Portal hero
- `components/scanner.tsx`: the scan flow (pick a site type, enter an address, live progress, results)
- `app/api/scan/route.ts`: runs the six TinyFish agents and the site checks, and streams their progress
- `lib/scan.ts`: the tasks per site type, the agents' safety rules, and scoring
- `lib/limits.ts`: rate limits, daily budget and result cache
