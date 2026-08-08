"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sopSchema,
  type GenerateRequest,
  type GenerateResponse,
  type Sop,
} from "@/lib/sop";
import { toMarkdown, toPlainText, slugify } from "@/lib/serialize";
import { examples } from "@/lib/examples";
import InputForm, { type FormState } from "./InputForm";
import ClarifyPanel from "./ClarifyPanel";
import LoadingPanel from "./LoadingPanel";
import ErrorPanel from "./ErrorPanel";
import SopDocument from "./SopDocument";

type Phase = "input" | "loading" | "clarify" | "output" | "error";

const STORAGE_KEY = "bluerook-process-to-sop-v1";
const EMPTY_FORM: FormState = { processName: "", industry: "", description: "" };

interface PersistedDraft {
  form: FormState;
  phase: "input" | "clarify" | "output";
  questions: string[];
  answers: string[];
  sop: Sop | null;
}

function loadDraft(): PersistedDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedDraft;
    if (!data || typeof data !== "object" || !data.form) return null;
    if (data.sop) {
      const parsed = sopSchema.safeParse(data.sop);
      data.sop = parsed.success ? parsed.data : null;
    }
    if (data.phase === "output" && !data.sop) data.phase = "input";
    if (data.phase === "clarify" && !Array.isArray(data.questions)) data.phase = "input";
    return data;
  } catch {
    return null;
  }
}

