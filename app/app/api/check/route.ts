import { runChecks } from "@/lib/checks";
import { checkReport } from "@/lib/check-report";
import { clientIp } from "@/lib/limits";
import { SITES } from "@/lib/sites";

// Free scan: only the site checks (no TinyFish agents, so no credits). The score here covers
// what the checks can see; a full scan adds the agents' verdicts.
export const maxDuration = 60;

const PER_HOUR = Number(process.env.CHECK_LIMIT_PER_HOUR) || 30;
const hits = new Map<string, number[]>();

function normaliseUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".") || /^[\d.]+$/.test(u.hostname) || u.hostname.endsWith(".local")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; type?: unknown };
  const url = normaliseUrl(body.url);
  if (!url) return Response.json({ error: "Enter a valid public address, like yoursite.com" }, { status: 400 });
  const type = typeof body.type === "string" && body.type in SITES ? body.type : "custom";

  const ip = clientIp(req);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= PER_HOUR) return Response.json({ error: "Too many checks from this address. Try again later." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const checks = await runChecks(url, type);
  return Response.json(checkReport(url, type, checks));
}
