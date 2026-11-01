"use client";

// A built-in browser wall for a running scan. TinyFish gives every agent a read-only live feed
// made to be embedded; this shows every running agent's feed at once and splits the space
// equally: one agent fills the view, two sit side by side, three or four make a 2 x 2 grid,
// and so on. A pane disappears when its agent finishes and the rest re-split.

type TaskState = "idle" | "queued" | "skip" | "run" | "pass" | "fail";

export default function LiveView({ titles, states, watch }: { titles: string[]; states: TaskState[]; watch: string[] }) {
  const panes = titles.map((title, i) => ({ title, url: watch[i], i })).filter(({ url, i }) => url && states[i] === "run");
  // Columns that make the grid as square as possible: 1 -> 1, 2 -> 2, 3-4 -> 2, 5-9 -> 3.
  const cols = Math.max(1, Math.ceil(Math.sqrt(panes.length)));

  return (
    <section className="live" aria-label="Live view of the agents">
      <div className="live-bar">
        <h3>Live view</h3>
        <span>
          {panes.length === 0
            ? "Waiting for an agent's browser to start. It appears here in a few seconds."
            : `${panes.length} ${panes.length === 1 ? "browser" : "browsers"} open, read-only`}
        </span>
      </div>
      <div className="live-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-count={panes.length}>
        {panes.length === 0 && <div className="live-pane live-empty" />}
        {panes.map(({ title, url, i }) => (
          <figure key={i} className="live-pane">
            <figcaption>
              <span>{title}</span>
              <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${title} in a new tab`}>
                Open
              </a>
            </figcaption>
            <iframe src={url} title={`Live browser: ${title}`} referrerPolicy="no-referrer" allow="fullscreen" />
          </figure>
        ))}
      </div>
    </section>
  );
}
