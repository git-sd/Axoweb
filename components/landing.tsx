"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { nunito } from "@/lib/fonts";
import GlyphPortal, { type GlyphPortalStyle } from "@/components/ui/glyph-portal";
import TinyfishLogo from "@/components/tinyfish-logo";
import AxolotlMark from "@/components/axolotl-mark";
import { DIMS } from "@/lib/sites";
import UrlForm from "@/components/url-form";
import Axolotl from "@/components/axolotl";
import InstallLine, { GithubIcon } from "@/components/github-link";
import { GITHUB_URL } from "@/lib/links";

const TASKS = [
  "Book a table for four",
  "Add the medium to cart",
  "Start a free trial",
  "Find the refund policy",
  "Request a quote",
  "Check out as a guest",
  "Compare two plans",
  "Reserve a room for Friday",
];

// Axolotl palette: dark pond water, pale pink body, coral gills.
const theme: GlyphPortalStyle = {
  "--gp-paper": "#0c0d10",
  "--gp-ink": "#f6dcd8",
  "--gp-field": "#ee7f95",
  "--gp-foreground": "#3a0f1f",
};

// Rows of agent tasks behind the word. They show through the letters at first, then fill
// the screen once the camera is inside, so the scroll before the copy arrives is not empty.
function TaskWall() {
  const rows = Array.from({ length: 9 }, (_, i) => {
    const shift = i % TASKS.length;
    return [...TASKS.slice(shift), ...TASKS.slice(0, shift)].join("  ·  ");
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--gp-field)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "1.2vh",
        transform: "scale(var(--gp-field-scale,1))",
      }}
    >
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            whiteSpace: "nowrap",
            fontWeight: 900,
            fontSize: "clamp(28px,6.5vh,64px)",
            lineHeight: 1,
            color: "#e46d86",
            marginLeft: `${-(i % 3) * 12}vw`,
            opacity: "var(--axo-wall,1)",
          }}
        >
          {row}
        </div>
      ))}
    </div>
  );
}

const PILLARS: [string, string][] = [
  ["Discoverability", "Can an agent find what it came for?"],
  ["Navigability", "Can it get from page to page without getting lost?"],
  ["Actionability", "Can it fill the form, pick the option, press the button?"],
  ["Reliability", "Does it work the same way every time?"],
];

const rise = { out: { opacity: 0, y: 40 }, in: { opacity: 1, y: 0 } };

// What the camera lands on: the pitch and a URL box up top, the four scored dimensions
// along the bottom, filling one screen. Everything springs in once the camera has landed.
function HeroPanel({ landed }: { landed: boolean }) {
  const state = landed ? "in" : "out";
  return (
    <div
      style={{
        // The portal pads its content by clamp(32px,7%,100px) of its width; 7vw matches that.
        minHeight: "calc(var(--gp-height,100svh) - 2 * clamp(32px,7vw,100px))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 48,
        maxWidth: 1100,
        width: "100%",
        // Grid item: allow shrinking below the URL box's intrinsic width on phones.
        minWidth: 0,
        margin: "0 auto",
      }}
    >
      <div />
      <div style={{ textAlign: "center" }}>
        <motion.h1
          style={{ margin: "0 0 28px", fontSize: "clamp(32px,5vw,60px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-.02em", textWrap: "balance" }}
          initial="out"
          animate={state}
          variants={{ out: { opacity: 0, y: 50, scale: 0.85, rotate: -2 }, in: { opacity: 1, y: 0, scale: 1, rotate: 0 } }}
          transition={{ type: "spring", stiffness: 240, damping: 11 }}
        >
          Can an AI agent actually use your website?
        </motion.h1>
        <motion.p
          style={{ maxWidth: "46ch", margin: "0 auto 40px", fontSize: 18, lineHeight: 1.65 }}
          initial="out"
          animate={state}
          variants={rise}
          transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.1 }}
        >
          People now ask agents to book, buy and sign up for them. Axolotl sends real agents to your site, scores how well they get through, and tells you exactly what to fix.
        </motion.p>
        <motion.div
          initial="out"
          animate={state}
          variants={{ out: { opacity: 0, y: 30, scale: 0.8 }, in: { opacity: 1, y: 0, scale: 1 } }}
          transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.2 }}
        >
          <UrlForm />
        </motion.div>
        <motion.p
          style={{ margin: "18px 0 0", fontSize: 14 }}
          initial="out"
          animate={state}
          variants={{ out: { opacity: 0 }, in: { opacity: 1 } }}
          transition={{ delay: 0.35 }}
        >
          <InstallLine />
        </motion.p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 24, textAlign: "left" }}>
        {PILLARS.map(([name, line], i) => (
          <motion.div
            key={name}
            style={{ borderTop: "1.5px solid rgba(58,15,31,.3)", paddingTop: 14 }}
            initial="out"
            animate={state}
            variants={rise}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.3 + i * 0.08 }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, marginBottom: 6 }}>0{i + 1}</div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.85 }}>{line}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Fade the task wall out gradually over the back half of the zoom, gone by the time the
