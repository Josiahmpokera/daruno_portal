/**
 * Canonical Shengena module registry (UI + menus).
 * Aligns with docs/MODULES.md — AI modules excluded.
 */

export const modules = [
  {
    key: 'platform',
    label: 'Platform',
    shortLabel: 'Platform',
    path: '/platform',
    hasPanel: true,
    audience: 'super_admin',
    description: 'Multi-tenant SaaS: schools, subscriptions, billing, branding',
    features: [
      { label: 'Overview', path: '/platform' },
      { label: 'Super Admin Dashboard', path: '/platform/dashboard' },
      {
        type: 'group',
        label: 'Schools',
        children: [
          { label: 'All Schools', path: '/platform/schools' },
          { label: 'Registration Queue', path: '/platform/schools/pending' },
          { label: 'Approval', path: '/platform/schools/approval' },
          { label: 'Activation / Deactivation', path: '/platform/activation' },
        ],
      },
      {
        type: 'group',
        label: 'Subscriptions',
        children: [
          { label: 'Plans', path: '/platform/subscriptions/plans' },
          { label: 'Billing (Monthly/Annual)', path: '/platform/subscriptions/billing' },
          { label: 'Trials', path: '/platform/subscriptions/trials' },
          { label: 'Expiry Notifications', path: '/platform/subscriptions/expiry' },
        ],
      },
      {
        type: 'group',
        label: 'Tenant setup',
        children: [
          { label: 'School Branding', path: '/platform/branding' },
          { label: 'Tenant Isolation', path: '/platform/tenants' },
        ],
      },
    ],
  },
  {
    key: 'school-profile',
    label: 'School Profile',
    shortLabel: 'Profile',
    path: '/school-profile',
    hasPanel: true,
    description: 'School identity, EMIS, contacts, vision & calendar',
    features: [
      { label: 'Overview', path: '/school-profile' },
      { label: 'School Information', path: '/school-profile/info' },
      { label: 'Motto, Vision & Mission', path: '/school-profile/mission' },
      {
        type: 'group',
        label: 'Identity & registration',
        children: [
          { label: 'Registration & EMIS', path: '/school-profile/registration' },
          { label: 'Type & Ownership', path: '/school-profile/type' },
          { label: 'Education Levels', path: '/school-profile/levels' },
        ],
      },
      {
        type: 'group',
        label: 'Branding & contacts',
        children: [
          { label: 'Contacts & Logo', path: '/school-profile/branding' },
        ],
      },
      {
        type: 'group',
        label: 'Calendar',
        children: [
          { label: 'Academic Calendar', path: '/school-profile/calendar' },
          { label: 'Working Days', path: '/school-profile/working-days' },
        ],
      },
    ],
  },
  {
    key: 'academic',
    label: 'Academic Setup',
    shortLabel: 'Academic',
    path: '/academic',
    hasPanel: true,
    description: 'Years, terms, classes, subjects, curriculum & grading',
    features: [
      { label: 'Overview', path: '/academic' },
      { label: 'Curriculum', path: '/academic/curriculum' },
      { label: 'Grading System', path: '/academic/grading' },
      {
        type: 'group',
        label: 'Calendar structure',
        children: [
          { label: 'Academic Years', path: '/academic/years' },
          { label: 'Terms / Semesters', path: '/academic/terms' },
        ],
      },
      {
        type: 'group',
        label: 'Classes & levels',
        children: [
          { label: 'Classes', path: '/academic/classes' },
          { label: 'Streams', path: '/academic/streams' },
          { label: 'Levels', path: '/academic/levels' },
        ],
      },
      {
        type: 'group',
        label: 'Subjects',
        children: [
          { label: 'All Subjects', path: '/academic/subjects' },
          { label: 'Categories', path: '/academic/subjects/categories' },
          {
            label: 'Combinations',
            path: '/academic/subjects/combinations',
            // Hidden for primary/pre-primary-only schools (see educationStages.js)
            requiresAnyStage: ['ordinary_level', 'advanced_level'],
          },
          { label: 'Class Assignment', path: '/academic/subjects/class-assignment' },
          { label: 'Teacher Allocation', path: '/academic/subjects/teacher-allocation' },
        ],
      },
    ],
  },
  {
    key: 'students',
    label: 'Students',
    shortLabel: 'Students',
    path: '/students',
    hasPanel: true,
    description: 'Registration, profiles, transfers, ID cards, alumni',
    features: [
      { label: 'Overview', path: '/students' },
      { label: 'All Students', path: '/students/list' },
      {
        type: 'group',
        label: 'Registration & admissions',
        children: [
          { label: 'Registration', path: '/students/registration' },
          { label: 'Admission Numbers', path: '/students/admission-numbers' },
          { label: 'Applications', path: '/students/admissions' },
        ],
      },
      {
        type: 'group',
        label: 'Profiles & records',
        children: [
          { label: 'Profiles', path: '/students/profiles' },
          { label: 'Parents / Guardians', path: '/students/parents' },
          { label: 'Medical Information', path: '/students/medical' },
          { label: 'Previous School', path: '/students/previous-school' },
          { label: 'Documents & Certificates', path: '/students/documents' },
          { label: 'Status Management', path: '/students/status' },
        ],
      },
      {
        type: 'group',
        label: 'Lifecycle',
        children: [
          { label: 'Transfers', path: '/students/transfers' },
          { label: 'Graduation', path: '/students/graduation' },
          { label: 'Alumni', path: '/students/alumni' },
        ],
      },
      {
        type: 'group',
        label: 'IDs & identity',
        children: [
          { label: 'QR / Barcode', path: '/students/qr' },
          { label: 'ID Cards', path: '/students/id-cards' },
        ],
      },
    ],
  },
  {
    key: 'parents',
    label: 'Parents',
    shortLabel: 'Parents',
    path: '/parents',
    hasPanel: true,
    description: 'Parent portal: performance, fees, attendance, messaging',
    features: [
      { label: 'Overview', path: '/parents' },
      { label: 'Parent Accounts', path: '/parents/accounts' },
      { label: 'Multiple Children', path: '/parents/children' },
      {
        type: 'group',
        label: 'Child progress',
        children: [
          { label: 'Student Performance', path: '/parents/performance' },
          { label: 'Attendance View', path: '/parents/attendance' },
          { label: 'Homework', path: '/parents/homework' },
          { label: 'Download Reports', path: '/parents/reports' },
        ],
      },
      {
        type: 'group',
        label: 'Fees & billing',
        children: [
          { label: 'Fee Balance', path: '/parents/fees' },
        ],
      },
      {
        type: 'group',
        label: 'Communication',
        children: [
          { label: 'Announcements', path: '/parents/announcements' },
          { label: 'Message Teachers', path: '/parents/messages' },
        ],
      },
    ],
  },
  {
    key: 'teachers',
    label: 'Teachers',
    shortLabel: 'Teachers',
    path: '/teachers',
    hasPanel: true,
    description: 'Teacher HR, allocation, leave, evaluation, portal',
    features: [
      { label: 'All Teachers', path: '/teachers' },
      { label: 'Teacher Portal', path: '/teachers/portal' },
      {
        type: 'group',
        label: 'Onboarding & HR',
        children: [
          { label: 'Registration', path: '/teachers/registration' },
          { label: 'Qualifications', path: '/teachers/qualifications' },
          { label: 'Employment', path: '/teachers/employment' },
        ],
      },
      {
        type: 'group',
        label: 'Assignments',
        children: [
          { label: 'Subject Allocation', path: '/teachers/subjects' },
          { label: 'Class Teacher Assignment', path: '/teachers/class-teachers' },
          { label: 'Timetable', path: '/teachers/timetable' },
        ],
      },
      {
        type: 'group',
        label: 'HR operations',
        children: [
          { label: 'Attendance', path: '/teachers/attendance' },
          { label: 'Leave Management', path: '/teachers/leave' },
          { label: 'Performance Evaluation', path: '/teachers/performance' },
        ],
      },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    shortLabel: 'Staff',
    path: '/staff',
    hasPanel: true,
    description: 'Non-teaching staff, departments, contracts, payroll link',
    features: [
      { label: 'All Staff', path: '/staff' },
      { label: 'Profiles', path: '/staff/profiles' },
      {
        type: 'group',
        label: 'Organization',
        children: [
          { label: 'Departments', path: '/staff/departments' },
          { label: 'Roles & positions', path: '/staff/roles' },
        ],
      },
      {
        type: 'group',
        label: 'HR operations',
        children: [
          { label: 'Attendance', path: '/staff/attendance' },
          { label: 'Leave', path: '/staff/leave' },
          { label: 'Contracts', path: '/staff/contracts' },
          { label: 'Documents', path: '/staff/documents' },
        ],
      },
      { label: 'Payroll Integration', path: '/staff/payroll' },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    shortLabel: 'Attendance',
    path: '/attendance',
    hasPanel: true,
    description: 'Student & teacher daily attendance, sessions, analytics',
    features: [
      { label: 'Overview', path: '/attendance' },
      {
        type: 'group',
        label: 'Students',
        children: [
          { label: 'Daily Attendance', path: '/attendance/students/daily' },
          { label: 'Morning & Afternoon', path: '/attendance/students/sessions' },
          { label: 'Late Arrival', path: '/attendance/students/late' },
          { label: 'Excused Absence', path: '/attendance/students/excused' },
          { label: 'Analytics', path: '/attendance/students/analytics' },
        ],
      },
      {
        type: 'group',
        label: 'Teachers',
        children: [
          { label: 'Daily Attendance', path: '/attendance/teachers/daily' },
          { label: 'Leave Tracking', path: '/attendance/teachers/leave' },
          { label: 'Reports', path: '/attendance/teachers/reports' },
        ],
      },
    ],
  },
  {
    key: 'examinations',
    label: 'Examinations',
    shortLabel: 'Exams',
    path: '/examinations',
    hasPanel: true,
    description: 'Exams, CA, marks, GPA, rankings, approval workflow',
    features: [
      { label: 'Overview', path: '/examinations' },
      { label: 'Marks Entry', path: '/examinations/marks' },
      {
        type: 'group',
        label: 'Setup & scheduling',
        children: [
          { label: 'Exam Types', path: '/examinations/types' },
          { label: 'Scheduling', path: '/examinations/scheduling' },
        ],
      },
      {
        type: 'group',
        label: 'Assessments',
        children: [
          { label: 'Continuous Assessment', path: '/examinations/ca' },
          { label: 'Homework Scores', path: '/examinations/homework-scores' },
          { label: 'Practical Assessment', path: '/examinations/practical' },
        ],
      },
      {
        type: 'group',
        label: 'Results',
        children: [
          { label: 'Grade Calculation', path: '/examinations/grades' },
          { label: 'GPA', path: '/examinations/gpa' },
          { label: 'Division', path: '/examinations/division' },
          { label: 'Ranking', path: '/examinations/ranking' },
          { label: 'Merit List', path: '/examinations/merit' },
        ],
      },
      {
        type: 'group',
        label: 'Analysis',
        children: [
          { label: 'Subject Analysis', path: '/examinations/analysis' },
          { label: 'Performance Trends', path: '/examinations/trends' },
        ],
      },
      {
        type: 'group',
        label: 'Control',
        children: [
          { label: 'Lock Results', path: '/examinations/lock' },
          { label: 'Approval Workflow', path: '/examinations/approval' },
        ],
      },
    ],
  },
  {
    key: 'report-cards',
    label: 'Report Cards',
    shortLabel: 'Cards',
    path: '/report-cards',
    hasPanel: true,
    description:
      'NECTA / TAMISEMI report cards — generate by class, positions, bulk print',
    features: [
      { label: 'Overview', path: '/report-cards' },
      { label: 'Generate report cards', path: '/report-cards/generate' },
      {
        type: 'group',
        label: 'Report types',
        children: [
          { label: 'Terminal reports', path: '/report-cards/terminal' },
          { label: 'Annual reports', path: '/report-cards/annual' },
          { label: 'Progress reports', path: '/report-cards/progress' },
          { label: 'Transcripts', path: '/report-cards/transcripts' },
        ],
      },
      {
        type: 'group',
        label: 'Class results',
        children: [
          { label: 'Class positions', path: '/report-cards/positions' },
          { label: 'Bulk print / export', path: '/report-cards/bulk' },
        ],
      },
      {
        type: 'group',
        label: 'Report content',
        children: [
          { label: 'Remarks', path: '/report-cards/remarks' },
          { label: 'Extras (attendance & fees)', path: '/report-cards/extras' },
        ],
      },
    ],
  },
  {
    key: 'behaviour',
    label: 'Behaviour',
    shortLabel: 'Behaviour',
    path: '/behaviour',
    hasPanel: true,
    description: 'Discipline, rewards, warnings (TAMISEMI-inspired)',
    features: [
      { label: 'Overview', path: '/behaviour' },
      { label: 'Behaviour Assessment', path: '/behaviour/assessment' },
      {
        type: 'group',
        label: 'Discipline',
        children: [
          { label: 'Discipline Records', path: '/behaviour/discipline' },
          { label: 'Warnings', path: '/behaviour/warnings' },
          { label: 'Punishments', path: '/behaviour/punishments' },
        ],
      },
      { label: 'Rewards', path: '/behaviour/rewards' },
      { label: 'Parent Meetings', path: '/behaviour/meetings' },
      { label: 'Behaviour Reports', path: '/behaviour/reports' },
    ],
  },
  {
    key: 'promotions',
    label: 'Promotions',
    shortLabel: 'Promote',
    path: '/promotions',
    hasPanel: true,
    description: 'Auto/manual promotion, rules, repeat class',
    features: [
      { label: 'Overview', path: '/promotions' },
      { label: 'Promotion Rules', path: '/promotions/rules' },
      {
        type: 'group',
        label: 'Run promotions',
        children: [
          { label: 'Automatic Promotion', path: '/promotions/automatic' },
          { label: 'Manual Promotion', path: '/promotions/manual' },
          { label: 'Repeat Class', path: '/promotions/repeat' },
        ],
      },
      { label: 'Promotion Reports', path: '/promotions/reports' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Fees',
    shortLabel: 'Finance',
    path: '/finance',
    hasPanel: true,
    description: 'Fee structures, invoices, payments, receipts, refunds and reports',
    features: [
      { label: 'Overview', path: '/finance' },
      {
        type: 'group',
        label: 'Fee setup',
        children: [
          { label: 'Fee Structure', path: '/finance/structures' },
          { label: 'Billing', path: '/finance/billing' },
          { label: 'Payment Methods', path: '/finance/methods' },
        ],
      },
      {
        type: 'group',
        label: 'Invoices & payments',
        children: [
          { label: 'Student Fees', path: '/finance/student-fees' },
          { label: 'Invoices', path: '/finance/invoices' },
          { label: 'Payments', path: '/finance/payments' },
          { label: 'Receipts', path: '/finance/receipts' },
          { label: 'Refunds', path: '/finance/refunds' },
        ],
      },
      {
        type: 'group',
        label: 'Adjustments',
        children: [
          { label: 'Discounts', path: '/finance/discounts' },
          { label: 'Fines / Penalties', path: '/finance/fines' },
        ],
      },
      {
        type: 'group',
        label: 'Collections & reports',
        children: [
          { label: 'Outstanding Fees', path: '/finance/outstanding' },
          { label: 'Fee Statements', path: '/finance/statements' },
          { label: 'Financial Reports', path: '/finance/reports' },
        ],
      },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    shortLabel: 'Accounts',
    path: '/accounting',
    hasPanel: true,
    description: 'Optional ERP: COA, journals, P&L, balance sheet',
    features: [
      { label: 'Overview', path: '/accounting' },
      {
        type: 'group',
        label: 'Setup',
        children: [
          { label: 'Chart of Accounts', path: '/accounting/coa' },
          { label: 'Bank Accounts', path: '/accounting/banks' },
          { label: 'Budget', path: '/accounting/budget' },
        ],
      },
      {
        type: 'group',
        label: 'Day-to-day',
        children: [
          { label: 'Income', path: '/accounting/income' },
          { label: 'Expenses', path: '/accounting/expenses' },
          { label: 'Cashbook', path: '/accounting/cashbook' },
          { label: 'Journal Entries', path: '/accounting/journals' },
        ],
      },
      {
        type: 'group',
        label: 'Ledgers & statements',
        children: [
          { label: 'General Ledger', path: '/accounting/ledger' },
          { label: 'Trial Balance', path: '/accounting/trial-balance' },
          { label: 'Profit & Loss', path: '/accounting/pnl' },
          { label: 'Balance Sheet', path: '/accounting/balance-sheet' },
        ],
      },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    shortLabel: 'Inventory',
    path: '/inventory',
    hasPanel: true,
    description: 'Assets, stock, POs, suppliers (TAMISEMI-inspired)',
    features: [
      { label: 'Overview', path: '/inventory' },
      { label: 'Assets', path: '/inventory/assets' },
      {
        type: 'group',
        label: 'Catalogue',
        children: [
          { label: 'Categories', path: '/inventory/categories' },
          { label: 'Suppliers', path: '/inventory/suppliers' },
        ],
      },
      {
        type: 'group',
        label: 'Stock movements',
        children: [
          { label: 'Stock In', path: '/inventory/stock-in' },
          { label: 'Stock Out', path: '/inventory/stock-out' },
          { label: 'Purchase Orders', path: '/inventory/purchase-orders' },
        ],
      },
      {
        type: 'group',
        label: 'Monitoring',
        children: [
          { label: 'Low Stock Alerts', path: '/inventory/alerts' },
          { label: 'Inventory Reports', path: '/inventory/reports' },
        ],
      },
    ],
  },
  {
    key: 'library',
    label: 'Library',
    shortLabel: 'Library',
    path: '/library',
    hasPanel: true,
    description: 'Catalogue, borrow/return, overdue, fines',
    features: [
      { label: 'Overview', path: '/library' },
      { label: 'Book Catalogue', path: '/library/catalogue' },
      {
        type: 'group',
        label: 'Catalogue setup',
        children: [
          { label: 'Categories', path: '/library/categories' },
          { label: 'ISBN', path: '/library/isbn' },
        ],
      },
      {
        type: 'group',
        label: 'Circulation',
        children: [
          { label: 'Borrow Books', path: '/library/borrow' },
          { label: 'Return Books', path: '/library/return' },
          { label: 'Reservations', path: '/library/reservations' },
        ],
      },
      {
        type: 'group',
        label: 'Overdue & fines',
        children: [
          { label: 'Overdue', path: '/library/overdue' },
          { label: 'Fines', path: '/library/fines' },
        ],
      },
      { label: 'Library Reports', path: '/library/reports' },
    ],
  },
  {
    key: 'transport',
    label: 'Transport',
    shortLabel: 'Transport',
    path: '/transport',
    hasPanel: true,
    description: 'Vehicles, drivers, routes, student allocation',
    features: [
      { label: 'Overview', path: '/transport' },
      { label: 'Student Allocation', path: '/transport/students' },
      {
        type: 'group',
        label: 'Fleet',
        children: [
          { label: 'Vehicles', path: '/transport/vehicles' },
          { label: 'Drivers', path: '/transport/drivers' },
          { label: 'Maintenance', path: '/transport/maintenance' },
        ],
      },
      {
        type: 'group',
        label: 'Routes',
        children: [
          { label: 'Routes', path: '/transport/routes' },
          { label: 'Stops', path: '/transport/stops' },
        ],
      },
      {
        type: 'group',
        label: 'Billing & tracking',
        children: [
          { label: 'Transport Fees', path: '/transport/fees' },
          { label: 'GPS (Future)', path: '/transport/gps' },
        ],
      },
    ],
  },
  {
    key: 'hostel',
    label: 'Hostel',
    shortLabel: 'Hostel',
    path: '/hostel',
    hasPanel: true,
    description: 'Hostels, rooms, beds, occupancy, check-in',
    features: [
      { label: 'Overview', path: '/hostel' },
      { label: 'Check-in / Check-out', path: '/hostel/check-in' },
      {
        type: 'group',
        label: 'Facilities',
        children: [
          { label: 'Hostels', path: '/hostel/hostels' },
          { label: 'Rooms', path: '/hostel/rooms' },
          { label: 'Bed Allocation', path: '/hostel/beds' },
        ],
      },
      {
        type: 'group',
        label: 'Fees & reports',
        children: [
          { label: 'Hostel Fees', path: '/hostel/fees' },
          { label: 'Occupancy Reports', path: '/hostel/occupancy' },
        ],
      },
    ],
  },
  {
    key: 'timetable',
    label: 'Timetable',
    shortLabel: 'Timetable',
    path: '/timetable',
    hasPanel: true,
    description: 'Teaching & exam timetables, conflicts, print',
    features: [
      { label: 'Overview', path: '/timetable' },
      { label: 'Print', path: '/timetable/print' },
      {
        type: 'group',
        label: 'Schedules',
        children: [
          { label: 'Teaching Timetable', path: '/timetable/teaching' },
          { label: 'Examination Timetable', path: '/timetable/exams' },
          { label: 'Teacher Timetable', path: '/timetable/teachers' },
        ],
      },
      {
        type: 'group',
        label: 'Planning tools',
        children: [
          { label: 'Classroom Allocation', path: '/timetable/classrooms' },
          { label: 'Conflict Detection', path: '/timetable/conflicts' },
        ],
      },
    ],
  },
  {
    key: 'homework',
    label: 'Homework',
    shortLabel: 'Homework',
    path: '/homework',
    hasPanel: true,
    description: 'Create, submit, feedback, homework reports',
    features: [
      { label: 'Overview', path: '/homework' },
      { label: 'Create Homework', path: '/homework/create' },
      {
        type: 'group',
        label: 'Workflow',
        children: [
          { label: 'Online Submission', path: '/homework/submissions' },
          { label: 'Due Dates', path: '/homework/due-dates' },
          { label: 'Teacher Feedback', path: '/homework/feedback' },
        ],
      },
      { label: 'Homework Reports', path: '/homework/reports' },
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    shortLabel: 'Learning',
    path: '/learning',
    hasPanel: true,
    description: 'Notes, past papers, videos, digital resources',
    features: [
      { label: 'Overview', path: '/learning' },
      { label: 'Smart Classroom', path: '/learning/classroom' },
      {
        type: 'group',
        label: 'Content library',
        children: [
          { label: 'Notes', path: '/learning/notes' },
          { label: 'Past Papers', path: '/learning/past-papers' },
          { label: 'Videos', path: '/learning/videos' },
          { label: 'Digital Books', path: '/learning/books' },
        ],
      },
      { label: 'Assignments', path: '/learning/assignments' },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    shortLabel: 'Comms',
    path: '/communication',
    hasPanel: true,
    description: 'SMS, WhatsApp, email, announcements, messaging',
    features: [
      { label: 'Overview', path: '/communication' },
      { label: 'Parent Messaging', path: '/communication/messages' },
      {
        type: 'group',
        label: 'Channels',
        children: [
          { label: 'SMS', path: '/communication/sms' },
          { label: 'WhatsApp', path: '/communication/whatsapp' },
          { label: 'Email', path: '/communication/email' },
          { label: 'Push Notifications', path: '/communication/push' },
        ],
      },
      {
        type: 'group',
        label: 'Broadcasts',
        children: [
          { label: 'Announcements', path: '/communication/announcements' },
          { label: 'Notice Board', path: '/communication/notice-board' },
        ],
      },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    shortLabel: 'Events',
    path: '/events',
    hasPanel: true,
    description: 'Calendar, events, meetings, holidays, deadlines',
    features: [
      { label: 'Overview', path: '/events' },
      { label: 'School Calendar', path: '/events/calendar' },
      {
        type: 'group',
        label: 'Events & meetings',
        children: [
          { label: 'Events', path: '/events/list' },
          { label: 'Sports Events', path: '/events/sports' },
          { label: 'Meetings', path: '/events/meetings' },
        ],
      },
      {
        type: 'group',
        label: 'School calendar items',
        children: [
          { label: 'Holidays', path: '/events/holidays' },
          { label: 'Academic Deadlines', path: '/events/deadlines' },
        ],
      },
    ],
  },
  {
    key: 'sports',
    label: 'Sports',
    shortLabel: 'Sports',
    path: '/sports',
    hasPanel: true,
    description: 'Teams, fixtures, clubs, participation',
    features: [
      { label: 'Overview', path: '/sports' },
      { label: 'Registration', path: '/sports/registration' },
      {
        type: 'group',
        label: 'Teams & clubs',
        children: [
          { label: 'Teams', path: '/sports/teams' },
          { label: 'Clubs', path: '/sports/clubs' },
          { label: 'Participation', path: '/sports/participation' },
        ],
      },
      {
        type: 'group',
        label: 'Matches',
        children: [
          { label: 'Fixtures', path: '/sports/fixtures' },
          { label: 'Results', path: '/sports/results' },
        ],
      },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    shortLabel: 'Docs',
    path: '/documents',
    hasPanel: true,
    description: 'Student/teacher docs, certificates, uploads',
    features: [
      { label: 'Overview', path: '/documents' },
      {
        type: 'group',
        label: 'By person',
        children: [
          { label: 'Student Documents', path: '/documents/students' },
          { label: 'Teacher Documents', path: '/documents/teachers' },
        ],
      },
      {
        type: 'group',
        label: 'Records',
        children: [
          { label: 'Certificates', path: '/documents/certificates' },
          { label: 'Medical Reports', path: '/documents/medical' },
        ],
      },
      {
        type: 'group',
        label: 'Files',
        children: [
          { label: 'Uploads', path: '/documents/uploads' },
          { label: 'Downloads', path: '/documents/downloads' },
        ],
      },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    path: '/reports',
    hasPanel: true,
    description: 'Analytics, dashboards, Excel/PDF exports',
    features: [
      { label: 'Overview', path: '/reports' },
      { label: 'Performance Dashboard', path: '/reports/dashboard' },
      { label: 'Custom Reports', path: '/reports/custom' },
      {
        type: 'group',
        label: 'Academic reports',
        children: [
          { label: 'Student Reports', path: '/reports/students' },
          { label: 'Attendance Reports', path: '/reports/attendance' },
          { label: 'Examination Reports', path: '/reports/exams' },
          { label: 'Teacher Reports', path: '/reports/teachers' },
        ],
      },
      {
        type: 'group',
        label: 'Operations reports',
        children: [
          { label: 'Financial Reports', path: '/reports/finance' },
          { label: 'Inventory Reports', path: '/reports/inventory' },
        ],
      },
      {
        type: 'group',
        label: 'Export',
        children: [
          { label: 'Excel Export', path: '/reports/excel' },
          { label: 'PDF Export', path: '/reports/pdf' },
        ],
      },
    ],
  },
  {
    key: 'users',
    label: 'Users & Roles',
    shortLabel: 'Users',
    path: '/users',
    hasPanel: true,
    description: 'RBAC, permissions, audit logs, password policy',
    features: [
      { label: 'Overview', path: '/users' },
      { label: 'All Users', path: '/users/list' },
      { label: 'Permissions (RBAC)', path: '/users/permissions' },
      {
        type: 'group',
        label: 'Roles',
        children: [
          { label: 'Role List', path: '/users/roles' },
          { label: 'Super Admin', path: '/users/roles/super-admin' },
          { label: 'School Roles', path: '/users/roles/school' },
          { label: 'Parent / Student', path: '/users/roles/family' },
        ],
      },
      {
        type: 'group',
        label: 'Security',
        children: [
          { label: 'Password Policies', path: '/users/password-policies' },
          { label: 'Two-Factor Auth', path: '/users/2fa' },
        ],
      },
      {
        type: 'group',
        label: 'Activity',
        children: [
          { label: 'Audit Logs', path: '/users/audit' },
          { label: 'Login History', path: '/users/login-history' },
        ],
      },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    shortLabel: 'Gov',
    path: '/compliance',
    hasPanel: true,
    description: 'Tanzania: NECTA, census, EMIS, ministry exports',
    features: [
      { label: 'Overview', path: '/compliance' },
      {
        type: 'group',
        label: 'NECTA & assessment',
        children: [
          { label: 'NECTA Report Cards', path: '/compliance/necta' },
          { label: 'Continuous Assessment', path: '/compliance/ca' },
          { label: 'Promotion Reports', path: '/compliance/promotions' },
        ],
      },
      {
        type: 'group',
        label: 'Census & statistics',
        children: [
          { label: 'School Census', path: '/compliance/census' },
          { label: 'Enrollment Statistics', path: '/compliance/enrollment' },
          { label: 'School Profile Export', path: '/compliance/profile' },
        ],
      },
      {
        type: 'group',
        label: 'Government exports',
        children: [
          { label: 'Ministry Reporting', path: '/compliance/ministry' },
          { label: 'Government Data Export', path: '/compliance/export' },
        ],
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    shortLabel: 'Admin',
    path: '/admin',
    hasPanel: true,
    description: 'System settings, gateways, backups, webhooks',
    features: [
      { label: 'Overview', path: '/admin' },
      { label: 'System Settings', path: '/admin/settings' },
      {
        type: 'group',
        label: 'Messaging gateways',
        children: [
          { label: 'Email Settings', path: '/admin/email' },
          { label: 'SMS Gateway', path: '/admin/sms' },
          { label: 'WhatsApp API', path: '/admin/whatsapp' },
          { label: 'Notification Templates', path: '/admin/templates' },
        ],
      },
      {
        type: 'group',
        label: 'Integrations',
        children: [
          { label: 'API Keys', path: '/admin/api-keys' },
          { label: 'Webhooks', path: '/admin/webhooks' },
        ],
      },
      {
        type: 'group',
        label: 'System health',
        children: [
          { label: 'Backup & Restore', path: '/admin/backup' },
          { label: 'System Logs', path: '/admin/logs' },
        ],
      },
    ],
  },
]

/**
 * Convert a domain module's features into secondary nav items
 * (links + nested feature groups).
 */
function featuresToItems(moduleKey) {
  const mod = modules.find((m) => m.key === moduleKey)
  if (!mod) return []
  return mod.features.map((f) => {
    if (f.type === 'group') {
      return {
        type: 'group',
        label: f.label,
        children: f.children.map((c) => ({
          label: c.label,
          path: c.path,
          requiresAnyStage: c.requiresAnyStage || null,
        })),
      }
    }
    return {
      type: 'link',
      label: f.label,
      path: f.path,
      requiresAnyStage: f.requiresAnyStage || null,
    }
  })
}

/**
 * Black rail hubs — summarized groups (similar modules combined).
 * White child panel: each category is a dropdown with that module's features.
 */
export const navHubs = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/dashboard',
    hasPanel: false,
    prefixes: ['/dashboard'],
  },
  {
    key: 'people',
    label: 'People',
    path: '/students',
    hasPanel: true,
    prefixes: ['/students', '/parents', '/teachers'],
    categories: [
      { title: 'Students', items: featuresToItems('students') },
      { title: 'Parents', items: featuresToItems('parents') },
      { title: 'Teachers', items: featuresToItems('teachers') },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    path: '/staff',
    hasPanel: true,
    prefixes: ['/staff'],
    categories: [
      {
        title: 'Directory',
        items: [
          { type: 'link', label: 'All Staff', path: '/staff' },
          { type: 'link', label: 'Profiles', path: '/staff/profiles' },
        ],
      },
      {
        title: 'Organization',
        items: [
          { type: 'link', label: 'Departments', path: '/staff/departments' },
          { type: 'link', label: 'Roles & positions', path: '/staff/roles' },
        ],
      },
      {
        title: 'HR operations',
        items: [
          { type: 'link', label: 'Attendance', path: '/staff/attendance' },
          { type: 'link', label: 'Leave', path: '/staff/leave' },
          { type: 'link', label: 'Contracts', path: '/staff/contracts' },
          { type: 'link', label: 'Documents', path: '/staff/documents' },
        ],
      },
      {
        title: 'Payroll',
        items: [
          { type: 'link', label: 'Payroll Integration', path: '/staff/payroll' },
        ],
      },
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    path: '/learning',
    hasPanel: true,
    prefixes: ['/learning', '/homework', '/promotions'],
    categories: [
      { title: 'Resources', items: featuresToItems('learning') },
      { title: 'Homework', items: featuresToItems('homework') },
      { title: 'Promotions', items: featuresToItems('promotions') },
    ],
  },
  {
    key: 'academic',
    label: 'Academic',
    path: '/academic',
    hasPanel: true,
    prefixes: ['/academic', '/timetable', '/examinations'],
    categories: [
      { title: 'Academic setup', items: featuresToItems('academic') },
      { title: 'Timetable', items: featuresToItems('timetable') },
      { title: 'Examinations', items: featuresToItems('examinations') },
    ],
  },
  {
    key: 'assessment',
    label: 'Assess',
    path: '/attendance',
    hasPanel: true,
    prefixes: [
      '/attendance',
      '/report-cards',
      '/behaviour',
    ],
    categories: [
      { title: 'Attendance', items: featuresToItems('attendance') },
      { title: 'Report cards', items: featuresToItems('report-cards') },
      { title: 'Behaviour', items: featuresToItems('behaviour') },
    ],
  },
  {
    key: 'money',
    label: 'Finance',
    path: '/finance',
    hasPanel: true,
    prefixes: ['/finance', '/accounting'],
    categories: [
      {
        title: 'Fees & billing',
        items: featuresToItems('finance'),
      },
      {
        title: 'Accounting',
        items: featuresToItems('accounting'),
      },
    ],
  },
  {
    key: 'operations',
    label: 'Ops',
    path: '/inventory',
    hasPanel: true,
    prefixes: ['/inventory', '/library', '/transport', '/hostel'],
    categories: [
      { title: 'Inventory', items: featuresToItems('inventory') },
      { title: 'Library', items: featuresToItems('library') },
      { title: 'Transport', items: featuresToItems('transport') },
      { title: 'Hostel', items: featuresToItems('hostel') },
    ],
  },
  {
    key: 'community',
    label: 'Engage',
    path: '/communication',
    hasPanel: true,
    prefixes: ['/communication', '/events', '/sports', '/documents'],
    categories: [
      { title: 'Communication', items: featuresToItems('communication') },
      { title: 'Events', items: featuresToItems('events') },
      { title: 'Sports', items: featuresToItems('sports') },
      { title: 'Documents', items: featuresToItems('documents') },
    ],
  },
  {
    key: 'school',
    label: 'School',
    path: '/school-profile',
    hasPanel: true,
    // School portal only — platform console is super-admin (not shown here)
    prefixes: ['/school-profile'],
    categories: [
      { title: 'School profile', items: featuresToItems('school-profile') },
    ],
  },
  {
    key: 'system',
    label: 'System',
    path: '/reports',
    hasPanel: true,
    prefixes: ['/reports', '/compliance', '/users', '/admin'],
    categories: [
      { title: 'Reports', items: featuresToItems('reports') },
      { title: 'Compliance', items: featuresToItems('compliance') },
      { title: 'Users & roles', items: featuresToItems('users') },
      { title: 'Administration', items: featuresToItems('admin') },
    ],
  },
]

/** Primary black-rail items — all summarized hubs */
export const primaryNav = navHubs.map((hub) => ({
  key: hub.key,
  label: hub.label,
  path: hub.path,
  hasPanel: hub.hasPanel !== false,
}))

/**
 * White secondary menus keyed by hub key.
 * Shape: { title, categories: [{ title, items }] }
 */
export const moduleMenus = Object.fromEntries(
  navHubs
    .filter((h) => h.hasPanel && h.categories)
    .map((h) => [
      h.key,
      {
        title: h.label,
        categories: h.categories,
      },
    ]),
)

export function getModuleByKey(key) {
  return modules.find((m) => m.key === key) || null
}

export function getModuleByPath(pathname) {
  const sorted = [...modules].sort((a, b) => b.path.length - a.path.length)
  return (
    sorted.find(
      (m) => pathname === m.path || pathname.startsWith(`${m.path}/`),
    ) || null
  )
}

export function getHubByKey(key) {
  return navHubs.find((h) => h.key === key) || null
}

/** Active hub for the black rail */
export function matchPrimaryKey(pathname) {
  if (pathname === '/dashboard' || pathname === '/') return 'overview'

  let best = null
  let bestLen = -1
  for (const hub of navHubs) {
    if (hub.key === 'overview') continue
    for (const prefix of hub.prefixes || []) {
      if (
        (pathname === prefix || pathname.startsWith(`${prefix}/`)) &&
        prefix.length > bestLen
      ) {
        best = hub.key
        bestLen = prefix.length
      }
    }
  }

  return best || 'overview'
}

export function isPathActive(currentPath, currentSearch, targetPath) {
  const [pathPart, queryPart = ''] = targetPath.split('?')
  const currentParams = new URLSearchParams(
    currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch,
  )
  const targetParams = new URLSearchParams(queryPart)

  // Target specifies query params (e.g. /platform/subscriptions?tab=plans)
  // → active only when path matches AND every target param matches current.
  if (queryPart) {
    if (currentPath !== pathPart) return false
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false
    }
    return true
  }

  // Target has no query (e.g. /platform/subscriptions).
  // Do not mark active when the current URL uses a tab (or other) query that
  // belongs to a sibling route — otherwise both "Subscriptions" and "Plans"
  // highlight when viewing ?tab=plans.
  if (currentPath === pathPart) {
    if (currentParams.get('tab')) return false
    return true
  }

  return false
}

/** Flatten features for dashboard cards / search */
export function flattenFeatures(module) {
  const list = []
  for (const f of module.features) {
    if (f.type === 'group') {
      for (const c of f.children) {
        list.push({ module: module.key, label: c.label, path: c.path, group: f.label })
      }
    } else {
      list.push({ module: module.key, label: f.label, path: f.path, group: null })
    }
  }
  return list
}
