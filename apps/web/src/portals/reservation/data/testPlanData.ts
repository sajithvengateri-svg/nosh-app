export interface TestStep {
  stepNumber: number;
  action: string;
  expected: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  priority: 'P0' | 'P1' | 'P2';
  persona: string[];
  tags: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  workflow: string;
  icon: string;
  cases: TestCase[];
}

export const TEST_SUITES: TestSuite[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Reservation Workflow (18 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-reservation',
    name: 'Reservation Workflow',
    description:
      'End-to-end tests for the core reservation lifecycle including creation, status transitions, walk-ins, and guest search.',
    workflow: 'reservation',
    icon: 'CalendarCheck',
    cases: [
      {
        id: 'RES-001',
        title: 'Create reservation via staff form',
        description:
          'Verify that a staff member can create a new reservation through the internal reservation form.',
        preconditions: [
          'User is logged in as floor_manager or waiter',
          'At least one table exists in the floor plan',
          'Restaurant is open for the selected date/time',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/reservations/new',
            expected: 'New reservation form loads with date defaulting to today',
          },
          {
            stepNumber: 2,
            action: 'Fill in date, time, and party size fields',
            expected: 'Fields accept input; available time slots shown based on capacity',
          },
          {
            stepNumber: 3,
            action: 'Search for an existing guest by name or phone',
            expected: 'Guest search dropdown displays matching results',
          },
          {
            stepNumber: 4,
            action: 'Select a guest from the search results',
            expected: 'Guest details auto-populate in the form (name, phone, email)',
          },
          {
            stepNumber: 5,
            action: 'Open the table picker and select an available table',
            expected: 'Table is highlighted as selected; capacity shown',
          },
          {
            stepNumber: 6,
            action: 'Click Submit / Create Reservation button',
            expected: 'Reservation created with ENQUIRY status, success toast shown',
          },
        ],
        expectedResult:
          'Reservation created with ENQUIRY status, visible in the reservations list with correct guest, date, time, party size, and table assignment.',
        priority: 'P0',
        persona: ['floor_manager', 'waiter'],
        tags: ['reservation', 'create', 'staff', 'form', 'enquiry'],
      },
      {
        id: 'RES-002',
        title: 'Create reservation via public widget',
        description:
          'Verify that a guest can book a reservation through the public-facing booking widget.',
        preconditions: [
          'Public booking widget is enabled for the venue',
          'Venue has availability for the selected date/time',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /book/:orgSlug in a browser',
            expected: 'Booking widget loads with venue branding and step-by-step wizard',
          },
          {
            stepNumber: 2,
            action: 'Select a date from the date picker',
            expected: 'Available time slots update for the selected date',
          },
          {
            stepNumber: 3,
            action: 'Select a time slot from the available options',
            expected: 'Time slot is highlighted; form advances to guest details step',
          },
          {
            stepNumber: 4,
            action: 'Fill in name, email, phone number, and party size',
            expected: 'All fields validate correctly (email format, phone format)',
          },
          {
            stepNumber: 5,
            action: 'Click Confirm / Book Now button',
            expected: 'Confirmation screen shown with booking reference',
          },
        ],
        expectedResult:
          'Reservation appears in the staff reservations list with ENQUIRY status, correct guest details, and selected date/time.',
        priority: 'P0',
        persona: ['guest'],
        tags: ['reservation', 'create', 'widget', 'public', 'booking', 'guest'],
      },
      {
        id: 'RES-003',
        title: 'Guest search by name during booking',
        description:
          'Verify that staff can search for existing guests by name when creating a reservation.',
        preconditions: [
          'User is logged in as floor_manager',
          'At least one guest exists in the system with a known name',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Start a new reservation from /reservation/reservations/new',
            expected: 'New reservation form loads',
          },
          {
            stepNumber: 2,
            action: 'Type the guest name in the guest search field',
            expected: 'Search dropdown appears with matching guest results',
          },
          {
            stepNumber: 3,
            action: 'Select the correct guest from the dropdown results',
            expected: 'Guest details auto-populate (name, phone, email)',
          },
          {
            stepNumber: 4,
            action: 'Verify the guest visit history section is visible',
            expected: 'Visit history shown with previous reservations count and dates',
          },
        ],
        expectedResult:
          'Guest details auto-populate in the reservation form and visit history is displayed showing previous bookings.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['guest', 'search', 'name', 'auto-populate', 'history'],
      },
      {
        id: 'RES-004',
        title: 'Guest search by phone during booking',
        description:
          'Verify that staff can search for existing guests by phone number when creating a reservation.',
        preconditions: [
          'User is logged in as waiter',
          'At least one guest exists with a known phone number',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Start a new reservation from /reservation/reservations/new',
            expected: 'New reservation form loads',
          },
          {
            stepNumber: 2,
            action: 'Type the phone number in the guest search field',
            expected: 'Search dropdown shows matching guest(s) by phone',
          },
          {
            stepNumber: 3,
            action: 'Select the matching guest from results',
            expected: 'Guest matched; name, email, and phone auto-filled',
          },
          {
            stepNumber: 4,
            action: 'Check that the no-show count is visible in guest info',
            expected: 'Previous no-show count is displayed if greater than zero',
          },
        ],
        expectedResult:
          'Guest is matched by phone number, details auto-fill, and previous no-show count is visible in the guest information section.',
        priority: 'P1',
        persona: ['waiter'],
        tags: ['guest', 'search', 'phone', 'no-show', 'match'],
      },
      {
        id: 'RES-005',
        title: 'No-show warning for repeat offender',
        description:
          'Verify that a warning is displayed when creating a reservation for a guest with 2 or more previous no-shows.',
        preconditions: [
          'User is logged in as floor_manager',
          'A guest exists with 2 or more no-show records',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Start a new reservation and search for a guest with 2+ no-shows',
            expected: 'Guest appears in search results',
          },
          {
            stepNumber: 2,
            action: 'Select the guest from the search results',
            expected: 'Guest details populate in the form',
          },
          {
            stepNumber: 3,
            action: 'Observe the form for any warning banners or alerts',
            expected: 'Warning banner displayed indicating no-show count (e.g., "This guest has 3 no-shows")',
          },
        ],
        expectedResult:
          'A warning banner is prominently displayed showing the guest no-show count, alerting the staff before proceeding with the reservation.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['guest', 'no-show', 'warning', 'repeat', 'banner'],
      },
      {
        id: 'RES-006',
        title: 'Assign table during creation',
        description:
          'Verify that a table can be assigned to a reservation during the creation flow.',
        preconditions: [
          'User is logged in as floor_manager',
          'At least one available table exists for the selected date/time',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Start creating a new reservation with date, time, and party size filled',
            expected: 'Form is partially filled with valid data',
          },
          {
            stepNumber: 2,
            action: 'Open the table picker component',
            expected: 'Table picker displays available tables with capacity labels',
          },
          {
            stepNumber: 3,
            action: 'Select an available table that fits the party size',
            expected: 'Table is highlighted/selected; table name and capacity shown in form',
          },
          {
            stepNumber: 4,
            action: 'Submit the reservation',
            expected: 'Reservation created with the selected table assignment',
          },
        ],
        expectedResult:
          'Table is assigned to the reservation and shown in the reservation detail view with correct table name and number.',
        priority: 'P0',
        persona: ['floor_manager'],
        tags: ['reservation', 'table', 'assign', 'picker', 'create'],
      },
      {
        id: 'RES-007',
        title: 'Confirm reservation ENQUIRY to CONFIRMED',
        description:
          'Verify that a reservation can be transitioned from ENQUIRY to CONFIRMED status.',
        preconditions: [
          'User is logged in as floor_manager',
          'A reservation exists with ENQUIRY status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the reservations list and locate a reservation with ENQUIRY status',
            expected: 'Reservation is visible with ENQUIRY status badge',
          },
          {
            stepNumber: 2,
            action: 'Click on the reservation to open the detail view',
            expected: 'Reservation detail page loads with all information',
          },
          {
            stepNumber: 3,
            action: 'Click the Confirm button',
            expected: 'Confirmation dialog or immediate status transition occurs',
          },
          {
            stepNumber: 4,
            action: 'Verify the status badge updates and toast notification appears',
            expected: 'Status changes to CONFIRMED; success toast shown',
          },
        ],
        expectedResult:
          'Reservation status changes from ENQUIRY to CONFIRMED, a success toast notification is displayed, and the updated status is reflected in the reservations list.',
        priority: 'P0',
        persona: ['floor_manager'],
        tags: ['reservation', 'confirm', 'status', 'enquiry', 'transition'],
      },
      {
        id: 'RES-008',
        title: 'Seat reservation CONFIRMED to SEATED',
        description:
          'Verify that a confirmed reservation can be seated, updating status and floor plan.',
        preconditions: [
          'User is logged in as waiter',
          'A reservation exists with CONFIRMED status and an assigned table',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open a reservation with CONFIRMED status',
            expected: 'Reservation detail shows CONFIRMED status with table assignment',
          },
          {
            stepNumber: 2,
            action: 'Click the Seat button or use the floor plan seat action',
            expected: 'Seating action is triggered',
          },
          {
            stepNumber: 3,
            action: 'Verify the status updates to SEATED',
            expected: 'Status badge changes to SEATED; seated_at timestamp is set',
          },
          {
            stepNumber: 4,
            action: 'Navigate to the floor plan and check the table color',
            expected: 'Table turns to occupied color (red) on the floor plan',
          },
        ],
        expectedResult:
          'Reservation status changes to SEATED, the seated_at timestamp is recorded, and the assigned table turns to the occupied color (red) on the floor plan.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['reservation', 'seat', 'confirmed', 'status', 'floor-plan', 'timestamp'],
      },
      {
        id: 'RES-009',
        title: 'Drop bill on seated table',
        description:
          'Verify that the bill can be dropped on a seated table via the floor plan popover.',
        preconditions: [
          'User is logged in as waiter',
          'A table is currently in SEATED state on the floor plan',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the floor plan at /reservation/floor',
            expected: 'Floor plan loads with tables in various states',
          },
          {
            stepNumber: 2,
            action: 'Click on a seated (red) table',
            expected: 'Popover card appears with table details and primary action button',
          },
          {
            stepNumber: 3,
            action: 'Click the "Drop Bill" primary action button',
            expected: '[BILL_DROPPED] note added to reservation; table color changes to amber',
          },
        ],
        expectedResult:
          '[BILL_DROPPED] is added to the reservation notes, and the table turns amber on the floor plan indicating the bill has been dropped.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['bill', 'drop', 'seated', 'table', 'floor-plan', 'popover'],
      },
      {
        id: 'RES-010',
        title: 'Complete reservation SEATED to COMPLETED',
        description:
          'Verify that a seated reservation can be marked as completed after the bill is dropped.',
        preconditions: [
          'User is logged in as waiter',
          'A table has bill dropped (amber state) on the floor plan',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click on the amber (bill dropped) table on the floor plan',
            expected: 'Popover card appears with "Mark Left" as primary action',
          },
          {
            stepNumber: 2,
            action: 'Click the "Mark Left" primary action button',
            expected: 'Reservation status transitions to COMPLETED',
          },
          {
            stepNumber: 3,
            action: 'Verify the table returns to available state on the floor plan',
            expected: 'Table color returns to green (available)',
          },
        ],
        expectedResult:
          'Reservation status changes to COMPLETED, and the table returns to available (green) on the floor plan, ready for the next seating.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['reservation', 'complete', 'mark-left', 'table', 'available', 'floor-plan'],
      },
      {
        id: 'RES-011',
        title: 'Mark no-show',
        description:
          'Verify that a reservation can be marked as a no-show and the guest no-show count is incremented.',
        preconditions: [
          'User is logged in as floor_manager',
          'A reservation exists with CONFIRMED status that is past its time slot',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the reservation detail for a confirmed reservation',
            expected: 'Reservation detail page loads with current status',
          },
          {
            stepNumber: 2,
            action: 'Click the No Show action button',
            expected: 'Confirmation dialog appears asking to confirm no-show',
          },
          {
            stepNumber: 3,
            action: 'Confirm the no-show action',
            expected: 'Status changes to NO_SHOW; guest profile no-show count incremented by 1',
          },
        ],
        expectedResult:
          'Reservation status changes to NO_SHOW, and the guest no-show count is incremented by one in their profile.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['reservation', 'no-show', 'status', 'guest', 'count'],
      },
      {
        id: 'RES-012',
        title: 'Cancel reservation',
        description:
          'Verify that a reservation can be cancelled and the assigned table is freed.',
        preconditions: [
          'User is logged in as floor_manager',
          'A reservation exists with a table assigned',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the reservation detail page',
            expected: 'Reservation detail loads with table assignment visible',
          },
          {
            stepNumber: 2,
            action: 'Click the Cancel button',
            expected: 'Cancellation confirmation dialog appears',
          },
          {
            stepNumber: 3,
            action: 'Confirm the cancellation',
            expected: 'Status changes to CANCELLED; assigned table is freed',
          },
        ],
        expectedResult:
          'Reservation status changes to CANCELLED, the previously assigned table becomes available, and the reservation is updated in the list view.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['reservation', 'cancel', 'status', 'table', 'free'],
      },
      {
        id: 'RES-013',
        title: 'Edit reservation details',
        description:
          'Verify that reservation details such as date, time, and party size can be edited.',
        preconditions: [
          'User is logged in as floor_manager',
          'A reservation exists that is not in a terminal state (COMPLETED, CANCELLED, NO_SHOW)',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the reservation detail page',
            expected: 'Reservation detail loads with editable fields',
          },
          {
            stepNumber: 2,
            action: 'Edit the date, time, or party size fields',
            expected: 'Fields become editable and accept new values',
          },
          {
            stepNumber: 3,
            action: 'Click Save to persist the changes',
            expected: 'Changes saved successfully; success toast shown',
          },
          {
            stepNumber: 4,
            action: 'Verify changes are reflected in the reservations list view',
            expected: 'Updated details visible in the list without a page refresh',
          },
        ],
        expectedResult:
          'Reservation details are saved and reflected in both the detail view and the reservations list view.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['reservation', 'edit', 'date', 'time', 'party-size', 'update'],
      },
      {
        id: 'RES-014',
        title: 'Change table assignment',
        description:
          'Verify that the table assignment on a reservation can be changed.',
        preconditions: [
          'User is logged in as floor_manager',
          'A reservation exists with a table assigned',
          'Another available table exists',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the reservation detail page',
            expected: 'Current table assignment is visible',
          },
          {
            stepNumber: 2,
            action: 'Click to change the table assignment and select a different table',
            expected: 'Table picker shows available tables; new table is selectable',
          },
          {
            stepNumber: 3,
            action: 'Save the updated table assignment',
            expected: 'Old table freed, new table assigned to reservation',
          },
        ],
        expectedResult:
          'The old table is freed and becomes available, and the new table is assigned to the reservation and reflected in the detail view.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['reservation', 'table', 'change', 'reassign', 'swap'],
      },
      {
        id: 'RES-015',
        title: 'Reservation list date filtering',
        description:
          'Verify that the reservations list can be filtered by date.',
        preconditions: [
          'User is logged in as floor_manager',
          'Reservations exist across multiple dates',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the reservations list at /reservation/reservations',
            expected: 'Reservations list loads showing today\'s reservations by default',
          },
          {
            stepNumber: 2,
            action: 'Change the date picker to a different date',
            expected: 'Loading indicator shown while fetching reservations for the new date',
          },
          {
            stepNumber: 3,
            action: 'Verify the list updates to show only reservations for the selected date',
            expected: 'Only reservations matching the selected date are displayed',
          },
        ],
        expectedResult:
          'The reservations list shows only reservations for the selected date, and changing the date updates the list accordingly.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['reservation', 'list', 'filter', 'date', 'picker'],
      },
      {
        id: 'RES-016',
        title: 'Walk-in seating (table available)',
        description:
          'Verify that a walk-in guest can be quickly seated when tables are available.',
        preconditions: [
          'User is logged in as waiter',
          'At least one table is available that fits the walk-in party size',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the Walk-in button on the floor plan or reservations page',
            expected: 'Walk-in dialog opens with party size and name fields',
          },
          {
            stepNumber: 2,
            action: 'Enter the party size and guest name',
            expected: 'Best-fit table is auto-suggested based on party size',
          },
          {
            stepNumber: 3,
            action: 'Click "Seat & Close" button',
            expected: 'Reservation created with SEATED status; dialog closes',
          },
          {
            stepNumber: 4,
            action: 'Verify the table on the floor plan shows the guest name',
            expected: 'Table turns red (occupied) with guest name label',
          },
        ],
        expectedResult:
          'A best-fit table is assigned, a reservation is created with SEATED status, and the walk-in dialog closes. The floor plan reflects the new seating.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['walk-in', 'seat', 'table', 'available', 'quick'],
      },
      {
        id: 'RES-017',
        title: 'Walk-in when no tables available',
        description:
          'Verify that when no suitable tables are available for a walk-in, the guest can be added to the waitlist.',
        preconditions: [
          'User is logged in as waiter',
          'All tables capable of fitting the walk-in party size are occupied',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the Walk-in button and enter a large party size',
            expected: 'Walk-in dialog opens',
          },
          {
            stepNumber: 2,
            action: 'Observe the "No tables available" message',
            expected: '"No tables" message displayed with estimated wait time',
          },
          {
            stepNumber: 3,
            action: 'Click "Add to Waitlist" button',
            expected: 'Guest is added to the waitlist with WAITING status and estimated wait time',
          },
        ],
        expectedResult:
          'Guest is added to the waitlist with an estimated wait time when no suitable tables are available for the walk-in party.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['walk-in', 'no-tables', 'waitlist', 'overflow', 'wait-time'],
      },
      {
        id: 'RES-018',
        title: 'Sticky walk-in "Seat & Next"',
        description:
          'Verify the sticky walk-in flow where multiple guests can be seated sequentially without closing the dialog.',
        preconditions: [
          'User is logged in as waiter',
          'Multiple tables are available',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the Walk-in button to open the walk-in dialog',
            expected: 'Walk-in dialog opens with empty fields',
          },
          {
            stepNumber: 2,
            action: 'Enter the first guest name and party size, then click "Seat & Next"',
            expected:
              'First guest is seated, dialog stays open with a green confirmation banner, fields reset for next entry',
          },
          {
            stepNumber: 3,
            action: 'Enter the second guest name and party size, then click "Seat & Close"',
            expected: 'Second guest is seated, dialog closes',
          },
          {
            stepNumber: 4,
            action: 'Verify both guests appear as SEATED on the floor plan',
            expected: 'Both tables show occupied status with respective guest names',
          },
        ],
        expectedResult:
          'The first guest is seated and the dialog remains open with a green confirmation, allowing the second guest to be seated. After clicking "Seat & Close", the dialog closes and both guests are visible as seated on the floor plan.',
        priority: 'P1',
        persona: ['waiter'],
        tags: ['walk-in', 'sticky', 'seat', 'next', 'sequential', 'bulk'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: Function Inquiry Workflow (14 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-function',
    name: 'Function Inquiry Workflow',
    description:
      'Tests for the function/event inquiry lifecycle including proposals, payments, and CRM integration.',
    workflow: 'function',
    icon: 'PartyPopper',
    cases: [
      {
        id: 'FN-001',
        title: 'Submit function inquiry via public widget',
        description:
          'Verify that a guest can submit a function inquiry through the public widget.',
        preconditions: [
          'Function inquiry widget is enabled for the venue',
          'Venue has function spaces configured',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /function-inquiry/:orgSlug in a browser',
            expected: 'Function inquiry form loads with venue branding',
          },
          {
            stepNumber: 2,
            action: 'Fill in event type, preferred date, and estimated guest count',
            expected: 'Form fields accept valid input with appropriate validation',
          },
          {
            stepNumber: 3,
            action: 'Fill in contact information (name, email, phone)',
            expected: 'Contact fields validate correctly',
          },
          {
            stepNumber: 4,
            action: 'Click Submit',
            expected: 'Confirmation screen displayed with inquiry reference',
          },
        ],
        expectedResult:
          'Function inquiry is created with ENQUIRY status and is visible in the staff function list with all submitted details.',
        priority: 'P0',
        persona: ['guest'],
        tags: ['function', 'inquiry', 'widget', 'public', 'submit', 'event'],
      },
      {
        id: 'FN-002',
        title: 'Create function inquiry via staff form',
        description:
          'Verify that a venue manager can create a function inquiry through the internal form.',
        preconditions: [
          'User is logged in as venue_manager',
          'Function module is enabled',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/functions/new',
            expected: 'New function inquiry form loads with all required fields',
          },
          {
            stepNumber: 2,
            action: 'Fill in all fields: event type, date, guest count, venue space, contact info',
            expected: 'All fields accept input; venue space dropdown populated',
          },
          {
            stepNumber: 3,
            action: 'Click Submit to create the function inquiry',
            expected: 'Function created; redirected to function detail page',
          },
          {
            stepNumber: 4,
            action: 'Verify the function appears in the functions list',
            expected: 'New function visible in /reservation/functions with correct details',
          },
        ],
        expectedResult:
          'Function inquiry is created and visible in the functions list with all entered details and ENQUIRY status.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['function', 'create', 'staff', 'form', 'inquiry'],
      },
      {
        id: 'FN-003',
        title: 'View function list with status filter',
        description:
          'Verify that the functions list can be filtered by status.',
        preconditions: [
          'User is logged in as venue_manager',
          'Functions exist in various statuses',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/functions',
            expected: 'Functions list loads showing all functions',
          },
          {
            stepNumber: 2,
            action: 'Click a status filter option (e.g., CONFIRMED)',
            expected: 'List updates to show only functions with the selected status',
          },
          {
            stepNumber: 3,
            action: 'Clear the filter and select a different status',
            expected: 'List updates again showing only the newly filtered status',
          },
        ],
        expectedResult:
          'The functions list correctly filters by status, showing only functions matching the selected filter.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['function', 'list', 'filter', 'status'],
      },
      {
        id: 'FN-004',
        title: 'View function detail with packages/payments',
        description:
          'Verify that the function detail page loads all tabs correctly.',
        preconditions: [
          'User is logged in as venue_manager',
          'A function exists with associated packages and payments',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the functions list and click on a function',
            expected: 'Function detail page loads with the details tab active',
          },
          {
            stepNumber: 2,
            action: 'Click the Packages tab',
            expected: 'Packages tab loads showing linked menu and beverage packages',
          },
          {
            stepNumber: 3,
            action: 'Click the Payments tab',
            expected: 'Payments tab loads showing payment records and outstanding balance',
          },
          {
            stepNumber: 4,
            action: 'Click the Timeline tab',
            expected: 'Timeline tab loads showing all activity and status changes',
          },
        ],
        expectedResult:
          'All tabs (details, packages, payments, timeline) load correctly with their respective data on the function detail page.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['function', 'detail', 'tabs', 'packages', 'payments', 'timeline'],
      },
      {
        id: 'FN-005',
        title: 'Create proposal from function',
        description:
          'Verify that a proposal can be created from a function inquiry using the dual-pane editor.',
        preconditions: [
          'User is logged in as venue_manager',
          'A function exists in ENQUIRY or later status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open a function detail page',
            expected: 'Function detail loads with "Create Proposal" button visible',
          },
          {
            stepNumber: 2,
            action: 'Click "Create Proposal"',
            expected: 'Dual-pane proposal editor opens with function details pre-filled',
          },
          {
            stepNumber: 3,
            action: 'Build the proposal content in the editor (add sections, pricing)',
            expected: 'Editor accepts content; live preview updates in the right pane',
          },
          {
            stepNumber: 4,
            action: 'Click Save to save the proposal',
            expected: 'Proposal saved with linked function; preview renders correctly',
          },
        ],
        expectedResult:
          'Proposal is saved and linked to the function. The preview renders correctly with all added content and pricing.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['function', 'proposal', 'create', 'editor', 'dual-pane'],
      },
      {
        id: 'FN-006',
        title: 'Add menu template to proposal',
        description:
          'Verify that a menu template can be added and customized in a proposal.',
        preconditions: [
          'User is logged in as venue_manager',
          'A proposal is open in the dual-pane editor',
          'Menu templates exist in the system',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'In the proposal builder, click "Add Menu"',
            expected: 'Menu template selection dialog opens',
          },
          {
            stepNumber: 2,
            action: 'Select a menu template from the list',
            expected: 'Template loads with predefined menu items and categories',
          },
          {
            stepNumber: 3,
            action: 'Customize menu items (add, remove, edit pricing)',
            expected: 'Changes reflected in the proposal; pricing recalculates',
          },
          {
            stepNumber: 4,
            action: 'Save the proposal with the menu',
            expected: 'Proposal saved; menu items appear in the preview with pricing',
          },
        ],
        expectedResult:
          'Menu items from the selected template appear in the proposal with customized pricing, and the total is correctly calculated.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['proposal', 'menu', 'template', 'customize', 'pricing'],
      },
      {
        id: 'FN-007',
        title: 'Add beverage package to proposal',
        description:
          'Verify that a beverage package can be added to a proposal with per-head pricing.',
        preconditions: [
          'User is logged in as venue_manager',
          'A proposal is open in the editor',
          'Beverage packages exist in the system',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'In the proposal builder, click "Add Beverages"',
            expected: 'Beverage package selection dialog opens',
          },
          {
            stepNumber: 2,
            action: 'Select a beverage package from available options',
            expected: 'Package details shown with per-head pricing',
          },
          {
            stepNumber: 3,
            action: 'Confirm the selection and save the proposal',
            expected: 'Beverage package added to proposal with per-head pricing displayed',
          },
        ],
        expectedResult:
          'The beverage package is added to the proposal with correct per-head pricing and is visible in the proposal preview.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['proposal', 'beverage', 'package', 'per-head', 'pricing'],
      },
      {
        id: 'FN-008',
        title: 'Send proposal via share link',
        description:
          'Verify that a completed proposal can be shared via a public link.',
        preconditions: [
          'User is logged in as venue_manager',
          'A proposal has been created and saved',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the completed proposal',
            expected: 'Proposal loads with all content',
          },
          {
            stepNumber: 2,
            action: 'Click the Share or Send button',
            expected: 'Share dialog opens with options to copy link',
          },
          {
            stepNumber: 3,
            action: 'Click Copy Link to copy the share URL',
            expected: 'Share token generated; public URL copied to clipboard',
          },
          {
            stepNumber: 4,
            action: 'Open the copied URL in an incognito browser window',
            expected: 'Proposal renders publicly without authentication',
          },
        ],
        expectedResult:
          'A share token is generated, the public URL works without authentication, and the proposal renders correctly with venue branding.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['proposal', 'share', 'link', 'token', 'public'],
      },
      {
        id: 'FN-009',
        title: 'Client views proposal (public route)',
        description:
          'Verify that a client can view a proposal through the public share link.',
        preconditions: [
          'A proposal share link has been generated',
          'The link is valid and not expired',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open /proposal/:shareToken in a browser (no authentication)',
            expected: 'Proposal page loads with venue branding',
          },
          {
            stepNumber: 2,
            action: 'Scroll through the proposal content',
            expected: 'All sections visible: event details, menu, beverages, pricing breakdown',
          },
          {
            stepNumber: 3,
            action: 'Verify the Accept button is visible at the bottom',
            expected: 'Accept button is prominently displayed',
          },
        ],
        expectedResult:
          'The proposal renders correctly on the public route with venue branding, complete content (menu, pricing), and an accept button.',
        priority: 'P0',
        persona: ['guest'],
        tags: ['proposal', 'view', 'public', 'client', 'branding'],
      },
      {
        id: 'FN-010',
        title: 'Client accepts proposal',
        description:
          'Verify that a client can accept a proposal, triggering a status change on the function.',
        preconditions: [
          'A valid proposal share link exists',
          'The function is in a status that allows proposal acceptance',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the proposal via the public share link',
            expected: 'Proposal loads with Accept button visible',
          },
          {
            stepNumber: 2,
            action: 'Click the Accept button',
            expected: 'Confirmation dialog appears asking to confirm acceptance',
          },
          {
            stepNumber: 3,
            action: 'Confirm acceptance',
            expected: 'Success message displayed; function status updates to CONFIRMED',
          },
        ],
        expectedResult:
          'The function status changes to CONFIRMED after the client accepts the proposal, and a success message is displayed.',
        priority: 'P0',
        persona: ['guest'],
        tags: ['proposal', 'accept', 'client', 'confirmed', 'status'],
      },
      {
        id: 'FN-011',
        title: 'Record deposit payment',
        description:
          'Verify that a deposit payment can be recorded on a function.',
        preconditions: [
          'User is logged in as venue_manager',
          'A function exists in CONFIRMED status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the function detail page and navigate to the Payments tab',
            expected: 'Payments tab loads showing current payment status',
          },
          {
            stepNumber: 2,
            action: 'Click "Record Deposit" or "Add Payment" button',
            expected: 'Payment form opens with amount and payment method fields',
          },
          {
            stepNumber: 3,
            action: 'Enter deposit amount and payment method, then submit',
            expected: 'Payment recorded; function status moves to DEPOSIT_PAID',
          },
        ],
        expectedResult:
          'The deposit payment is recorded, displayed in the payments tab, and the function status moves to DEPOSIT_PAID.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['function', 'payment', 'deposit', 'record', 'status'],
      },
      {
        id: 'FN-012',
        title: 'Full stage progression ENQUIRY to COMPLETED',
        description:
          'Verify that a function can progress through all stages from ENQUIRY to COMPLETED.',
        preconditions: [
          'User is logged in as venue_manager',
          'A function exists in ENQUIRY status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the function in ENQUIRY status and advance to the next stage',
            expected: 'Function moves to the next status (e.g., PROPOSAL_SENT)',
          },
          {
            stepNumber: 2,
            action: 'Continue advancing through each stage (CONFIRMED, DEPOSIT_PAID, etc.)',
            expected: 'Each status transition succeeds with appropriate UI feedback',
          },
          {
            stepNumber: 3,
            action: 'Advance to the final COMPLETED status',
            expected: 'Function reaches COMPLETED; timeline shows all transition events',
          },
          {
            stepNumber: 4,
            action: 'Open the Timeline tab and verify all events are logged',
            expected: 'Complete history of all status transitions visible in chronological order',
          },
        ],
        expectedResult:
          'The function successfully progresses through every stage from ENQUIRY to COMPLETED, and the timeline tab shows all status transition events.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['function', 'stage', 'progression', 'lifecycle', 'complete', 'timeline'],
      },
      {
        id: 'FN-013',
        title: 'Function CRM client detail',
        description:
          'Verify the function CRM client detail page shows complete client information.',
        preconditions: [
          'User is logged in as venue_manager',
          'Clients exist with function history',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/functions/crm',
            expected: 'Function CRM page loads with client list',
          },
          {
            stepNumber: 2,
            action: 'Click on a client in the list',
            expected: 'Client profile page loads',
          },
          {
            stepNumber: 3,
            action: 'Verify function history and activity log are displayed',
            expected: 'Client profile shows function history with dates and statuses, plus activity log',
          },
        ],
        expectedResult:
          'The client profile page displays complete information including function history and activity log.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['function', 'crm', 'client', 'profile', 'history', 'activity'],
      },
      {
        id: 'FN-014',
        title: 'Venue spaces management',
        description:
          'Verify that venue spaces (rooms) can be added and edited.',
        preconditions: [
          'User is logged in as venue_manager',
          'Function module is enabled',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/functions/spaces',
            expected: 'Venue spaces management page loads with existing spaces listed',
          },
          {
            stepNumber: 2,
            action: 'Click Add Space/Room and fill in name, capacity, and amenities',
            expected: 'Form accepts input for all fields',
          },
          {
            stepNumber: 3,
            action: 'Save the new space',
            expected: 'Space saved and appears in the spaces list with capacity and amenities',
          },
        ],
        expectedResult:
          'The new venue space is saved and displayed in the spaces list with correct capacity and amenities information.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['function', 'spaces', 'venue', 'room', 'capacity', 'amenities'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: Service Workflow (12 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-service',
    name: 'Service Workflow',
    description:
      'Tests for the live service experience including floor plan interactions, waitlist management, and real-time dashboard.',
    workflow: 'service',
    icon: 'Map',
    cases: [
      {
        id: 'SVC-001',
        title: 'Floor plan loads with correct status colors',
        description:
          'Verify that the floor plan displays tables with the correct color coding for each status.',
        preconditions: [
          'User is logged in as floor_manager',
          'Tables exist in various statuses (available, reserved, seated, bill dropped, blocked)',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/floor',
            expected: 'Floor plan loads with all configured tables visible',
          },
          {
            stepNumber: 2,
            action: 'Identify tables in each status and verify their color',
            expected:
              'Green = available, Blue = reserved, Red = seated, Amber = bill dropped, Grey = blocked',
          },
          {
            stepNumber: 3,
            action: 'Verify that table labels (name/number) are readable on all colors',
            expected: 'Table labels clearly visible with appropriate contrast',
          },
        ],
        expectedResult:
          'All tables display the correct status color: Green for available, Blue for reserved, Red for seated, Amber for bill dropped, and Grey for blocked.',
        priority: 'P0',
        persona: ['floor_manager'],
        tags: ['floor-plan', 'status', 'colors', 'tables', 'visual'],
      },
      {
        id: 'SVC-002',
        title: 'Click table shows popover with actions',
        description:
          'Verify that clicking a table on the floor plan shows a popover card with contextual actions.',
        preconditions: [
          'User is logged in as waiter',
          'Tables exist on the floor plan in various states',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/floor',
            expected: 'Floor plan loads',
          },
          {
            stepNumber: 2,
            action: 'Click on any table on the floor plan',
            expected: 'Popover card appears near the clicked table',
          },
          {
            stepNumber: 3,
            action: 'Verify the popover contains a primary action button and secondary actions',
            expected:
              'Primary action button visible (contextual to table status), secondary action options available',
          },
        ],
        expectedResult:
          'A popover card appears when clicking a table, displaying the primary action button appropriate to the table status and secondary action options.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['floor-plan', 'table', 'popover', 'actions', 'click'],
      },
      {
        id: 'SVC-003',
        title: 'Seat walk-in from floor view',
        description:
          'Verify that a walk-in guest can be seated directly from the floor plan view.',
        preconditions: [
          'User is logged in as waiter',
          'At least one table is available on the floor plan',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the Walk-in button on the floor plan',
            expected: 'Walk-in dialog opens',
          },
          {
            stepNumber: 2,
            action: 'Fill in guest details (name, party size)',
            expected: 'Fields accept input; table suggestion shown',
          },
          {
            stepNumber: 3,
            action: 'Click Seat to confirm',
            expected: 'Guest is seated; table turns red on the floor plan',
          },
          {
            stepNumber: 4,
            action: 'Verify guest name is shown on the table',
            expected: 'Table displays guest name label',
          },
        ],
        expectedResult:
          'Walk-in guest is seated, the table turns red (occupied) on the floor plan, and the guest name is displayed on the table.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['walk-in', 'floor-plan', 'seat', 'table', 'guest-name'],
      },
      {
        id: 'SVC-004',
        title: 'Stage progression via popover primary button',
        description:
          'Verify that the full stage progression works via the popover primary action buttons on the floor plan.',
        preconditions: [
          'User is logged in as floor_manager',
          'A table is in reserved (blue) state with a confirmed reservation',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click a reserved (blue) table and click "Seat Guest" primary button',
            expected: 'Table turns red (seated); reservation status updated',
          },
          {
            stepNumber: 2,
            action: 'Click the now-seated (red) table and click "Drop Bill" primary button',
            expected: 'Table turns amber (bill dropped)',
          },
          {
            stepNumber: 3,
            action: 'Click the billed (amber) table and click "Mark Left" primary button',
            expected: 'Table returns to green (available); reservation marked COMPLETED',
          },
        ],
        expectedResult:
          'Each click on the primary action button advances the table through the stages (reserved -> seated -> bill dropped -> available), with immediate color updates on the floor plan.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['floor-plan', 'popover', 'stage', 'progression', 'primary-action'],
      },
      {
        id: 'SVC-005',
        title: 'Table combine selection mode',
        description:
          'Verify that multiple tables can be selected and combined.',
        preconditions: [
          'User is logged in as floor_manager',
          'Multiple adjacent available tables exist',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the Combine button on the floor plan toolbar',
            expected: 'Table selection mode activates; visual indicator shown',
          },
          {
            stepNumber: 2,
            action: 'Select 2 or more tables by clicking them',
            expected: 'Selected tables are highlighted; combine count badge shows selected number',
          },
          {
            stepNumber: 3,
            action: 'Click Confirm to combine the selected tables',
            expected: 'Tables are combined into a single logical unit; combined capacity shown',
          },
        ],
        expectedResult:
          'Tables are highlighted during selection mode, the combine count is shown, and after confirmation the tables function as a single combined unit.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['table', 'combine', 'selection', 'merge', 'floor-plan'],
      },
      {
        id: 'SVC-006',
        title: 'Block/unblock table',
        description:
          'Verify that a table can be blocked and unblocked.',
        preconditions: [
          'User is logged in as floor_manager',
          'An available table exists on the floor plan',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click an available (green) table and select Block action',
            expected: 'Table turns grey (blocked); no longer available for reservations',
          },
          {
            stepNumber: 2,
            action: 'Verify the table cannot be assigned to new reservations',
            expected: 'Table does not appear in table picker for new reservations',
          },
          {
            stepNumber: 3,
            action: 'Click the blocked (grey) table and select Unblock action',
            expected: 'Table returns to green (available); available for reservations again',
          },
        ],
        expectedResult:
          'The table toggles between blocked (grey) and available (green) states, and blocked tables are excluded from reservation table selection.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['table', 'block', 'unblock', 'toggle', 'floor-plan'],
      },
      {
        id: 'SVC-007',
        title: 'Waitlist - add guest',
        description:
          'Verify that a guest can be added to the waitlist.',
        preconditions: [
          'User is logged in as waiter',
          'Waitlist feature is enabled',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/waitlist',
            expected: 'Waitlist page loads showing current entries',
          },
          {
            stepNumber: 2,
            action: 'Click the Add button to add a new guest',
            expected: 'Add to waitlist form opens with name and party size fields',
          },
          {
            stepNumber: 3,
            action: 'Fill in guest name and party size, then submit',
            expected: 'Guest added to waitlist with WAITING status and estimated wait time',
          },
        ],
        expectedResult:
          'Guest is added to the waitlist with WAITING status and an estimated wait time is displayed.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['waitlist', 'add', 'guest', 'waiting', 'wait-time'],
      },
      {
        id: 'SVC-008',
        title: 'Waitlist - notify guest',
        description:
          'Verify that a waiting guest can be notified when a table is becoming available.',
        preconditions: [
          'User is logged in as waiter',
          'A guest exists on the waitlist with WAITING status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/waitlist',
            expected: 'Waitlist page loads with entries',
          },
          {
            stepNumber: 2,
            action: 'Locate a guest with WAITING status',
            expected: 'Guest entry visible with Notify action available',
          },
          {
            stepNumber: 3,
            action: 'Click the Notify button on the waitlist entry',
            expected: 'Status changes from WAITING to NOTIFIED; visual indicator updates',
          },
        ],
        expectedResult:
          'The waitlist entry status changes to NOTIFIED, indicating the guest has been alerted about table availability.',
        priority: 'P1',
        persona: ['waiter'],
        tags: ['waitlist', 'notify', 'guest', 'status', 'alert'],
      },
      {
        id: 'SVC-009',
        title: 'Waitlist - seat guest',
        description:
          'Verify that a waitlisted guest can be seated at a table.',
        preconditions: [
          'User is logged in as waiter',
          'A guest exists on the waitlist',
          'An available table exists',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/waitlist',
            expected: 'Waitlist page loads with entries',
          },
          {
            stepNumber: 2,
            action: 'Click the Seat button on a waitlist entry',
            expected: 'Table selection dialog opens showing available tables',
          },
          {
            stepNumber: 3,
            action: 'Select a table and confirm seating',
            expected: 'Reservation created with SEATED status; waitlist entry moves to SEATED',
          },
        ],
        expectedResult:
          'A reservation is created for the waitlisted guest with SEATED status, and the waitlist entry is updated to SEATED.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['waitlist', 'seat', 'guest', 'table', 'reservation'],
      },
      {
        id: 'SVC-010',
        title: 'Waitlist - guest leaves',
        description:
          'Verify that a waitlisted guest can be marked as having left.',
        preconditions: [
          'User is logged in as waiter',
          'A guest exists on the waitlist with WAITING or NOTIFIED status',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/waitlist',
            expected: 'Waitlist page loads with entries',
          },
          {
            stepNumber: 2,
            action: 'Locate a waiting guest entry',
            expected: 'Guest entry visible with Left action available',
          },
          {
            stepNumber: 3,
            action: 'Click the Left button on the waitlist entry',
            expected: 'Entry status changes to LEFT; entry visually dimmed or moved to history',
          },
        ],
        expectedResult:
          'The waitlist entry is marked as LEFT, removing the guest from the active waitlist.',
        priority: 'P1',
        persona: ['waiter'],
        tags: ['waitlist', 'left', 'guest', 'remove', 'status'],
      },
      {
        id: 'SVC-011',
        title: 'Dashboard stats real-time update',
        description:
          'Verify that dashboard statistics update in real-time when service actions occur.',
        preconditions: [
          'User is logged in as floor_manager',
          'Dashboard is open alongside the floor plan',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Note the current covers count and occupancy percentage on the dashboard',
            expected: 'Current stats are visible and noted',
          },
          {
            stepNumber: 2,
            action: 'Seat a new guest (walk-in or reservation) on the floor plan',
            expected: 'Guest is seated successfully',
          },
          {
            stepNumber: 3,
            action: 'Check the dashboard stats within 5 seconds',
            expected: 'Covers count incremented and occupancy percentage updated',
          },
        ],
        expectedResult:
          'Dashboard covers count and occupancy percentage update within 5 seconds of seating a guest, without requiring a page refresh.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['dashboard', 'stats', 'real-time', 'covers', 'occupancy', 'live'],
      },
      {
        id: 'SVC-012',
        title: 'Diary view groups by time slot',
        description:
          'Verify that the diary view groups reservations by time slot.',
        preconditions: [
          'User is logged in as floor_manager',
          'Multiple reservations exist for today across different time slots',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/diary',
            expected: 'Diary view loads showing today\'s reservations',
          },
          {
            stepNumber: 2,
            action: 'Verify reservations are grouped by their time slots',
            expected: 'Reservations organized under time slot headers',
          },
          {
            stepNumber: 3,
            action: 'Verify status badges are visible on each reservation entry',
            expected: 'Each reservation shows a colored status badge (ENQUIRY, CONFIRMED, etc.)',
          },
        ],
        expectedResult:
          'Reservations are grouped by time slot in the diary view with status badges visible on each entry.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['diary', 'view', 'time-slot', 'group', 'status', 'badge'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: VenueFlow Pipeline (10 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-venueflow',
    name: 'VenueFlow Pipeline',
    description:
      'Tests for the VenueFlow sales pipeline including kanban board, leads management, and analytics.',
    workflow: 'venueflow',
    icon: 'Kanban',
    cases: [
      {
        id: 'VF-001',
        title: 'Pipeline kanban loads all stages',
        description:
          'Verify that the pipeline kanban board loads all stages as columns with deal cards.',
        preconditions: [
          'User is logged in as venue_manager',
          'Deals exist in various pipeline stages',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/venueflow/pipeline',
            expected: 'Pipeline kanban board loads',
          },
          {
            stepNumber: 2,
            action: 'Verify all pipeline stages are shown as columns',
            expected: 'All stage columns visible (e.g., INQUIRY, SITE_VISIT, PROPOSAL, CONFIRMED, etc.)',
          },
          {
            stepNumber: 3,
            action: 'Verify deal cards appear in the appropriate columns',
            expected: 'Deal cards displayed with summary info (name, value, date)',
          },
        ],
        expectedResult:
          'All pipeline stages are shown as columns on the kanban board with deal cards correctly placed in their respective stage columns.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['venueflow', 'pipeline', 'kanban', 'stages', 'columns', 'deals'],
      },
      {
        id: 'VF-002',
        title: 'Quick-add inquiry from pipeline',
        description:
          'Verify that a new inquiry can be quickly added from the pipeline kanban view.',
        preconditions: [
          'User is logged in as venue_manager',
          'Pipeline view is loaded',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the + button on the INQUIRY column',
            expected: 'Quick-add form opens (inline or modal)',
          },
          {
            stepNumber: 2,
            action: 'Fill in the quick form with deal name, contact, and estimated value',
            expected: 'Form accepts input',
          },
          {
            stepNumber: 3,
            action: 'Submit the quick form',
            expected: 'New deal card appears in the INQUIRY column',
          },
        ],
        expectedResult:
          'A new deal card appears in the INQUIRY column of the kanban board with the entered details.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['venueflow', 'pipeline', 'quick-add', 'inquiry', 'deal'],
      },
      {
        id: 'VF-003',
        title: 'Move deal between stages',
        description:
          'Verify that a deal card can be dragged between pipeline stages.',
        preconditions: [
          'User is logged in as venue_manager',
          'A deal exists in the INQUIRY column',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Locate a deal card in the INQUIRY column',
            expected: 'Deal card is visible and draggable',
          },
          {
            stepNumber: 2,
            action: 'Drag the deal card from INQUIRY to SITE_VISIT column',
            expected: 'Card moves to the SITE_VISIT column; visual feedback during drag',
          },
          {
            stepNumber: 3,
            action: 'Verify the stage is updated and activity is logged',
            expected: 'Deal stage updated to SITE_VISIT; activity log shows the transition',
          },
        ],
        expectedResult:
          'The deal card moves to the SITE_VISIT column, the stage is updated in the database, and the activity log records the transition.',
        priority: 'P0',
        persona: ['venue_manager'],
        tags: ['venueflow', 'pipeline', 'drag', 'move', 'stage', 'kanban'],
      },
      {
        id: 'VF-004',
        title: 'Filter by temperature',
        description:
          'Verify that pipeline deals can be filtered by temperature (Hot/Warm/Cold).',
        preconditions: [
          'User is logged in as venue_manager',
          'Deals exist with different temperature ratings',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the pipeline kanban view',
            expected: 'Pipeline loads with all deals visible',
          },
          {
            stepNumber: 2,
            action: 'Click the Hot filter button',
            expected: 'Only deals marked as Hot are shown across all columns',
          },
          {
            stepNumber: 3,
            action: 'Click the Warm filter button',
            expected: 'Only Warm-temperature deals are shown; Hot filter deselected',
          },
        ],
        expectedResult:
          'Only deals matching the selected temperature filter are displayed on the kanban board.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'pipeline', 'filter', 'temperature', 'hot', 'warm', 'cold'],
      },
      {
        id: 'VF-005',
        title: 'Pipeline value metrics update',
        description:
          'Verify that pipeline value metrics recalculate when deals are added or updated.',
        preconditions: [
          'User is logged in as venue_manager',
          'Pipeline has existing deals with monetary values',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Note the current total pipeline value displayed',
            expected: 'Total pipeline value is visible in the metrics area',
          },
          {
            stepNumber: 2,
            action: 'Add a new deal with a specific monetary value',
            expected: 'Deal is created successfully',
          },
          {
            stepNumber: 3,
            action: 'Verify the total pipeline value has been recalculated',
            expected: 'Total pipeline value includes the new deal\'s value',
          },
        ],
        expectedResult:
          'Pipeline value totals recalculate to include the new deal, and per-stage value breakdowns update accordingly.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'pipeline', 'metrics', 'value', 'total', 'recalculate'],
      },
      {
        id: 'VF-006',
        title: 'Leads list loads and filters',
        description:
          'Verify that the leads list loads and can be filtered by various criteria.',
        preconditions: [
          'User is logged in as venue_manager',
          'Leads exist from various sources',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/venueflow/leads',
            expected: 'Leads list page loads with all leads displayed',
          },
          {
            stepNumber: 2,
            action: 'Use the search box to search by lead name',
            expected: 'Results filter by the search term in real-time',
          },
          {
            stepNumber: 3,
            action: 'Apply filters for source, status, and date range',
            expected: 'Leads are filterable by source, status, and date; results update accordingly',
          },
        ],
        expectedResult:
          'The leads list loads correctly and can be filtered by source, status, and date with search functionality working in real-time.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'leads', 'list', 'filter', 'search', 'source'],
      },
      {
        id: 'VF-007',
        title: 'Referrals tracking',
        description:
          'Verify that referral sources and conversion statistics are displayed.',
        preconditions: [
          'User is logged in as venue_manager',
          'Referral data exists in the system',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/venueflow/referrals',
            expected: 'Referrals page loads with tracking data',
          },
          {
            stepNumber: 2,
            action: 'View the referral sources list',
            expected: 'Referral sources displayed with associated leads count',
          },
          {
            stepNumber: 3,
            action: 'Verify conversion statistics are shown',
            expected: 'Conversion rates and stats displayed for each referral source',
          },
        ],
        expectedResult:
          'Referral sources and their conversion statistics are correctly displayed on the referrals tracking page.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'referrals', 'tracking', 'conversion', 'source', 'stats'],
      },
      {
        id: 'VF-008',
        title: 'Automations enable/disable',
        description:
          'Verify that pipeline automations can be toggled on and off.',
        preconditions: [
          'User is logged in as venue_manager',
          'Automations are configured in the system',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/venueflow/automations',
            expected: 'Automations page loads with list of configured automations',
          },
          {
            stepNumber: 2,
            action: 'Toggle an automation from enabled to disabled (or vice versa)',
            expected: 'Toggle switch changes state',
          },
          {
            stepNumber: 3,
            action: 'Verify toast confirmation appears and status persists on reload',
            expected: 'Toast confirmation shown; automation status persisted after page reload',
          },
        ],
        expectedResult:
          'The automation status is toggled, a toast confirmation is shown, and the status persists after page reload.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'automations', 'toggle', 'enable', 'disable'],
      },
      {
        id: 'VF-009',
        title: 'CSV import for leads',
        description:
          'Verify that leads can be imported from a CSV file.',
        preconditions: [
          'User is logged in as venue_manager',
          'A valid CSV file with lead data is available',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the CSV import page within VenueFlow',
            expected: 'CSV import interface loads with upload area',
          },
          {
            stepNumber: 2,
            action: 'Upload a CSV file with lead data',
            expected: 'File is parsed; column mapping interface shown',
          },
          {
            stepNumber: 3,
            action: 'Map CSV columns to lead fields and click Import',
            expected: 'Import process runs; success summary with count of imported leads',
          },
        ],
        expectedResult:
          'Leads are created from the CSV data with correct field mapping, and a success summary is displayed.',
        priority: 'P2',
        persona: ['venue_manager'],
        tags: ['venueflow', 'csv', 'import', 'leads', 'bulk', 'upload'],
      },
      {
        id: 'VF-010',
        title: 'Analytics dashboard loads',
        description:
          'Verify that the VenueFlow analytics dashboard renders with pipeline metrics.',
        preconditions: [
          'User is logged in as venue_manager',
          'Pipeline data exists for analytics',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/venueflow/analytics',
            expected: 'Analytics dashboard page loads',
          },
          {
            stepNumber: 2,
            action: 'Verify charts render with pipeline metrics',
            expected: 'Charts display conversion rates, pipeline value over time, stage distribution',
          },
          {
            stepNumber: 3,
            action: 'Verify key metrics are displayed (conversion rate, total value, etc.)',
            expected: 'Summary metrics shown at the top of the dashboard',
          },
        ],
        expectedResult:
          'The analytics dashboard renders with charts showing pipeline metrics, conversion rates, and summary statistics.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['venueflow', 'analytics', 'dashboard', 'charts', 'metrics', 'conversion'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 5: Guest CRM (8 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-crm',
    name: 'Guest CRM',
    description:
      'Tests for the guest CRM system including search, profiles, visit history, and VIP management.',
    workflow: 'crm',
    icon: 'Users',
    cases: [
      {
        id: 'CRM-001',
        title: 'Guest list search',
        description:
          'Verify that the guest list can be searched in real-time by name, phone, or email.',
        preconditions: [
          'User is logged in as floor_manager',
          'Guests exist in the system with various names, phones, and emails',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/guests',
            expected: 'Guest list page loads with all guests displayed',
          },
          {
            stepNumber: 2,
            action: 'Type a guest name in the search box',
            expected: 'Results filter in real-time showing matching guests by name',
          },
          {
            stepNumber: 3,
            action: 'Clear search and type a phone number',
            expected: 'Results filter by phone number match',
          },
          {
            stepNumber: 4,
            action: 'Clear search and type an email address',
            expected: 'Results filter by email match',
          },
        ],
        expectedResult:
          'The guest list filters in real-time by name, phone, or email as the user types in the search box.',
        priority: 'P0',
        persona: ['floor_manager'],
        tags: ['crm', 'guest', 'search', 'name', 'phone', 'email', 'real-time'],
      },
      {
        id: 'CRM-002',
        title: 'Guest detail shows profile',
        description:
          'Verify that the guest detail page displays the complete guest profile.',
        preconditions: [
          'User is logged in as floor_manager',
          'A guest exists with profile data (VIP tier, visit count, no-show count)',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/guests and click on a guest',
            expected: 'Guest detail page loads',
          },
          {
            stepNumber: 2,
            action: 'Verify profile information is displayed',
            expected: 'Name, contact info, VIP tier, visit count, and no-show count all visible',
          },
          {
            stepNumber: 3,
            action: 'Verify the profile layout and data accuracy',
            expected: 'All profile fields populated with correct data',
          },
        ],
        expectedResult:
          'The guest profile page displays name, contact information, VIP tier, visit count, and no-show count accurately.',
        priority: 'P0',
        persona: ['floor_manager'],
        tags: ['crm', 'guest', 'profile', 'detail', 'vip', 'visit-count'],
      },
      {
        id: 'CRM-003',
        title: 'Guest visit history loads',
        description:
          'Verify that the guest visit history tab shows all past reservations.',
        preconditions: [
          'User is logged in as floor_manager',
          'A guest exists with past reservations',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open a guest detail page',
            expected: 'Guest profile loads',
          },
          {
            stepNumber: 2,
            action: 'Click the Visit History tab',
            expected: 'Visit history tab loads with a list of past reservations',
          },
          {
            stepNumber: 3,
            action: 'Verify each entry shows date, status, and relevant details',
            expected: 'All past reservations listed with dates and final status (COMPLETED, NO_SHOW, etc.)',
          },
        ],
        expectedResult:
          'The visit history tab displays all past reservations for the guest with dates and status information.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['crm', 'guest', 'visit', 'history', 'reservations', 'past'],
      },
      {
        id: 'CRM-004',
        title: 'Edit guest notes',
        description:
          'Verify that guest notes can be edited and saved.',
        preconditions: [
          'User is logged in as floor_manager',
          'A guest profile exists',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open a guest detail page',
            expected: 'Guest profile loads with notes field visible',
          },
          {
            stepNumber: 2,
            action: 'Edit the notes field with new text',
            expected: 'Notes field is editable and accepts new text',
          },
          {
            stepNumber: 3,
            action: 'Click Save to persist the notes',
            expected: 'Notes saved; success toast displayed',
          },
          {
            stepNumber: 4,
            action: 'Refresh the page and verify notes persist',
            expected: 'Notes remain unchanged after page reload',
          },
        ],
        expectedResult:
          'Guest notes are saved and persisted across page reloads.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['crm', 'guest', 'notes', 'edit', 'save', 'persist'],
      },
      {
        id: 'CRM-005',
        title: 'VIP badge on dashboard for VIP guests',
        description:
          'Verify that VIP guests have a visible VIP badge on their reservation cards.',
        preconditions: [
          'User is logged in as floor_manager',
          'A VIP guest has an upcoming reservation',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Create or confirm a reservation for a guest with VIP tier',
            expected: 'Reservation created/confirmed for the VIP guest',
          },
          {
            stepNumber: 2,
            action: 'Navigate to the dashboard or reservations list',
            expected: 'Dashboard/list loads with reservation cards',
          },
          {
            stepNumber: 3,
            action: 'Locate the VIP guest reservation card',
            expected: 'VIP badge or indicator is prominently visible on the reservation card',
          },
        ],
        expectedResult:
          'The VIP badge/indicator is visible on the reservation card for VIP guests in the dashboard and reservations list.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['crm', 'vip', 'badge', 'dashboard', 'reservation', 'indicator'],
      },
      {
        id: 'CRM-006',
        title: 'Guest score displays correctly',
        description:
          'Verify that the guest score is calculated and displayed based on visit frequency.',
        preconditions: [
          'User is logged in as venue_manager',
          'A guest exists with multiple past visits',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Open the profile of a guest with multiple visits',
            expected: 'Guest profile loads',
          },
          {
            stepNumber: 2,
            action: 'Locate the guest score display in the profile',
            expected: 'Guest score is visible and shows a calculated value',
          },
          {
            stepNumber: 3,
            action: 'Verify the score reflects the visit frequency',
            expected: 'Score is proportional to the number and recency of visits',
          },
        ],
        expectedResult:
          'The guest score is calculated based on visit frequency and displayed correctly on the guest profile.',
        priority: 'P2',
        persona: ['venue_manager'],
        tags: ['crm', 'guest', 'score', 'frequency', 'visits', 'calculation'],
      },
      {
        id: 'CRM-007',
        title: 'No-show count tracked',
        description:
          'Verify that the guest no-show count is accurately tracked across multiple no-shows.',
        preconditions: [
          'User is logged in as floor_manager',
          'A guest exists with at least one reservation',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Mark a guest as no-show on a reservation',
            expected: 'Reservation marked NO_SHOW',
          },
          {
            stepNumber: 2,
            action: 'Mark the same guest as no-show on a second reservation',
            expected: 'Second reservation marked NO_SHOW',
          },
          {
            stepNumber: 3,
            action: 'Open the guest profile and check the no-show count',
            expected: 'No-show count displays 2',
          },
        ],
        expectedResult:
          'The guest profile no-show count accurately shows 2 after two no-show markings.',
        priority: 'P1',
        persona: ['floor_manager'],
        tags: ['crm', 'guest', 'no-show', 'count', 'track', 'increment'],
      },
      {
        id: 'CRM-008',
        title: 'Guest search from new reservation links',
        description:
          'Verify that searching for a guest during reservation creation provides a link to the guest detail page.',
        preconditions: [
          'User is logged in as waiter',
          'Guests exist in the system',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the new reservation form',
            expected: 'New reservation form loads',
          },
          {
            stepNumber: 2,
            action: 'Search for a guest and select them from results',
            expected: 'Guest details populate in the form',
          },
          {
            stepNumber: 3,
            action: 'Click the link/icon to view the full guest profile',
            expected: 'Guest detail page opens in a new tab or navigation occurs',
          },
        ],
        expectedResult:
          'The link from the reservation form navigates to the complete guest detail page.',
        priority: 'P1',
        persona: ['waiter'],
        tags: ['crm', 'guest', 'search', 'reservation', 'link', 'profile', 'navigate'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 6: Navigation & Settings (10 cases)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'suite-navigation',
    name: 'Navigation & Settings',
    description:
      'Tests for application navigation, sidebar behavior, settings pages, and public route access.',
    workflow: 'navigation',
    icon: 'Settings',
    cases: [
      {
        id: 'NAV-001',
        title: 'All sidebar links navigate correctly',
        description:
          'Verify that every link in the sidebar navigates to the correct page without errors.',
        preconditions: [
          'User is logged in with appropriate permissions',
          'Application is fully loaded',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the first sidebar link',
            expected: 'Correct page loads without errors',
          },
          {
            stepNumber: 2,
            action: 'Click each subsequent sidebar link one by one',
            expected: 'Each link loads the correct page without console errors or blank screens',
          },
          {
            stepNumber: 3,
            action: 'Verify no 404 or error pages appear for any sidebar link',
            expected: 'All pages render with appropriate content',
          },
        ],
        expectedResult:
          'Every sidebar link navigates to the correct page without errors, blank screens, or 404 responses.',
        priority: 'P0',
        persona: ['floor_manager', 'waiter', 'venue_manager', 'guest'],
        tags: ['navigation', 'sidebar', 'links', 'routing', 'pages'],
      },
      {
        id: 'NAV-002',
        title: 'Bottom nav works on mobile viewport',
        description:
          'Verify that the bottom navigation bar works correctly on mobile viewport sizes.',
        preconditions: [
          'User is logged in as waiter',
          'Browser is resized to mobile viewport (< 768px)',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Resize the browser to a mobile viewport width',
            expected: 'Bottom navigation bar appears; sidebar is hidden',
          },
          {
            stepNumber: 2,
            action: 'Tap each bottom navigation item',
            expected: 'Each item navigates to the correct page',
          },
          {
            stepNumber: 3,
            action: 'Verify the active state indicator on the current nav item',
            expected: 'Active nav item is visually highlighted',
          },
        ],
        expectedResult:
          'The bottom navigation bar is visible on mobile, all items navigate correctly, and the active state is properly indicated.',
        priority: 'P0',
        persona: ['waiter'],
        tags: ['navigation', 'mobile', 'bottom-nav', 'responsive', 'viewport'],
      },
      {
        id: 'NAV-003',
        title: 'Sidebar collapse/expand persists',
        description:
          'Verify that the sidebar collapsed/expanded state persists across page reloads.',
        preconditions: [
          'User is logged in',
          'Sidebar is currently expanded',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Click the sidebar collapse button',
            expected: 'Sidebar collapses to icon-only mode',
          },
          {
            stepNumber: 2,
            action: 'Refresh the page',
            expected: 'Sidebar remains collapsed after reload',
          },
          {
            stepNumber: 3,
            action: 'Click the expand button and refresh again',
            expected: 'Sidebar remains expanded after reload',
          },
        ],
        expectedResult:
          'The sidebar collapsed/expanded state persists in local storage and is restored after page reloads.',
        priority: 'P2',
        persona: ['floor_manager', 'waiter', 'venue_manager', 'guest'],
        tags: ['navigation', 'sidebar', 'collapse', 'expand', 'persist', 'local-storage'],
      },
      {
        id: 'NAV-004',
        title: 'Back button on all detail pages',
        description:
          'Verify that the browser back button returns to the previous list page from any detail page.',
        preconditions: [
          'User is logged in',
          'User is on a list page (reservations, functions, guests, etc.)',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to a list page (e.g., reservations list)',
            expected: 'List page loads',
          },
          {
            stepNumber: 2,
            action: 'Click on an item to navigate to its detail page',
            expected: 'Detail page loads',
          },
          {
            stepNumber: 3,
            action: 'Click the browser back button',
            expected: 'Returns to the previous list page with scroll position preserved',
          },
        ],
        expectedResult:
          'The browser back button returns to the previous list page from any detail page without errors.',
        priority: 'P1',
        persona: ['floor_manager', 'waiter', 'venue_manager', 'guest'],
        tags: ['navigation', 'back', 'detail', 'list', 'history', 'browser'],
      },
      {
        id: 'NAV-005',
        title: 'Settings page loads all tabs',
        description:
          'Verify that the settings page loads with all configuration tabs accessible.',
        preconditions: [
          'User is logged in as venue_manager',
          'Settings page is accessible',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/settings',
            expected: 'Settings page loads with the first tab active',
          },
          {
            stepNumber: 2,
            action: 'Click the General tab',
            expected: 'General settings render with editable fields',
          },
          {
            stepNumber: 3,
            action: 'Click the Tables tab',
            expected: 'Tables configuration renders',
          },
          {
            stepNumber: 4,
            action: 'Click the Widget tab',
            expected: 'Widget settings render with customization options',
          },
          {
            stepNumber: 5,
            action: 'Click the Integrations tab',
            expected: 'Integrations settings render with available integrations',
          },
        ],
        expectedResult:
          'All settings tabs (General, Tables, Widget, Integrations) load and render their content correctly.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['settings', 'tabs', 'general', 'tables', 'widget', 'integrations'],
      },
      {
        id: 'NAV-006',
        title: 'Floor editor loads and saves',
        description:
          'Verify that the floor plan editor can load, add tables, and save changes.',
        preconditions: [
          'User is logged in as venue_manager',
          'Floor plan editor is accessible',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/settings/floor',
            expected: 'Floor plan editor loads with existing tables (if any)',
          },
          {
            stepNumber: 2,
            action: 'Add a new table to the floor plan (set name, capacity, position)',
            expected: 'Table appears on the editor canvas',
          },
          {
            stepNumber: 3,
            action: 'Click Save to persist the changes',
            expected: 'Changes saved; table visible on the live floor plan view',
          },
        ],
        expectedResult:
          'The floor plan editor saves changes, and the new table is visible on the floor plan used during service.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['settings', 'floor', 'editor', 'table', 'add', 'save'],
      },
      {
        id: 'NAV-007',
        title: 'Widget config saves and preview works',
        description:
          'Verify that the booking widget configuration saves and the preview reflects changes.',
        preconditions: [
          'User is logged in as venue_manager',
          'Widget configuration page is accessible',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/widget',
            expected: 'Widget configuration page loads with current settings',
          },
          {
            stepNumber: 2,
            action: 'Change the primary color or styling option',
            expected: 'Change reflected in the settings form',
          },
          {
            stepNumber: 3,
            action: 'Click Save to persist the configuration',
            expected: 'Config saved; success toast shown',
          },
          {
            stepNumber: 4,
            action: 'Click Preview to view the updated widget',
            expected: 'Preview shows the widget with the updated styling',
          },
        ],
        expectedResult:
          'Widget configuration is saved and the preview displays the updated styling correctly.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['settings', 'widget', 'config', 'preview', 'styling', 'color'],
      },
      {
        id: 'NAV-008',
        title: 'Function widget config saves',
        description:
          'Verify that the function inquiry widget configuration saves correctly.',
        preconditions: [
          'User is logged in as venue_manager',
          'Function widget configuration is accessible',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/function-widget',
            expected: 'Function widget configuration page loads',
          },
          {
            stepNumber: 2,
            action: 'Edit a configuration field (e.g., intro text, event types)',
            expected: 'Field accepts new input',
          },
          {
            stepNumber: 3,
            action: 'Click Save to persist the changes',
            expected: 'Config saved; success toast shown; changes persisted on reload',
          },
        ],
        expectedResult:
          'Function widget configuration is saved and persists after page reload.',
        priority: 'P1',
        persona: ['venue_manager'],
        tags: ['settings', 'function-widget', 'config', 'save', 'persist'],
      },
      {
        id: 'NAV-009',
        title: 'Public booking widget loads for valid org slug',
        description:
          'Verify that the public booking widget loads correctly for a valid organization slug.',
        preconditions: [
          'A valid organization slug exists',
          'The booking widget is enabled for the organization',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /book/valid-slug in a browser (no authentication)',
            expected: 'Booking widget loads with venue branding',
          },
          {
            stepNumber: 2,
            action: 'Verify the 4-step booking wizard is displayed',
            expected: 'Step indicators visible; first step (date selection) is active',
          },
          {
            stepNumber: 3,
            action: 'Verify venue branding (logo, colors) is applied',
            expected: 'Widget displays with the venue custom branding and colors',
          },
        ],
        expectedResult:
          'The public booking widget loads with the 4-step booking wizard and venue branding for a valid org slug.',
        priority: 'P0',
        persona: ['guest'],
        tags: ['navigation', 'public', 'widget', 'booking', 'org-slug', 'branding'],
      },
      {
        id: 'NAV-010',
        title: '404 for invalid routes',
        description:
          'Verify that navigating to an invalid route shows a 404 page or redirects appropriately.',
        preconditions: [
          'User may or may not be logged in',
        ],
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to /reservation/nonexistent in the browser',
            expected: 'A 404 page or redirect is shown instead of a blank screen',
          },
          {
            stepNumber: 2,
            action: 'Verify no JavaScript errors appear in the console',
            expected: 'No uncaught errors or blank white screen',
          },
          {
            stepNumber: 3,
            action: 'Verify there is a way to navigate back (link or redirect)',
            expected: 'User can return to a valid page via a link or automatic redirect',
          },
        ],
        expectedResult:
          'Invalid routes show a 404 page or redirect to a valid page, with no blank screens or unhandled errors.',
        priority: 'P2',
        persona: ['floor_manager', 'waiter', 'venue_manager', 'guest'],
        tags: ['navigation', '404', 'invalid', 'route', 'error', 'redirect'],
      },
    ],
  },
];
