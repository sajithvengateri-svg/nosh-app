// =============================================================================
// Help Documentation Data — ResOS In-App Help Center
// Pure static data file. No project imports.
// =============================================================================

export interface HelpContentBlock {
  type: 'heading' | 'paragraph' | 'steps' | 'tip' | 'warning' | 'table';
  content: string;
  items?: string[];
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  category: 'getting-started' | 'workflow' | 'feature' | 'troubleshooting' | 'faq';
  content: HelpContentBlock[];
  relatedArticles: string[];
  keywords: string[];
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: HelpArticle[];
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

// =============================================================================
// HELP SECTIONS
// =============================================================================

export const HELP_SECTIONS: HelpSection[] = [
  // ---------------------------------------------------------------------------
  // Section 1: VenueFlow
  // ---------------------------------------------------------------------------
  {
    id: 'venueflow',
    title: 'VenueFlow',
    description:
      'Manage your event sales pipeline from initial inquiry through to completed events using the VenueFlow CRM.',
    icon: 'Building2',
    articles: [
      {
        id: 'vf-getting-started',
        title: 'Getting Started with VenueFlow',
        summary:
          'Learn how VenueFlow helps manage your event sales pipeline from first inquiry to final payment.',
        category: 'getting-started',
        content: [
          {
            type: 'heading',
            content: 'What is VenueFlow?',
          },
          {
            type: 'paragraph',
            content:
              'VenueFlow is the built-in CRM and sales pipeline that helps your venue track every function inquiry from the moment it arrives to the day the event wraps up. Think of it as a bird\'s-eye view of all your upcoming events, their revenue potential, and where each deal sits in the sales process. Whether you handle five events a month or fifty, VenueFlow keeps everything organised in one place so nothing slips through the cracks.',
          },
          {
            type: 'steps',
            content: 'How to start using VenueFlow',
            items: [
              'Navigate to VenueFlow from the main sidebar menu.',
              'Review the Today view to see a snapshot of upcoming events and key metrics.',
              'Open the Pipeline tab to see your deals organised across stages.',
              'Click any deal card to view its full details, timeline, and attached documents.',
              'Use the Calendar tab to visualise events on a monthly or weekly view.',
            ],
          },
          {
            type: 'tip',
            content:
              'Start by entering any existing event inquiries you already have so the pipeline reflects your real workload from day one. This also helps you get comfortable with the interface before new inquiries start flowing in.',
          },
        ],
        relatedArticles: ['vf-pipeline-stages', 'vf-dashboard'],
        keywords: ['venueflow', 'pipeline', 'events', 'sales', 'CRM'],
      },
      {
        id: 'vf-pipeline-stages',
        title: 'Understanding Pipeline Stages',
        summary:
          'Learn about each stage in the VenueFlow sales pipeline and how deals progress through them.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Pipeline Stages Overview',
          },
          {
            type: 'paragraph',
            content:
              'Every function deal in VenueFlow moves through a series of stages that mirror the real-world sales process for venue events. Each stage represents a meaningful milestone — from the first phone call or web inquiry, all the way through to post-event follow-up. Understanding these stages helps your team stay aligned on where every deal stands and what action is needed next.',
          },
          {
            type: 'table',
            content:
              'Stage | Description\nINQUIRY | A new lead has expressed interest in hosting an event at your venue. This is the starting point for every deal.\nSITE_VISIT | The prospective client has been invited to or has completed a site visit to see your spaces in person.\nPROPOSAL | A formal proposal has been created and sent to the client with pricing, menus, and event details.\nDEPOSIT | The client has accepted the proposal and a deposit payment has been recorded to secure the date.\nCONFIRMED | The event is fully confirmed with all details locked in. Preparation can begin.\nPRE_EVENT | Final preparations are underway — run sheets, staff assignments, and vendor coordination.\nEVENT_DAY | The event is happening today. Real-time management and on-the-day coordination.\nPOST_EVENT | The event has concluded. Time for final invoicing, feedback collection, and thank-you messages.\nCOMPLETED | All payments settled and the deal is closed. The event is archived for reporting.\nLOST | The deal did not convert. Recording the reason helps improve future win rates.',
          },
          {
            type: 'tip',
            content:
              'You can drag deal cards between columns on the Kanban board to advance them through stages, or use the detail panel to update the stage with notes explaining the change.',
          },
        ],
        relatedArticles: ['vf-getting-started', 'vf-dashboard', 'wf-function'],
        keywords: ['pipeline', 'stages', 'kanban', 'deals', 'inquiry'],
      },
      {
        id: 'vf-dashboard',
        title: 'Using the VenueFlow Dashboard',
        summary:
          'Navigate the VenueFlow today view and key metrics to stay on top of your event business.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'The VenueFlow Dashboard',
          },
          {
            type: 'paragraph',
            content:
              'The VenueFlow Dashboard is the first screen you see when you open VenueFlow. It provides an at-a-glance summary of your event pipeline — how many deals are active, their combined revenue, upcoming events, and any items that need attention today. It is designed so a venue manager can open it each morning and immediately know what needs doing.',
          },
          {
            type: 'steps',
            content: 'Viewing and using dashboard metrics',
            items: [
              'Open VenueFlow from the sidebar to land on the Today view.',
              'Review the summary cards at the top: total active deals, pipeline value, events this week, and conversion rate.',
              'Check the "Needs Attention" section for deals that require follow-up or have overdue tasks.',
              'Click any metric card to drill down into the underlying deals.',
              'Use the date range selector to compare performance across different periods.',
            ],
          },
          {
            type: 'tip',
            content:
              'Make reviewing the VenueFlow Dashboard part of your morning routine. A quick two-minute check ensures you never miss a follow-up or let a hot lead go cold.',
          },
        ],
        relatedArticles: ['vf-getting-started', 'vf-pipeline-stages', 'gr-analytics'],
        keywords: ['dashboard', 'metrics', 'today', 'overview'],
      },
      {
        id: 'vf-calendar',
        title: 'VenueFlow Calendar',
        summary:
          'View and manage upcoming events on the calendar to avoid double-bookings and plan ahead.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Calendar View for Events',
          },
          {
            type: 'paragraph',
            content:
              'The VenueFlow Calendar gives you a visual timeline of all your confirmed, tentative, and completed events. It helps you spot availability gaps, prevent double-bookings on the same space, and plan staffing well in advance. Events are colour-coded by stage so you can see at a glance which are locked in and which still need confirmation.',
          },
          {
            type: 'steps',
            content: 'Using the VenueFlow Calendar',
            items: [
              'Navigate to VenueFlow > Calendar from the sidebar or the tab bar within VenueFlow.',
              'Toggle between monthly and weekly views depending on how far ahead you need to plan.',
              'Click on any event block to open its deal detail panel.',
              'Use the room filter dropdown to view events for a specific space only.',
              'Click on an empty date to quickly create a new deal for that day.',
            ],
          },
          {
            type: 'tip',
            content:
              'If you manage multiple rooms, use the room filter to check availability for a specific space before promising a date to a prospective client on the phone.',
          },
        ],
        relatedArticles: ['vf-dashboard', 'vs-rooms', 'wf-function'],
        keywords: ['calendar', 'events', 'schedule', 'dates'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 2: Venue Setup
  // ---------------------------------------------------------------------------
  {
    id: 'venue-setup',
    title: 'Venue Setup',
    description:
      'Configure your venue\'s rooms, menu templates, and beverage packages so proposals and bookings are ready to go.',
    icon: 'Settings2',
    articles: [
      {
        id: 'vs-rooms',
        title: 'Managing Rooms and Spaces',
        summary:
          'Set up and manage your venue\'s rooms, gardens, and event spaces so they appear in proposals and calendars.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Rooms and Spaces',
          },
          {
            type: 'paragraph',
            content:
              'Every venue has distinct spaces — a main dining room, a private function room, an outdoor garden, a rooftop terrace. In ResOS, each of these is set up as a "Space" with its own capacity, amenities, photos, and pricing. Spaces are used throughout the system: in proposals, on the calendar, in the booking widget, and on the floor plan. Getting them right from the start means less manual work later.',
          },
          {
            type: 'steps',
            content: 'Adding a new space',
            items: [
              'Go to Settings > Venue Setup > Rooms & Spaces.',
              'Click the "Add Space" button.',
              'Enter the space name (e.g., "The Garden Terrace").',
              'Set the minimum and maximum capacity for seated and standing configurations.',
              'Add amenities such as AV equipment, natural light, private bar, or dance floor.',
              'Upload photos that will be used in proposals and the public website.',
              'Set any minimum spend or hire fee if applicable.',
              'Click Save to make the space available across the system.',
            ],
          },
          {
            type: 'tip',
            content:
              'Include accurate capacity numbers and a complete amenity list for every space. This information is pulled directly into proposals, saving your events team from retyping details for every client.',
          },
        ],
        relatedArticles: ['vs-menus', 'vs-beverages', 'vf-calendar'],
        keywords: ['rooms', 'spaces', 'venue', 'capacity', 'amenities'],
      },
      {
        id: 'vs-menus',
        title: 'Creating Menu Templates',
        summary:
          'Build reusable menu templates for function proposals so your team can assemble quotes in minutes.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Menu Templates',
          },
          {
            type: 'paragraph',
            content:
              'Menu templates let you predefine food packages that can be dropped into any function proposal with a single click. Each template includes a name, description, per-head price, and a list of courses with individual items. You can create as many templates as you need — from a simple canape package to a five-course degustation — and update them seasonally without affecting past proposals.',
          },
          {
            type: 'steps',
            content: 'Creating a menu template',
            items: [
              'Navigate to Settings > Venue Setup > Menu Templates.',
              'Click "New Template" and give it a clear name (e.g., "3-Course Autumn Menu").',
              'Set the per-head price for this menu package.',
              'Add courses (Entree, Main, Dessert, etc.) and list the items under each course.',
              'Optionally add dietary notes or alternate options for guests with restrictions.',
              'Save the template. It will now appear in the proposal builder when quoting events.',
            ],
          },
          {
            type: 'tip',
            content:
              'Create a "Base" template for your most popular package and duplicate it each season. This way you only need to swap out a few dishes rather than starting from scratch.',
          },
        ],
        relatedArticles: ['vs-rooms', 'vs-beverages', 'wf-function'],
        keywords: ['menus', 'templates', 'food', 'packages', 'pricing', 'per-head'],
      },
      {
        id: 'vs-beverages',
        title: 'Setting Up Beverage Packages',
        summary:
          'Create beverage packages for events with per-head pricing that plug directly into proposals.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Beverage Packages',
          },
          {
            type: 'paragraph',
            content:
              'Beverage packages work similarly to menu templates but are focused on drinks. You can define packages that include beer, wine, spirits, soft drinks, and cocktails with a per-head price and a duration (e.g., 3-hour or 5-hour beverage package). These packages appear in the proposal builder alongside your food menus, making it easy to assemble a complete event quote.',
          },
          {
            type: 'steps',
            content: 'Creating a beverage package',
            items: [
              'Go to Settings > Venue Setup > Beverage Packages.',
              'Click "New Package" and enter a name (e.g., "Premium 4-Hour Package").',
              'Set the per-head price and the package duration in hours.',
              'Add categories: Beer, Wine, Spirits, Non-Alcoholic, Cocktails.',
              'List specific brands or descriptions under each category.',
              'Save. The package is now available in the proposal builder.',
            ],
          },
          {
            type: 'tip',
            content:
              'Offering two or three tiered packages (Standard, Premium, Deluxe) gives clients clear options and makes upselling straightforward during the proposal stage.',
          },
        ],
        relatedArticles: ['vs-menus', 'vs-rooms', 'wf-function'],
        keywords: ['beverages', 'drinks', 'packages', 'wine', 'beer', 'spirits'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 3: Reservations
  // ---------------------------------------------------------------------------
  {
    id: 'reservations',
    title: 'Reservations',
    description:
      'Everything about creating, managing, and completing restaurant reservations — from booking to departure.',
    icon: 'CalendarCheck',
    articles: [
      {
        id: 'res-creating',
        title: 'Creating Reservations',
        summary:
          'How to create reservations via the staff form or the public booking widget on your website.',
        category: 'getting-started',
        content: [
          {
            type: 'heading',
            content: 'Staff-Side Booking',
          },
          {
            type: 'steps',
            content: 'Creating a reservation from the staff interface',
            items: [
              'Navigate to Reservations and click the "New Reservation" button (or use the keyboard shortcut).',
              'Fill in the reservation form: select the date, time, and party size.',
              'Search for the guest by name, phone, or email. If they are a returning guest, their profile will auto-populate. For new guests, enter their details.',
              'Assign a table from the available options. The system highlights tables that fit the party size.',
              'Add any special notes — dietary requirements, celebrations, accessibility needs.',
              'Click Save to confirm the reservation. A confirmation is sent to the guest if auto-confirmations are enabled.',
            ],
          },
          {
            type: 'heading',
            content: 'Public Widget Booking',
          },
          {
            type: 'paragraph',
            content:
              'Guests can also book directly through the booking widget embedded on your website. They select a date, choose an available time slot, enter their details, and confirm. The reservation appears in your system in real time with the status set to CONFIRMED (or ENQUIRY if you require manual approval). This reduces phone calls and lets guests book 24/7.',
          },
          {
            type: 'tip',
            content:
              'Enable auto-confirmation for standard bookings to reduce manual work. You can still require approval for large parties or peak nights by setting party size thresholds in your widget configuration.',
          },
        ],
        relatedArticles: ['res-lifecycle', 'res-widget', 'res-floor'],
        keywords: ['reservation', 'booking', 'new', 'create', 'form', 'widget'],
      },
      {
        id: 'res-lifecycle',
        title: 'The Reservation Lifecycle',
        summary:
          'Understanding reservation statuses from enquiry to completion and how they transition.',
        category: 'workflow',
        content: [
          {
            type: 'heading',
            content: 'Reservation Lifecycle',
          },
          {
            type: 'paragraph',
            content:
              'Every reservation in ResOS follows a defined lifecycle. Understanding these statuses helps your front-of-house team communicate clearly, ensures accurate reporting, and powers automations like reminder emails and no-show tracking. Each status reflects a real-world state that the reservation is in at that moment.',
          },
          {
            type: 'table',
            content:
              'Status | Description\nENQUIRY | The reservation has been requested but not yet confirmed by the venue. Used for large parties or peak nights that require manual review.\nCONFIRMED | The reservation is confirmed and the guest is expected. A table may or may not be pre-assigned.\nSEATED | The guest has arrived and has been seated at their table. The table status on the floor plan updates to red.\nCOMPLETED | The guest has finished their visit, paid, and left. The table is freed and the reservation is archived.\nNO_SHOW | The guest did not arrive and the reservation was marked as a no-show. This is recorded on the guest profile.\nCANCELLED | The reservation was cancelled before the guest arrived, either by the guest or by staff.',
          },
          {
            type: 'steps',
            content: 'Typical reservation flow',
            items: [
              'Reservation is created with status ENQUIRY or CONFIRMED.',
              'If ENQUIRY, staff reviews and confirms — status moves to CONFIRMED.',
              'Guest arrives. Staff marks them as arrived and seats them — status moves to SEATED.',
              'Guest finishes dining and pays. Staff marks the table as left — status moves to COMPLETED.',
              'If the guest does not arrive within the grace period, staff marks the reservation as NO_SHOW.',
            ],
          },
          {
            type: 'warning',
            content:
              'Pay attention to guests with a history of no-shows. ResOS displays a warning banner when you create a new reservation for a guest who has two or more past no-shows. Consider requiring a deposit or confirmation call for these guests.',
          },
        ],
        relatedArticles: ['res-creating', 'res-floor', 'wf-reservation'],
        keywords: [
          'lifecycle',
          'status',
          'enquiry',
          'confirmed',
          'seated',
          'completed',
          'no-show',
          'cancelled',
        ],
      },
      {
        id: 'res-floor',
        title: 'Using the Floor Plan',
        summary:
          'Interactive floor map for managing tables during service — see status at a glance and seat guests fast.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'The Interactive Floor Plan',
          },
          {
            type: 'paragraph',
            content:
              'The Floor Plan is where front-of-house staff spend most of their time during service. It shows a visual map of your restaurant with every table represented as a coloured circle or rectangle. The colour indicates the table\'s current status so you can scan the room instantly and know what is happening at every table without walking the floor.',
          },
          {
            type: 'table',
            content:
              'Colour | Status | Meaning\nGreen | Available | The table is free and has no current or upcoming reservation assigned.\nBlue | Reserved | An upcoming reservation is assigned to this table. The guest has not arrived yet.\nRed | Seated | A guest is currently seated and dining at this table.\nAmber | Bill Dropped | The bill has been presented. The table is waiting for payment before being freed.\nGrey | Blocked | The table is blocked for maintenance, a reserved hold, or other reasons and is not available.',
          },
          {
            type: 'steps',
            content: 'Working with the floor plan during service',
            items: [
              'Click on any table to open its popover with details — reservation name, party size, time, and status.',
              'From the popover, take quick actions: Seat, Drop Bill, Mark as Left, Block, or Combine.',
              'To seat a walk-in, click any green (available) table and select "Seat Walk-In" from the popover.',
              'To advance a table, click a red (seated) table and select "Drop Bill" to move it to amber.',
              'Once payment is complete, click the amber table and select "Mark as Left" to free it back to green.',
            ],
          },
          {
            type: 'tip',
            content:
              'Keep the Floor Plan open on a tablet at your host stand during service. It gives the host an instant view of availability and lets them seat guests without running back to the office.',
          },
        ],
        relatedArticles: ['res-lifecycle', 'res-walkin', 'wf-service'],
        keywords: ['floor', 'plan', 'map', 'tables', 'colors', 'status', 'popover', 'seat'],
      },
      {
        id: 'res-diary',
        title: 'The Diary View',
        summary:
          'Timeline view of reservations grouped by time slot — ideal for planning and reviewing service.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Diary View',
          },
          {
            type: 'paragraph',
            content:
              'The Diary View presents your reservations on a timeline grouped by time slot. Each row represents a 15- or 30-minute block, and reservations appear as cards within their slot. This view is perfect for pre-service planning — you can see how covers are distributed across the evening, identify busy periods, and spot gaps where walk-ins could be accommodated.',
          },
          {
            type: 'steps',
            content: 'Using the Diary View effectively',
            items: [
              'Navigate to Reservations > Diary from the tab bar.',
              'Select the date you want to review using the date picker.',
              'Scan the timeline to see how reservations are spread across the service.',
              'Click any reservation card to open its detail panel where you can edit, reassign tables, or add notes.',
              'Use the covers summary at the top to see total covers per hour — this helps with kitchen and staff planning.',
            ],
          },
          {
            type: 'tip',
            content:
              'Before each service, review the Diary View to brief your team on expected covers, large parties, VIP guests, and any special requests noted on reservations.',
          },
        ],
        relatedArticles: ['res-creating', 'res-floor', 'wf-service'],
        keywords: ['diary', 'timeline', 'calendar', 'schedule', 'time slots'],
      },
      {
        id: 'res-walkin',
        title: 'Walk-In and Waitlist Management',
        summary:
          'Handle walk-in guests quickly and manage the waitlist during busy periods.',
        category: 'workflow',
        content: [
          {
            type: 'heading',
            content: 'Walk-In Flow',
          },
          {
            type: 'steps',
            content: 'Seating a walk-in guest',
            items: [
              'Click the "Walk-In" button on the floor plan toolbar (or use the keyboard shortcut).',
              'Enter the party size and optionally the guest\'s name and phone number.',
              'The system highlights available tables that fit the party. Select one.',
              'Click "Seat & Close" to seat the guest and return to the floor plan.',
              'Alternatively, click "Seat & Next" to seat this guest and immediately open the dialog for the next walk-in — ideal during a rush.',
            ],
          },
          {
            type: 'heading',
            content: 'Waitlist Management',
          },
          {
            type: 'steps',
            content: 'Managing the waitlist',
            items: [
              'If no suitable tables are available, the Walk-In dialog shows an "Add to Waitlist" button. Click it.',
              'Enter the guest\'s name, phone number, and party size. An estimated wait time is calculated automatically.',
              'When a table becomes available, open the Waitlist panel and click "Notify" next to the guest\'s entry. An SMS is sent.',
              'Once the guest returns, click "Seat" to assign them a table and move them off the waitlist.',
              'If a guest leaves before being seated, click "Mark as Left" to remove them from the waitlist.',
            ],
          },
          {
            type: 'tip',
            content:
              'Use "Seat & Next" during the busiest periods. It keeps the walk-in dialog open so you can process a queue of arriving guests without clicking the Walk-In button each time.',
          },
        ],
        relatedArticles: ['res-floor', 'res-creating', 'wf-service'],
        keywords: ['walk-in', 'walkin', 'waitlist', 'queue', 'no tables', 'waiting'],
      },
      {
        id: 'res-widget',
        title: 'The Booking Widget',
        summary:
          'How guests book through your website\'s booking widget — the 4-step guest journey.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Guest Booking Widget',
          },
          {
            type: 'paragraph',
            content:
              'The booking widget is a lightweight form that you embed on your restaurant\'s website. It allows guests to book a table 24/7 without needing to call. The widget follows a simple four-step flow: the guest selects a date, picks an available time slot, enters their details, and confirms the reservation. The booking appears in your system immediately, reducing admin effort and capturing bookings you might otherwise miss after hours.',
          },
          {
            type: 'steps',
            content: 'The guest journey through the widget',
            items: [
              'Step 1 — Date: The guest selects their preferred date from a calendar. Unavailable dates (fully booked or closed days) are greyed out.',
              'Step 2 — Time & Party Size: Available time slots are shown based on the date and party size selected. The guest picks the slot that works for them.',
              'Step 3 — Details: The guest enters their name, phone number, email, and any special requests or dietary notes.',
              'Step 4 — Confirm: The guest reviews their booking summary and clicks Confirm. A confirmation message is displayed, and an email or SMS is sent.',
            ],
          },
          {
            type: 'tip',
            content:
              'Add a direct link to the booking widget in your Google Business Profile, Instagram bio, and email signature. The easier you make it for guests to find, the more online bookings you will receive.',
          },
        ],
        relatedArticles: ['res-creating', 'on-booking-widget', 'res-lifecycle'],
        keywords: ['widget', 'booking', 'online', 'website', 'embed', 'public'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 4: Growth
  // ---------------------------------------------------------------------------
  {
    id: 'growth',
    title: 'Growth',
    description:
      'Tools for lead management, referral tracking, client reactivation, and performance analytics.',
    icon: 'TrendingUp',
    articles: [
      {
        id: 'gr-leads',
        title: 'Lead Management',
        summary:
          'Track and nurture potential event clients from first contact to confirmed booking.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Managing Leads',
          },
          {
            type: 'paragraph',
            content:
              'Not every inquiry converts on the first call. The Lead Management module lets you capture prospective clients, record their event requirements, schedule follow-ups, and track the conversation over time. Leads can be imported in bulk via CSV or added manually. Once a lead converts, they flow directly into VenueFlow as a deal.',
          },
          {
            type: 'steps',
            content: 'Adding and following up on leads',
            items: [
              'Go to Growth > Leads and click "Add Lead".',
              'Enter the contact details: name, email, phone, company, and event type.',
              'Set a follow-up date and assign the lead to a team member if needed.',
              'Add notes from your initial conversation — budget, preferred dates, event style.',
              'When the follow-up date arrives, a task appears on your dashboard. Call or email the lead.',
              'Once the lead is ready, click "Convert to Deal" to create a VenueFlow pipeline entry.',
            ],
          },
          {
            type: 'tip',
            content:
              'Follow up within 24 hours of receiving an inquiry. Venues that respond quickly are significantly more likely to win the booking, especially for weddings and corporate events.',
          },
        ],
        relatedArticles: ['gr-referrals', 'gr-analytics', 'vf-getting-started'],
        keywords: ['leads', 'nurture', 'follow-up', 'sales', 'prospects'],
      },
      {
        id: 'gr-referrals',
        title: 'Referral Tracking',
        summary:
          'Track word-of-mouth referrals and understand which sources drive the most event bookings.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Referral Tracking',
          },
          {
            type: 'paragraph',
            content:
              'Word-of-mouth is one of the most powerful channels for venue bookings. The Referral Tracking feature lets you record how each lead or deal heard about you — whether it was a past client, a wedding planner, a Google search, or social media. Over time, this data reveals which referral sources generate the most revenue, helping you focus your marketing budget.',
          },
          {
            type: 'steps',
            content: 'Tracking referrals',
            items: [
              'When adding a new lead or deal, select the referral source from the dropdown or add a new one.',
              'For past-client referrals, link the referring guest from your Guest Database for a complete chain.',
              'View the Referral Report under Growth > Referrals to see total bookings and revenue per source.',
              'Filter by date range to compare referral performance across seasons or campaigns.',
            ],
          },
          {
            type: 'tip',
            content:
              'Always ask new inquiries how they heard about you and record it consistently. Even a simple "A friend recommended you" should be logged. Over a year, this data becomes incredibly valuable for marketing decisions.',
          },
        ],
        relatedArticles: ['gr-leads', 'gr-analytics', 'gu-database'],
        keywords: ['referrals', 'word-of-mouth', 'tracking', 'sources'],
      },
      {
        id: 'gr-reactivation',
        title: 'Client Reactivation',
        summary:
          'Re-engage past event clients and encourage repeat bookings at your venue.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Client Reactivation',
          },
          {
            type: 'paragraph',
            content:
              'Your past event clients are your warmest leads. They already know your venue, your team, and your quality of service. The Client Reactivation tool identifies past clients who haven\'t booked in a defined period and helps you reach out with a personalised message or offer. Repeat bookings are easier to close and often have higher average spend.',
          },
          {
            type: 'steps',
            content: 'Reactivating past clients',
            items: [
              'Navigate to Growth > Reactivation to see a list of past clients sorted by last event date.',
              'Filter by time since last booking (e.g., 6+ months, 12+ months) and event type.',
              'Select one or more clients and click "Send Reactivation" to send a templated email.',
              'Customize the message with seasonal offers, new menu highlights, or venue updates.',
              'Track open rates and responses from the Reactivation dashboard.',
            ],
          },
          {
            type: 'tip',
            content:
              'Time your reactivation campaigns around the client\'s original event anniversary. A message like "It\'s almost a year since your company\'s event with us — shall we start planning this year\'s?" feels personal and relevant.',
          },
        ],
        relatedArticles: ['gr-leads', 'gu-database', 'gr-analytics'],
        keywords: ['reactivation', 'past clients', 'repeat', 're-engage'],
      },
      {
        id: 'gr-analytics',
        title: 'Analytics and Reports',
        summary:
          'Understand your venue\'s performance with data — revenue, conversion rates, covers, and more.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Analytics and Reporting',
          },
          {
            type: 'paragraph',
            content:
              'The Analytics module provides a comprehensive view of your venue\'s performance across reservations and events. Key metrics include total revenue, average spend per cover, booking conversion rate, no-show percentage, busiest time slots, and referral source performance. Reports can be filtered by date range, space, and event type to answer specific business questions.',
          },
          {
            type: 'steps',
            content: 'Accessing and using reports',
            items: [
              'Navigate to Growth > Analytics from the sidebar.',
              'Select a date range using the picker at the top of the page.',
              'Review the summary cards: revenue, covers, average spend, conversion rate, and no-show rate.',
              'Scroll down for detailed charts: revenue over time, covers by day of week, and top referral sources.',
              'Click "Export" to download the report data as a CSV for use in spreadsheets or presentations.',
            ],
          },
          {
            type: 'tip',
            content:
              'Review your analytics monthly at a minimum. Compare month-over-month to spot trends early — a rising no-show rate, a dip in weekend covers, or a new referral source gaining traction. Data-driven decisions lead to better outcomes.',
          },
        ],
        relatedArticles: ['gr-leads', 'gr-referrals', 'vf-dashboard'],
        keywords: ['analytics', 'reports', 'metrics', 'data', 'performance', 'conversion'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 5: Guests
  // ---------------------------------------------------------------------------
  {
    id: 'guests',
    title: 'Guests',
    description:
      'Your central guest database — profiles, visit history, VIP tiers, and guest scoring.',
    icon: 'Users',
    articles: [
      {
        id: 'gu-database',
        title: 'The Guest Database',
        summary:
          'Central CRM for all your guests with profiles, contact details, and complete visit history.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Guest Database',
          },
          {
            type: 'paragraph',
            content:
              'The Guest Database is the single source of truth for every person who has dined at or inquired about your venue. Each guest has a profile with their name, phone, email, visit history, spend totals, dietary preferences, VIP status, and any notes your team has added. When a guest calls to book, searching their name instantly pulls up everything you need to provide a personalised experience.',
          },
          {
            type: 'steps',
            content: 'Searching and viewing guest profiles',
            items: [
              'Navigate to Guests from the main sidebar.',
              'Use the search bar to find a guest by name, phone number, or email address.',
              'Click on a guest to open their full profile.',
              'Review their visit history tab to see all past reservations, including dates, party sizes, tables, and outcomes.',
              'Check the notes section for any special requirements, preferences, or flags added by your team.',
              'Use the "Add Note" button to record new information after a conversation or visit.',
            ],
          },
          {
            type: 'tip',
            content:
              'Encourage your front-of-house team to add notes after each service — things like "prefers the corner booth", "allergic to shellfish", or "celebrating 10th anniversary". These small details create a memorable experience when the guest returns.',
          },
        ],
        relatedArticles: ['gu-vip', 'res-creating', 'gr-reactivation'],
        keywords: ['guests', 'database', 'CRM', 'profiles', 'search', 'contacts'],
      },
      {
        id: 'gu-vip',
        title: 'VIP Tiers and Guest Scoring',
        summary:
          'Identify and reward your best guests with VIP tiers and automatic guest scoring.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'VIP Tiers and Guest Scoring',
          },
          {
            type: 'paragraph',
            content:
              'Not all guests are created equal. Your regulars, high-spenders, and event clients deserve recognition. ResOS includes a VIP tier system and an automatic guest score that factors in visit frequency, total spend, and referral activity. VIP status is visible throughout the system — on reservation cards, the floor plan, and the guest profile — so your team always knows when a valued guest is in the house.',
          },
          {
            type: 'steps',
            content: 'Managing VIP status and viewing scores',
            items: [
              'Open a guest\'s profile from the Guest Database.',
              'In the VIP section, select the appropriate tier: Silver, Gold, or Platinum (or create custom tiers in Settings).',
              'View the guest\'s automatically calculated score, which reflects their overall value based on visits, spend, and referrals.',
              'Once set, the VIP badge appears on all of that guest\'s future reservation cards and on their floor plan table popover.',
              'Filter the Guest Database by VIP tier to see all your top guests in one list.',
            ],
          },
          {
            type: 'tip',
            content:
              'VIP guests get visible badges on reservation cards and the floor plan. Brief your team before service on which VIPs are dining tonight so they can deliver extra attention — a complimentary appetiser, a greeting from the manager, or their preferred table.',
          },
        ],
        relatedArticles: ['gu-database', 'res-floor', 'gr-reactivation'],
        keywords: ['VIP', 'tiers', 'scoring', 'loyalty', 'badges', 'recognition'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 6: Online
  // ---------------------------------------------------------------------------
  {
    id: 'online',
    title: 'Online',
    description:
      'Configure your public-facing booking and function inquiry widgets for your website.',
    icon: 'Globe',
    articles: [
      {
        id: 'on-booking-widget',
        title: 'Configuring the Booking Widget',
        summary:
          'Customize the public booking widget\'s appearance, time slots, and behaviour for your website.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Booking Widget Configuration',
          },
          {
            type: 'paragraph',
            content:
              'The booking widget is the public face of your reservation system. It sits on your website and lets guests book directly. You have full control over its appearance (colours, logo, fonts), behaviour (available time slots, party size limits, deposit requirements), and messaging (confirmation text, terms and conditions). A well-configured widget reduces phone calls and increases online bookings.',
          },
          {
            type: 'steps',
            content: 'Configuring your booking widget',
            items: [
              'Go to Online > Booking Widget from the sidebar.',
              'In the Appearance tab, upload your logo and set your brand colours to match your website.',
              'In the Availability tab, configure available time slots, minimum and maximum party sizes, and lead time (how far in advance guests can book).',
              'In the Deposits tab, optionally enable deposit requirements for large parties or peak nights.',
              'Click the Preview button to see exactly how the widget will look and behave on your website.',
              'Copy the embed code and paste it into your website, or use the hosted link to share directly.',
            ],
          },
          {
            type: 'tip',
            content:
              'Test the widget yourself by making a real booking through it at least once. This helps you experience the guest journey firsthand and catch any configuration issues before your customers do.',
          },
        ],
        relatedArticles: ['res-widget', 'on-function-widget', 'sys-settings'],
        keywords: ['widget', 'config', 'booking', 'colors', 'logo', 'embed', 'website', 'online'],
      },
      {
        id: 'on-function-widget',
        title: 'Configuring the Function Widget',
        summary:
          'Set up the public function inquiry form so prospective event clients can reach you directly.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Function Inquiry Widget',
          },
          {
            type: 'paragraph',
            content:
              'The Function Widget is a public inquiry form that sits on your website\'s events or private dining page. When a prospective client fills it out, their inquiry flows directly into VenueFlow as a new deal in the INQUIRY stage. The form collects key details — event type, preferred date, estimated guest count, budget range, and contact information — so your events team has everything they need to follow up quickly.',
          },
          {
            type: 'steps',
            content: 'Setting up the function widget',
            items: [
              'Navigate to Online > Function Widget from the sidebar.',
              'Customise the form fields: choose which fields are required and which are optional.',
              'Set the appearance to match your brand — colours, logo, and introductory text.',
              'Configure the confirmation message that guests see after submitting their inquiry.',
              'Enable email notifications so your events team is alerted immediately when a new inquiry comes in.',
              'Copy the embed code or hosted link and add it to your website\'s events page.',
            ],
          },
          {
            type: 'tip',
            content:
              'Keep the form short — name, email, phone, event type, date, guest count, and a message field. Long forms with too many required fields deter prospective clients from completing the inquiry.',
          },
        ],
        relatedArticles: ['on-booking-widget', 'vf-getting-started', 'gr-leads'],
        keywords: ['function', 'widget', 'inquiry', 'form', 'events', 'public'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 7: System
  // ---------------------------------------------------------------------------
  {
    id: 'system',
    title: 'System',
    description:
      'Automations, integrations, and general settings that control how ResOS operates.',
    icon: 'Cog',
    articles: [
      {
        id: 'sys-automations',
        title: 'Setting Up Automations',
        summary:
          'Automate emails, follow-ups, and reminders to save time and improve the guest experience.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Automations',
          },
          {
            type: 'paragraph',
            content:
              'Automations handle repetitive communication so your team can focus on hospitality. ResOS supports automated booking confirmations, pre-visit reminder emails or SMS, post-visit thank-you messages, event follow-ups, and no-show notifications. Each automation can be toggled on or off independently and customised with your own messaging and timing.',
          },
          {
            type: 'steps',
            content: 'Enabling and customising automations',
            items: [
              'Go to System > Automations from the sidebar.',
              'Browse the list of available automations: Booking Confirmation, Reminder (24h before), Thank You (post-visit), Event Follow-Up, and No-Show Alert.',
              'Toggle on the automations you want to activate.',
              'Click "Edit" on any automation to customise the message template, timing, and channel (email or SMS).',
              'Use placeholders like {guest_name}, {date}, {time}, and {venue_name} to personalise messages.',
              'Save your changes. New automations take effect immediately for future bookings.',
            ],
          },
          {
            type: 'warning',
            content:
              'Always test your automations before going live. Send a test email to yourself for each automation to verify the content, timing, and personalisation placeholders are working correctly. A broken automation with placeholder text like "{guest_name}" reaching a real guest looks unprofessional.',
          },
        ],
        relatedArticles: ['sys-settings', 'sys-integrations', 'res-lifecycle'],
        keywords: ['automations', 'emails', 'triggers', 'reminders', 'follow-up', 'auto'],
      },
      {
        id: 'sys-integrations',
        title: 'Integration Connections',
        summary:
          'Connect ResOS with your POS, payment provider, and other third-party systems.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Integrations',
          },
          {
            type: 'paragraph',
            content:
              'ResOS is designed to work alongside your existing technology stack. The Integrations page lets you connect your Point of Sale (POS) system, payment gateway, accounting software, and marketing tools. Once connected, data flows between systems automatically — POS orders update table status, payments sync with your accounting, and guest data stays consistent across platforms.',
          },
          {
            type: 'steps',
            content: 'Connecting an integration',
            items: [
              'Navigate to System > Integrations from the sidebar.',
              'Browse the available integrations or search for a specific provider.',
              'Click "Connect" next to the integration you want to set up.',
              'Follow the provider-specific authentication flow (usually an API key or OAuth login).',
              'Configure sync settings — choose what data to sync and in which direction.',
              'Test the connection by clicking "Test" to verify data flows correctly.',
              'Once confirmed, click "Enable" to activate the integration.',
            ],
          },
          {
            type: 'tip',
            content:
              'Connecting your POS system is the highest-value integration. It enables automatic table status updates when orders are placed and bills are settled, reducing manual clicks for your floor staff.',
          },
        ],
        relatedArticles: ['sys-automations', 'sys-settings', 'res-floor'],
        keywords: ['integrations', 'POS', 'connect', 'sync', 'third-party'],
      },
      {
        id: 'sys-settings',
        title: 'General Settings',
        summary:
          'Configure operating hours, SMS templates, booking channels, and core venue settings.',
        category: 'feature',
        content: [
          {
            type: 'heading',
            content: 'Operating Hours',
          },
          {
            type: 'steps',
            content: 'Setting your operating hours',
            items: [
              'Go to Settings > General tab.',
              'In the Operating Hours section, set your opening and closing times for each day of the week.',
              'Toggle days off (e.g., Monday closed) by deactivating that day.',
              'Set special holiday hours by adding date-specific overrides.',
              'Save. These hours control available time slots on the booking widget and the diary view.',
            ],
          },
          {
            type: 'heading',
            content: 'SMS Templates',
          },
          {
            type: 'steps',
            content: 'Customising SMS templates',
            items: [
              'Scroll to the SMS Templates section on the General tab.',
              'Edit the templates for Confirmation, Reminder, Cancellation, and Waitlist notifications.',
              'Use placeholders: {guest_name}, {date}, {time}, {party_size}, {venue_name}.',
              'Keep messages concise — SMS has a character limit and costs per message.',
              'Save your templates. They are used by automations and manual sends throughout the system.',
            ],
          },
          {
            type: 'heading',
            content: 'Booking Channels',
          },
          {
            type: 'steps',
            content: 'Managing booking channels',
            items: [
              'Scroll to the Booking Channels section on the General tab.',
              'Review the list of channels: Phone, Walk-In, Website Widget, Instagram, Google, Third-Party Platforms.',
              'Toggle channels on or off depending on which sources you accept bookings from.',
              'For each active channel, set any channel-specific rules (e.g., max party size for online bookings).',
              'Save. Channel data is attached to each reservation for reporting and attribution.',
            ],
          },
          {
            type: 'tip',
            content:
              'Keep your operating hours up to date, especially around public holidays. Outdated hours on the booking widget lead to guest frustration and missed bookings.',
          },
        ],
        relatedArticles: ['sys-automations', 'on-booking-widget', 'res-diary'],
        keywords: ['settings', 'hours', 'SMS', 'templates', 'channels', 'operating', 'config'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 8: Workflows
  // ---------------------------------------------------------------------------
  {
    id: 'workflows',
    title: 'Workflows',
    description:
      'End-to-end guides for common operational workflows — reservations, functions, and service nights.',
    icon: 'GitBranchPlus',
    articles: [
      {
        id: 'wf-reservation',
        title: 'Complete Reservation Workflow',
        summary:
          'End-to-end guide from guest booking to departure — every step your team needs to know.',
        category: 'workflow',
        content: [
          {
            type: 'heading',
            content: 'Reservation Workflow: Booking to Departure',
          },
          {
            type: 'paragraph',
            content:
              'This guide walks through the complete lifecycle of a restaurant reservation from the moment a guest books to the moment they leave. Following this workflow consistently ensures a smooth experience for guests and accurate data in your system for reporting and guest history.',
          },
          {
            type: 'steps',
            content: 'End-to-end reservation workflow',
            items: [
              'Guest books via the website widget, phone call, or walk-in. The reservation is created in the system.',
              'Staff confirms the reservation in the system (if it was an enquiry requiring approval). An automated confirmation is sent to the guest.',
              'Guest arrives at the venue. The host marks the reservation as arrived from the floor plan or diary.',
              'Seat the guest at their assigned table from the floor plan. The table status changes to red (Seated).',
              'During service, POS orders are automatically detected (if integrated) and linked to the table.',
              'When the guest is ready to pay, click "Drop Bill" from the table popover. The table status changes to amber.',
              'After payment, click "Mark as Left" on the table. The table is freed back to green (Available) and the reservation status moves to COMPLETED.',
              'The reservation auto-completes and is archived. Visit data is added to the guest\'s profile history.',
            ],
          },
          {
            type: 'tip',
            content:
              'Train your entire front-of-house team on this workflow. When everyone follows the same process, your data stays clean, reporting is accurate, and the guest experience is consistent regardless of who is on shift.',
          },
          {
            type: 'warning',
            content:
              'Always check the guest\'s no-show history before confirming a reservation. If a guest has multiple no-shows on record, consider requiring a deposit or a confirmation call to protect your tables.',
          },
        ],
        relatedArticles: ['res-lifecycle', 'res-floor', 'wf-service'],
        keywords: ['reservation', 'workflow', 'end-to-end', 'booking', 'seat', 'bill', 'complete'],
      },
      {
        id: 'wf-function',
        title: 'Complete Function Inquiry Workflow',
        summary:
          'From initial inquiry to event completion — the full function sales and delivery workflow.',
        category: 'workflow',
        content: [
          {
            type: 'heading',
            content: 'Function Workflow: Inquiry to Completion',
          },
          {
            type: 'paragraph',
            content:
              'Function events are the highest-revenue opportunities for most venues. This workflow covers every stage of the process, from the first inquiry through proposal creation, client acceptance, deposit collection, event delivery, and final payment. Following this process ensures nothing is missed and every event is delivered professionally.',
          },
          {
            type: 'steps',
            content: 'End-to-end function inquiry workflow',
            items: [
              'Inquiry is received via the function widget on your website or through a phone call. A new deal is created in VenueFlow at the INQUIRY stage.',
              'Review the inquiry details: event type, preferred date, estimated guest count, budget, and any special requirements.',
              'Create a proposal using the dual-pane editor. Add the space, menu templates, beverage packages, AV requirements, and custom notes.',
              'Send the proposal to the client by clicking Share to generate a unique link. Share this link via email or message.',
              'The client reviews the proposal and accepts it (or requests changes, which you revise and re-send).',
              'Record the deposit payment in the Payments tab. The deal advances to the DEPOSIT stage automatically.',
              'In the weeks before the event, handle pre-event preparation: finalise run sheets, confirm numbers, coordinate with suppliers, and brief staff.',
              'On event day, manage the event in real time using VenueFlow\'s event day view. Track setup, guest arrival, service milestones, and any issues.',
              'After the event, send a post-event follow-up: thank the client, request feedback, and ask for a referral.',
              'Record the final payment and mark the deal as COMPLETED. The event is archived and contributes to your analytics.',
            ],
          },
          {
            type: 'tip',
            content:
              'Speed matters in the events business. Aim to send proposals within 24 hours of receiving an inquiry. Venues that respond quickly convert at significantly higher rates than those that take days to follow up.',
          },
        ],
        relatedArticles: ['vf-pipeline-stages', 'vs-menus', 'vs-beverages'],
        keywords: ['function', 'inquiry', 'workflow', 'proposal', 'event', 'payment', 'deposit'],
      },
      {
        id: 'wf-service',
        title: 'Service Night Workflow',
        summary:
          'Pre-service preparation through end-of-night close — a complete guide for every shift.',
        category: 'workflow',
        content: [
          {
            type: 'heading',
            content: 'Pre-Service Preparation',
          },
          {
            type: 'steps',
            content: 'Before the doors open',
            items: [
              'Check the forecast and total covers count for tonight\'s service in the Diary View.',
              'Review all upcoming reservations: note large parties, VIP guests, special requests, and dietary requirements.',
              'Assign waiters to zones on the floor plan so everyone knows their section.',
              'Run through the pre-service audit checklist: tables set, menus printed, POS stations ready, and any blocked tables confirmed.',
            ],
          },
          {
            type: 'heading',
            content: 'During Service',
          },
          {
            type: 'steps',
            content: 'Managing the floor while service is running',
            items: [
              'Monitor the floor plan continuously for arriving guests. Blue (Reserved) tables with imminent bookings should be prioritised.',
              'Seat guests from the floor plan by clicking their reserved table and selecting "Seat", or use the Walk-In dialog for guests without reservations.',
              'Advance tables through their lifecycle: Seated (red) to Bill Dropped (amber) to Left (green). Keep the floor plan accurate in real time.',
              'Manage the waitlist during peak periods. Notify waiting guests via SMS when a table becomes available.',
              'Handle walk-ins efficiently with the "Seat & Next" button for speed when there is a queue at the door.',
            ],
          },
          {
            type: 'heading',
            content: 'Post-Service Close',
          },
          {
            type: 'steps',
            content: 'Wrapping up after last guests leave',
            items: [
              'Review any no-shows and update the guest profiles with no-show records. This data helps with future booking decisions.',
              'Check the night\'s reports: total covers, revenue, average spend, and any issues or incidents to note.',
            ],
          },
          {
            type: 'tip',
            content:
              'A well-run pre-service briefing sets the tone for the entire night. Take five minutes to walk your team through the covers, VIPs, large parties, and any notes before the first guest arrives.',
          },
        ],
        relatedArticles: ['res-floor', 'res-diary', 'res-walkin'],
        keywords: [
          'service',
          'night',
          'pre-service',
          'during',
          'post-service',
          'workflow',
          'floor',
          'waiter',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 9: FAQ
  // ---------------------------------------------------------------------------
  {
    id: 'faq',
    title: 'FAQ',
    description:
      'Frequently asked questions covering common tasks, troubleshooting, and quick how-to guides.',
    icon: 'HelpCircle',
    articles: [
      {
        id: 'faq-walkin-no-tables',
        title: 'How do I handle a walk-in when no tables are available?',
        summary:
          'Use the waitlist feature when no tables fit the walk-in party size.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Handling Walk-Ins With No Availability',
          },
          {
            type: 'paragraph',
            content:
              'When you try to seat a walk-in and no tables fit the party size, the Walk-In dialog automatically shows an "Add to Waitlist" button. Click it to add the guest to the waitlist with an estimated wait time. You\'ll be able to seat them when a table frees up.',
          },
          {
            type: 'tip',
            content:
              'Collect the guest\'s phone number when adding them to the waitlist so you can send an SMS notification the moment a suitable table opens up.',
          },
        ],
        relatedArticles: ['res-walkin', 'res-floor'],
        keywords: ['walk-in', 'no tables', 'waitlist', 'full', 'busy'],
      },
      {
        id: 'faq-combine-tables',
        title: 'How do I combine tables for a large party?',
        summary:
          'Use the Combine feature on the floor plan to link multiple tables together.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Combining Tables',
          },
          {
            type: 'paragraph',
            content:
              'On the Floor Plan page, click the "Combine" button in the top-right. Then tap two or more tables you want to combine. A counter shows how many you\'ve selected. Click "Combine Tables" to link them. The combined group acts as a single table for seating purposes.',
          },
          {
            type: 'tip',
            content:
              'You can uncombine tables after the party leaves by clicking the combined group and selecting "Uncombine".',
          },
        ],
        relatedArticles: ['res-floor', 'res-creating'],
        keywords: ['combine', 'tables', 'large party', 'merge', 'link'],
      },
      {
        id: 'faq-block-table',
        title: 'How do I block a table for maintenance?',
        summary:
          'Block a table from the floor plan to take it out of rotation.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Blocking a Table',
          },
          {
            type: 'paragraph',
            content:
              'Click the table on the floor plan, then click "Block" in the secondary actions. The table turns grey and won\'t be available for reservations. Click it again and choose "Unblock" to make it available when maintenance is complete.',
          },
          {
            type: 'tip',
            content:
              'Add a note when blocking a table (e.g., "wobbly leg — maintenance requested") so other staff know why it is unavailable.',
          },
        ],
        relatedArticles: ['res-floor'],
        keywords: ['block', 'table', 'maintenance', 'unavailable', 'grey'],
      },
      {
        id: 'faq-send-proposal',
        title: 'How do I send a proposal to a function client?',
        summary:
          'Create and share a proposal link from the function detail page.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Sending a Function Proposal',
          },
          {
            type: 'paragraph',
            content:
              'Open the function, click "Create Proposal", and build it in the dual-pane editor — add menus, beverages, spaces, and notes. Once you are happy with the proposal, click Share to generate a unique link. Send this link to your client via email or message. The client can view, accept, or request changes through the link.',
          },
          {
            type: 'tip',
            content:
              'Preview the proposal from the client\'s perspective before sharing by clicking the "Preview" button in the editor.',
          },
        ],
        relatedArticles: ['wf-function', 'vs-menus', 'vs-beverages'],
        keywords: ['proposal', 'send', 'share', 'function', 'link', 'client'],
      },
      {
        id: 'faq-mark-vip',
        title: 'How do I mark a guest as VIP?',
        summary:
          'Set VIP status from the guest profile in the Guest Database.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Marking a Guest as VIP',
          },
          {
            type: 'paragraph',
            content:
              'Go to the guest\'s profile in the Guest Database. You can set their VIP tier (Silver, Gold, or Platinum) in the VIP section. Once set, VIP status is visible on their reservation cards and on the floor plan table popover, ensuring your team always recognises them.',
          },
          {
            type: 'tip',
            content:
              'Brief your team before service on which VIP guests are dining tonight so they can deliver a standout experience.',
          },
        ],
        relatedArticles: ['gu-vip', 'gu-database'],
        keywords: ['VIP', 'mark', 'guest', 'tier', 'status'],
      },
      {
        id: 'faq-sms-templates',
        title: 'How do I configure SMS templates?',
        summary:
          'Customise SMS confirmation, reminder, and cancellation messages in General Settings.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Configuring SMS Templates',
          },
          {
            type: 'paragraph',
            content:
              'Go to Settings > General tab. Scroll to the SMS Templates section. You can customise confirmation, reminder, and cancellation messages. Use placeholders like {guest_name}, {date}, {time}, and {party_size} to personalise each message automatically.',
          },
          {
            type: 'tip',
            content:
              'Keep SMS messages under 160 characters where possible to avoid being split into multiple messages, which incurs additional cost.',
          },
        ],
        relatedArticles: ['sys-settings', 'sys-automations'],
        keywords: ['SMS', 'templates', 'configure', 'messages', 'placeholders'],
      },
      {
        id: 'faq-table-colors',
        title: 'What do the table status colors mean?',
        summary:
          'Quick reference for floor plan table colours and their meanings.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Table Status Colours',
          },
          {
            type: 'table',
            content:
              'Colour | Status | Meaning\nGreen | Available | No current reservation — the table is free.\nBlue | Reserved | An upcoming booking is assigned to this table.\nRed | Seated | A guest is currently dining at this table.\nAmber | Bill Dropped | The bill has been presented, waiting for payment.\nGrey | Blocked | The table is not available (maintenance or hold).',
          },
          {
            type: 'tip',
            content:
              'Glance at the floor plan to get an instant read on how busy the restaurant is. Mostly green means plenty of availability; mostly red and amber means you are near capacity.',
          },
        ],
        relatedArticles: ['res-floor', 'wf-service'],
        keywords: ['colors', 'colours', 'table', 'status', 'green', 'blue', 'red', 'amber', 'grey'],
      },
      {
        id: 'faq-operating-hours',
        title: 'How do I set operating hours?',
        summary:
          'Configure daily opening and closing times in General Settings.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Setting Operating Hours',
          },
          {
            type: 'paragraph',
            content:
              'Go to Settings > General tab. Set your opening and closing times for each day of the week. These times control what time slots are shown on the booking widget and in the diary view. You can also add date-specific overrides for public holidays or special events.',
          },
          {
            type: 'tip',
            content:
              'Update your hours before public holidays and seasonal changes. Incorrect hours on the booking widget lead to guest confusion and wasted reservations.',
          },
        ],
        relatedArticles: ['sys-settings', 'on-booking-widget'],
        keywords: ['operating', 'hours', 'opening', 'closing', 'schedule', 'times'],
      },
      {
        id: 'faq-import-csv',
        title: 'How do I import leads via CSV?',
        summary:
          'Bulk-import leads using a CSV file through the Guests section.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Importing Leads via CSV',
          },
          {
            type: 'paragraph',
            content:
              'Go to the Guests section and click CSV Import. Upload your CSV file, map the columns to the correct fields (name, email, phone, company, event type, etc.), review the preview, and click Import. Leads will be created in the system and are immediately available in the Guest Database and Lead Management module.',
          },
          {
            type: 'tip',
            content:
              'Clean your CSV before importing — remove duplicates, fix formatting issues, and ensure phone numbers include country codes. A clean import saves hours of manual correction later.',
          },
        ],
        relatedArticles: ['gr-leads', 'gu-database'],
        keywords: ['import', 'CSV', 'leads', 'bulk', 'upload', 'data'],
      },
      {
        id: 'faq-automated-emails',
        title: 'How do I set up automated emails?',
        summary:
          'Enable and customise automated email communications in the Automations settings.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Setting Up Automated Emails',
          },
          {
            type: 'paragraph',
            content:
              'Go to Automations in the System section. You can enable auto-send for booking confirmations, reminders (sent 24 hours before the reservation), thank-you emails after events, and follow-up messages. Each automation can be toggled on or off independently, and you can customise the message template, subject line, and timing.',
          },
          {
            type: 'tip',
            content:
              'Start with just booking confirmations and reminders. Once you are comfortable with those, add post-visit thank-you emails and event follow-ups.',
          },
        ],
        relatedArticles: ['sys-automations', 'sys-settings'],
        keywords: ['automated', 'emails', 'setup', 'confirmations', 'reminders', 'auto-send'],
      },
      {
        id: 'faq-past-reservations',
        title: 'How do I view past reservations for a guest?',
        summary:
          'Access a guest\'s complete visit history from their profile.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Viewing Guest Visit History',
          },
          {
            type: 'paragraph',
            content:
              'Open the guest\'s profile from the Guest Database. The visit history tab shows all past reservations with dates, party sizes, assigned tables, and outcomes (completed, no-show, cancelled). This gives you a complete picture of the guest\'s relationship with your venue.',
          },
          {
            type: 'tip',
            content:
              'Review a guest\'s history before they arrive for their next booking. Knowing they visited three times last month or had a no-show helps your team prepare appropriately.',
          },
        ],
        relatedArticles: ['gu-database', 'gu-vip'],
        keywords: ['past', 'reservations', 'history', 'guest', 'visits', 'previous'],
      },
      {
        id: 'faq-configure-widget',
        title: 'How do I configure the booking widget?',
        summary:
          'Customise appearance, availability, and deposits for your public booking widget.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Configuring the Booking Widget',
          },
          {
            type: 'paragraph',
            content:
              'Go to Online > Booking Widget. You can change colours, add your logo, set available time slots, configure party size limits, and enable deposit requirements. Use the Preview button to see how the widget looks to guests before publishing your changes.',
          },
          {
            type: 'tip',
            content:
              'Match the widget colours to your website\'s branding for a seamless guest experience. A mismatched widget can look out of place and reduce trust.',
          },
        ],
        relatedArticles: ['on-booking-widget', 'res-widget'],
        keywords: ['configure', 'booking', 'widget', 'appearance', 'customise', 'preview'],
      },
      {
        id: 'faq-no-show-repeat',
        title: 'What happens when a guest no-shows multiple times?',
        summary:
          'ResOS tracks no-shows and warns staff when booking repeat offenders.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Repeat No-Show Tracking',
          },
          {
            type: 'paragraph',
            content:
              'ResOS tracks no-shows per guest automatically. When you create a new reservation for a guest with two or more no-shows, a warning banner appears on the booking form. This helps staff make informed decisions about accepting the booking — you may choose to require a deposit, request a confirmation call, or decline the reservation.',
          },
          {
            type: 'warning',
            content:
              'No-shows cost your venue real revenue. Use the no-show data to set policies — for example, requiring deposits from guests with a history of not showing up.',
          },
        ],
        relatedArticles: ['res-lifecycle', 'gu-database'],
        keywords: ['no-show', 'repeat', 'warning', 'tracking', 'multiple', 'history'],
      },
      {
        id: 'faq-deposit-payments',
        title: 'How do I track deposit payments?',
        summary:
          'Record deposit and final payments in the function detail Payments tab.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Tracking Deposit Payments',
          },
          {
            type: 'paragraph',
            content:
              'Open the function detail and go to the Payments tab. Click "Record Payment" and enter the deposit amount, payment method, and any reference number. The function status automatically advances to DEPOSIT_PAID. When the remaining balance is settled after the event, record the final payment to move the status to FULLY_PAID.',
          },
          {
            type: 'tip',
            content:
              'Always record payments promptly and include a reference number. This creates a clear audit trail and prevents disputes about what has been paid.',
          },
        ],
        relatedArticles: ['wf-function', 'vf-pipeline-stages'],
        keywords: ['deposit', 'payment', 'track', 'record', 'function', 'paid'],
      },
      {
        id: 'faq-pipeline-kanban',
        title: 'How do I use the pipeline kanban board?',
        summary:
          'Drag and drop deal cards across pipeline stages on the VenueFlow kanban board.',
        category: 'faq',
        content: [
          {
            type: 'heading',
            content: 'Using the Pipeline Kanban Board',
          },
          {
            type: 'paragraph',
            content:
              'Navigate to VenueFlow > Pipeline. Each column represents a stage in the sales process. Drag deal cards between columns to advance them through the pipeline. Use the temperature filter (hot, warm, cold) to focus on your highest-priority deals. Click any card to open its full detail panel with timeline, documents, and notes.',
          },
          {
            type: 'tip',
            content:
              'Review the kanban board at the start of each day. Focus on "hot" deals that need immediate action to keep your conversion rate high.',
          },
        ],
        relatedArticles: ['vf-pipeline-stages', 'vf-getting-started', 'vf-dashboard'],
        keywords: ['pipeline', 'kanban', 'board', 'drag', 'drop', 'deals', 'stages'],
      },
    ],
  },
];

