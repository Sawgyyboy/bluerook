import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  generateRequestSchema,
  generationSchema,
  type GenerateResponse,
} from "@/lib/sop";
import { mockSop } from "@/lib/mock";

export const maxDuration = 120;

const DEFAULT_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are an operations consultant at Bluerook, a premium BPO agency. You turn a founder's messy description of a recurring business process into a precise Standard Operating Procedure.

Non-negotiable rules:
- Never invent business facts. Use only what the description states or clearly implies.
- Preserve the user's actual process, tools, names and terminology. Improve clarity; do not redesign the operation.
- When something essential is unstated but reasonably inferable, infer it AND list it in "assumptions" so the owner can confirm. Never present an assumption as confirmed fact.
- Ask clarification questions (set needsClarification=true, sop=null) ONLY when the description is too thin to draft a responsible SOP — e.g. you cannot tell what the process is, what starts it, or roughly who does it. Ask at most 3 short, specific questions. If you can draft with marked assumptions, draft.
- If the user has already answered clarification questions, or the request says to proceed anyway, you MUST generate the SOP (needsClarification=false) and put remaining unknowns in "assumptions".

Writing style:
- Direct operational language. Short sentences. No management jargon, no filler, no generic advice.
- Every step starts with a verb and has one clear owner. Number steps sequentially from 1.
- Surface problems the owner may not see: contradictions, missing ownership, missing handoffs, missing statuses, missing deadlines, missing completion conditions, and single points of failure (one person, one tool or one spreadsheet everything depends on). Put these in failurePoints, notes, or handoffPoint fields where they belong.
- qualityChecks are concrete, verifiable statements — things a manager could audit in five minutes.
- metrics: include only metrics that matter for THIS process (typical candidates: response time, completion time, error rate, conversion rate, rework rate). Explain why each matters here.
- automationOpportunities: only automate mechanical work. Do not recommend automating anything that needs human judgment, relationships or negotiation. Rate complexity honestly (low = off-the-shelf tool or simple rule; high = custom integration).
- If the industry is given, use its vocabulary naturally. Do not pad any section; empty is better than filler.`;

function buildPrompt(req: {
  processName: string;
  industry: string;
  description: string;
  clarifications: { question: string; answer: string }[];
  forceGenerate: boolean;
}): string {
  const parts: string[] = [];
  if (req.processName) parts.push(`Process name (from the user): ${req.processName}`);
  if (req.industry) parts.push(`Business / industry: ${req.industry}`);
  parts.push(`How the process currently works, in the user's own words:\n"""\n${req.description}\n"""`);
  if (req.clarifications.length > 0) {
    parts.push(
      "The user has answered your clarification questions:\n" +
        req.clarifications
          .map((c) => `Q: ${c.question}\nA: ${c.answer || "(no answer given — treat as unknown and mark an assumption)"}`)
          .join("\n")
    );
    parts.push("Do not ask further questions. Generate the SOP now.");
  }
  if (req.forceGenerate) {
    parts.push(
      "The user chose to proceed without answering clarification questions. Do not ask questions. Generate the SOP and mark every open point as an assumption."
    );
  }
  return parts.join("\n\n");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Dev-only escape hatch: work on the UI without an API key.
  if (process.env.SOP_MOCK === "1") {
    await new Promise((r) => setTimeout(r, 1500));
    // Include "[clarify]" in the description to exercise the question flow.
    if (
      parsed.data.description.includes("[clarify]") &&
      !parsed.data.forceGenerate &&
      parsed.data.clarifications.length === 0
    ) {
      const res: GenerateResponse = {
        type: "clarification",
        questions: [
          "Who replies to leads when more than one person is available?",
          "Is there a fixed follow-up schedule, or does each person decide?",
          "What marks a lead as closed?",
        ],
      };
      return NextResponse.json(res);
    }
    const res: GenerateResponse = {
      type: "sop",
      sop: { ...mockSop, processName: parsed.data.processName || mockSop.processName },
    };
    return NextResponse.json(res);
  }

  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY);
  if (!hasAnthropicKey && !hasGatewayKey) {
    return NextResponse.json(
      {
        error:
          "The server is not configured with an AI API key. Set ANTHROPIC_API_KEY (or AI_GATEWAY_API_KEY) and try again.",
      },
      { status: 503 }
    );
  }

  const modelId = process.env.SOP_MODEL || DEFAULT_MODEL;
  const model = hasAnthropicKey
    ? anthropic(modelId)
    : `anthropic/${modelId}`; // Vercel AI Gateway routing

  try {
    const { object } = await generateObject({
      model,
      schema: generationSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(parsed.data),
      temperature: 0.3,
    });

    if (!object.needsClarification && object.sop) {
      // Normalise step numbering so the UI can trust it.
      object.sop.steps = object.sop.steps.map((s, i) => ({ ...s, number: i + 1 }));
      const res: GenerateResponse = { type: "sop", sop: object.sop };
      return NextResponse.json(res);
    }

    if (object.needsClarification && object.clarificationQuestions.length > 0) {
      // Never loop forever: if the user already clarified or chose to proceed,
      // a question response is a model error — surface it as retryable.
      if (parsed.data.forceGenerate || parsed.data.clarifications.length > 0) {
        return NextResponse.json(
          { error: "The model failed to produce an SOP. Please retry." },
          { status: 502 }
        );
      }
      const res: GenerateResponse = {
        type: "clarification",
        questions: object.clarificationQuestions.slice(0, 3),
      };
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { error: "The model returned an incomplete result. Please retry." },
      { status: 502 }
    );
  } catch (err) {
    console.error("SOP generation failed:", err);
    return NextResponse.json(
      { error: "Generation failed. This is usually temporary — please retry." },
      { status: 502 }
    );
  }
}