export default function Tool() {
  const [phase, setPhase] = useState<Phase>("input");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [sop, setSop] = useState<Sop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const lastRequest = useRef<GenerateRequest | null>(null);

  // ── restore draft on mount, persist on change ──────────────────────────
  useEffect(() => {
    // localStorage is only readable on the client, after hydration — the
    // setState-in-effect here is the standard SSR-safe restore pattern.
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(draft.form);
      setQuestions(draft.questions ?? []);
      setAnswers(draft.answers ?? []);
      setSop(draft.sop);
      setPhase(draft.phase);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const persistedPhase: PersistedDraft["phase"] =
      phase === "output" && sop ? "output" : phase === "clarify" ? "clarify" : "input";
    const draft: PersistedDraft = { form, phase: persistedPhase, questions, answers, sop };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // storage full or unavailable — the app still works, just no draft
      }
    }, 300);
    return () => clearTimeout(t);
  }, [hydrated, form, phase, questions, answers, sop]);

  // Clear the "Copied ✓" state after a moment.
  useEffect(() => {
    if (!copiedAll) return;
    const t = setTimeout(() => setCopiedAll(false), 1600);
    return () => clearTimeout(t);
  }, [copiedAll]);

  // "New SOP" asks for a second click; back off after a moment.
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  // ── generation ─────────────────────────────────────────────────────────
  const submitRequest = useCallback(async (payload: GenerateRequest) => {
    lastRequest.current = payload;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong. Please retry.");
      }
      if (data.type === "clarification") {
        setQuestions(data.questions);
        setAnswers(data.questions.map(() => ""));
        setPhase("clarify");
        window.scrollTo({ top: 0 });
        return;
      }
      setSop(data.sop);
      setPhase("output");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error — check your connection and retry."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please retry."
      );
      setPhase("error");
    }
  }, []);

  const basePayload = useCallback(
    (): GenerateRequest => ({
      processName: form.processName.trim(),
      industry: form.industry.trim(),
      description: form.description.trim(),
    }),
    [form]
  );

  const handleSubmit = () => {
    if (form.description.trim().length < 40) {
      setInputError(
        "Please describe the process in a few sentences — who does what, when it starts, and which tools are involved."
      );
      document.getElementById("description")?.focus();
      return;
    }
    setInputError(null);
    void submitRequest(basePayload());
  };

  const handleClarifySubmit = (skip: boolean) => {
    void submitRequest({
      ...basePayload(),
      clarifications: skip
        ? []
        : questions.map((q, i) => ({ question: q, answer: (answers[i] ?? "").trim() })),
      forceGenerate: skip,
    });
  };

  const handleRetry = () => {
    if (lastRequest.current) void submitRequest(lastRequest.current);
    else setPhase("input");
  };

  const handleLoadExample = () => {
    const ex = examples[exampleIndex];
    setForm({
      processName: ex.processName,
      industry: ex.industry,
      description: ex.description,
    });
    setInputError(null);
    setExampleIndex((exampleIndex + 1) % examples.length);
  };

  // ── export actions ─────────────────────────────────────────────────────
  const handleCopyAll = async () => {
    if (!sop) return;
    try {
      await navigator.clipboard.writeText(toPlainText(sop));
      setCopiedAll(true);
    } catch {
      // clipboard blocked — nothing sensible to do
    }
  };

  const handleDownload = () => {
    if (!sop) return;
    const blob = new Blob([toMarkdown(sop)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(sop.processName)}-sop.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (sop && !confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    setForm(EMPTY_FORM);
    setQuestions([]);
    setAnswers([]);
    setSop(null);
    setError(null);
    setInputError(null);
    setPhase("input");
    lastRequest.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  };

  const actionButton =
    "focus-brass border border-line px-4 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-slate uppercase transition-colors hover:border-slate hover:text-paper";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Top navigation ── */}
      <nav className="no-print border-b border-line" aria-label="Main">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-5">
          <a
            href="https://bluerook.co"
            className="focus-brass flex items-baseline gap-2.5 font-display text-2xl font-semibold tracking-tight text-paper"
          >
            <span aria-hidden="true" className="inline-block h-2 w-2 translate-y-[-1px] bg-rook" />
            Bluerook
          </a>
          <a
            href="https://bluerook.co"
            className="eyebrow text-slate underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            bluerook.co →
          </a>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:py-20">
        {phase === "input" && (
          <InputForm
            form={form}
            onChange={(f) => {
              setForm(f);
              if (inputError) setInputError(null);
            }}
            onSubmit={handleSubmit}
            onLoadExample={handleLoadExample}
            exampleLabel={examples[exampleIndex].label}
            error={inputError}
          />
        )}

        {phase === "loading" && <LoadingPanel />}

        {phase === "clarify" && (
          <ClarifyPanel
            questions={questions}
            answers={answers}
            onAnswerChange={(i, v) =>
              setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)))
            }
            onSubmit={() => handleClarifySubmit(false)}
            onSkip={() => handleClarifySubmit(true)}
            onBack={() => setPhase("input")}
          />
        )}

        {phase === "error" && (
          <ErrorPanel message={error ?? "Something went wrong."} onRetry={handleRetry} onBack={() => setPhase("input")} />
        )}

        {phase === "output" && sop && (
          <div>
            {/* Export actions — sticky so they stay in reach on long SOPs */}
            <div className="no-print sticky top-0 z-10 -mx-6 mb-10 border-b border-line bg-midnight px-6 py-3">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2.5">
                <button type="button" onClick={handleCopyAll} className={actionButton}>
                  {copiedAll ? "Copied ✓" : "Copy full SOP"}
                </button>
                <button type="button" onClick={handleDownload} className={actionButton}>
                  Download .md
                </button>
                <button type="button" onClick={() => window.print()} className={actionButton}>
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`focus-brass ml-auto px-2 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] uppercase underline-offset-4 transition-colors hover:underline ${
                    confirmReset ? "text-brass" : "text-slate hover:text-paper"
                  }`}
                >
                  {confirmReset ? "Click again to clear" : "New SOP"}
                </button>
              </div>
            </div>

            <p className="no-print mx-auto mb-8 max-w-3xl font-mono text-xs leading-relaxed text-slate">
              Every field below is editable — click any text to refine it before
              exporting.
            </p>

            <SopDocument sop={sop} onChange={setSop} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="no-print border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="max-w-2xl text-sm leading-relaxed text-slate">
            Documenting a process is the first step. Bluerook helps businesses
            connect, automate and improve the systems around it.{" "}
            <a
              href="https://bluerook.co"
              className="focus-brass text-paper/80 underline underline-offset-4 transition-colors hover:text-brass"
            >
              Talk to Bluerook
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
