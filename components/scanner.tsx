"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import TinyfishLogo from "@/components/tinyfish-logo";
import AxolotlMark from "@/components/axolotl-mark";
import { GithubIcon } from "@/components/github-link";
import TypeArt from "@/components/type-art";
import Axolotl from "@/components/axolotl";
import Report from "@/components/report";
import { GITHUB_URL } from "@/lib/links";
import { PRESETS, SITES, detect, total, verdictOf } from "@/lib/sites";
import { tasksFor, type ScanResult } from "@/lib/scan";
import type { ScanEvent } from "@/app/api/scan/route";

type Phase = "pick" | "address" | "loading" | "results";
type TaskState = "idle" | "queued" | "skip" | "run" | "pass" | "fail";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Low damping so things overshoot and settle, matching the landing page.
const pop = { type: "spring", stiffness: 260, damping: 14 } as const;
const phaseMotion = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.96 },
  transition: pop,
};

function hostOf(u: string) {
  try {
    return new URL(/^https?:\/\//.test(u) ? u : "https://" + u).hostname;
  } catch {
    return null;
  }
}

export default function Scanner() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [sel, setSel] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  // Prefilled from the landing page's URL box (/scan?url=...).
  const params = useSearchParams();
  const [url, setUrl] = useState(() => params.get("url") ?? "");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(0);
  const [host, setHost] = useState("");
  const [status, setStatus] = useState("");
  const [states, setStates] = useState<TaskState[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [num, setNum] = useState(0);
  const [titles, setTitles] = useState<string[]>([]);
  // Latest thing each agent reported doing, shown under its task while it runs.
  const [steps, setSteps] = useState<string[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  // Verified site checks; null while they are still running.
  const [checks, setChecks] = useState<{ label: string; ok: boolean; detail: string }[] | null>(null);
  const [live, setLive] = useState(true);
  // The server replayed a recent scan of this site instead of running agents again.
  const [fromCache, setFromCache] = useState(false);
  const running = useRef(false);

  const detected = sel === "own" && desc.trim().length >= 10 ? detect(desc) : null;
  const key = sel === "own" ? detected || "custom" : sel || "custom";
  const site = SITES[key];
  const canContinue = sel !== null && (sel !== "own" || desc.trim().length >= 10);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // Counts the score up, then reveals the cards and fixes one by one.
  async function reveal(r: ScanResult) {
    setResult(r);
    setNum(0);
    setRevealed(false);
    setPhase("results");
    await sleep(500);
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const f = (t: number) => {
        const p = Math.min(1, (t - t0) / 1600);
        setNum(Math.round(r.score * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(f);
        else done();
      };
      requestAnimationFrame(f);
    });
    await sleep(300);
    setRevealed(true);
  }

  // Replays the bundled sample for this site type (used when the server has no TinyFish key).
  async function replaySample(h: string) {
    setLive(false);
    setTitles(site.tasks.map((t) => t[0]));
    setStates(site.tasks.map(() => "idle"));
    setStatus(`Opening ${h}…`);
    await sleep(1000);
    for (let i = 0; i < site.tasks.length; i++) {
      setStatus(i === 0 ? "Reading the page like an agent would…" : "Trying real tasks…");
      setStates((s) => s.map((v, j) => (j === i ? "run" : v)));
      await sleep(1300);
      setStates((s) => s.map((v, j) => (j === i ? (site.tasks[i][2] ? "pass" : "fail") : v)));
    }
    setStatus("Scoring the results…");
    await sleep(900);
    await reveal({ type: key, tasks: site.tasks, dims: site.dims, fixes: site.fixes, score: total(site) });
  }

  // Runs the TinyFish agents and site checks through /api/scan and follows their progress live.
  async function scan(h: string) {
    if (running.current) return;
    running.current = true;
    setHost(h);
    setPhase("loading");
    const tasks = tasksFor(key);
    setLive(true);
    setFromCache(false);
    setTitles(tasks.map((t) => t.title));
    setStates(tasks.map(() => "queued"));
    setSteps(tasks.map(() => ""));
    setChecks(null);
    setStatus(`Sending agents to ${h}…`);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), type: key, description: sel === "own" ? desc : undefined }),
      });
      if (res.status === 503) {
        await replaySample(h);
        return;
      }
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The scan could not start.");
      }
      // One JSON event per line; a chunk can end mid-line, so keep the remainder.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final: ScanResult | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as ScanEvent;
          if (e.type === "progress") {
            setSteps((s) => s.map((v, j) => (j === e.task ? e.text : v)));
            setStatus(e.text);
          } else if (e.type === "checks") {
            setChecks(e.checks);
          } else if (e.type === "skipped") {
            setStates((s) => s.map((v, j) => (j === e.task ? "skip" : v)));
          } else if (e.type === "started") {
            setStates((s) => s.map((v, j) => (j === e.task && v === "queued" ? "run" : v)));
          } else if (e.type === "task") {
            setStates((s) => s.map((v, j) => (j === e.task ? (e.ok ? "pass" : "fail") : v)));
          } else if (e.type === "result") {
            final = e.result;
            setFromCache(!!e.cached);
          } else if (e.type === "error") {
            throw new Error(e.message);
          }
        }
      }
      if (!final) throw new Error("The scan ended without a result.");
      setStatus("Scoring the results…");
      await sleep(700);
      await reveal(final);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The scan failed.");
      setPhase("address");
    } finally {
      running.current = false;
    }
  }

  function submit() {
    const h = hostOf(url.trim());
    if (!h || !h.includes(".")) {
      setErr("Enter a valid address, like yoursite.com");
      setShake((n) => n + 1);
      return;
    }
    setErr("");
    scan(h);
  }

  function reset() {
    setSel(null);
    setDesc("");
    setUrl("");
    setPhase("pick");
  }

  const C = 2 * Math.PI * 90;
  const score = result?.score ?? 0;
  const shownSite = SITES[result?.type ?? key] ?? site;

  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="brand">
            <AxolotlMark size={26} />
            <span>axolotl</span>
            <span className="x">×</span>
            <TinyfishLogo size={24} />
            <span>tinyfish</span>
          </Link>
          <nav className="topbar-links">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="back">
              <GithubIcon size={15} />
              GitHub
            </a>
            <Link href="/" className="back">← Back to home</Link>
          </nav>
        </div>
      </header>

      <main className="stage">
        <AnimatePresence mode="wait">
          {phase === "pick" && (
            <motion.div key="pick" {...phaseMotion}>
              <h1>
                What kind of site should agents <span>try to use?</span>
              </h1>
              <p className="lede">Choose the closest match so we test the tasks that matter for your site.</p>
              <div className="types">
                {[...PRESETS, "own"].map((k, i) => {
                  const on = sel === k;
                  return (
                    <motion.button
                      key={k}
                      className="type"
                      onClick={() => setSel(on ? null : k)}
                      aria-pressed={on}
                      data-own={k === "own"}
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: on ? 1.04 : 1 }}
                      whileHover={{ y: -6, rotate: i % 2 ? -1.5 : 1.5 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ ...pop, delay: i * 0.05 }}
                    >
                      <motion.span
                        className="type-art"
                        animate={on ? { y: -4, rotate: i % 2 ? 2 : -2 } : { y: 0, rotate: 0 }}
                        transition={pop}
                      >
                        <TypeArt kind={k} />
                      </motion.span>
                      <b>{k === "own" ? "Describe it yourself" : SITES[k].name}</b>
                      <small>{k === "own" ? "Something else? Tell us." : SITES[k].sub}</small>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {sel === "own" && (
                  <motion.div
                    key="own"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={pop}
                    style={{ overflow: "hidden" }}
                  >
                    <textarea
                      className="field"
                      autoFocus
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      aria-label="Describe your website"
                      placeholder="e.g. A marketplace where people book dog walkers, pay deposits and message the walker..."
                    />
                    <p className="hint" aria-live="polite">
                      {desc.trim().length < 10
                        ? ""
                        : detected
                          ? `Looks like a ${SITES[detected].name} site, so we will test those tasks.`
                          : "No clear match, so we will use a general set of tasks."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="actions">
                <motion.button
                  className="btn"
                  disabled={!canContinue}
                  onClick={() => setPhase("address")}
                  animate={canContinue ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "address" && (
            <motion.div key="address" className="address" {...phaseMotion}>
              <h1>Where does it live?</h1>
              <p className="lede">
                {sel === "own"
                  ? `Scanning as ${detected ? "a " + site.name.toLowerCase() + " site" : "a custom project"}: “${desc.trim().slice(0, 90)}”`
                  : `Scanning as a ${site.name.toLowerCase()} site.`}
              </p>
              <motion.input
                key={shake}
                className="field"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                aria-label="Site address"
                aria-invalid={!!err}
                aria-describedby="address-err"
                placeholder="https://yoursite.com"
                animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
                transition={{ duration: 0.4 }}
              />
              <p className="err" id="address-err" role="alert">{err}</p>
              <div className="actions">
                <button className="btn-quiet" onClick={() => setPhase("pick")}>← Back</button>
                <button className="btn" onClick={submit}>Run scan</button>
              </div>
              <p className="fineprint">TinyFish agents will try real tasks on this site, two at a time, and 26 checks will read its files. A scan takes about three to four minutes. The agents never submit, pay, book or sign up.</p>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" {...phaseMotion}>
              <div className="loading-axolotl">
                <Axolotl calm size={230} />
              </div>
              <h2>Sending agents to your site</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={status}
                  className="status"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={pop}
                >
                  {status}
                </motion.p>
              </AnimatePresence>
              <div className="checks">
                {titles.map((title, i) => {
                  const st = states[i] || "idle";
                  return (
                    <motion.div
                      key={title}
                      className="check"
                      data-state={st}
                      animate={st === "run" ? { x: 8 } : { x: 0 }}
                      transition={pop}
                    >
                      <motion.span
                        key={st}
                        className="dot"
                        data-dot={st}
                        initial={st === "pass" || st === "fail" ? { scale: 0 } : false}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 12 }}
                      >
                        {st === "pass" ? "✓" : st === "fail" ? "✕" : ""}
                      </motion.span>
                      <span className="check-text">
                        {title}
                        {live && st === "queued" && <small>Waiting for its turn</small>}
                        {live && st === "skip" && <small>Not run: this server only has time for the main tasks</small>}
                        {live && st === "run" && steps[i] && <small>{steps[i]}</small>}
                      </span>
                    </motion.div>
                  );
                })}
                {live && (
                  <motion.div className="check" data-state={checks ? (checks.every((c) => c.ok) ? "pass" : "done") : "run"} transition={pop}>
                    <motion.span
                      key={checks ? "done" : "run"}
                      className="dot"
                      data-dot={checks ? "pass" : "run"}
                      initial={checks ? { scale: 0 } : false}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 12 }}
                    >
                      {checks ? "✓" : ""}
                    </motion.span>
                    <span className="check-text">
                      Site checks
                      <small>
                        {checks
                          ? `${checks.filter((c) => c.ok).length} of ${checks.length} passed`
                          : "26 checks: robots.txt, structured data, forms, links, content without JavaScript"}
                      </small>
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div key="results" {...phaseMotion}>
              <div className="result-head">
                <motion.div
                  className="ring"
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 10 }}
                >
                  <svg viewBox="0 0 220 220" width="220" height="220">
                    <circle className="track" cx="110" cy="110" r="90" fill="none" strokeWidth="14" />
                    <motion.circle
                      className="fill"
                      cx="110" cy="110" r="90" fill="none" strokeWidth="14" strokeLinecap="round" strokeDasharray={C}
                      initial={{ strokeDashoffset: C }}
                      animate={{ strokeDashoffset: C - (C * score) / 100 }}
                      transition={{ type: "spring", stiffness: 30, damping: 8, delay: 0.5 }}
                    />
                  </svg>
                  <motion.div
                    className="ring-num"
                    animate={revealed ? { scale: [1, 1.25, 0.95, 1] } : {}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {num}
                  </motion.div>
                </motion.div>
                <div className="verdict-wrap">
                  {revealed && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={pop}>
                      <div className="verdict">{verdictOf(score)[0]}</div>
                      <div className="verdict-sub">{verdictOf(score)[1]}</div>
                    </motion.div>
                  )}
                </div>
                <span className="tag">{host} · {shownSite.name}{live ? "" : " · sample"}</span>
              </div>

              {revealed && result && <Report result={result} host={host} fromCache={fromCache} onReset={reset} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
