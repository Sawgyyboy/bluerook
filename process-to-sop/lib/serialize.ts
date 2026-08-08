import type { Sop } from "./sop";

export type SectionId =
  | "overview"
  | "roles"
  | "inputs"
  | "steps"
  | "decisions"
  | "quality"
  | "failures"
  | "metrics"
  | "automation";

export const sectionTitles: Record<SectionId, string> = {
  overview: "Process overview",
  roles: "Roles and ownership",
  inputs: "Required inputs",
  steps: "Step-by-step procedure",
  decisions: "Decision points",
  quality: "Quality-control checklist",
  failures: "Common failure points",
  metrics: "Key metrics",
  automation: "Automation opportunities",
};

export const sectionOrder: SectionId[] = [
  "overview",
  "roles",
  "inputs",
  "steps",
  "decisions",
  "quality",
  "failures",
  "metrics",
  "automation",
];

const complexityLabel = { low: "Low", medium: "Medium", high: "High" } as const;

function inputGroup(label: string, items: string[]): string[] {
  if (items.length === 0) return [];
  return [`${label}: ${items.join("; ")}`];
}

/** Plain-text body of one section (no heading). */
export function sectionToText(sop: Sop, id: SectionId): string {
  const lines: string[] = [];
  switch (id) {
    case "overview":
      lines.push(`Process: ${sop.processName}`);
      lines.push(`Objective: ${sop.objective}`);
      lines.push(`Trigger: ${sop.trigger}`);
      lines.push(`Complete when: ${sop.completionCondition}`);
      if (sop.assumptions.length > 0) {
        lines.push("", "Assumptions (not confirmed by the process owner):");
        sop.assumptions.forEach((a) => lines.push(`  - ${a}`));
      }
      break;
    case "roles":
      sop.roles.forEach((r) => {
        lines.push(`${r.role}`);
        lines.push(`  Responsibility: ${r.responsibility}`);
        lines.push(`  Hands off: ${r.handoffPoint}`);
      });
      break;
    case "inputs":
      lines.push(
        ...inputGroup("Information", sop.inputs.information),
        ...inputGroup("Tools", sop.inputs.tools),
        ...inputGroup("Access", sop.inputs.access),
        ...inputGroup("Documents", sop.inputs.documents)
      );
      break;
    case "steps":
      sop.steps.forEach((s) => {
        lines.push(`${s.number}. ${s.action}`);
        lines.push(`   Owner: ${s.owner}`);
        lines.push(`   Input: ${s.input}`);
        lines.push(`   Output: ${s.output}`);
        if (s.notes) lines.push(`   Notes: ${s.notes}`);
      });
      break;
    case "decisions":
      sop.decisions.forEach((d) => {
        lines.push(`If ${d.condition}`);
        lines.push(`  Yes: ${d.yesAction}`);
        lines.push(`  No:  ${d.noAction}`);
      });
      break;
    case "quality":
      sop.qualityChecks.forEach((q) => lines.push(`[ ] ${q}`));
      break;
    case "failures":
      sop.failurePoints.forEach((f) => {
        lines.push(`Risk: ${f.risk}`);
        lines.push(`  Likely cause: ${f.cause}`);
        lines.push(`  Prevention: ${f.prevention}`);
      });
      break;
    case "metrics":
      sop.metrics.forEach((m) => {
        lines.push(`${m.name} — ${m.definition}`);
        lines.push(`  Why: ${m.reason}`);
      });
      break;
    case "automation":
      sop.automationOpportunities.forEach((a) => {
        lines.push(`${a.manualAction} → ${a.automation}`);
        lines.push(`  Benefit: ${a.benefit}`);
        lines.push(`  Complexity: ${complexityLabel[a.complexity]}`);
      });
      break;
  }
  return lines.join("\n");
}

