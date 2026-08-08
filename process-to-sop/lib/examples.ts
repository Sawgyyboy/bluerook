export interface ExampleProcess {
  label: string;
  processName: string;
  industry: string;
  description: string;
}

export const examples: ExampleProcess[] = [
  {
    label: "Lead follow-up",
    processName: "Lead follow-up",
    industry: "Home services company",
    description:
      "When a new lead messages us on WhatsApp or fills the website form, whoever sees it first replies. We ask what service they need and where they're located, then send our price list PDF. If they seem serious we try to book a site visit. If they go quiet, someone is supposed to follow up after a couple of days but honestly it depends who remembers. When a lead books, Sara adds them to the jobs spreadsheet and tells the field team in the group chat. We lose leads all the time because nobody knows who replied last or whether anyone followed up.",
  },
  {
    label: "Client onboarding",
    processName: "New client onboarding",
    industry: "Marketing agency",
    description:
      "After a client signs the proposal, I send them a welcome email with a questionnaire link and an invoice for the first month. Once they pay, my assistant creates a shared Drive folder, a Slack channel, and adds the project to Notion. Then we schedule a kickoff call — I run it, take notes somewhere, and afterwards I'm supposed to turn the notes into a project brief for the team. Sometimes the questionnaire never comes back and we do the kickoff without it. The team says they often start work before the brief exists. Nobody owns checking whether the invoice was actually paid before work starts.",
  },
  {
    label: "Event registration",
    processName: "Workshop registration",
    industry: "Professional training business",
    description:
      "We announce each workshop on Instagram and LinkedIn with a link to a Google Form. Registrations land in a sheet. My colleague Youssef checks the sheet every day or two, sends each person a payment link by email, and marks them as paid when the money arrives. Paid attendees should get a confirmation email with the venue details and a calendar invite, but sometimes that goes out late or not at all. Two days before the event we export the list, print name badges and send a reminder. People who registered but never paid still show up sometimes, and we've had events where we didn't notice we were over room capacity until the week of.",
  },
];

/** Placeholder shown in the empty description textarea. */
export const placeholderDescription =
  "e.g. When a new client messages us, we reply on WhatsApp, ask what service they need, send prices, follow up later, and update a spreadsheet if they book. Fatima handles the replies unless she's off, then whoever is free does it…";
