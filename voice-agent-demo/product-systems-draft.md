# Bluerook product systems — working draft

This is a product and visual-direction draft. It does not modify the current public
website and must not be treated as proof of deployed client systems.

## Product framing

Replace human-VA language with:

**AI System VAs**

Role-based AI operating systems that own a defined workflow across approved tools,
with clear permissions, human approval points, exception paths, and operational
reporting.

Supporting product categories:

1. AI System VAs
2. Workflow Automation and Orchestration
3. System Audits and Architecture
4. AI Maintenance and Optimization

## System catalogue

### Inbound Receptionist

`Call / Chat → Identify intent → Approved knowledge → Qualify or support → CRM record → Book / route / escalate`

Outcome: faster, consistent handling of inbound demand without pretending the AI is
human.

### Speed to Lead

`Form / Ad / Message → Validate → Enrich → Score → Immediate response → CRM update → Owner alert → Follow-up timer`

Outcome: reduce the gap between enquiry and first useful response.

### Lead Activation

`Approved CRM segment → Eligibility and consent check → Personalized sequence → Reply classification → Booking or nurture → CRM outcome`

Outcome: systematically work eligible dormant leads while respecting stop rules.

### CRM Operations Agent

`User request → Permission check → Search CRM → Summarize record → Recommend action → Human approval when required → Update → Audit log`

Outcome: make the CRM an active operational system rather than a passive database.

### Website and Support Agent

`Website conversation → Knowledge retrieval → Intent and fit → Answer / qualify → Create or update contact → Route / book → Transcript summary`

Outcome: turn website traffic into resolved questions, structured leads, and
controlled handoffs.

### Reporting and Dashboard Agent

`CRM + Operations + Marketing data → Validate → Normalize → KPI layer → Anomaly detection → Dashboard → Decision brief`

Outcome: give the owner a reliable operating view and a short list of decisions.

### AI Executive Operations Assistant

`Inbox / Work queue → Triage → Retrieve context → Draft / assign → Approval gate → Send or update → Track completion → Escalate exceptions`

Outcome: remove repeated coordination work without giving the AI unbounded authority.

## Future n8n-style visual grammar

The attached references are useful for their structural language:

- one large system or agent node;
- smaller tool and data nodes;
- visible curved connectors;
- clear direction of flow;
- large titles and very little explanatory copy;
- a dark canvas option with a subtle dot grid.

Bluerook execution should not copy the reference colors, layouts, n8n logo, or
generic robot icon. Use the canonical system:

- Midnight canvas;
- Paper primary nodes and type;
- Bluerook Blue for structural paths and system boundaries;
- one scarce Brass outcome or human-approval point;
- Geist Mono for node labels and event metadata;
- the approved Bluerook rook only where a company mark is needed.

Each system visual should show:

1. entry trigger;
2. AI role;
3. tools and systems of record;
4. human approval or escalation;
5. observable completion state;
6. monitoring or dashboard output.

Suggested reusable node types:

- Trigger
- AI System VA
- Knowledge
- Rules / Guardrail
- Human Approval
- CRM / System of Record
- Communication Channel
- Workflow
- Dashboard
- Exception
- Outcome

Never draw a workflow that implies a live integration unless it exists. Proposed
systems should be labeled **System blueprint** or **Illustrative architecture**.

