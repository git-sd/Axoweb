// Gathers the Next.js standalone server, its static files and the public folder into
// server-bundle/, which Electron runs (and electron-builder ships as resources/server).
import { cpSync, existsSync, rmSync } from "node:fs";

const out = "server-bundle";
if (!existsSync(".next/standalone/server.js")) throw new Error('Run "next build" first (needs output: "standalone").');
rmSync(out, { recursive: true, force: true });
cpSync(".next/standalone", out, { recursive: true });
cpSync(".next/static", `${out}/.next/static`, { recursive: true });
if (existsSync("public")) cpSync("public", `${out}/public`, { recursive: true });
// Never ship a local env file (it could hold a developer's key).
rmSync(`${out}/.env.local`, { force: true });
console.log("server bundle ready");