// copy settles. Runs every scroll frame, so it writes a CSS variable instead of React state.
function fadeWall(p: number) {
  const t = Math.min(1, Math.max(0, (p - 0.5) / 0.42));
  document.documentElement.style.setProperty("--axo-wall", String(1 - t * t * (3 - 2 * t)));
}

// Drop the portal's caption (scroll hint and enter link); scrolling is the only way in.
const heroCss = `[data-axo-hero] [data-gp-caption]{display:none;}`;

function Hero() {
  // The portal freezes its face on mount, so wait for Nunito before mounting it.
  const [face, setFace] = useState<string | null>(null);
  // Flips as the copy fades in (and back on the way out), so its bounce replays each visit.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = (value: string) => {
      if (!done) {
        done = true;
        setFace(value);
      }
    };
    // Skip next/font's generated "Nunito Fallback" face: the portal treats any face
    // that is not loaded as pending and turns its scroll motion off.
    const family = `${nunito.style.fontFamily.split(",")[0]}, Arial, sans-serif`;
    const timeout = window.setTimeout(() => finish("Arial, sans-serif"), 1600);
    document.fonts
      .load(`900 100px ${family}`, "AXOLOTL")
      .then(() => finish(family), () => finish("Arial, sans-serif"));
    return () => {
      done = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!face) return <div style={{ height: "100svh", background: "#0c0d10" }} />;

  return (
    <div data-axo-hero>
    <style>{heroCss}</style>
    <GlyphPortal
      word="AXOLOTL"
      fontFamily={face}
      fontWeight={900}
      scrollLength={2}
      onProgress={(p) => {
        fadeWall(p);
        setLanded(p > 0.8);
      }}
      style={{ ...theme, fontFamily: face }}
      background={<TaskWall />}
      front={
        <>
          <div style={{ position: "absolute", inset: "24px 24px auto", display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 18 }}>
            <AxolotlMark size={30} />
            <span>axolotl</span>
            <span style={{ opacity: 0.6, fontWeight: 600 }}>×</span>
            <TinyfishLogo size={28} />
            <span>tinyfish</span>
          </div>
          <p style={{ position: "absolute", inset: "auto 24px calc(100% - var(--gp-word-top,35%) + 28px)", margin: 0, textAlign: "center", fontSize: 13 }}>
            Agent experience optimization
          </p>
          <p style={{ position: "absolute", inset: "calc(var(--gp-word-bottom,50%) + 28px) 24px auto", margin: 0, textAlign: "center", fontSize: 16 }}>
            Is your site ready for AI agents?
          </p>
          <HeroFloaters />
        </>
      }
    >
      <HeroPanel landed={landed} />
    </GlyphPortal>
    </div>
  );
}

// Task results scattered around the word in the opening frame, like a scan in progress.
// `top` is placed relative to the word (--gp-word-top / --gp-word-bottom, set by the portal).
const FLOATERS: { label: string; ok: boolean; top: string; side: "left" | "right"; at: string; tilt: number; wide?: boolean }[] = [
  { label: "Book a table for four", ok: true, top: "calc(var(--gp-word-top,35%) * .42)", side: "left", at: "9%", tilt: -4 },
  { label: "Find the refund policy", ok: true, top: "calc(var(--gp-word-top,35%) * .3)", side: "right", at: "26%", tilt: 3, wide: true },
  { label: "Check out as a guest", ok: false, top: "calc(var(--gp-word-top,35%) * .6)", side: "right", at: "8%", tilt: 5 },
  { label: "Add the medium to cart", ok: true, top: "calc(var(--gp-word-bottom,60%) + 96px)", side: "left", at: "11%", tilt: 4 },
  { label: "Submit the quote form", ok: false, top: "calc(var(--gp-word-bottom,60%) + 130px)", side: "right", at: "10%", tilt: -3, wide: true },
];

