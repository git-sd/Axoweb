#!/usr/bin/env node
// Axolotl MCP server: lets a coding agent check how ready a website is for AI agents while the
// site is being built.
//
//   axolotl_check  free and instant. Runs the 26 site checks right here on your machine, so it
//                  works on localhost and on any site, with no server and no key.
//   axolotl_scan   full scan: TinyFish web agents try real tasks on the site (3-8 minutes, uses
//                  your TinyFish credits). The agents run in TinyFish's cloud, so the site must
//                  be reachable from the internet. Needs AXOLOTL_URL and TINYFISH_API_KEY.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runChecks, checkReport, isLocalHost } from "./checks.bundle.mjs";

const BASE = (process.env.AXOLOTL_URL || "").replace(/\/$/, "");
const KEY = (process.env.TINYFISH_API_KEY || "").trim();
const TYPES = ["booking", "shop", "saas", "docs", "lead", "custom"];

const server = new McpServer({ name: "axolotl", version: "0.2.0" });

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });
const fail = (message) => ({ isError: true, content: [{ type: "text", text: message }] });

// "localhost:3000" and "my-site.dev" both work; local addresses default to http.
function normalise(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `${isLocalHost(trimmed.split(/[/:]/)[0]) ? "http" : "https"}://${trimmed}`;
    const u = new URL(withScheme);
    return /^https?:$/.test(u.protocol) ? u : null;
  } catch {
    return null;
  }
}

const input = {
  url: z.string().describe("Address of the site: a public address like example.com, or a local one like localhost:3000"),
  type: z.enum(TYPES).default("custom").describe("What kind of site: booking, shop, saas, docs, lead (lead-gen forms) or custom"),
};

server.registerTool(
  "axolotl_check",
  {
    title: "Check a site for agent-readiness (free, works on localhost)",
    description:
      "Runs Axolotl's 26 site checks (structured data, headings, form labels, link text, buttons, CAPTCHAs, robots.txt, sitemap, llms.txt, page speed and more) from this machine and returns a score out of 100, four dimension scores, and every failed check with a specific fix. Free and takes a few seconds. Works on localhost and private addresses, so use it while building: run it, apply the fixes, run it again. It reads the page's HTML and root files only; it does not run agents, so it cannot prove a task such as checkout actually works.",
    inputSchema: input,
  },
  async ({ url, type }) => {
    const target = normalise(url);
    if (!target) return fail("That is not a valid address. Try example.com or localhost:3000.");
    try {
      const checks = await runChecks(target.toString(), type);
      const report = checkReport(target.toString(), type, checks);
      const failed = report.checks.filter((c) => c.applicable && !c.passed).length;
      return text({
        ...report,
        summary: `${report.score}/100 for ${target.host}: ${failed} of ${report.checks.filter((c) => c.applicable).length} applicable checks failed.`,
        ran: isLocalHost(target.hostname) ? "locally, on your machine" : "from your machine",
      });
    } catch (e) {
      return fail(`The checks could not run: ${e.message}`);
    }
  },
);

server.registerTool(
  "axolotl_scan",
  {
    title: "Full agent-experience scan (uses your TinyFish credits)",
    description:
      "Sends real TinyFish web agents to the site to attempt the tasks that matter for its type (find a product, reach checkout, and so on), plus the 26 site checks. Returns the score, per-task results with what each agent saw, and ranked fixes. Takes 3 to 8 minutes and costs roughly $1 in the user's own TinyFish credits, so run axolotl_check first and only run this when the user asks for the full scan. The agents browse from TinyFish's cloud, so the site must be reachable from the internet: localhost will not work (use a deployed preview or a tunnel). Needs AXOLOTL_URL and TINYFISH_API_KEY. The agents never submit, pay or sign up.",
    inputSchema: { ...input, description: z.string().optional().describe("For type=custom: what the site is and what visitors should be able to do") },
  },
  async ({ url, type, description }) => {
    const target = normalise(url);
    if (!target) return fail("That is not a valid address. Try example.com.");
    if (isLocalHost(target.hostname)) {
      return fail(
        `${target.host} only exists on this machine, and the agents browse from TinyFish's cloud, so they cannot reach it. Expose it first with a deployed preview (Vercel, Netlify) or a tunnel (npx localtunnel --port 3000, or cloudflared tunnel --url ${target.origin}), then scan that public address. axolotl_check works on localhost without any of this.`,
      );
    }
    if (!KEY) return fail("axolotl_scan needs your TinyFish key. Set TINYFISH_API_KEY in this MCP server's environment (get one at agent.tinyfish.ai/api-keys) and restart it. axolotl_check works without a key.");
    if (!BASE) return fail("axolotl_scan needs a running Axolotl to drive the agents. Set AXOLOTL_URL in this MCP server's environment to your Axolotl website's address, and restart it. axolotl_check works without it.");
    try {
      const res = await fetch(`${BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-TinyFish-Key": KEY },
        body: JSON.stringify({ url: target.toString(), type, description }),
        signal: AbortSignal.timeout(720_000),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        return fail(data.error || `Axolotl at ${BASE} returned ${res.status}`);
      }
      const decoder = new TextDecoder();
      let buffer = "";
      let result = null;
      let error = null;
      for await (const chunk of res.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "result") result = event;
          if (event.type === "error") error = event.message;
        }
      }
      if (result) return text({ cached: !!result.cached, ...result.result });
      return fail(error || "The scan ended without a result.");
    } catch (e) {
      return fail(`The scan failed: ${e.message}. Is AXOLOTL_URL (${BASE}) reachable?`);
    }
  },
);

await server.connect(new StdioServerTransport());
