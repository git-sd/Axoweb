// Turns the verified site checks into the numbers people see: a score out of 100, a score per
// dimension, and each check with its fix. Used by the free /api/check route and by the MCP
// server, so both give the same answer for the same site.

import { DIMS, SITES } from "@/lib/sites";
import type { Check } from "@/lib/checks";

export function checkReport(url: string, type: string, checks: Check[]) {
  const t = type in SITES ? type : "custom";
  const w = SITES[t].w;
  // Each dimension is the weighted share of its applicable checks that pass; a dimension with
  // nothing applicable counts as full marks.
  const dims = DIMS.map((_, d) => {
    const mine = checks.filter((c) => c.dim === d && c.weight > 0);
    const total = mine.reduce((a, c) => a + c.weight, 0);
    return total ? Math.round((mine.filter((c) => c.ok).reduce((a, c) => a + c.weight, 0) / total) * 100) : 100;
  });
  // When the page itself would not load, only the root files were checked and the rest counts as
  // full marks, which would flatter a dead site. Cap it at about what a full scan gives one.
  const unreachable = checks.some((c) => c.id === "fetch");
  const raw = Math.round(dims.reduce((a, v, i) => a + v * w[i], 0));
  const score = unreachable ? Math.min(raw, 15) : raw;
  return {
    url,
    type: t,
    score,
    scope: "site checks only (no agents run)",
    ...(unreachable ? { warning: "The page did not load for an automated visitor, so most checks could not run." } : {}),
    dimensions: DIMS.map((name, i) => ({ name, score: dims[i], weight: w[i] })),
    checks: checks.map((c) => ({
      label: c.label,
      dimension: DIMS[c.dim],
      applicable: c.weight > 0,
      passed: c.ok,
      detail: c.detail,
      ...(c.weight > 0 && !c.ok ? { severity: c.severity, fix: c.fix } : {}),
    })),
  };
}