function HeroFloaters() {
  return (
    <>
      {FLOATERS.map((f, i) => (
        <motion.div
          key={f.label}
          className={f.wide ? "hero-chip wide-only" : "hero-chip"}
          style={{ top: f.top, [f.side]: f.at }}
          initial={{ opacity: 0, scale: 0.4, rotate: f.tilt * 3 }}
          animate={{ opacity: 1, scale: 1, rotate: f.tilt }}
          transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.4 + i * 0.12 }}
        >
          <motion.span
            className="hero-chip-inner"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="hero-chip-dot" data-ok={f.ok}>{f.ok ? "✓" : "✕"}</span>
            {f.label}
          </motion.span>
        </motion.div>
      ))}
      <div className="hero-cue">
        <span>Scroll to dive in</span>
        <motion.span
          aria-hidden="true"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          ↓
        </motion.span>
      </div>
      <div className="hero-cue right">Real agents, powered by TinyFish</div>
      <motion.div
        className="hero-peek"
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 11, delay: 1 }}
      >
        <Axolotl size={190} />
      </motion.div>
    </>
  );
}

// Low damping so things overshoot and settle: the bounce is the point.
const pop = { type: "spring", stiffness: 260, damping: 14 } as const;
const inView = { once: true, margin: "-80px" } as const;