// =============================================================================
// FREQUENTLY ASKED QUESTIONS
// =============================================================================

export const FAQS: FAQ[] = [
  {
    question: 'How do I handle a walk-in when no tables are available?',
    answer:
      'When you try to seat a walk-in and no tables fit the party size, the Walk-In dialog automatically shows an "Add to Waitlist" button. Click it to add the guest to the waitlist with an estimated wait time. You\'ll be able to seat them when a table frees up.',
    category: 'reservations',
  },
  {
    question: 'How do I combine tables for a large party?',
    answer:
      'On the Floor Plan page, click the "Combine" button in the top-right. Then tap 2 or more tables you want to combine. A counter shows how many you\'ve selected. Click "Combine Tables" to link them.',
    category: 'floor',
  },
  {
    question: 'How do I block a table for maintenance?',
    answer:
      'Click the table on the floor plan, then click "Block" in the secondary actions. The table turns grey and won\'t be available for reservations. Click it again and choose "Unblock" to make it available.',
    category: 'floor',
  },
  {
    question: 'How do I send a proposal to a function client?',
    answer:
      'Open the function, click "Create Proposal", build it in the dual-pane editor (add menus, beverages, notes), then click Share to generate a link. Send this link to your client via email or message.',
    category: 'functions',
  },
  {
    question: 'How do I mark a guest as VIP?',
    answer:
      'Go to the guest\'s profile in the Guest Database. You can set their VIP tier there. VIP status is visible on their reservation cards and on the floor plan.',
    category: 'guests',
  },
  {
    question: 'How do I configure SMS templates?',
    answer:
      'Go to Settings > General tab. Scroll to SMS Templates section. You can customize confirmation, reminder, and cancellation messages. Use placeholders like {guest_name}, {date}, {time}.',
    category: 'settings',
  },
  {
    question: 'What do the table status colors mean?',
    answer:
      'Green = Available (no current reservation). Blue = Reserved (upcoming booking assigned). Red = Seated (guest is currently dining). Amber = Bill Dropped (waiting for payment). Grey = Blocked (not available).',
    category: 'floor',
  },
  {
    question: 'How do I set operating hours?',
    answer:
      'Go to Settings > General tab. Set your opening and closing times for each day of the week. These times control what\'s shown on the booking widget and diary view.',
    category: 'settings',
  },
  {
    question: 'How do I import leads via CSV?',
    answer:
      'Go to the Guests section > CSV Import. Upload your CSV file, map the columns to the correct fields (name, email, phone, etc.), and click Import. Leads will be created in the system.',
    category: 'growth',
  },
  {
    question: 'How do I set up automated emails?',
    answer:
      'Go to Automations in the System section. You can enable auto-send for booking confirmations, reminders, thank-you emails after events, and follow-up messages. Each automation can be toggled on/off.',
    category: 'system',
  },
  {
    question: 'How do I view past reservations for a guest?',
    answer:
      'Open the guest\'s profile from the Guest Database. The visit history tab shows all past reservations with dates, party sizes, tables, and outcomes (completed, no-show, cancelled).',
    category: 'guests',
  },
  {
    question: 'How do I configure the booking widget?',
    answer:
      'Go to Online > Booking Widget. You can change colors, add your logo, set available time slots, party size limits, and deposit requirements. Use the Preview button to see how it looks.',
    category: 'online',
  },
  {
    question: 'What happens when a guest no-shows multiple times?',
    answer:
      'ResOS tracks no-shows per guest. When you create a new reservation for a guest with 2 or more no-shows, a warning banner appears. This helps staff make informed decisions about accepting bookings.',
    category: 'reservations',
  },
  {
    question: 'How do I track deposit payments?',
    answer:
      'Open the function detail > Payments tab. Click "Record Payment" and enter the deposit amount. The function status auto-advances to DEPOSIT_PAID. Full payment moves it to FULLY_PAID.',
    category: 'functions',
  },
  {
    question: 'How do I use the pipeline kanban board?',
    answer:
      'Navigate to VenueFlow > Pipeline. Each column represents a stage. Drag deal cards between columns to advance them. Use the temperature filter (hot/warm/cold) to focus on priority deals. Click a card to see details.',
    category: 'venueflow',
  },
];
