// What the MCP server needs from the app's own code: the same checks and the same scoring the
// website and desktop app use. `npm run build` bundles this into checks.bundle.mjs.
export { runChecks, isLocalHost } from "../app/lib/checks";
export { checkReport } from "../app/lib/check-report";
