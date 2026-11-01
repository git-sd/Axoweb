export const DIMS = ["Discoverability", "Navigability", "Actionability", "Reliability"] as const;

export type Priority = "high" | "med" | "low";
export type SiteType = {
  name: string;
  sub: string;
  w: number[];
  tasks: [string, string, 0 | 1][];
  dims: number[];
  fixes: [Priority, string, string, number][];
};

export const SITES: Record<string, SiteType> = {
  booking: {
    name: "Booking",
    sub: "Hotels, tables, appointments",
    w: [0.2, 0.25, 0.35, 0.2],
    tasks: [
      ["Find availability for 2 guests", "Search with dates and party size", 1],
      ["Compare two options", "Read price, policy and cancellation terms", 1],
      ["Complete a reservation", "Fill guest details and confirm", 0],
    ],
    dims: [82, 70, 38, 64],
    fixes: [
      ["high", "Date picker is a custom canvas widget", "Agents cannot set dates. Add a native input or labelled fields.", 14],
      ["high", "Booking form resets on validation error", "Preserve entered values and expose errors next to each field.", 9],
      ["med", "Cancellation policy hidden behind hover", "Render policy as plain text on the page.", 5],
      ["low", "No structured availability data", "Add schema.org Reservation markup.", 3],
    ],
  },
  shop: {
    name: "E-commerce",
    sub: "Products, cart, checkout",
    w: [0.25, 0.2, 0.35, 0.2],
    tasks: [
      ["Find a product by description", "Use search and filters", 1],
      ["Add item to cart with a size", "Choose a variant and add", 1],
      ["Reach checkout as a guest", "Proceed without an account", 0],
    ],
    dims: [78, 66, 45, 58],
    fixes: [
      ["high", "Guest checkout requires login wall", "Allow checkout without account creation.", 13],
      ["high", "Variant selector uses unlabelled swatches", "Add text labels and aria attributes to size and colour options.", 8],
      ["med", "Price loads after a delay with no marker", "Render price in initial HTML.", 6],
      ["low", "Missing Product schema", "Add price, availability and SKU markup.", 4],
    ],
  },
  saas: {
    name: "SaaS",
    sub: "Trials, pricing, onboarding",
    w: [0.2, 0.2, 0.4, 0.2],
    tasks: [
      ["Find pricing for a team of 10", "Locate plans and compare", 1],
      ["Start a free trial", "Open signup and submit", 1],
      ["Confirm email and reach app", "Complete onboarding", 1],
    ],
    dims: [88, 81, 74, 69],
    fixes: [
      ["med", "Pricing toggle changes content without a URL", "Give monthly and annual views distinct URLs.", 6],
      ["med", "CAPTCHA on signup blocks agents", "Use a risk-based check or offer an API key path.", 6],
      ["low", "Onboarding modal traps focus", "Allow dismissal with a visible button.", 3],
    ],
  },
  docs: {
    name: "Content & docs",
    sub: "Articles, help centres, docs",
    w: [0.4, 0.3, 0.1, 0.2],
    tasks: [
      ["Find an answer to a how-to question", "Use search or navigation", 1],
      ["Follow a link chain to a deep page", "Navigate three levels", 1],
      ["Extract a code sample", "Copy the exact snippet", 1],
    ],
    dims: [85, 90, 70, 86],
    fixes: [
      ["med", "Search results render only after JS hydrates", "Server-render the result list.", 5],
      ["low", "Code blocks lack language labels", "Add class and label for each snippet.", 3],
      ["low", "No sitemap.xml", "Publish a sitemap and link it from robots.txt.", 2],
    ],
  },
  lead: {
    name: "Lead-gen forms",
    sub: "Quotes, contact, applications",
    w: [0.15, 0.2, 0.45, 0.2],
    tasks: [
      ["Find the contact or quote page", "Locate the entry point", 1],
      ["Fill a multi-step quote form", "Complete all steps", 0],
      ["Submit and confirm", "Reach the confirmation", 0],
    ],
    dims: [74, 60, 31, 52],
    fixes: [
      ["high", "Multi-step form hides fields until scroll", "Render all fields in the DOM and label each one.", 16],
      ["high", "Submit button disabled until mouse movement", "Enable on valid input, not on pointer events.", 10],
      ["med", "Confirmation shown only as a toast", "Navigate to a confirmation URL with text.", 5],
      ["low", "Placeholder text used as labels", "Add real label elements.", 3],
    ],
  },
  custom: {
    name: "Custom project",
    sub: "",
    w: [0.25, 0.25, 0.3, 0.2],
    tasks: [
      ["Understand what the site offers", "Read the landing page", 1],
      ["Reach the main goal", "Follow the primary call to action", 1],
      ["Complete the main goal", "Finish the core flow", 0],
    ],
    dims: [80, 68, 52, 62],
    fixes: [
      ["high", "Core action relies on unlabelled controls", "Give every button and field a visible label and accessible name.", 11],
      ["med", "Key content loads only after scripts run", "Include the main content in the initial HTML.", 6],
      ["low", "No structured data describing the site", "Add schema.org markup matching your project.", 3],
    ],
  },
};

export const PRESETS = ["booking", "shop", "saas", "docs", "lead"] as const;

export const KEYS: Record<string, string[]> = {
  booking: ["book", "reserv", "hotel", "appointment", "table", "ticket", "stay", "rental", "schedule", "slot", "dog walker"],
  shop: ["shop", "store", "cart", "checkout", "product", "buy", "sell", "ecommerce", "e-commerce", "retail", "merch", "marketplace"],
  saas: ["saas", "software", "app", "trial", "subscription", "dashboard", "platform", "tool", "sign up", "signup", "api"],
  docs: ["blog", "docs", "documentation", "article", "news", "tutorial", "help centre", "help center", "guide", "wiki", "content"],
  lead: ["quote", "lead", "contact", "enquir", "inquiry", "apply", "application", "consult", "agency", "insurance", "loan", "form"],
};

export function detect(text: string): string | null {
  const t = text.toLowerCase();
  let best: string | null = null;
  let n = 0;
  for (const k in KEYS) {
    const c = KEYS[k].filter((w) => t.includes(w)).length;
    if (c > n) {
      n = c;
      best = k;
    }
  }
  return best;
}

export const total = (s: SiteType) =>
  Math.round(s.dims.reduce((a, v, i) => a + v * s.w[i], 0));

export const verdictOf = (n: number): [string, string] =>
  n >= 80
    ? ["Agent-ready", "Agents complete most tasks without help."]
    : n >= 60
      ? ["Partly usable", "Agents get through, but trip on key steps."]
      : ["Hard for agents", "Agents fail at critical steps."];