function Heading({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <>
      {eyebrow && (
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={pop}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        className="h2"
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={inView}
        transition={{ ...pop, delay: 0.06 }}
      >
        {children}
      </motion.h2>
    </>
  );
}

function ScoreCard() {
  const demo = [82, 70, 38, 64];
  const score = 60;
  const C = 2 * Math.PI * 54;
  return (
    <motion.div
      className="card sample-card"
      initial={{ opacity: 0, y: 60, rotate: 6, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      whileHover={{ rotate: -1.5, scale: 1.03, y: -6 }}
      viewport={inView}
      transition={pop}
    >
      <div className="card-top">
        <span>yourbookingsite.com</span>
        <span className="tag">sample</span>
      </div>
      <div className="score-row">
        <div className="ring" style={{ width: 128, height: 128 }}>
          <svg viewBox="0 0 128 128" width="128" height="128">
            <circle className="track" cx="64" cy="64" r="54" fill="none" strokeWidth="10" />
            <motion.circle
              className="fill"
              cx="64" cy="64" r="54" fill="none" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              whileInView={{ strokeDashoffset: C - (C * score) / 100 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 40, damping: 9, delay: 0.3 }}
            />
          </svg>
          <motion.div
            className="ring-num"
            style={{ fontSize: 40 }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.5 }}
          >
            {score}
          </motion.div>
        </div>
        <div>
          <div className="verdict">Partly usable</div>
          <div className="verdict-sub">Agents get through, but trip on key steps.</div>
        </div>
      </div>
      {DIMS.map((d, i) => (
        <div className="dim" key={d}>
          <div className="dim-head">
            <span>{d}</span>
            <span>{demo[i]}</span>
          </div>
          <div className="bar">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${demo[i]}%` }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 70, damping: 9, delay: 0.4 + i * 0.12 }}
            />
          </div>
        </div>
      ))}
      <motion.div
        className="fix"
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ ...pop, delay: 1.1 }}
      >
        <motion.span
          className="pri"
          data-priority="high"
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 0.6, delay: 1.6, repeat: Infinity, repeatDelay: 3 }}
        >
          HIGH
        </motion.span>
        <div>
          <b>Date picker is a custom widget</b>
          <span className="why">Agents cannot set dates.</span>
          <em>+14 pts</em>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Tasks() {
  // Doubled so the strip can loop seamlessly at -50%.
  const items = [...TASKS, ...TASKS];
  return (
    <section className="strip" aria-label="Tasks agents are tested on">
      <ul className="strip-track">
        {items.map((t, i) => (
          <li key={i} aria-hidden={i >= TASKS.length}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

// Each step shows a tiny version of what actually happens in the product.
function StepPick() {
  return (
    <div className="mini-chips">
      {["Booking", "Shop", "SaaS", "Docs"].map((t, i) => (
        <span key={t} className="mini-chip" data-on={i === 0}>
          {t}
        </span>
      ))}
    </div>
  );
}

function StepAddress() {
  return (
    <div className="mini-url">
      <span className="mini-url-text">yoursite.com</span>
      <span className="mini-caret" aria-hidden="true" />
    </div>
  );
}

function StepAgents() {
  const rows: [string, boolean][] = [
    ["Find a table", true],
    ["Pick a time", true],
    ["Confirm booking", false],
  ];
  return (
    <ul className="mini-checks">
      {rows.map(([t, ok], i) => (
        <motion.li
          key={t}
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ ...pop, delay: 0.5 + i * 0.35 }}
        >
          <span className="mini-dot" data-ok={ok}>{ok ? "✓" : "✕"}</span>
          {t}
        </motion.li>
      ))}
    </ul>
  );
}

function StepScore() {
  const C = 2 * Math.PI * 30;
  return (
    <div className="mini-score">
      <svg viewBox="0 0 76 76" width="76" height="76">
        <circle cx="38" cy="38" r="30" fill="none" strokeWidth="8" stroke="rgba(58,15,31,.18)" />
        <motion.circle
          cx="38" cy="38" r="30" fill="none" strokeWidth="8" strokeLinecap="round" stroke="#3a0f1f"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          whileInView={{ strokeDashoffset: C * 0.4 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 40, damping: 9, delay: 0.9 }}
        />
      </svg>
      <span>60</span>
    </div>
  );
}

const STEPS: [string, string, () => React.ReactElement][] = [
  ["Describe your site", "Pick booking, e-commerce, SaaS, docs or forms, or describe it. That decides which tasks we test.", StepPick],
  ["Enter the address", "Just the URL. Nothing to install, no code to add.", StepAddress],
  ["Agents try it", "TinyFish web agents attempt three real tasks, the way a customer's agent would.", StepAgents],
  ["Get your score", "What worked, what broke, and the fixes worth the most points.", StepScore],
];

function How() {
  return (
    <section id="how" className="section">
      <div className="wrap">
        <Heading eyebrow="How it works">Four steps from address to answer.</Heading>
        <ol className="journey">
          <li className="journey-track" aria-hidden="true">
            <motion.span
              className="journey-agent"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
            />
          </li>
          {STEPS.map(([t, d, Visual], i) => (
            <motion.li
              className="journey-step"
              key={t}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ ...pop, delay: i * 0.12 }}
            >
              <motion.div
                className="journey-tile"
                whileHover={{ y: -6, rotate: i % 2 ? 1.5 : -1.5 }}
                transition={pop}
              >
                <Visual />
              </motion.div>
              <div className="journey-no">0{i + 1}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Get() {
  const items = [
    ["A score out of 100", "One number for how agent-friendly your site is, with a plain verdict."],
    ["Four dimensions", "Discoverability, Navigability, Actionability and Reliability."],
    ["Task by task", "Pass or fail for every job the agents tried."],
    ["Ranked fixes", "Every problem, ordered by how many points fixing it earns you."],
  ];
  return (
    <section id="get" className="section">
      <div className="wrap">
        <Heading eyebrow="What you get">Not a vague report. A to-do list.</Heading>
        <div className="get">
          <ul className="get-list">
            {items.map(([t, d], i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: 10 }}
                viewport={inView}
                transition={{ ...pop, delay: i * 0.08 }}
              >
                <h3>{t}</h3>
                <p>{d}</p>
              </motion.li>
            ))}
          </ul>
          <ScoreCard />
        </div>
      </div>
    </section>
  );
}

function Cta() {
  const [typing, setTyping] = useState(false);
  return (
    <section className="cta">
      <div className="wrap">
        <motion.div
          className="cta-axolotl"
          initial={{ opacity: 0, y: 80, rotate: -12 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={inView}
          transition={{ type: "spring", stiffness: 180, damping: 10 }}
        >
          <Axolotl excited={typing} size={300} />
        </motion.div>
        <motion.h2
          className="h2"
          initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={inView}
          transition={{ type: "spring", stiffness: 220, damping: 11 }}
        >
          Your next customer might be an agent. Find out if it gets in.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ ...pop, delay: 0.15 }}
        >
          <UrlForm onFocusChange={setTyping} />
          <p className="cta-install">
            <InstallLine />
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <main>
        <Hero />
        <Tasks />
        <How />
        <Get />
        <Cta />
      </main>
      <footer className="footer">
        <span>axolotl × tinyfish · Prototype. Scans are bundled samples and do not call TinyFish yet.</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="gh-link">
          <GithubIcon size={15} />
          GitHub
        </a>
      </footer>
    </MotionConfig>
  );
}
