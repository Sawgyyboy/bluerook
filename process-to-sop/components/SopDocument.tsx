"use client";

import { useEffect, useState } from "react";
import type { Sop } from "@/lib/sop";
import { sectionToText, sectionTitles, type SectionId } from "@/lib/serialize";
import Editable from "./Editable";

interface SopDocumentProps {
  sop: Sop;
  onChange: (sop: Sop) => void;
}

const COMPLEXITY_CYCLE = { low: "medium", medium: "high", high: "low" } as const;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] tracking-[0.2em] text-ink/50 uppercase">
      {children}
    </span>
  );
}

interface SectionProps {
  id: SectionId;
  n: string;
  copied: boolean;
  onCopy: (id: SectionId) => void;
  children: React.ReactNode;
}

function Section({ id, n, copied, onCopy, children }: SectionProps) {
  return (
    <section className="sop-section mt-12 border-t border-ink/15 pt-8" aria-label={sectionTitles[id]}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-3">
          <span className="font-mono text-[0.6875rem] tracking-[0.22em] text-ink/45">{n}</span>
          <span className="font-display text-[1.7rem] leading-tight font-medium tracking-tight">
            {sectionTitles[id]}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => onCopy(id)}
          className="no-print shrink-0 font-mono text-[0.6875rem] tracking-[0.18em] text-ink/45 uppercase underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline focus-visible:outline-none"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function SopDocument({ sop, onChange }: SopDocumentProps) {
  const [copiedSection, setCopiedSection] = useState<SectionId | null>(null);

  // Clear the "Copied ✓" state after a moment.
  useEffect(() => {
    if (copiedSection === null) return;
    const t = setTimeout(() => setCopiedSection(null), 1600);
    return () => clearTimeout(t);
  }, [copiedSection]);

  const copySection = async (id: SectionId) => {
    const text = `${sectionTitles[id].toUpperCase()}\n\n${sectionToText(sop, id)}`;
    if (await copyText(text)) setCopiedSection(id);
  };

  // ── field setters ──────────────────────────────────────────────────────
  const set = (patch: Partial<Sop>) => onChange({ ...sop, ...patch });

  const setItem = <K extends "assumptions" | "qualityChecks">(
    key: K,
    i: number,
    value: string
  ) => {
    const list = [...sop[key]];
    list[i] = value;
    set({ [key]: list } as Partial<Sop>);
  };

  const setRow = <
    K extends "roles" | "steps" | "decisions" | "failurePoints" | "metrics" | "automationOpportunities"
  >(
    key: K,
    i: number,
    patch: Partial<Sop[K][number]>
  ) => {
    const list = sop[key].map((row, idx) => (idx === i ? { ...row, ...patch } : row)) as Sop[K];
    set({ [key]: list } as Partial<Sop>);
  };

  const setInputItem = (group: keyof Sop["inputs"], i: number, value: string) => {
    const items = [...sop.inputs[group]];
    items[i] = value;
    set({ inputs: { ...sop.inputs, [group]: items } });
  };

  // ── section numbering (skips empty, hidden sections) ──────────────────
  const visibleSections: SectionId[] = ["overview", "roles", "inputs", "steps"];
  if (sop.decisions.length > 0) visibleSections.push("decisions");
  if (sop.qualityChecks.length > 0) visibleSections.push("quality");
  if (sop.failurePoints.length > 0) visibleSections.push("failures");
  if (sop.metrics.length > 0) visibleSections.push("metrics");
  if (sop.automationOpportunities.length > 0) visibleSections.push("automation");

  const sectionProps = (id: SectionId): Omit<SectionProps, "children"> => ({
    id,
    n: String(visibleSections.indexOf(id) + 1).padStart(2, "0"),
    copied: copiedSection === id,
    onCopy: copySection,
  });

  const inputGroups: Array<[keyof Sop["inputs"], string]> = [
    ["information", "Information"],
    ["tools", "Tools"],
    ["access", "Access"],
    ["documents", "Documents"],
  ];

  return (
    <article className="sop-paper mx-auto w-full max-w-3xl bg-paper px-6 py-12 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:px-12 sm:py-16">
      {/* ── Document header ── */}
      <header>
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
          <span className="font-mono text-[0.6875rem] tracking-[0.22em] text-ink/60 uppercase">
            Standard Operating Procedure
          </span>
          <span className="font-mono text-[0.6875rem] tracking-[0.22em] text-ink/40 uppercase">
            Bluerook · Field Tool
          </span>
        </div>
        <Editable
          as="h1"
          value={sop.processName}
          onCommit={(v) => set({ processName: v })}
          label="Process name"
          className="focus-brass mt-8 font-display text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl"
        />
      </header>

      {/* 01 · Process overview */}
      <Section {...sectionProps("overview")}>
        <dl className="space-y-5">
          {(
            [
              ["Objective", "objective"],
              ["Trigger", "trigger"],
              ["Complete when", "completionCondition"],
            ] as Array<[string, "objective" | "trigger" | "completionCondition"]>
          ).map(([label, key]) => (
            <div key={key} className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="pt-0.5">
                <MonoLabel>{label}</MonoLabel>
              </dt>
              <dd>
                <Editable
                  value={sop[key]}
                  onCommit={(v) => set({ [key]: v } as Partial<Sop>)}
                  label={label}
                  as="div"
                  multiline
                  className="text-[0.9375rem] leading-relaxed"
                />
              </dd>
            </div>
          ))}
        </dl>

        {sop.assumptions.length > 0 && (
          <div className="mt-8 border-l-2 border-brass pl-5">
            <MonoLabel>Assumptions — confirm before use</MonoLabel>
            <ul className="mt-3 space-y-2">
              {sop.assumptions.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink/80">
                  <span aria-hidden="true" className="text-brass">
                    ▪
                  </span>
                  <Editable
                    value={a}
                    onCommit={(v) => setItem("assumptions", i, v)}
                    label={`Assumption ${i + 1}`}
                    as="div"
                    multiline
                    className="flex-1"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* 02 · Roles and ownership */}
      <Section {...sectionProps("roles")}>
        <div className="space-y-6">
          {sop.roles.map((r, i) => (
            <div key={i} className="grid gap-2 border-b border-ink/10 pb-6 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <Editable
                value={r.role}
                onCommit={(v) => setRow("roles", i, { role: v })}
                label={`Role ${i + 1} name`}
                as="div"
                className="text-[0.9375rem] leading-relaxed font-semibold"
              />
              <div className="space-y-1.5">
                <Editable
                  value={r.responsibility}
                  onCommit={(v) => setRow("roles", i, { responsibility: v })}
                  label={`Role ${i + 1} responsibility`}
                  as="div"
                  multiline
                  className="text-[0.9375rem] leading-relaxed"
                />
                <div className="flex gap-2.5">
                  <MonoLabel>Hands off</MonoLabel>
                  <Editable
                    value={r.handoffPoint}
                    onCommit={(v) => setRow("roles", i, { handoffPoint: v })}
                    label={`Role ${i + 1} handoff point`}
                    as="div"
                    multiline
                    className="flex-1 text-sm leading-relaxed text-ink/70"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 03 · Required inputs */}
      <Section {...sectionProps("inputs")}>
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {inputGroups.map(([group, label]) =>
            sop.inputs[group].length > 0 ? (
              <div key={group}>
                <MonoLabel>{label}</MonoLabel>
                <ul className="mt-2.5 space-y-1.5">
                  {sop.inputs[group].map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-relaxed">
                      <span aria-hidden="true" className="text-ink/35">
                        —
                      </span>
                      <Editable
                        value={item}
                        onCommit={(v) => setInputItem(group, i, v)}
                        label={`${label} item ${i + 1}`}
                        as="div"
                        multiline
                        className="flex-1"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      </Section>

      {/* 04 · Step-by-step procedure */}
      <Section {...sectionProps("steps")}>
        <ol className="space-y-8">
          {sop.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[2.75rem_1fr] gap-4 sm:gap-6">
              <span
                aria-hidden="true"
                className="font-display text-3xl leading-none font-medium text-ink/30 tabular-nums"
              >
                {s.number}
              </span>
              <div>
                <Editable
                  value={s.action}
                  onCommit={(v) => setRow("steps", i, { action: v })}
                  label={`Step ${s.number} action`}
                  as="h3"
                  multiline
                  className="text-[0.9375rem] leading-relaxed font-semibold"
                />
                <div className="mt-3 grid gap-x-8 gap-y-2 border-l border-ink/15 pl-4 sm:grid-cols-3">
                  {(
                    [
                      ["Owner", "owner"],
                      ["Input", "input"],
                      ["Output", "output"],
                    ] as Array<[string, "owner" | "input" | "output"]>
                  ).map(([label, key]) => (
                    <div key={key}>
                      <MonoLabel>{label}</MonoLabel>
                      <Editable
                        value={s[key]}
                        onCommit={(v) => setRow("steps", i, { [key]: v })}
                        label={`Step ${s.number} ${label.toLowerCase()}`}
                        as="div"
                        multiline
                        className="mt-1 text-sm leading-relaxed text-ink/80"
                      />
                    </div>
                  ))}
                </div>
                {s.notes !== "" && (
                  <div className="mt-2.5 flex gap-2.5 pl-4">
                    <MonoLabel>Note</MonoLabel>
                    <Editable
                      value={s.notes}
                      onCommit={(v) => setRow("steps", i, { notes: v })}
                      label={`Step ${s.number} notes`}
                      as="div"
                      multiline
                      className="flex-1 text-sm leading-relaxed text-ink/70 italic"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 05 · Decision points */}
      {sop.decisions.length > 0 && (
        <Section {...sectionProps("decisions")}>
          <div className="space-y-7">
            {sop.decisions.map((d, i) => (
              <div key={i}>
                <div className="flex gap-2.5">
                  <MonoLabel>If</MonoLabel>
                  <Editable
                    value={d.condition}
                    onCommit={(v) => setRow("decisions", i, { condition: v })}
                    label={`Decision ${i + 1} condition`}
                    as="div"
                    multiline
                    className="flex-1 text-[0.9375rem] leading-relaxed font-semibold"
                  />
                </div>
                <div className="mt-3 grid gap-3 border-l border-ink/15 pl-4 sm:grid-cols-2 sm:gap-8">
                  <div className="flex gap-2.5">
                    <span className="font-mono text-[0.625rem] tracking-[0.2em] text-ink uppercase">
                      Yes →
                    </span>
                    <Editable
                      value={d.yesAction}
                      onCommit={(v) => setRow("decisions", i, { yesAction: v })}
                      label={`Decision ${i + 1}, if yes`}
                      as="div"
                      multiline
                      className="flex-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <span className="font-mono text-[0.625rem] tracking-[0.2em] text-ink/50 uppercase">
                      No →
                    </span>
                    <Editable
                      value={d.noAction}
                      onCommit={(v) => setRow("decisions", i, { noAction: v })}
                      label={`Decision ${i + 1}, if no`}
                      as="div"
                      multiline
                      className="flex-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 06 · Quality-control checklist */}
      {sop.qualityChecks.length > 0 && (
        <Section {...sectionProps("quality")}>
          <ul className="space-y-3">
            {sop.qualityChecks.map((q, i) => (
              <li key={i} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 block h-4 w-4 shrink-0 border border-ink/40"
                />
                <Editable
                  value={q}
                  onCommit={(v) => setItem("qualityChecks", i, v)}
                  label={`Quality check ${i + 1}`}
                  as="div"
                  multiline
                  className="flex-1 text-[0.9375rem] leading-relaxed"
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 07 · Common failure points */}
      {sop.failurePoints.length > 0 && (
        <Section {...sectionProps("failures")}>
          <div className="space-y-6">
            {sop.failurePoints.map((f, i) => (
              <div key={i} className="border-b border-ink/10 pb-6 last:border-b-0 last:pb-0">
                <Editable
                  value={f.risk}
                  onCommit={(v) => setRow("failurePoints", i, { risk: v })}
                  label={`Failure point ${i + 1} risk`}
                  as="div"
                  multiline
                  className="text-[0.9375rem] leading-relaxed font-semibold"
                />
                <div className="mt-2.5 grid gap-2 border-l border-ink/15 pl-4 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <MonoLabel>Likely cause</MonoLabel>
                    <Editable
                      value={f.cause}
                      onCommit={(v) => setRow("failurePoints", i, { cause: v })}
                      label={`Failure point ${i + 1} cause`}
                      as="div"
                      multiline
                      className="mt-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                  <div>
                    <MonoLabel>Prevention</MonoLabel>
                    <Editable
                      value={f.prevention}
                      onCommit={(v) => setRow("failurePoints", i, { prevention: v })}
                      label={`Failure point ${i + 1} prevention`}
                      as="div"
                      multiline
                      className="mt-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 08 · Key metrics */}
      {sop.metrics.length > 0 && (
        <Section {...sectionProps("metrics")}>
          <div className="space-y-5">
            {sop.metrics.map((m, i) => (
              <div key={i} className="grid gap-1.5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <Editable
                  value={m.name}
                  onCommit={(v) => setRow("metrics", i, { name: v })}
                  label={`Metric ${i + 1} name`}
                  as="div"
                  className="text-[0.9375rem] leading-relaxed font-semibold"
                />
                <div>
                  <Editable
                    value={m.definition}
                    onCommit={(v) => setRow("metrics", i, { definition: v })}
                    label={`Metric ${i + 1} definition`}
                    as="div"
                    multiline
                    className="text-[0.9375rem] leading-relaxed"
                  />
                  <Editable
                    value={m.reason}
                    onCommit={(v) => setRow("metrics", i, { reason: v })}
                    label={`Metric ${i + 1} reason`}
                    as="div"
                    multiline
                    className="mt-1 text-sm leading-relaxed text-ink/60 italic"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 09 · Automation opportunities */}
      {sop.automationOpportunities.length > 0 && (
        <Section {...sectionProps("automation")}>
          <div className="space-y-6">
            {sop.automationOpportunities.map((a, i) => (
              <div key={i} className="border-b border-ink/10 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <Editable
                    value={a.manualAction}
                    onCommit={(v) => setRow("automationOpportunities", i, { manualAction: v })}
                    label={`Automation ${i + 1}, current manual action`}
                    as="div"
                    multiline
                    className="flex-1 text-[0.9375rem] leading-relaxed font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRow("automationOpportunities", i, {
                        complexity: COMPLEXITY_CYCLE[a.complexity],
                      })
                    }
                    aria-label={`Complexity: ${a.complexity}. Activate to change.`}
                    className="shrink-0 border border-ink/30 px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.2em] text-ink/70 uppercase transition-colors hover:border-ink hover:text-ink focus-visible:border-ink focus-visible:text-ink focus-visible:outline-none"
                  >
                    {a.complexity}
                  </button>
                </div>
                <div className="mt-2.5 space-y-2 border-l border-ink/15 pl-4">
                  <div className="flex gap-2.5">
                    <MonoLabel>Automate</MonoLabel>
                    <Editable
                      value={a.automation}
                      onCommit={(v) => setRow("automationOpportunities", i, { automation: v })}
                      label={`Automation ${i + 1} suggestion`}
                      as="div"
                      multiline
                      className="flex-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <MonoLabel>Benefit</MonoLabel>
                    <Editable
                      value={a.benefit}
                      onCommit={(v) => setRow("automationOpportunities", i, { benefit: v })}
                      label={`Automation ${i + 1} benefit`}
                      as="div"
                      multiline
                      className="flex-1 text-sm leading-relaxed text-ink/80"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Document footer ── */}
      <footer className="mt-14 border-t-2 border-ink pt-4">
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-ink/45 uppercase">
          Structured with Process to SOP · bluerook.co
        </p>
      </footer>
    </article>
  );
}