/** Full SOP as clean plain text (for the Copy button). */
export function toPlainText(sop: Sop): string {
  const parts: string[] = [
    sop.processName.toUpperCase(),
    "Standard Operating Procedure",
    "",
  ];
  sectionOrder.forEach((id, i) => {
    const body = sectionToText(sop, id);
    if (!body) return;
    parts.push(`${String(i + 1).padStart(2, "0")} · ${sectionTitles[id].toUpperCase()}`);
    parts.push("-".repeat(46));
    parts.push(body, "");
  });
  parts.push("—", "Structured with Process to SOP by Bluerook · bluerook.co");
  return parts.join("\n");
}

/** Full SOP as Markdown (for the .md download). */
export function toMarkdown(sop: Sop): string {
  const md: string[] = [`# ${sop.processName}`, "", "> Standard Operating Procedure", ""];

  md.push("## 1 · Process overview", "");
  md.push(`**Objective.** ${sop.objective}`, "");
  md.push(`**Trigger.** ${sop.trigger}`, "");
  md.push(`**Complete when.** ${sop.completionCondition}`, "");
  if (sop.assumptions.length > 0) {
    md.push("**Assumptions** *(not confirmed by the process owner)*:", "");
    sop.assumptions.forEach((a) => md.push(`- ${a}`));
    md.push("");
  }

  md.push("## 2 · Roles and ownership", "");
  md.push("| Role | Responsibility | Handoff point |", "| --- | --- | --- |");
  sop.roles.forEach((r) => md.push(`| ${r.role} | ${r.responsibility} | ${r.handoffPoint} |`));
  md.push("");

  md.push("## 3 · Required inputs", "");
  const groups: Array<[string, string[]]> = [
    ["Information", sop.inputs.information],
    ["Tools", sop.inputs.tools],
    ["Access", sop.inputs.access],
    ["Documents", sop.inputs.documents],
  ];
  groups.forEach(([label, items]) => {
    if (items.length > 0) md.push(`- **${label}:** ${items.join("; ")}`);
  });
  md.push("");

  md.push("## 4 · Step-by-step procedure", "");
  sop.steps.forEach((s) => {
    md.push(`### Step ${s.number} — ${s.action}`, "");
    md.push(`- **Owner:** ${s.owner}`);
    md.push(`- **Input:** ${s.input}`);
    md.push(`- **Output:** ${s.output}`);
    if (s.notes) md.push(`- **Notes:** ${s.notes}`);
    md.push("");
  });

  if (sop.decisions.length > 0) {
    md.push("## 5 · Decision points", "");
    sop.decisions.forEach((d) => {
      md.push(`**If ${d.condition}**`, "");
      md.push(`- Yes → ${d.yesAction}`);
      md.push(`- No → ${d.noAction}`, "");
    });
  }

  if (sop.qualityChecks.length > 0) {
    md.push("## 6 · Quality-control checklist", "");
    sop.qualityChecks.forEach((q) => md.push(`- [ ] ${q}`));
    md.push("");
  }

  if (sop.failurePoints.length > 0) {
    md.push("## 7 · Common failure points", "");
    md.push("| Risk | Likely cause | Prevention |", "| --- | --- | --- |");
    sop.failurePoints.forEach((f) => md.push(`| ${f.risk} | ${f.cause} | ${f.prevention} |`));
    md.push("");
  }

  if (sop.metrics.length > 0) {
    md.push("## 8 · Key metrics", "");
    sop.metrics.forEach((m) => md.push(`- **${m.name}** — ${m.definition} *(${m.reason})*`));
    md.push("");
  }

  if (sop.automationOpportunities.length > 0) {
    md.push("## 9 · Automation opportunities", "");
    sop.automationOpportunities.forEach((a) => {
      md.push(`### ${a.manualAction}`, "");
      md.push(`- **Automation:** ${a.automation}`);
      md.push(`- **Benefit:** ${a.benefit}`);
      md.push(`- **Complexity:** ${complexityLabel[a.complexity]}`, "");
    });
  }

  md.push("---", "", "*Structured with [Process to SOP](https://bluerook.co) by Bluerook.*");
  return md.join("\n");
}

/** Filename-safe slug for the Markdown download. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sop"
  );
}
