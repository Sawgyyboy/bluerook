import { z } from "zod";

/** The structured SOP document. Single source of truth for AI output,
 *  client state, and every serializer. */
export const sopSchema = z.object({
  processName: z.string().describe("Short, specific name of the process"),
  objective: z.string().describe("What the process achieves, in one or two plain sentences"),
  trigger: z.string().describe("The event that starts the process"),
  completionCondition: z.string().describe("The observable condition that means the process is done"),
  assumptions: z
    .array(z.string())
    .describe("Assumptions made because the description did not confirm them. Empty if none."),
  roles: z.array(
    z.object({
      role: z.string(),
      responsibility: z.string(),
      handoffPoint: z.string().describe("Where this role hands work to the next role, or 'None' if the role owns it end to end"),
    })
  ),
  inputs: z.object({
    information: z.array(z.string()),
    tools: z.array(z.string()),
    access: z.array(z.string()),
    documents: z.array(z.string()),
  }),
  steps: z.array(
    z.object({
      number: z.number().int(),
      action: z.string().describe("One direct instruction, starting with a verb"),
      owner: z.string(),
      input: z.string(),
      output: z.string(),
      notes: z.string().describe("Constraints, deadlines or edge cases. Empty string if none."),
    })
  ),
  decisions: z.array(
    z.object({
      condition: z.string(),
      yesAction: z.string(),
      noAction: z.string(),
    })
  ),
  qualityChecks: z.array(z.string()),
  failurePoints: z.array(
    z.object({
      risk: z.string(),
      cause: z.string(),
      prevention: z.string(),
    })
  ),
  metrics: z.array(
    z.object({
      name: z.string(),
      definition: z.string(),
      reason: z.string().describe("Why this metric matters for this specific process"),
    })
  ),
  automationOpportunities: z.array(
    z.object({
      manualAction: z.string(),
      automation: z.string(),
      benefit: z.string(),
      complexity: z.enum(["low", "medium", "high"]),
    })
  ),
});

export type Sop = z.infer<typeof sopSchema>;

/** What the model returns: either a finished SOP, or up to three
 *  clarification questions when essential information is missing. */
export const generationSchema = z.object({
  needsClarification: z
    .boolean()
    .describe("True only if the SOP cannot be responsibly drafted without answers"),
  clarificationQuestions: z
    .array(z.string())
    .max(3)
    .describe("Up to three short, specific questions. Empty when needsClarification is false."),
  sop: sopSchema.nullable().describe("The SOP. Null only when needsClarification is true."),
});

export type Generation = z.infer<typeof generationSchema>;

/** Request body for POST /api/generate. */
export const generateRequestSchema = z.object({
  processName: z.string().max(200).default(""),
  industry: z.string().max(200).default(""),
  description: z
    .string()
    .min(40, "Please describe the process in a few sentences — who does what, and when.")
    .max(12000),
  clarifications: z
    .array(z.object({ question: z.string().max(500), answer: z.string().max(2000) }))
    .max(3)
    .default([]),
  /** When true (user chose to skip clarification), the model must generate
   *  and mark assumptions instead of asking again. */
  forceGenerate: z.boolean().default(false),
});

export type GenerateRequest = z.input<typeof generateRequestSchema>;

export type GenerateResponse =
  | { type: "clarification"; questions: string[] }
  | { type: "sop"; sop: Sop };
