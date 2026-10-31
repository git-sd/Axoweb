"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

const EXAMPLES = ["yourbookingsite.com", "shop.yourbrand.com", "app.yoursaas.io", "docs.yourproduct.dev", "getaquote.co"];

// Types example addresses into the placeholder one character at a time, then deletes them.
function useTypedPlaceholder(active: boolean) {
  const [text, setText] = useState(EXAMPLES[0]);
  useEffect(() => {
    if (!active) return;
    let word = 0;
    let len = EXAMPLES[0].length;
    let deleting = true;
    let pause = 14;
    const id = window.setInterval(() => {
      if (pause > 0) {
        pause--;
        return;
      }
      const target = EXAMPLES[word];
      if (deleting) {
        len--;
        if (len === 0) {
          deleting = false;
          word = (word + 1) % EXAMPLES.length;
        }
      } else {
        len++;
        if (len === EXAMPLES[word].length) {
          deleting = true;
          pause = 18;
        }
      }
      setText((deleting ? target : EXAMPLES[word]).slice(0, len));
    }, 70);
    return () => window.clearInterval(id);
  }, [active]);
  return text;
}

// Address box that hands off to the scanner with the address prefilled (/scan?url=...).
export default function UrlForm({ onFocusChange }: { onFocusChange?: (focused: boolean) => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const placeholder = useTypedPlaceholder(!focused && url === "");

  const focus = (f: boolean) => {
    setFocused(f);
    onFocusChange?.(f);
  };

  return (
    <form
      className="urlform"
      onSubmit={(e) => {
        e.preventDefault();
        const u = url.trim();
        router.push(u ? `/scan?url=${encodeURIComponent(u)}` : "/scan");
      }}
    >
      <label className="urlform-field">
        <svg className="urlform-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span className="urlform-prefix" aria-hidden="true">https://</span>
        <span className="sr-only">Your site address</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => focus(true)}
          onBlur={() => focus(false)}
          placeholder={focused ? "yoursite.com" : placeholder}
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
        />
      </label>
      <motion.button type="submit" whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        Scan site
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </motion.button>
    </form>
  );
}
