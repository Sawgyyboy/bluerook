"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Mapping the process",
  "Identifying ownership",
  "Checking handoffs",
  "Finding automation opportunities",
];

export default function LoadingPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-6 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="block h-2.5 w-2.5 animate-pulse bg-brass" aria-hidden="true" />
      <p className="font-display text-3xl text-paper italic sm:text-4xl">
        Structuring your process
      </p>
      <p className="eyebrow text-slate">{MESSAGES[index]}…</p>
    </div>
  );
}
