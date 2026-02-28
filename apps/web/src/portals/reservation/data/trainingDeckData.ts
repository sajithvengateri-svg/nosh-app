// ---------------------------------------------------------------------------
// Training Deck Data — static content for interactive staff training decks.
// No project imports. Pure data.
// ---------------------------------------------------------------------------

export type TrainingRole = 'venue_manager' | 'floor_manager' | 'waiter' | 'all';

export interface TrainingCard {
  id: string;
  title: string;
  content: string;
  tips: string[];
  navLink?: string;
  order: number;
}

export interface TrainingDeck {
  id: string;
  title: string;
  description: string;
  role: TrainingRole;
  icon: string;
  estimatedMinutes: number;
  cards: TrainingCard[];
}

// ---------------------------------------------------------------------------
// Decks
// ---------------------------------------------------------------------------

export const TRAINING_DECKS: TrainingDeck[] = [
  // -----------------------------------------------------------------------
  // 1. Getting Started
  // -----------------------------------------------------------------------
  {
    id: 'getting-started',
    title: 'Getting Started',
    description:
      'A quick orientation for every team member. Learn how to navigate ResOS, create your first reservation, and configure the essentials.',
    role: 'all',
    icon: 'LayoutDashboard',
    estimatedMinutes: 5,
    cards: [
      {
        id: 'gs-welcome',
        title: 'Welcome to ResOS',
        content:
          'ResOS is your all-in-one restaurant operating system. It brings together reservation management, an interactive floor plan, a full guest CRM, and the VenueFlow sales engine for functions and events. Everything your team needs lives in a single browser tab, accessible from any device.',
        tips: [
          'Bookmark the dashboard URL so you can get back in one click.',
          'ResOS works on tablets too — great for floor staff during service.',
        ],
        navLink: '/reservation/dashboard',
        order: 1,
      },
      {
        id: 'gs-navigation',
        title: 'Navigating the System',
        content:
          'The sidebar on the left is your primary navigation hub. It is organised into major sections: VenueFlow, Venue Setup, Reservations, Growth, Guests, Online, and System. You can collapse or expand the sidebar at any time to give yourself more screen real estate during busy service periods.',
        tips: [
          'Collapse the sidebar on smaller screens by clicking the toggle at the top.',
          'Learn the section groupings early — it will save you time every shift.',
          'The active section is always highlighted so you know where you are.',
        ],
        order: 2,
      },
      {
        id: 'gs-command-center',
        title: 'The Dashboard',
        content:
          'The dashboard is your hub. At the top you will find a stats row showing today\'s key numbers — covers, reservations, availability, and no-shows. Below that is the journey thermometer, a visual summary of how tonight\'s service is progressing. The live table mini-view gives you a glanceable snapshot of current floor status without leaving the page.',
        tips: [
          'Check the dashboard at the start of every shift for a quick situational overview.',
          'The journey thermometer updates in real time — use it to anticipate rushes.',
        ],
        navLink: '/reservation/dashboard',
        order: 3,
      },
      {
        id: 'gs-first-reservation',
        title: 'Your First Reservation',
        content:
          'Creating a reservation is straightforward. Navigate to the new reservation screen, select a date and time, enter the party size, search for or create a guest profile, assign a table, and save. The system will automatically check availability and warn you of any conflicts before you confirm.',
        tips: [
          'Always search for the guest first — returning guests already have a profile.',
          'If the guest does not specify a table preference, the system will suggest the best fit based on party size.',
        ],
        navLink: '/reservation/reservations/new',
        order: 4,
      },
      {
        id: 'gs-floor-plan',
        title: 'The Floor Plan',
        content:
          'The floor plan is an interactive SVG map of your venue. Each table is colour-coded to show its current status: green means available, blue means reserved, red means seated, amber means the bill has been dropped, and grey means the table is blocked. Click any table to take action on it directly.',
        tips: [
          'Memorise the colour code — it lets you read the room in a glance.',
          'You can zoom and pan on touch devices for large floor layouts.',
          'Use the floor plan during service instead of a paper seating chart.',
        ],
        navLink: '/reservation/floor',
        order: 5,
      },
      {
        id: 'gs-guest-profiles',
        title: 'Guest Profiles',
        content:
          'Every guest in ResOS has a profile that builds over time. It includes visit history, VIP tier, staff notes, no-show count, and tags such as dietary preferences or occasion types. The more your team updates profiles, the better the service you can deliver on return visits.',
        tips: [
          'Add a quick note after memorable interactions — it pays off next time the guest visits.',
          'Use tags like "birthday regular" or "window preference" for personalised service.',
        ],
        navLink: '/reservation/guests',
        order: 6,
      },
      {
        id: 'gs-settings',
        title: 'Settings You Should Configure First',
        content:
          'Before your first service with ResOS, make sure you configure your operating hours, SMS templates, active booking channels, and table layout. These settings control what guests see when they book online and how the system manages availability behind the scenes.',
        tips: [
          'Set operating hours accurately — they directly affect online availability.',
          'Customise SMS templates with your venue name so messages feel personal.',
          'Double-check table capacities in the layout to avoid over-seating.',
        ],
        navLink: '/reservation/settings',
        order: 7,
      },
      {
        id: 'gs-help',
        title: 'Getting Help',
        content:
          'If you ever get stuck, the Help Center is just a click away in the sidebar. You can also revisit these training decks at any time to refresh your knowledge. The decks are role-specific, so you will always see the content most relevant to your position.',
        tips: [
          'Complete all training decks assigned to your role within your first week.',
          'Revisit decks before a role change or promotion to fill any knowledge gaps.',
        ],
        navLink: '/reservation/help',
        order: 8,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 2. Reservation Mastery
  // -----------------------------------------------------------------------
  {
    id: 'reservation-mastery',
    title: 'Reservation Mastery',
    description:
      'Deep-dive into the reservation system. Master every stage of the booking lifecycle, from creating and assigning to handling no-shows and VIPs.',
    role: 'floor_manager',
    icon: 'CalendarCheck',
    estimatedMinutes: 8,
    cards: [
      {
        id: 'rm-lifecycle',
        title: 'The Reservation Lifecycle',
        content:
          'Every reservation moves through a defined set of states: ENQUIRY, CONFIRMED, SEATED, and COMPLETED. Two additional terminal states exist — NO_SHOW for guests who never arrive and CANCELLED for bookings that are withdrawn. Understanding these states helps you track where every booking stands at a glance.',
        tips: [
          'Focus on moving reservations from CONFIRMED to SEATED promptly — it keeps the floor plan accurate.',
          'A reservation can only move forward, never backward, except via cancellation.',
        ],
        order: 1,
      },
      {
        id: 'rm-create-booking',
        title: 'Creating a New Booking',
        content:
          'To create a staff-side booking, select the date and time, enter the party size, optionally assign a table, and search for or create the guest profile. The form validates availability in real time and will flag conflicts before you save. All fields except table assignment are required.',
        tips: [
          'Use the keyboard shortcut to jump straight to the new reservation form during busy periods.',
          'If the guest is uncertain on time, book the earliest option and adjust later.',
        ],
        navLink: '/reservation/reservations/new',
        order: 2,
      },
      {
        id: 'rm-assign-tables',
        title: 'Assigning Tables',
        content:
          'During the booking process, the table picker displays every table along with its availability window, seating capacity, and zone. You can assign a table at booking time or leave it unassigned and decide closer to service. Tables can also be reassigned at any point before the guest is seated.',
        tips: [
          'Assign tables strategically to balance load across zones and waitstaff sections.',
          'If a guest requests a specific table, check its availability first to avoid double-booking.',
          'Reassigning after booking does not notify the guest — it is an internal operation.',
        ],
        order: 3,
      },
      {
        id: 'rm-guest-search',
        title: 'Guest Search',
        content:
          'The guest search field accepts name, phone number, or email. As you type, matching profiles appear instantly. Returning guests auto-populate their details, saving you time and ensuring data consistency. If a guest has a history of no-shows, a warning badge will appear next to their name.',
        tips: [
          'Search by phone number for the fastest match — names can have spelling variations.',
          'If you see a no-show warning, politely confirm the booking with the guest closer to the date.',
        ],
        order: 4,
      },
      {
        id: 'rm-walkin',
        title: 'Walk-In Workflow',
        content:
          'For walk-in guests, tap the Walk-In button on the floor plan. Enter the party size and guest name, then choose "Seat & Close" for a single walk-in or "Seat & Next" to stay in sticky mode during a rush. Sticky mode keeps the walk-in form open so you can seat the next party immediately.',
        tips: [
          'Use "Seat & Next" during peak walk-in periods — it shaves seconds off every interaction.',
          'Always capture a name, even for walk-ins. It improves guest recognition on return visits.',
        ],
        navLink: '/reservation/floor',
        order: 5,
      },
      {
        id: 'rm-waitlist',
        title: 'Managing the Waitlist',
        content:
          'When the venue is full, add guests to the waitlist with their name, party size, and contact number. When a table becomes available, notify the waiting guest directly from the list. Once they arrive, seat them. If they do not respond or choose to leave, mark them accordingly.',
        tips: [
          'Give guests an honest time estimate — under-promising and over-delivering builds trust.',
          'Review the waitlist every fifteen minutes so no one is forgotten.',
        ],
        navLink: '/reservation/waitlist',
        order: 6,
      },
      {
        id: 'rm-edit-cancel',
        title: 'Editing and Cancelling',
        content:
          'Open any reservation to edit its date, time, or party size. Changes take effect immediately and availability is recalculated on save. To cancel, use the cancel action on the reservation detail screen. Cancelled reservations are soft-deleted and remain visible in reports for auditing purposes.',
        tips: [
          'When changing party size, double-check that the assigned table still fits the new count.',
          'Add a cancellation reason in the notes — it helps identify patterns over time.',
        ],
        order: 7,
      },
      {
        id: 'rm-noshow',
        title: 'The No-Show System',
        content:
          'No-shows are tracked automatically per guest profile. When a guest fails to arrive and the reservation is marked as a no-show, their lifetime no-show count increments. On future bookings, the system displays a prominent warning so staff can take appropriate action, such as requesting a deposit or confirming closer to the date.',
        tips: [
          'Only managers should mark a reservation as a no-show to prevent accidental misuse.',
          'Consider implementing a deposit policy for guests with repeated no-shows.',
        ],
        order: 8,
      },
      {
        id: 'rm-vip',
        title: 'Handling VIP Guests',
        content:
          'VIP tiers are visible directly on reservation cards and on the floor plan popover. Special notes and preferences — such as favourite table, dietary needs, or celebration details — carry across every visit automatically. This allows any staff member to deliver a personalised experience, even if they have never served the guest before.',
        tips: [
          'Brief the team on tonight\'s VIP arrivals during the pre-shift meeting.',
          'Update VIP notes after each visit so the profile stays current.',
          'Use the VIP tier to prioritise table assignments during busy periods.',
        ],
        order: 9,
      },
      {
        id: 'rm-diary',
        title: 'Using the Diary View',
        content:
          'The diary view presents all reservations for the day in a timeline format, grouped by time slot. Each entry shows guest name, party size, table, and current status. It is the fastest way to get a complete picture of the day ahead and identify gaps or clusters in the schedule.',
        tips: [
          'Use the diary view at the start of the shift to plan staffing levels by time slot.',
          'Look for clusters of large parties arriving at the same time — they may need extra attention.',
        ],
        navLink: '/reservation/diary',
        order: 10,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 3. Floor Plan Operations
  // -----------------------------------------------------------------------
  {
    id: 'floor-plan-operations',
    title: 'Floor Plan Operations',
    description:
      'Master the interactive floor plan. Learn table statuses, quick actions, seating workflows, and how to manage tables during live service.',
    role: 'waiter',
    icon: 'Map',
    estimatedMinutes: 5,
    cards: [
      {
        id: 'fp-colors',
        title: 'Table Status Colors',
        content:
          'Every table on the floor plan is colour-coded to communicate its current state instantly. Green means the table is available and ready for the next guest. Blue indicates a confirmed reservation is assigned. Red means guests are currently seated. Amber signals that the bill has been dropped. Grey means the table is blocked and unavailable.',
        tips: [
          'Scan for amber tables regularly — they represent upcoming availability.',
          'A quick colour check before quoting wait times keeps your estimates accurate.',
        ],
        order: 1,
      },
      {
        id: 'fp-popover',
        title: 'The Action Popover',
        content:
          'Clicking any table opens an action popover. The popover shows the table number, current status, and assigned guest information. A large primary action button offers the logical next step for that table — for example, "Seat Guest" on a blue table or "Drop Bill" on a red table. A row of secondary actions provides less common options. The popover auto-switches when you tap a different table.',
        tips: [
          'Trust the primary action — it is context-aware and almost always the right next step.',
          'Tap another table to switch context without closing the popover first.',
        ],
        order: 2,
      },
      {
        id: 'fp-seating',
        title: 'Seating a Guest',
        content:
          'For a reserved table, click it and tap "Seat Guest". The table immediately turns from blue to red, and the reservation status updates to SEATED. For walk-in guests, use the Walk-In button on the floor plan, fill in the party details, and the system assigns and seats them in one step.',
        tips: [
          'Seat guests as soon as they sit down so the floor plan stays accurate for the whole team.',
          'If the guest is moved to a different table at seating time, reassign before marking as seated.',
        ],
        order: 3,
      },
      {
        id: 'fp-bill',
        title: 'Dropping the Bill',
        content:
          'When a seated table is ready for the bill, click it and tap "Drop Bill". The table colour changes from red to amber, signalling to the rest of the team that this table is in its final stage. Any notes you add at this point are saved to the reservation record.',
        tips: [
          'Drop the bill in the system at the same time you deliver the physical bill — it keeps everything in sync.',
          'Amber tables are the best candidates when you need to quote wait times for incoming guests.',
        ],
        order: 4,
      },
      {
        id: 'fp-mark-left',
        title: 'Marking a Guest as Left',
        content:
          'Once a billed table has been cleared, click it and tap "Mark Left". The table returns to green, indicating it is available for the next guest. The reservation status moves to COMPLETED and the turn is recorded for reporting purposes.',
        tips: [
          'Mark tables as left promptly — delayed updates cause the host to turn away walk-ins unnecessarily.',
          'Make sure the table is actually cleared and reset before marking it as available.',
        ],
        order: 5,
      },
      {
        id: 'fp-combine',
        title: 'Combining Tables',
        content:
          'For large parties that need more space, use the Combine button on the floor plan. Tap two or more adjacent tables and confirm the combination. The combined tables act as a single unit for reservation purposes. You can split them back apart when the party leaves.',
        tips: [
          'Pre-combine tables before a large-party reservation arrives so the floor is ready.',
          'Remember to split tables back after the event to restore normal capacity.',
        ],
        order: 6,
      },
      {
        id: 'fp-block',
        title: 'Blocking and Unblocking',
        content:
          'Blocked tables appear grey on the floor plan and are excluded from availability calculations. Use blocking for maintenance, private holds, or any reason a table should not be seated. Unblock the table when it is ready to return to service.',
        tips: [
          'Add a note when blocking so other staff know why the table is unavailable.',
          'Review blocked tables at the start of each shift — some may have been forgotten.',
          'Only floor managers should block tables to prevent accidental capacity loss.',
        ],
        order: 7,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 4. Functions and Events
  // -----------------------------------------------------------------------
  {
    id: 'functions-and-events',
    title: 'Functions and Events',
    description:
      'Learn how to manage private events, weddings, and corporate functions from inquiry through to completion, including proposals, menus, and payments.',
    role: 'venue_manager',
    icon: 'PartyPopper',
    estimatedMinutes: 8,
    cards: [
      {
        id: 'fn-what',
        title: 'What are Functions?',
        content:
          'Functions are private events such as weddings, corporate dinners, birthday celebrations, and product launches. They are managed separately from regular reservations because they involve bespoke menus, beverage packages, venue space allocation, and multi-stage payment workflows. The Functions module gives you a dedicated workspace for every event.',
        tips: [
          'Keep functions and regular reservations separate — they have different workflows and timelines.',
          'Use the Functions module even for smaller private bookings to maintain a consistent process.',
        ],
        navLink: '/reservation/functions',
        order: 1,
      },
      {
        id: 'fn-inquiry',
        title: 'Creating a Function Inquiry',
        content:
          'A function inquiry can be created by staff through the internal form or by a client through the public inquiry widget. The form captures the event type, preferred date, estimated guest count, budget range, and any special requirements. Once submitted, the inquiry appears on your pipeline for follow-up.',
        tips: [
          'Respond to new inquiries within 24 hours — speed of response strongly influences conversion.',
          'Capture as much detail as possible up front to avoid lengthy back-and-forth later.',
        ],
        navLink: '/reservation/functions/new',
        order: 2,
      },
      {
        id: 'fn-lifecycle',
        title: 'The Function Lifecycle',
        content:
          'Every function progresses through defined stages: ENQUIRY, QUOTED, CONFIRMED, DEPOSIT_PAID, FULLY_PAID, and COMPLETED. Each stage has clear entry criteria and the system advances automatically when conditions are met — for example, recording a deposit payment moves the function from CONFIRMED to DEPOSIT_PAID.',
        tips: [
          'Use the lifecycle stages to identify where your pipeline is stalling.',
          'Set internal deadlines for each stage to keep events moving forward.',
        ],
        order: 3,
      },
      {
        id: 'fn-proposal',
        title: 'Building a Proposal',
        content:
          'The proposal editor uses a dual-pane layout. On the left you build the proposal by adding menu packages, beverage options, venue spaces, and custom line items. On the right you see a live preview exactly as the client will see it. This makes it easy to assemble polished, branded proposals without leaving the system.',
        tips: [
          'Use the preview pane to proofread before sending — clients notice formatting issues.',
          'Save proposal templates for common event types to speed up future quotes.',
          'Add a personal note at the top of every proposal for a professional touch.',
        ],
        navLink: '/reservation/functions',
        order: 4,
      },
      {
        id: 'fn-menus',
        title: 'Menu Templates',
        content:
          'Menu templates are pre-built packages that you can drop into any proposal. Each template includes courses, items, and per-head pricing. You can create templates for different cuisines, dietary styles, or price points, and customise them per event after adding them to a proposal.',
        tips: [
          'Maintain at least three menu tiers — good, better, best — to suit different budgets.',
          'Review and update pricing quarterly so proposals always reflect current costs.',
        ],
        navLink: '/reservation/venueflow/menus',
        order: 5,
      },
      {
        id: 'fn-beverages',
        title: 'Beverage Packages',
        content:
          'Beverage packages come in tiers — Standard, Premium, and Premium+ — and are priced per head for a set duration. Each package lists the included wines, beers, spirits, and non-alcoholic options. Like menu templates, beverage packages can be customised per event once added to a proposal.',
        tips: [
          'Always confirm the package duration with the client — it is a common point of confusion.',
          'Offer a non-alcoholic package option to accommodate all guests.',
        ],
        navLink: '/reservation/venueflow/beverages',
        order: 6,
      },
      {
        id: 'fn-send-proposal',
        title: 'Sending Proposals',
        content:
          'When a proposal is ready, generate a share link and send it to the client. They will open a branded landing page showing every detail of the proposal. Clients can accept the proposal, request changes, or leave comments — all of which are tracked in the system for your review.',
        tips: [
          'Follow up within 48 hours of sending a proposal if you have not received a response.',
          'Mention a specific highlight of the proposal in your follow-up message to re-engage the client.',
        ],
        order: 7,
      },
      {
        id: 'fn-payments',
        title: 'Recording Payments',
        content:
          'Record deposit and final payments directly in the function record. When a deposit is recorded, the function status automatically advances to DEPOSIT_PAID. When the remaining balance is paid, the status moves to FULLY_PAID. This ensures your pipeline always reflects the true financial state of every event.',
        tips: [
          'Record payments immediately when received so the pipeline stays accurate.',
          'Set payment reminders for upcoming due dates to avoid last-minute chasing.',
        ],
        order: 8,
      },
      {
        id: 'fn-crm',
        title: 'The Functions CRM',
        content:
          'The Functions CRM tracks client relationships across multiple events. Each client profile includes an activity timeline showing every inquiry, proposal, booking, and communication. This context helps you provide a seamless experience for repeat clients and identify upsell opportunities.',
        tips: [
          'Log every phone call and meeting in the activity timeline for full team visibility.',
          'Review past event details before client meetings to personalise your approach.',
        ],
        navLink: '/reservation/functions/crm',
        order: 9,
      },
      {
        id: 'fn-spaces',
        title: 'Venue Spaces',
        content:
          'Venue spaces represent the physical areas available for private events — rooms, gardens, terraces, and more. Each space has a defined capacity, list of amenities, and availability calendar. When building a proposal, you assign one or more spaces to the event so capacity and scheduling are managed automatically.',
        tips: [
          'Keep space amenities lists up to date — clients often choose based on what is included.',
          'Block spaces on the calendar as soon as a deposit is paid to prevent double-booking.',
        ],
        navLink: '/reservation/functions/spaces',
        order: 10,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 5. VenueFlow Pipeline
  // -----------------------------------------------------------------------
  {
    id: 'venueflow-pipeline',
    title: 'VenueFlow Pipeline',
    description:
      'Master the VenueFlow sales CRM. Manage your event inquiry pipeline, track leads, nurture referrals, and measure conversion performance.',
    role: 'venue_manager',
    icon: 'Kanban',
    estimatedMinutes: 6,
    cards: [
      {
        id: 'vf-what',
        title: 'What is VenueFlow?',
        content:
          'VenueFlow is the built-in sales CRM designed specifically for venue event inquiries. It provides a visual pipeline kanban, lead management tools, referral tracking, and detailed analytics. Think of it as your sales hub for all event-related revenue.',
        tips: [
          'Check VenueFlow at the start of each business day to review new inquiries and pending follow-ups.',
          'Use VenueFlow alongside the Functions module — they work together seamlessly.',
        ],
        navLink: '/reservation/venueflow/pipeline',
        order: 1,
      },
      {
        id: 'vf-kanban',
        title: 'The Pipeline Kanban',
        content:
          'The kanban board visualises every deal as a card that you drag through stages: INQUIRY, SITE_VISIT, PROPOSAL, DEPOSIT, CONFIRMED, PRE_EVENT, EVENT_DAY, POST_EVENT, and COMPLETED. Each card shows the client name, event date, estimated value, and temperature indicator. Moving a card updates its status system-wide.',
        tips: [
          'Review the kanban weekly to ensure no deals are stuck in a single stage for too long.',
          'Use the temperature indicator (hot, warm, cold) to prioritise your follow-up list.',
          'Drag-and-drop is the fastest way to update deal status during pipeline review meetings.',
        ],
        order: 2,
      },
      {
        id: 'vf-add-inquiry',
        title: 'Adding New Inquiries',
        content:
          'New inquiries can be added via the quick-add button on the kanban or through a detailed form. At minimum, capture the client name, event type, preferred date, and estimated guest count. Set the temperature to hot, warm, or cold based on your assessment of likelihood to convert, and enter the estimated deal value for pipeline forecasting.',
        tips: [
          'Use quick-add for speed during phone calls, then fill in details afterward.',
          'Always set a follow-up date when adding a new inquiry so nothing falls through the cracks.',
        ],
        order: 3,
      },
      {
        id: 'vf-leads',
        title: 'Lead Management',
        content:
          'The leads view helps you track where inquiries come from and how effectively you convert them. Each lead captures the source channel, initial contact date, follow-up reminders, and conversion status. Filter and sort leads to focus your energy on the highest-potential opportunities.',
        tips: [
          'Tag every lead with its source so you can measure which marketing channels deliver results.',
          'Set follow-up reminders for every active lead — consistency is the key to conversion.',
        ],
        navLink: '/reservation/venueflow/leads',
        order: 4,
      },
      {
        id: 'vf-referrals',
        title: 'Referral Tracking',
        content:
          'Word-of-mouth is one of the most powerful lead sources for venues. The referral tracking feature lets you record who referred each new inquiry, building a clear picture of your referral network. Over time, this data reveals your most valuable advocates and helps you nurture those relationships.',
        tips: [
          'Always ask new inquiries how they heard about you and log the answer.',
          'Thank referrers promptly — a quick email or call strengthens the relationship.',
        ],
        navLink: '/reservation/venueflow/referrals',
        order: 5,
      },
      {
        id: 'vf-reactivation',
        title: 'Client Reactivation',
        content:
          'Past event clients are your warmest leads for repeat business. The reactivation tool surfaces clients who have not booked in a defined period and helps you reach out with tailored offers. Reactivation campaigns can be run manually or scheduled to trigger automatically based on time since last event.',
        tips: [
          'Reach out to past clients around the anniversary of their last event — it feels personal.',
          'Offer a small incentive for rebooking, such as a complimentary beverage upgrade.',
        ],
        navLink: '/reservation/venueflow/reactivation',
        order: 6,
      },
      {
        id: 'vf-automations',
        title: 'Automations',
        content:
          'VenueFlow automations handle repetitive communication so you can focus on high-value tasks. Configure automated thank-you emails after inquiries, follow-up reminders at defined intervals, and post-event surveys to gather feedback. Each automation can be customised with your branding and messaging.',
        tips: [
          'Start with three core automations: inquiry acknowledgement, follow-up reminder, and post-event survey.',
          'Personalise automated messages with merge fields like client name and event date.',
          'Review automation performance monthly and adjust timing or messaging as needed.',
        ],
        navLink: '/reservation/venueflow/automations',
        order: 7,
      },
      {
        id: 'vf-analytics',
        title: 'Pipeline Analytics',
        content:
          'The analytics dashboard gives you a data-driven view of your sales performance. Key metrics include conversion funnels, average deal value, stage duration, and win/loss rates. Use these insights to identify bottlenecks in your pipeline and make informed decisions about where to focus your effort.',
        tips: [
          'Track stage duration to find where deals stall — that is your biggest improvement opportunity.',
          'Compare monthly conversion rates to measure the impact of process changes.',
        ],
        navLink: '/reservation/venueflow/analytics',
        order: 8,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 6. Reports and Analytics
  // -----------------------------------------------------------------------
  {
    id: 'reports-and-analytics',
    title: 'Reports and Analytics',
    description:
      'Understand your venue\'s performance through data. Generate reports, configure automated email summaries, and learn which metrics matter most.',
    role: 'venue_manager',
    icon: 'BarChart3',
    estimatedMinutes: 4,
    cards: [
      {
        id: 'ra-overview',
        title: 'Reports Overview',
        content:
          'The reports section lets you generate detailed reports for any date range. Choose from reservation summaries, revenue breakdowns, guest analytics, and operational metrics. Every report can be exported to CSV or PDF for sharing with stakeholders or for your own records.',
        tips: [
          'Run a weekly summary report every Monday morning to review the previous week.',
          'Export PDF reports for owner or investor meetings — they are formatted and ready to present.',
        ],
        navLink: '/reservation/reports/generate',
        order: 1,
      },
      {
        id: 'ra-email-reports',
        title: 'Configuring Email Reports',
        content:
          'Set up automated report emails so key metrics land in your inbox without manual effort. Choose a daily, weekly, or monthly cadence and select which reports to include. Multiple team members can subscribe to the same report schedule with their own email addresses.',
        tips: [
          'Start with a daily covers summary and a weekly revenue breakdown.',
          'Add your general manager to the weekly email so they stay informed without logging in.',
        ],
        navLink: '/reservation/venueflow/reports',
        order: 2,
      },
      {
        id: 'ra-venueflow-analytics',
        title: 'VenueFlow Analytics',
        content:
          'VenueFlow analytics focus specifically on your event sales pipeline. Key visuals include pipeline value by stage, conversion rates by source, and revenue trends over time. Use this dashboard to understand the health of your events business and forecast future revenue.',
        tips: [
          'Compare revenue by source to allocate your marketing budget where it delivers the best return.',
          'Track month-over-month pipeline value to spot seasonal trends early.',
        ],
        navLink: '/reservation/venueflow/analytics',
        order: 3,
      },
      {
        id: 'ra-efficiency',
        title: 'Efficiency Audit',
        content:
          'The efficiency audit scores your venue across key operational dimensions such as table turn time, no-show rate, and peak-hour utilisation. Each dimension receives a score along with actionable recommendations. Run the audit monthly to track improvement over time.',
        tips: [
          'Focus on one or two low-scoring dimensions each month rather than trying to fix everything at once.',
          'Share audit results with the team — transparency drives collective improvement.',
        ],
        navLink: '/reservation/reports/efficiency',
        order: 4,
      },
      {
        id: 'ra-understanding-data',
        title: 'Understanding Your Data',
        content:
          'The most important metrics to track are total covers, average turn time, no-show rate, channel mix, and peak hours. Covers tells you volume, turn time tells you efficiency, no-show rate tells you reliability, channel mix tells you where bookings originate, and peak hours tell you when to staff up. Together, these five metrics give you a complete operational picture.',
        tips: [
          'Benchmark your no-show rate — anything above five percent warrants action.',
          'Use channel mix data to decide whether to invest more in online or phone bookings.',
          'Overlay peak hours with staffing schedules to ensure you are never under-resourced.',
        ],
        order: 5,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // 7. Public Widgets
  // -----------------------------------------------------------------------
  {
    id: 'public-widgets',
    title: 'Public Widgets',
    description:
      'Set up and customise the guest-facing booking and inquiry widgets that live on your website. Control appearance, behaviour, and content.',
    role: 'venue_manager',
    icon: 'Globe',
    estimatedMinutes: 4,
    cards: [
      {
        id: 'pw-booking-widget',
        title: 'The Booking Widget',
        content:
          'The booking widget is what your guests see when they make a reservation on your website. It guides them through a clean four-step wizard: choose a date, select a time slot, enter their details, and confirm the booking. The widget is fully branded to match your venue and works seamlessly on mobile devices.',
        tips: [
          'Test the widget on your phone before going live — mobile is the most common booking device.',
          'Keep the number of required fields to a minimum to reduce booking abandonment.',
        ],
        order: 1,
      },
      {
        id: 'pw-config-booking',
        title: 'Configuring the Booking Widget',
        content:
          'Customise the booking widget to match your brand and operational rules. Set your accent colours, upload your logo, define available time slots, configure party size limits, and optionally require a deposit for large bookings. All changes are reflected immediately on the live widget.',
        tips: [
          'Match your widget colours to your website for a seamless guest experience.',
          'Set a maximum party size that aligns with your largest available table configuration.',
          'Enable deposits for parties above a certain size to reduce no-shows.',
        ],
        navLink: '/reservation/widget',
        order: 2,
      },
      {
        id: 'pw-function-widget',
        title: 'The Function Inquiry Widget',
        content:
          'The function inquiry widget is a six-step wizard designed to capture all the details you need to quote an event. Guests provide the event type, preferred date and time, estimated headcount, space preferences, catering requirements, and contact information. Submissions flow directly into your VenueFlow pipeline.',
        tips: [
          'Link to the function widget from your venue website events page for maximum visibility.',
          'Review incoming function inquiries daily — they represent high-value opportunities.',
        ],
        navLink: '/reservation/function-widget',
        order: 3,
      },
      {
        id: 'pw-faq',
        title: 'Widget FAQ Configuration',
        content:
          'Add frequently asked questions to your booking widget so guests can find answers without contacting your team. Common topics include cancellation policy, dress code, parking, dietary accommodations, and accessibility. A well-maintained FAQ section reduces inbound calls and improves the guest experience.',
        tips: [
          'Start with the five questions your host team answers most often.',
          'Keep answers concise — guests scan rather than read.',
          'Update the FAQ seasonally to address time-specific questions like holiday hours.',
        ],
        order: 4,
      },
      {
        id: 'pw-embed',
        title: 'Embedding on Your Website',
        content:
          'To add the widget to your website, copy the embed code snippet from the configuration screen and paste it into your site\'s HTML. The snippet works with any website platform including WordPress, Squarespace, Wix, and custom-built sites. The widget loads asynchronously so it will not slow down your page.',
        tips: [
          'Place the booking widget on your homepage and your dedicated reservations page.',
          'Ask your web developer to test the embed on all major browsers before launch.',
          'The embed code only needs to be added once — all future configuration changes apply automatically.',
        ],
        order: 5,
      },
    ],
  },
];
