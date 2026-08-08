/*
 * Synthetic, deterministic data for the public Bluerook portfolio.
 * No record in this file represents a real customer, lead, order, call, or account.
 */
(function () {
  'use strict';

  const freeze = (value) => Object.freeze(value);

  window.BluerookPortfolioData = freeze({
    disclosure: freeze({
      implemented: 'IMPLEMENTED SYSTEM · ANONYMIZED',
      product: 'BLUEROOK PRODUCT',
      fictional: 'FICTIONAL INTERACTIVE DEMONSTRATION',
      prototype: 'CAPABILITY PROTOTYPE',
      capability: 'AVAILABLE CAPABILITY',
      managed: 'MANAGED SERVICE'
    }),

    commerce: freeze({
      retailer: 'Aster & Vale',
      products: freeze([
        freeze({ id: 'AV-104', name: 'Field Notes No. 04', price: 48, inventory: 12, collection: 'Field Editions', availability: 'Published', image: 'field' }),
        freeze({ id: 'AV-218', name: 'Studio Vessel No. 02', price: 72, inventory: 4, collection: 'Objects', availability: 'Published', image: 'vessel' }),
        freeze({ id: 'AV-331', name: 'Night Archive Set', price: 94, inventory: 0, collection: 'Archive', availability: 'Draft', image: 'archive' })
      ]),
      order: freeze({ id: 'AV-2408', customer: 'Mara Ellis', product: 'Field Notes No. 04', stage: 'New', tracking: 'Pending', owner: 'Commerce desk' })
    }),

    sports: freeze({
      organisation: 'Northline Athletics',
      parent: 'Samira Cole',
      participant: 'Lea Cole',
      programmes: freeze(['Football', 'Basketball', 'Swimming', 'Holiday camp']),
      agents: freeze([
        freeze({ id: 'football', name: 'Football enquiry operator', responsibility: 'Qualify age, location, goal, and trial preference.', boundary: 'Availability and exceptional requests require staff confirmation.', completion: 'Trial offered, handed off, or closed with a reason.' }),
        freeze({ id: 'basketball', name: 'Basketball enquiry operator', responsibility: 'Match the participant to a suitable development group.', boundary: 'Capacity, accessibility, and payment questions route to staff.', completion: 'Suitable trial selected and recorded.' }),
        freeze({ id: 'swimming', name: 'Swimming enquiry operator', responsibility: 'Collect confidence level, age, location, and schedule.', boundary: 'Medical and safety information is never interpreted by the agent.', completion: 'Assessment requested or human handoff created.' }),
        freeze({ id: 'camp', name: 'Holiday camp operator', responsibility: 'Confirm dates, age band, and guardian details.', boundary: 'Discounts, refunds, and special arrangements require approval.', completion: 'Place requested, exception routed, or enquiry closed.' })
      ])
    }),

    dormantLeads: freeze([
      freeze({ id: 'L-018', name: 'Amina Reed', reason: 'No next action', age: '94 days', consent: 'Email permitted', status: 'Dormant', suggested: 'Confirm whether the spring programme is still relevant.' }),
      freeze({ id: 'L-027', name: 'Jon Bell', reason: 'Trial never booked', age: '61 days', consent: 'Voice + SMS permitted', status: 'Dormant', suggested: 'Offer two current trial windows after staff review.' }),
      freeze({ id: 'L-043', name: 'Nora Patel', reason: 'Overdue follow-up', age: '12 days', consent: 'Email permitted', status: 'Dormant', suggested: 'Reply to the pricing question with approved programme information.' }),
      freeze({ id: 'L-047', name: 'Milan Shah', reason: 'No owner', age: '18 days', consent: 'Human review only', status: 'Dormant', suggested: 'Assign a responsible person before any contact is prepared.' }),
      freeze({ id: 'L-049', name: 'Tessa Young', reason: 'Missing context', age: '35 days', consent: 'Email permitted', status: 'Dormant', suggested: 'Recover the last approved interaction before drafting a response.' }),
      freeze({ id: 'L-052', name: 'Eli North', reason: 'Healthy record', age: '2 days', consent: 'Email permitted', status: 'Healthy', suggested: 'No action. Owner and next step are current.' })
    ]),

    operations: freeze({
      inbox: freeze([
        freeze({ id: 'M-01', subject: 'Contract approval needed', type: 'Decision', owner: 'Founder', deadline: 'Today · 16:00', action: 'Approve revised scope' }),
        freeze({ id: 'M-02', subject: 'Customer delivery exception', type: 'Exception', owner: 'Operations', deadline: 'Today · 12:30', action: 'Confirm replacement route' }),
        freeze({ id: 'M-03', subject: 'Campaign notes and assets', type: 'Process + decision', owner: 'Content desk', deadline: 'Tomorrow', action: 'File assets; prepare release-window decision' }),
        freeze({ id: 'M-04', subject: 'Unassigned CRM follow-up', type: 'Gap', owner: 'Revenue desk', deadline: 'Today · 14:00', action: 'Assign and schedule response' })
      ])
    }),

    voiceScenarios: freeze({
      faq: freeze({ label: 'Ask a common question', caller: 'What happens after the strategy call?', reply: 'We map the bottleneck, define the owner and controls, then recommend the smallest useful first system.', intent: 'Approved information', state: 'Knowledge answer available', action: 'Answered and logged' }),
      book: freeze({ label: 'Book an appointment', caller: 'Can I book a strategy call next Tuesday?', reply: 'I can offer two prepared fictional slots. Which one should I hold?', intent: 'Booking', state: 'Availability check required', action: 'Calendar hold prepared' }),
      change: freeze({ label: 'Change a booking', caller: 'I need to move my appointment.', reply: 'I can record the change request and hand it to the scheduling owner with your current booking context.', intent: 'Reschedule', state: 'Customer record located', action: 'Human scheduling task created' }),
      problem: freeze({ label: 'Report a problem', caller: 'The form failed after I submitted it.', reply: 'I have captured the failure, the affected step, and your contact preference for the operations owner.', intent: 'Service exception', state: 'Human escalation required', action: 'Priority exception created' }),
      person: freeze({ label: 'Request a person', caller: 'I would rather speak to someone.', reply: 'Of course. I will pass your reason and contact preference to the appropriate person.', intent: 'Human request', state: 'Immediate handoff', action: 'Callback task created' }),
      after: freeze({ label: 'Call after hours', caller: 'Is anyone available now?', reply: 'The team is offline. I can answer approved questions or prepare a callback with the context you share.', intent: 'After-hours enquiry', state: 'Coverage window closed', action: 'Next-window follow-up prepared' })
    })
  });
})();
