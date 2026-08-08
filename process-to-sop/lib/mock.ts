import type { Sop } from "./sop";

/** Canned SOP returned when SOP_MOCK=1 — lets the UI be developed and
 *  tested without an API key. Mirrors the "Lead follow-up" example. */
export const mockSop: Sop = {
  processName: "Lead follow-up",
  objective:
    "Respond to every new lead quickly, qualify them, and either book a site visit or close the loop — without leads falling through the cracks.",
  trigger: "A new lead messages on WhatsApp or submits the website form.",
  completionCondition:
    "The lead is either booked (added to the jobs spreadsheet and announced to the field team) or marked closed after the final follow-up.",
  assumptions: [
    "Follow-up cadence of 2 business days is assumed — the description says 'a couple of days' but no fixed rule exists.",
    "Sara is assumed to be the only person updating the jobs spreadsheet.",
  ],
  roles: [
    {
      role: "First responder (rotating)",
      responsibility: "Reply to new leads, qualify service and location, send the price list.",
      handoffPoint: "Hands the lead to the booking owner once a site visit is requested.",
    },
    {
      role: "Sara (booking owner)",
      responsibility: "Record bookings in the jobs spreadsheet and notify the field team.",
      handoffPoint: "Hands off to the field team via the group chat announcement.",
    },
  ],
  inputs: {
    information: ["Lead's name and phone number", "Service requested", "Lead's location"],
    tools: ["WhatsApp Business", "Website form inbox", "Jobs spreadsheet", "Field team group chat"],
    access: ["Shared WhatsApp account", "Edit access to the jobs spreadsheet"],
    documents: ["Price list PDF"],
  },
  steps: [
    {
      number: 1,
      action: "Reply to the new lead and claim it by name in the team chat",
      owner: "First responder",
      input: "Incoming WhatsApp message or form submission",
      output: "Lead acknowledged and visibly owned by one person",
      notes: "Target: reply within 15 minutes during working hours.",
    },
    {
      number: 2,
      action: "Ask what service the lead needs and where they are located",
      owner: "First responder",
      input: "Open conversation with the lead",
      output: "Service type and location recorded",
      notes: "",
    },
    {
      number: 3,
      action: "Send the price list PDF and answer initial questions",
      owner: "First responder",
      input: "Qualified service type",
      output: "Lead has pricing information",
      notes: "",
    },
    {
      number: 4,
      action: "Propose a site visit if the lead is qualified",
      owner: "First responder",
      input: "Lead's response to pricing",
      output: "Site visit accepted, declined, or pending",
      notes: "",
    },
    {
      number: 5,
      action: "Follow up with any lead that has gone quiet",
      owner: "First responder",
      input: "Leads with no reply after 2 business days",
      output: "Lead re-engaged or marked closed after second follow-up",
      notes: "Assumed cadence — confirm with the team.",
    },
    {
      number: 6,
      action: "Add booked leads to the jobs spreadsheet and announce in the group chat",
      owner: "Sara",
      input: "Confirmed booking details",
      output: "Job scheduled and field team informed",
      notes: "",
    },
  ],
  decisions: [
    {
      condition: "the lead replies with a service we actually offer in their area",
      yesAction: "Send the price list and move toward booking a site visit.",
      noAction: "Politely decline and, where possible, refer them elsewhere; mark the lead closed.",
    },
    {
      condition: "the lead has not replied after two follow-ups",
      yesAction: "Mark the lead closed with reason 'no response'.",
      noAction: "Keep the lead open and schedule the next follow-up.",
    },
  ],
  qualityChecks: [
    "Every new lead has a named owner within 15 minutes",
    "Service and location are recorded before prices are sent",
    "Every quiet lead has a dated follow-up entry",
    "Every booking appears in the jobs spreadsheet before the field team is notified",
  ],
  failurePoints: [
    {
      risk: "Two people reply to the same lead, or nobody does",
      cause: "'Whoever sees it first' means ownership is never explicit",
      prevention: "Claim each lead by name in the team chat before replying (Step 1).",
    },
    {
      risk: "Quiet leads are never followed up",
      cause: "Follow-up depends on individual memory; no list of open leads exists",
      prevention: "Keep a simple open-leads sheet with a next-follow-up date, reviewed each morning.",
    },
    {
      risk: "Bookings stall when Sara is unavailable",
      cause: "Sara is a single point of failure for the spreadsheet and team notification",
      prevention: "Name a backup who can complete Step 6 in her absence.",
    },
  ],
  metrics: [
    {
      name: "First response time",
      definition: "Minutes between the lead's first message and the first human reply",
      reason: "Speed of first contact is the strongest driver of conversion for inbound leads.",
    },
    {
      name: "Follow-up completion rate",
      definition: "Share of quiet leads that received a follow-up within the agreed cadence",
      reason: "Directly measures the leak the team already knows exists.",
    },
    {
      name: "Lead-to-booking conversion",
      definition: "Booked leads divided by total qualified leads per month",
      reason: "Ties the whole process to revenue.",
    },
  ],
  automationOpportunities: [
    {
      manualAction: "Manually noticing and replying to new website form leads",
      automation: "Auto-forward form submissions into the team WhatsApp/chat with an instant acknowledgement to the lead",
      benefit: "No lead sits unseen; response time drops to minutes",
      complexity: "low",
    },
    {
      manualAction: "Remembering to follow up with quiet leads",
      automation: "A simple CRM or sheet with automatic follow-up reminders per lead",
      benefit: "Follow-up stops depending on memory",
      complexity: "medium",
    },
    {
      manualAction: "Copying booking details into the spreadsheet and re-typing them in the group chat",
      automation: "A booking form that writes to the sheet and posts to the chat automatically",
      benefit: "One entry instead of two; removes transcription errors",
      complexity: "medium",
    },
  ],
};
