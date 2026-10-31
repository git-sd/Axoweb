# Axolotl × TinyFish

Agent experience optimization: SEO for AI agents. Axolotl sends real [TinyFish](https://tinyfish.ai) web agents to a website, has them attempt three tasks that matter for that kind of site (booking, e-commerce, SaaS, docs or lead-gen forms), and scores how well they got through on four dimensions: Discoverability, Navigability, Actionability and Reliability. It finishes with a ranked list of fixes.

Agents never submit, pay, book, sign up or type personal details on the sites they test.

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
| `SCAN_DAILY_BUDGET` | `40` | Scans everyone together can start per day |
| `SCAN_MAX_CONCURRENT` | `3` | Scans running at the same time |
| `SCAN_CACHE_MINUTES` | `60` | Re-scanning the same site within this window reuses the result |

Setting any of the first three limits to `0` pauses live scans. A scan uses roughly 30 TinyFish agent steps.

The limits are kept in server memory, so on hosts that run several instances (such as Vercel) each instance counts separately.

## Where things are

- `components/landing.tsx`: landing page, including the Glyph Portal hero
- `components/scanner.tsx`: the scan flow (pick a site type, enter an address, live progress, results)
- `app/api/scan/route.ts`: runs the three TinyFish agents and streams their progress
- `lib/scan.ts`: the tasks per site type, the agents' safety rules, and scoring
- `lib/limits.ts`: rate limits, daily budget and result cache
