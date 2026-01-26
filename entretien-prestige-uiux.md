# ENTRETIEN PRESTIGE - UI/UX FEATURE LIST & BRANDING GUIDE
## Complete Application Interface Documentation + Role-Based Feature Matrix

**Date**: January 26, 2026  
**Version**: 1.0 - Complete UI/UX  
**Company**: Entretien Prestige - Services de Nettoyage Professionnel  
**Tagline**: "Faites briller votre maison"  
**Location**: Grand Montréal, Quebec  

---

## PARTIE 1: BRANDING GUIDELINES

### Color Palette

```
PRIMARY COLORS
├─ Prestige Blue:        #1E40AF (Professional, trustworthy)
├─ Prestige Dark Blue:   #1E3A8A (Depth, emphasis)
├─ Prestige Light Blue:  #DBEAFE (Backgrounds, light accents)
└─ Prestige Gold:        #B8860B (Prestige accent, premium tier)

SECONDARY COLORS
├─ Clean White:          #FFFFFF (Cleanliness, fresh)
├─ Professional Gray:    #6B7280 (Text, neutral elements)
├─ Success Green:        #10B981 (Confirmations, completed jobs)
├─ Warning Orange:       #F59E0B (Alerts, attention)
├─ Error Red:            #EF4444 (Urgent, issues)
└─ Neutral Charcoal:     #374151 (Dark backgrounds)

GRADIENT COMBINATIONS
├─ Blue Gradient:        #1E40AF → #3B82F6 (Hero sections)
├─ Gold Gradient:        #B8860B → #FFD700 (Premium highlights)
└─ Success Gradient:     #10B981 → #6EE7B7 (Positive actions)
```

### Typography

```
FONT FAMILY
├─ Primary (Headings): Poppins Bold / Inter Bold
├─ Body Text: Inter Regular / Open Sans
├─ Buttons: Poppins Medium
└─ Data/Numbers: IBM Plex Mono (for tables, metrics)

SIZE HIERARCHY
├─ H1 (Hero):           32px, Bold (#1E3A8A)
├─ H2 (Section):        24px, Bold (#1E40AF)
├─ H3 (Subsection):     18px, SemiBold (#1E40AF)
├─ Body:                14px, Regular (#374151)
├─ Small:               12px, Regular (#6B7280)
└─ Button:              14px, Medium (#FFFFFF)

LETTER SPACING
├─ Headings:            -0.5px
├─ Body:                0.15px
└─ Buttons:             0.5px
```

### Logo Placement

```
HEADER CONFIGURATION
├─ Logo Position:       Left side of navigation bar
├─ Logo Size:           40px height × 140px width
├─ Clear Space:         20px minimum on all sides
├─ Background:          White (#FFFFFF) or Prestige Blue (#1E40AF)
├─ Logo Variant:        "EP" monogram for mobile (compact)
└─ Animation:           Subtle scale on hover (1.05x)
```

### Visual Style

```
DESIGN SYSTEM
├─ Border Radius:       8px (standard), 12px (large), 4px (small)
├─ Shadows:             Subtle elevation (0 2px 8px rgba(0,0,0,0.08))
├─ Spacing Unit:        8px grid system
├─ Transitions:         200ms ease-in-out
├─ Icons:               Feather Icons (24px standard)
└─ Theme:               Light mode (with dark mode option)

MOBILE RESPONSIVE
├─ Breakpoints:         320px, 640px, 768px, 1024px, 1280px
├─ Navigation:          Hamburger menu on mobile
├─ Touch Targets:       Minimum 44px × 44px
├─ Font Scaling:        Responsive sizing (clamp)
└─ Layout:              Single column on mobile, multi-column on desktop
```

---

## PARTIE 2: ROLE-BASED FEATURE MATRIX

### User Roles & Permissions

```
ROLE HIERARCHY & ACCESS LEVELS

┌─────────────┬────────────┬──────────┬────────────┬────────────┐
│   FEATURE   │   ADMIN    │ MANAGER  │ SALES_REP  │ TECHNICIAN │
├─────────────┼────────────┼──────────┼────────────┼────────────┤
│ Dashboard   │ Full View  │ Full View│ Limited    │ Personal   │
│ Dispatch    │ Manage All │ Manage   │ View Own   │ View Own   │
│ Customers   │ All Data   │ Territory│ Territory  │ Assigned   │
│ Reports     │ Full Access│ Team View│ Personal   │ N/A        │
│ Payments    │ Reconcile  │ Approve  │ N/A        │ N/A        │
│ Settings    │ Full Admin │ Limited  │ N/A        │ N/A        │
│ GPS Tracking│ Live View  │ Live View│ N/A        │ Personal   │
│ Commissions │ View All   │ Team View│ Personal   │ Personal   │
├─────────────┼────────────┼──────────┼────────────┼────────────┤
│ Mobile App  │ Web Only   │ Web Only │ Both       │ Both       │
│ API Access  │ Full       │ Limited  │ Limited    │ Minimal    │
└─────────────┴────────────┴──────────┴────────────┴────────────┘

CUSTOMER ROLE (Web Portal)
├─ View own invoices
├─ Track job status (GPS)
├─ Submit service complaints
├─ Request quotes
├─ Download receipts/PDFs
└─ Manage communication preferences
```

---

## PARTIE 3: COMPLETE PAGE INVENTORY & FEATURES

### 1. AUTHENTICATION PAGES

#### Login Page
```
LAYOUT
├─ Header: Entretien Prestige Logo + "Faites briller votre maison"
├─ Form Area:
│  ├─ Email/Phone input
│  ├─ Password input (with show/hide toggle)
│  ├─ "Remember Me" checkbox
│  ├─ "Forgot Password?" link
│  └─ [LOGIN] button (Prestige Blue)
├─ 2FA Section:
│  ├─ SMS verification code input (when login succeeds)
│  ├─ "Send Code Again" option
│  ├─ "Use Authenticator App" alternative
│  └─ [VERIFY] button
└─ Footer: "Don't have an account? Sign up" link

MOBILE FEATURES
├─ Full screen form
├─ Biometric login option (fingerprint/face)
├─ Password manager support
└─ QR code for 2FA app setup

SECURITY FEATURES
├─ Rate limiting: Max 5 attempts per IP
├─ Account lockout: 30 minutes after 5 failures
├─ Password requirements display
├─ Session timeout warning: 2 minutes before logout
└─ SSL/TLS enforced badge
```

#### Registration Page
```
LAYOUT
├─ Step 1: Personal Information
│  ├─ Full Name input
│  ├─ Email input
│  ├─ Phone number input
│  └─ [NEXT] button
├─ Step 2: Company Setup
│  ├─ Company name input
│  ├─ Role selection (Admin / Manager / Sales Rep / Technician)
│  ├─ Number of team members
│  └─ [NEXT] button
├─ Step 3: Security Setup
│  ├─ Password creation (with requirements checklist)
│  ├─ 2FA method selection (SMS / Authenticator)
│  ├─ Terms acceptance checkbox
│  └─ [CREATE ACCOUNT] button
└─ Success Screen: Verification email sent

VALIDATION
├─ Real-time email validation
├─ Password strength indicator (Weak/Fair/Good/Strong)
├─ Phone number format validation
├─ Terms must be accepted
└─ 2FA must be configured

RESPONSIVE
├─ Mobile: Single column, larger inputs
├─ Tablet: 2-column layout
├─ Desktop: 3-column layout with progress indicator
```

#### Forgot Password Page
```
LAYOUT
├─ Header: "Reset Your Password"
├─ Email input: "Enter your registered email"
├─ [SEND RESET LINK] button
├─ Alternative: "Via SMS" link
└─ "Back to Login" link

RESET EMAIL
├─ Subject: "Entretien Prestige - Password Reset"
├─ Link valid for: 24 hours
├─ Contains: Reset token + password reset form link
└─ Security: One-time use only

RESET FORM
├─ New password input
├─ Confirm password input
├─ Password requirements checklist
├─ [RESET PASSWORD] button
└─ Automatic redirect to login after success
```

---

### 2. DASHBOARD PAGES

#### Admin Dashboard
```
LAYOUT: 3-COLUMN GRID

┌─────────────────────────────────────────────────────────┐
│ ENTRETIEN PRESTIGE ADMIN DASHBOARD                [👤][⚙️]│
├─────────────────────────────────────────────────────────┤
│ [HOME]  [DISPATCH]  [CUSTOMERS]  [REPORTS]  [SETTINGS]  │
├─────────────────────────────────────────────────────────┤

LEFT COLUMN (Sidebar - Fixed)
├─ Company Logo & Name
├─ Quick Navigation:
│  ├─ Dashboard (active)
│  ├─ Dispatch Calendar
│  ├─ Customers
│  ├─ Technicians
│  ├─ Reports
│  ├─ Payments
│  ├─ Settings
│  └─ Logout
├─ Notifications Bell (with count badge)
├─ User Profile Card (collapsible):
│  ├─ Avatar
│  ├─ Name
│  ├─ Role: Admin
│  └─ [Profile Settings] [Logout]
└─ Theme Toggle (Light/Dark)

MAIN AREA: KPI CARDS (Row 1)
├─ CARD 1: Today's Jobs
│  ├─ Value: 12 scheduled
│  ├─ Trend: +2 vs average
│  ├─ Icon: 📋
│  ├─ Color: Prestige Blue
│  └─ Click action: Go to Dispatch
├─ CARD 2: Today's Revenue
│  ├─ Value: $4,250
│  ├─ Trend: +18% vs average
│  ├─ Icon: 💰
│  ├─ Color: Success Green
│  └─ Goal indicator: 87% of daily target
├─ CARD 3: Active Customers
│  ├─ Value: 287
│  ├─ Trend: +5% vs last month
│  ├─ Icon: 👥
│  ├─ Color: Warning Orange
│  └─ New customers this month: 12
└─ CARD 4: Average Rating
   ├─ Value: 4.8/5.0 ⭐
   ├─ Trend: +0.2 vs last month
   ├─ Icon: ⭐
   ├─ Color: Prestige Gold
   └─ Total reviews: 347

MAIN AREA: PERFORMANCE GRAPH (Row 2)
├─ Title: "Revenue Trend - Last 30 Days"
├─ Chart Type: Line chart + Area fill
├─ X-Axis: Daily dates
├─ Y-Axis: Revenue ($)
├─ Features:
│  ├─ Interactive tooltips on hover
│  ├─ Zoom/Pan controls
│  ├─ Export to CSV button
│  ├─ Target line overlay (dashed)
│  └─ Color: Gradient Blue → Light Blue
└─ Legend: Actual vs Target vs Average

MAIN AREA: QUICK ACTIONS (Row 3)
├─ [+ NEW JOB] - Button (Prestige Blue)
├─ [📞 DISPATCH] - Opens Dispatch Calendar
├─ [👥 TEAM] - Team member management
├─ [📊 EXPORT] - Export data as CSV/PDF
├─ [🔄 REFRESH] - Manual data refresh
└─ [⚡ ALERTS] - Critical alerts view

MAIN AREA: TODAY'S SCHEDULE (Row 4)
├─ Title: "Today's Schedule - 12 Jobs"
├─ Table Columns:
│  ├─ TIME: 09:00, 10:30, 13:00, etc.
│  ├─ TECHNICIAN: John Doe, Jane Smith, Mike Brown
│  ├─ SERVICE: Window Washing, Gutter Cleaning, Roof Cleaning
│  ├─ AMOUNT: $250, $180, $400
│  ├─ STATUS: On Time ✓, 5 min ETA 📍, Delayed ⚠️
│  └─ ACTIONS: View | Edit | Complete | Cancel
├─ Row Highlighting:
│  ├─ Green: Completed jobs
│  ├─ Blue: Current/In-Progress
│  ├─ Orange: Delayed jobs
│  └─ Red: No-shows
└─ Pagination: 10 per page

RIGHT COLUMN (Sidebar - Fixed)
├─ ALERTS WIDGET
│  ├─ Title: "Alerts & Notifications"
│  ├─ Alert 1: "⚠️ Mike Brown - 15min delayed"
│  ├─ Alert 2: "❌ Job #234 marked as no-show"
│  ├─ Alert 3: "✓ 5 new customer inquiries"
│  ├─ Alert 4: "💳 Payment received: $2,100"
│  └─ [View All] link
├─ TEAM STATUS WIDGET
│  ├─ Title: "Team Status"
│  ├─ John Doe: 6 jobs completed (92% on-time)
│  ├─ Jane Smith: 5 jobs completed (100% on-time)
│  ├─ Mike Brown: 3 jobs completed (67% on-time)
│  └─ [View Details] link
├─ TOP CUSTOMERS WIDGET
│  ├─ Title: "Top Customers This Month"
│  ├─ 1. David Leclerc - $2,400 spent
│  ├─ 2. Marie Dupont - $1,800 spent
│  ├─ 3. Robert Martin - $1,650 spent
│  └─ [View All] link
└─ REVENUE FORECAST WIDGET
   ├─ Title: "Monthly Forecast"
   ├─ Current Month: $45,230 (87% complete)
   ├─ Projected Total: $52,000
   ├─ Target: $50,000 ✓
   └─ On Track indicator: Green ✓

FOOTER
├─ Last Updated: Just now
├─ Auto-Refresh: Every 5 minutes
└─ © 2026 Entretien Prestige | Privacy | Terms
```

#### Manager Dashboard
```
SIMILAR TO ADMIN but with restrictions:
├─ Limited to team's territory/region
├─ Cannot see other managers' teams
├─ Commissions visible for own team only
├─ Reports limited to team performance
├─ Payment approvals for team members
└─ No system-wide settings access

ADDITIONAL WIDGETS
├─ Team utilization (% of capacity used)
├─ Average job duration vs. target
├─ Customer satisfaction by technician
├─ Territory coverage map
└─ Weekly performance forecast
```

#### Sales Rep Dashboard
```
FOCUSED ON PERSONAL METRICS:

├─ MY SALES (Top of page)
│  ├─ This Month: $12,500
│  ├─ This Week: $3,200
│  ├─ Conversion Rate: 42%
│  ├─ Average Deal Size: $2,100
│  └─ Rank: #2 of 5 (vs leaderboard)
├─ MY LEADS
│  ├─ Total: 23 leads
│  ├─ New (this week): 5
│  ├─ Contacted: 8
│  ├─ Estimated: 4
│  ├─ Won: 3
│  ├─ Lost: 2
│  └─ Lost Reason breakdown chart
├─ MY TERRITORY
│  ├─ Interactive map showing territory
│  ├─ Active customers: 45
│  ├─ Service frequency: 1.2x/month average
│  ├─ Repeat business: 80%
│  └─ Next appointment reminders
├─ MY COMMISSIONS (Personal)
│  ├─ This Month: $2,500 (pending confirmation)
│  ├─ Last Month: $2,100 (paid)
│  ├─ YTD Total: $18,750
│  ├─ Payment method: Direct deposit
│  └─ Payment date: Every 2 weeks
└─ FOLLOW-UP ACTIONS
   ├─ Follow-ups due today: 3
   ├─ Follow-ups due this week: 8
   ├─ [Quick Call] [Send SMS] [Schedule] buttons
   └─ [CALL THIS LEAD] button (tap to dial)
```

#### Technician Dashboard (Mobile)
```
OPTIMIZED FOR MOBILE DEVICE:

┌─────────────────────────────────┐
│ TODAY'S JOBS      Jan 26, 2026   │ 🔔
├─────────────────────────────────┤

[GPS ON] [Current Location]
[📍 45.5017° N, 73.5673° W]

MY STATS (Quick View)
├─ Today: 4 jobs scheduled
├─ Revenue potential: $1,200
├─ Time on site: 8:00 AM - 4:00 PM
└─ On-time: 100% this month ✓

[═══════════════════════════════════]

JOB CARD 1 (Current/Next)
┌────────────────────────────────┐
│ 09:00 - JOHN'S HOUSE            │
│ 📍 456 Main Street, Montreal    │
│ Service: Window Washing         │
│ Package: Basique                │
│ Est. Time: 1.5 hours            │
│ Revenue: $250                   │
│                                 │
│ [✓ CHECK IN] (Tap to start)    │
│ [📞 CALL] [📧 MESSAGE]          │
└────────────────────────────────┘

[═══════════════════════════════════]

JOB CARD 2 (Upcoming)
┌────────────────────────────────┐
│ 11:00 - JANE'S OFFICE           │
│ 📍 789 Park Ave, Montreal       │
│ Service: Roof Cleaning          │
│ Package: Premium                │
│ Est. Time: 2 hours              │
│ Revenue: $400                   │
│                                 │
│ Distance: 2.3 km (8 min drive)  │
│ [➡️ DIRECTIONS] [✓ CHECK IN]    │
│ [📞 CALL] [📧 MESSAGE]          │
└────────────────────────────────┘

[═══════════════════════════════════]

JOB CARD 3 (Upcoming)
┌────────────────────────────────┐
│ 14:00 - BUILDING COMPLEX        │
│ 📍 111 Oak Street, Quebec       │
│ Service: Gutter Cleaning        │
│ Package: Premium                │
│ Est. Time: 1 hour               │
│ Revenue: $300                   │
│                                 │
│ Distance: 35 km (45 min drive)  │
│ [➡️ DIRECTIONS] [✓ CHECK IN]    │
│ [📞 CALL] [📧 MESSAGE]          │
└────────────────────────────────┘

[═══════════════════════════════════]

QUICK ACTIONS (Bottom Bar)
├─ [📞 Support]
├─ [📋 Checklist]
├─ [🔴 INCIDENT REPORT]
└─ [👤 Profile]

End of Shift
├─ [✅ END SHIFT] - Saves location, marks availability
└─ [📸 SHIFT PHOTO] - Upload vehicle/equipment condition

NOTIFICATIONS (Badge Count: 2)
├─ Job reminder: Next job in 30 minutes
├─ Message: Customer "Jane Smith" sent message
└─ [DISMISS ALL]
```

---

### 3. DISPATCH PAGES

#### Dispatch Calendar (Week View - Drag & Drop)
```
LAYOUT: FULL-WIDTH CALENDAR

┌────────────────────────────────────────────────────────────┐
│ DISPATCH CALENDAR - Week of Jan 26-Feb 2                   │
│ [← PREV] [TODAY] [NEXT →]     VIEW: Week Month [+ NEW JOB] │
├────────────────────────────────────────────────────────────┤

FILTER BAR (Collapsed/Expandable)
├─ Status: [All ▼] [✓ Confirmed] [⏳ Pending] [❌ Cancelled]
├─ Technician: [All ▼] [John Doe] [Jane Smith] [Mike Brown]
├─ Service Type: [All ▼] [Window Washing] [Gutter] [Roof]
├─ Priority: [All ▼] [Low] [Medium] [High] [Urgent]
└─ Search: "Find job or customer..."

CALENDAR GRID
┌────────────┬────────────┬────────────┬────────────┐
│   MONDAY   │  TUESDAY   │ WEDNESDAY  │ THURSDAY   │
│ Jan 26     │ Jan 27     │ Jan 28     │ Jan 29     │
├────────────┼────────────┼────────────┼────────────┤

JOHN DOE (6 jobs)
├─ 09:00-10:30 │ Window Wash │ 456 Main │ $250 ✓
├─ 11:00-12:30 │ Roof Clean  │ 567 Oak  │ $400 ⏳
├─ 14:00-15:00 │ Gutter      │ 234 Elm  │ $180 ✓
├─ [+] ADD JOB │
└─ Total: $830/day

JANE SMITH (8 jobs)
├─ 09:00-10:00 │ Window Wash │ 789 Park │ $150 ✓
├─ 11:00-12:30 │ Pressure W. │ 345 Pine │ $200 ✓
├─ 13:00-14:30 │ Gutter      │ 890 Birch│ $300 ✓
├─ 15:00-16:00 │ Roof Clean  │ 123 Maple│ $400 ⏳
├─ [+] ADD JOB │
└─ Total: $1,050/day

MIKE BROWN (5 jobs)
├─ 09:30-10:30 │ Gutter      │ 111 Oak  │ $300 ✓
├─ 11:00-12:00 │ Roof Clean  │ 567 Pine │ $350 ⏳
├─ 13:00-14:00 │ Window      │ 234 Ash  │ $250 ✓
├─ [+] ADD JOB │
└─ Total: $900/day

FEATURES
├─ Drag job cards to move between technicians
├─ Drag job cards down to change time
├─ Drop zone highlights on hover
├─ Conflict warnings (overlapping times)
├─ Double-click to edit job details
├─ Right-click context menu (Edit/Delete/Reassign)
├─ Color coding by status:
│  ├─ Green: Confirmed
│  ├─ Blue: In Progress
│  ├─ Orange: Pending confirmation
│  ├─ Red: Delayed/No-show
│  └─ Gray: Cancelled
└─ Total revenue visible at bottom of each column

SIDE PANEL (Right Side - Collapsible)
├─ UNASSIGNED JOBS (2)
│  ├─ Job #456: Window Washing - 123 Main - $250 (Today 10:00)
│  ├─ Job #457: Roof Cleaning - 456 Park - $400 (Today 14:00)
│  └─ [Auto-Assign] [Assign Manually]
├─ TECHNICIAN STATUS
│  ├─ John Doe: 3/6 jobs completed (50%) - On time
│  ├─ Jane Smith: 5/8 jobs completed (62%) - On time
│  └─ Mike Brown: 2/5 jobs completed (40%) - Delayed (1)
├─ WEATHER FORECAST
│  ├─ Mon: Sunny ☀️ (-5°C)
│  ├─ Tue: Cloudy ☁️ (-3°C)
│  ├─ Wed: Rain 🌧️ (-1°C) [⚠️ May affect outdoor jobs]
│  └─ [CANCEL JOBS FOR RAIN]
└─ DAILY METRICS
   ├─ Total Jobs: 19
   ├─ Total Revenue: $2,780
   ├─ Completed: 10 (53%)
   ├─ On Time: 9 (90%)
   └─ Avg Rating: 4.8/5.0
```

#### Job Details Modal (Edit/Create)
```
MODAL: NEW/EDIT JOB

┌──────────────────────────────────────────┐
│ JOB #234 - EDIT                        [X]│
├──────────────────────────────────────────┤

TAB 1: JOB DETAILS (Active)
├─ Service Type: [Window Cleaning ▼]
├─ Package: [Basique ▼] [Premium] [Prestige]
├─ Customer: [Select... ▼] (or "+ New Customer")
├─ Description: [Text area with rich formatting]
│
├─ SCHEDULING
│  ├─ Date: [Jan 26, 2026]
│  ├─ Start Time: [09:00] AM/PM
│  ├─ Duration: [1.5 hours] (auto-calculates end time)
│  ├─ End Time: [10:30]
│  └─ [🔄 Auto-schedule] (AI scheduling)
│
├─ LOCATION
│  ├─ Address: [456 Main Street]
│  ├─ City: [Montreal]
│  ├─ Postal Code: [H1H 1A1]
│  ├─ [🗺️ MAP PREVIEW] (Small interactive map)
│  └─ Distance from last job: 2.3 km (8 min)
│
├─ PRICING
│  ├─ Estimated Revenue: [$250.00]
│  ├─ Discount: [% ▼] [% input]
│  ├─ Discount Reason: [Required if % > 0]
│  ├─ Final Price: [$250.00]
│  └─ [💰 ADD UPSELLS]
│
├─ ASSIGNMENT
│  ├─ Assigned to: [Jane Smith ▼] (Auto-populated if editing)
│  ├─ Manager: [John Manager ▼]
│  └─ Notes: [Any special instructions]
│
└─ ACTION BUTTONS
   ├─ [SAVE JOB]
   ├─ [SAVE & SEND TO CUSTOMER]
   ├─ [SAVE & ADD ANOTHER]
   ├─ [CANCEL]
   └─ [DELETE] (if existing job)

TAB 2: CUSTOMER INFO
├─ Name: [Jane Smith]
├─ Phone: [(514) 555-0123]
├─ Email: [jane@email.com]
├─ Previous jobs: 12
├─ Last service: Jan 15, 2026
├─ Average rating: 4.9/5.0
└─ Payment method: Interac

TAB 3: NOTES & HISTORY
├─ Internal notes: [Text area]
├─ Customer notes: [Text area]
├─ Technician notes: [Empty until completed]
└─ Change history:
   ├─ Jan 26, 10:00: Status changed to "confirmed"
   ├─ Jan 25, 14:30: Price updated by Manager
   └─ Jan 25, 09:00: Job created by Sales Rep

UPSELLS SECTION (If opened)
├─ Available add-ons for this service:
│  ├─ ☐ Gutter Cleaning (+$150)
│  ├─ ☐ Pressure Washing (+$200)
│  └─ ☐ Window Screens (+$50)
└─ Selected total: $400
```

---

### 4. CUSTOMER PAGES

#### Customers List
```
LAYOUT: FULL-WIDTH TABLE WITH SIDEBAR

LEFT SIDEBAR
├─ FILTERS
│  ├─ Status: [All ▼] [Active] [Inactive] [Prospect]
│  ├─ Type: [All ▼] [Residential] [Commercial]
│  ├─ Territory: [All ▼] [Downtown] [West Island]
│  ├─ Rating: [All ▼] [⭐⭐⭐⭐⭐] [4+ stars]
│  └─ [APPLY FILTERS]
├─ SEARCH
│  └─ [🔍 Search customer name, phone, email...]
├─ ACTIONS
│  ├─ [+ NEW CUSTOMER]
│  ├─ [📤 IMPORT CSV]
│  └─ [📥 EXPORT LIST]
└─ SAVED VIEWS
   ├─ All Customers (287)
   ├─ My Territory (45)
   ├─ VIP Customers (12)
   ├─ At-Risk (8)
   └─ [+ Save Current View]

MAIN TABLE
┌────────────────────────────────────────────────────────────┐
│ CUSTOMERS (Showing 1-10 of 287)                            │
├────────┬──────────┬─────────┬─────────┬────────────────────┤
│ SELECT │ NAME     │ PHONE   │ RATING  │ ACTIONS            │
├────────┼──────────┼─────────┼─────────┼────────────────────┤
│ ☐      │ Jane     │ (514)   │ ⭐⭐⭐⭐⭐│ [VIEW] [EDIT]     │
│        │ Smith    │ 555-0101│ (4.9)   │ [SCHEDULE] [EMAIL] │
├────────┼──────────┼─────────┼─────────┼────────────────────┤
│ ☐      │ Robert   │ (514)   │ ⭐⭐⭐⭐  │ [VIEW] [EDIT]     │
│        │ Martin   │ 555-0102│ (4.2)   │ [SCHEDULE] [SMS]   │
├────────┼──────────┼─────────┼─────────┼────────────────────┤

BULK ACTIONS (Bottom)
├─ [Select All] [Select Page] [Deselect All]
├─ With Selection:
│  ├─ [📧 EMAIL] [📱 SMS] [📞 CALL]
│  ├─ [📊 EXPORT] [🗑️ DELETE]
│  └─ [📍 ADD TO TERRITORY]

CUSTOMER CARD - DETAIL VIEW (Click Customer Row)
┌────────────────────────────────────────────────────┐
│ JANE SMITH - CUSTOMER DETAIL                    [X]│
├────────────────────────────────────────────────────┤

HEADER
├─ Name: Jane Smith
├─ Rating: ⭐⭐⭐⭐⭐ (4.9/5.0 - 34 reviews)
├─ Status: Active ✓
├─ Customer Since: Jan 2024 (1 year 1 month)
├─ Territory: Downtown Montreal
└─ Assigned Rep: Marie Dupont

CONTACT INFO
├─ Phone: (514) 555-0101
├─ Email: jane.smith@email.com
├─ Address: 456 Main Street, Montreal, QC H1H 1A1
└─ [📍 MAP] [📧 EMAIL] [📞 CALL]

FINANCIAL
├─ Total Spent: $4,500
├─ Average Job: $375
├─ Payment Method: Interac (preferred)
├─ Account Balance: $0 (Paid in Full ✓)
├─ Credit Limit: $1,000
└─ On-Time Payment Rate: 100%

SERVICE HISTORY
├─ Total Jobs: 12
├─ Last Service: Jan 19, 2026
├─ Next Service: Feb 9, 2026 (Scheduled)
├─ Preferred Services:
│  ├─ Window Cleaning: 8 times
│  ├─ Gutter Cleaning: 3 times
│  └─ Roof Cleaning: 1 time
└─ [VIEW ALL 12 JOBS]

COMMUNICATION
├─ SMS Opt-in: ✓ Yes
├─ Email Opt-in: ✓ Yes
├─ Marketing Opt-in: ✓ Yes
├─ Preferred Contact: SMS
└─ Last Contact: 2 days ago

QUICK ACTIONS
├─ [➕ NEW JOB]
├─ [📧 SEND EMAIL]
├─ [📱 SEND SMS]
├─ [📞 SCHEDULE CALL]
├─ [✏️ EDIT CUSTOMER]
└─ [⚠️ ADD TO BLACKLIST]
```

---

### 5. GPS & TRACKING PAGES

#### Live Tracking Map
```
LAYOUT: FULL-SCREEN MAP WITH CONTROLS

MAP AREA (Main)
├─ Google Maps integration
├─ Technician markers (color-coded):
│  ├─ 🔵 John Doe - On time, 2/6 jobs completed
│  ├─ 🟢 Jane Smith - On time, 5/8 jobs completed
│  └─ 🟠 Mike Brown - Delayed, 2/5 jobs completed
├─ Job location pins:
│  ├─ 🏠 Active job (Pulsing blue)
│  ├─ ✓ Completed jobs (Gray)
│  └─ ⏳ Pending jobs (Orange outline)
├─ Route overlay between jobs
└─ Traffic layer (optional toggle)

CONTROLS (Top-Left)
├─ [+ ZOOM] [- ZOOM]
├─ [🗺️ MAP] [🛰️ SATELLITE] [🌍 TERRAIN]
├─ [🚗 TRAFFIC] [Route Info]
└─ [TODAY] [WEEK] [CUSTOM DATE RANGE]

INFO PANELS (Top-Right)
├─ FILTER PANEL
│  ├─ Show: [All ▼] Technicians
│  ├─ By Status: [All ▼] [On Time] [Delayed]
│  └─ [APPLY]
└─ LEGEND
   ├─ 🔵 On Time
   ├─ 🟠 Delayed
   └─ ⚫ Offline

TECHNICIAN CARDS (Bottom Panel - Scrollable)
├─ JOHN DOE
│  ├─ Current Location: 456 Main St
│  ├─ Current Job: Window Washing (Jane Smith)
│  ├─ Time on Site: 45 minutes / 90 minutes est.
│  ├─ Next Job: 12 minutes away (11:00 AM)
│  ├─ GPS Accuracy: 12 meters
│  ├─ Status: ✓ On Schedule
│  ├─ Contact: [📞] [📱]
│  └─ [VIEW DETAILS] [📍 DIRECTIONS]
├─ JANE SMITH
│  ├─ Current Location: (Moving) 2 km from Westmount
│  ├─ ETA to Next Job: 8 minutes
│  ├─ GPS Signal: Strong ✓
│  ├─ Status: ✓ On Time
│  └─ [VIEW DETAILS]
└─ MIKE BROWN
   ├─ Current Location: 567 Pine St
   ├─ Current Job: Roof Cleaning (Building Complex)
   ├─ Time on Site: 25 minutes / 120 minutes est.
   ├─ Delay: 15 minutes behind schedule ⚠️
   ├─ Status: ⚠️ Delayed
   └─ [VIEW DETAILS] [RESCHEDULE NEXT JOB]

ACTIONS (Bottom-Right)
├─ [📊 EXPORT ROUTE]
├─ [💾 SAVE ROUTE]
├─ [📧 SEND SUMMARY]
└─ [🔄 REFRESH]
```

---

### 6. REPORTS PAGES

#### Dashboard Reports
```
LAYOUT: MULTI-SECTION REPORT VIEW

TAB NAVIGATION
├─ [Overview] [Revenue] [Team Performance] [Customer]
├─ [Quality] [Commission] [Audit Log] [Export]
└─ Date Range: [Last 30 Days ▼] [📅 Custom Range]

SECTION 1: KEY METRICS (Overview Tab)
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Jobs  │ Total Rev   │ Avg Rating  │ Customer   │
│ 487         │ $45,230     │ 4.8/5.0     │ 287        │
│ +15% vs mo  │ +18% vs mo  │ +0.2 vs mo  │ +5% vs mo  │
│ On-Time: 92%│ Completed:  │ Repeat: 82% │ New: 12    │
│             │ 98%         │             │            │
└─────────────┴─────────────┴─────────────┴─────────────┘

SECTION 2: REVENUE ANALYSIS (Revenue Tab)
├─ Daily Revenue Chart (Bar)
│  ├─ X-Axis: Dates
│  ├─ Y-Axis: Revenue ($)
│  ├─ Color: Gradient Blue
│  └─ Interactive: Hover for details
├─ Revenue by Service Type (Pie)
│  ├─ Window Cleaning: $18,500 (41%)
│  ├─ Gutter Cleaning: $14,200 (31%)
│  ├─ Roof Cleaning: $12,530 (28%)
│  └─ Click for details
├─ Revenue by Package (Horizontal Bar)
│  ├─ Basique: $12,300
│  ├─ Premium: $22,400
│  └─ Prestige: $10,530
└─ Revenue by Territory (Map Heatmap)
   ├─ Downtown: $18,500 (41%)
   ├─ West Island: $15,230 (34%)
   └─ East Side: $11,500 (25%)

SECTION 3: TEAM PERFORMANCE (Team Performance Tab)
├─ Leaderboard (Table)
│  ├─ John Doe: 234 jobs, $35,100, 94% on-time, Rank #1
│  ├─ Jane Smith: 198 jobs, $31,500, 96% on-time, Rank #2
│  ├─ Mike Brown: 145 jobs, $22,000, 85% on-time, Rank #3
│  └─ [View Detailed Stats]
├─ On-Time Performance (Bar Chart)
│  ├─ Target: 90%
│  ├─ John Doe: 94% ✓
│  ├─ Jane Smith: 96% ✓
│  └─ Mike Brown: 85% ⚠️
├─ Hours Worked (Time Tracking)
│  ├─ John Doe: 168 hours this month
│  ├─ Jane Smith: 156 hours
│  └─ Mike Brown: 134 hours
└─ Customer Rating by Technician (Star Chart)
   ├─ John Doe: 4.9/5.0 ⭐
   ├─ Jane Smith: 4.8/5.0 ⭐
   └─ Mike Brown: 4.5/5.0 ⭐

SECTION 4: CUSTOMER INSIGHTS (Customer Tab)
├─ New Customers: 12 this month
│  ├─ Source: 5 referrals, 4 Google, 3 Facebook
│  └─ Avg. first order value: $285
├─ Repeat Customers: 34 (82% of active)
│  ├─ Avg. repeat frequency: 1.2x per month
│  └─ Avg. customer lifetime value: $2,450
├─ Top 10 Customers (Table)
│  ├─ Jane Smith: $4,500 total, 12 jobs
│  ├─ Robert Martin: $4,200 total, 11 jobs
│  └─ [...8 more]
├─ Customer Satisfaction (NPS)
│  ├─ Promoters (9-10): 68%
│  ├─ Passives (7-8): 22%
│  ├─ Detractors (0-6): 10%
│  └─ NPS Score: +58 (Excellent)
└─ Churn Analysis
   ├─ Active Customers: 287
   ├─ Lost Customers: 12 (this month)
   ├─ Reason breakdown: Non-payment (3), Moved (5), Poor service (2), Other (2)
   └─ Re-engagement: 1 won back

SECTION 5: QUALITY METRICS (Quality Tab)
├─ Customer Complaints: 3 (0.6% of jobs)
│  ├─ Types: Water spots (1), Incomplete work (1), Late arrival (1)
│  ├─ Resolution time: Avg 2.3 hours
│  └─ Resolution rate: 100%
├─ Quality Issues by Technician (Table)
│  ├─ John Doe: 0 complaints (0%)
│  ├─ Jane Smith: 1 complaint (0.5%)
│  └─ Mike Brown: 2 complaints (1.4%)
├─ No-Show Rate: 2 (0.4% of jobs)
│  ├─ Customer no-shows: 1
│  ├─ Technician no-shows: 1
│  └─ Total impact: -$500 revenue
└─ Rework Required: 2 jobs (0.4%)
   ├─ John Doe: 0 rework
   ├─ Jane Smith: 1 rework
   └─ Mike Brown: 1 rework

SECTION 6: COMMISSION TRACKING (Commission Tab)
├─ Commissions This Month: $5,500 (estimated)
│  ├─ John Doe: $1,755 (5% of $35,100)
│  ├─ Jane Smith: $1,575 (5% of $31,500)
│  ├─ Mike Brown: $1,100 (5% of $22,000)
│  └─ Pending confirmation: 50%
├─ Commission by Service Type
│  ├─ Window Cleaning: $925
│  ├─ Gutter Cleaning: $710
│  └─ Roof Cleaning: $626
├─ Deductions Applied
│  ├─ Quality Issues: -$150
│  ├─ No-Shows: -$250
│  └─ Late Arrival: -$75
└─ Payments (Table)
   ├─ John Doe (Jan): $1,500 paid, $255 pending
   ├─ Jane Smith (Jan): $1,400 paid, $175 pending
   └─ Mike Brown (Jan): $950 paid, $150 pending

EXPORT OPTIONS (Bottom)
├─ [📥 EXPORT CSV]
├─ [📥 EXPORT PDF]
├─ [📧 EMAIL REPORT]
├─ [📊 SCHEDULE REPORT]
└─ [🔔 ALERTS ENABLED]
```

---

### 7. SETTINGS PAGES

#### Admin Settings
```
LEFT SIDEBAR - SETTINGS MENU
├─ [Company Settings]
├─ [Team Members]
├─ [Payment Methods]
├─ [Integration]
├─ [Security]
├─ [API Keys]
├─ [Notifications]
├─ [Billing]
└─ [Support]

MAIN AREA: COMPANY SETTINGS

COMPANY INFORMATION
├─ Company Name: Entretien Prestige
├─ Legal Name: Entretien Prestige Inc.
├─ Address: 1234 Rue Principal, Montreal, QC
├─ Phone: (514) 555-0100
├─ Email: info@entretienprestige.ca
├─ Website: entretienprestige.ca
├─ Logo Upload: [📤 UPLOAD LOGO]
├─ Business License: EP-2024-001234
└─ [SAVE CHANGES]

SERVICE CONFIGURATION
├─ Service Types:
│  ├─ ☑ Window Cleaning
│  ├─ ☑ Gutter Cleaning
│  ├─ ☑ Roof Cleaning
│  ├─ ☑ Pressure Washing
│  ├─ ☑ Other: [Custom Service Name]
│  └─ [ADD NEW SERVICE]
├─ Service Packages:
│  ├─ Basique: $50-150
│  ├─ Premium: $150-300
│  └─ Prestige: $300-500+
├─ Pricing Rules:
│  ├─ Standard markup: 100%
│  ├─ Holiday surcharge: +20%
│  ├─ Emergency surcharge: +50%
│  └─ Volume discount: 10% off 5+ jobs
└─ [SAVE PRICING]

TERRITORY MANAGEMENT
├─ Territories:
│  ├─ Downtown Montreal (5 reps)
│  ├─ West Island (3 reps)
│  ├─ East Side (2 reps)
│  └─ [+ ADD TERRITORY]
├─ Service Area:
│  └─ [🗺️ EDIT ON MAP] Polygon boundary
└─ [SAVE TERRITORY]

TEAM MANAGEMENT (Secondary Tab)
├─ Active Employees: 10
│  ├─ Admins: 1 (Me)
│  ├─ Managers: 2
│  ├─ Sales Reps: 3
│  └─ Technicians: 4
├─ [+ INVITE NEW TEAM MEMBER]
├─ Team List:
│  ├─ Name | Role | Status | Last Login | Actions
│  ├─ John Manager | Manager | Active | 1 hr ago | [EDIT] [REMOVE]
│  ├─ Marie Sales | Sales Rep | Active | 3 hrs ago | [EDIT] [REMOVE]
│  └─ [VIEW MORE]
└─ Pending Invitations: 1
   └─ john.tech@email.com (invited 2 days ago)

PAYMENT CONFIGURATION (Secondary Tab)
├─ Primary Payment Method: Interac
│  ├─ Account holder: Entretien Prestige Inc.
│  ├─ Bank: TD Bank
│  └─ Status: ✓ Connected
├─ Secondary Payment Method: Stripe
│  ├─ Stripe Account ID: acct_1234567890
│  ├─ Status: ✓ Connected
│  ├─ Processing Fee: 2.9% + $0.30 CAD
│  └─ [DISCONNECT] [EDIT SETTINGS]
├─ Payment Terms:
│  ├─ Default: Due Upon Receipt
│  ├─ Allow payment plans: ☐ No
│  └─ [SAVE]
└─ [+ ADD PAYMENT METHOD]

SECURITY SETTINGS (Secondary Tab)
├─ Two-Factor Authentication: ✓ Enabled (Required)
├─ Password Policy:
│  ├─ Minimum length: 16 characters
│  ├─ Require uppercase: ✓
│  ├─ Require numbers: ✓
│  ├─ Require symbols: ✓
│  ├─ Password expiry: 90 days
│  └─ [SAVE]
├─ Session Management:
│  ├─ Session timeout: 15 minutes
│  ├─ Require re-authentication for sensitive actions: ✓
│  └─ [SAVE]
├─ IP Whitelisting:
│  ├─ [ENABLE IP WHITELIST]
│  ├─ Allowed IPs: [List of IPs]
│  └─ [ADD IP]
├─ Audit Logging:
│  ├─ Status: ✓ Enabled (All actions logged)
│  ├─ Log retention: 30 days
│  └─ [VIEW AUDIT LOG]
└─ [SAVE SECURITY SETTINGS]

INTEGRATION SETTINGS (Secondary Tab)
├─ Twilio SMS: ✓ Connected
│  ├─ Account SID: AC1234567890
│  ├─ Phone Number: (514) 555-SMS
│  └─ [TEST SEND] [DISCONNECT]
├─ Google Maps: ✓ Connected
│  ├─ API Key: AIza...
│  ├─ Usage: 15,234/28,000 calls this month
│  └─ [USAGE DETAILS]
├─ Resend Email: ✓ Connected
│  ├─ Account: entretien@resend.com
│  ├─ Usage: 45/100 emails this month
│  └─ [USAGE DETAILS]
└─ [+ ADD INTEGRATION]

NOTIFICATIONS SETTINGS (Secondary Tab)
├─ Email Alerts:
│  ├─ ☑ Failed job
│  ├─ ☑ No-show
│  ├─ ☑ Payment received
│  ├─ ☑ Daily summary
│  └─ [SAVE]
├─ SMS Alerts:
│  ├─ ☑ Critical alerts only
│  ├─ Recipients: [admin1@, admin2@]
│  └─ [SAVE]
└─ Alert Recipients:
   ├─ Primary: admin@entretienprestige.ca
   ├─ Secondary: manager@entretienprestige.ca
   └─ [UPDATE]

BILLING & SUBSCRIPTION (Secondary Tab)
├─ Current Plan: Entretien Prestige Pro
│  ├─ Status: Active ✓
│  ├─ Monthly Cost: $25-40 CAD (SMS based)
│  └─ Renewal: Auto-renews monthly
├─ Usage This Month:
│  ├─ SMS: 1,234 / unlimited
│  ├─ Email: 45 / unlimited
│  ├─ API calls: 234,500 / unlimited
│  └─ Storage: 2.3 GB / 100 GB
├─ Billing History:
│  ├─ January 2026: $32.50
│  ├─ December 2025: $28.75
│  └─ [VIEW ALL INVOICES]
└─ [UPGRADE PLAN] [CANCEL SUBSCRIPTION]
```

---

### 8. MOBILE APP - SPECIFIC PAGES

#### Mobile Navigation
```
BOTTOM TAB BAR (Always Visible)
├─ [📱 TODAY'S JOBS] (Active indicator)
├─ [🗺️ MAP]
├─ [👥 CUSTOMERS]
├─ [💰 EARNINGS]
└─ [👤 PROFILE]

EACH TAB LEADS TO:

TAB 1: TODAY'S JOBS (Default Home)
├─ GPS status
├─ Current job card (drag to reveal actions)
├─ Job list (scrollable)
├─ [+ ADD JOB] floating action button
└─ Quick stats at top

TAB 2: LIVE MAP
├─ Full-screen map
├─ My current location
├─ My route between jobs
├─ Customer locations
├─ Technician locations
└─ Quick search at top

TAB 3: CUSTOMERS (Quick Access)
├─ My assigned customers
├─ Recent customers
├─ [🔍 Search]
├─ [+ NEW CUSTOMER]
└─ Contact quick actions

TAB 4: EARNINGS (Commission Tracking)
├─ This week: $1,200 (pending)
├─ This month: $4,500 (confirmed)
├─ Last payment: $1,500 (delivered)
├─ Breakdown by job
└─ Payment history

TAB 5: PROFILE
├─ User info
├─ Edit profile
├─ Settings
├─ Support
└─ [LOGOUT]
```

---

## PARTIE 4: COMPONENT LIBRARY

### Buttons

```
PRIMARY BUTTON
├─ Background: Prestige Blue (#1E40AF)
├─ Text: White (#FFFFFF)
├─ Padding: 10px 16px
├─ Border-radius: 8px
├─ Font-weight: 500
├─ Hover: Darker blue (#1E3A8A) + Shadow
├─ Active: Dark blue (#1E3A8A)
└─ Example: [+ NEW JOB] [SAVE] [CONFIRM]

SECONDARY BUTTON
├─ Background: Light Blue (#DBEAFE)
├─ Text: Prestige Blue (#1E40AF)
├─ Border: 1px Prestige Blue
├─ Hover: Background darker
└─ Example: [CANCEL] [PREVIEW] [EDIT]

DANGER BUTTON
├─ Background: Error Red (#EF4444)
├─ Text: White
├─ Hover: Darker red
└─ Example: [DELETE] [REMOVE] [CANCEL JOB]

ICON BUTTON
├─ Size: 40px × 40px (touch-friendly)
├─ Icon: 20px Feather Icon
├─ Hover: Subtle background
└─ Example: [🔍] [📞] [📧]

TEXT BUTTON
├─ No background
├─ Text: Prestige Blue
├─ Underline on hover
└─ Example: [View Details] [Learn More] [Skip]
```

### Form Elements

```
INPUT FIELD
├─ Background: White (#FFFFFF)
├─ Border: 1px Light Gray
├─ Focus: 2px Prestige Blue border
├─ Padding: 8px 12px
├─ Height: 40px (mobile-friendly)
├─ Font: 14px Inter
└─ Placeholder: Light gray text

SELECT DROPDOWN
├─ Style: Standard input with caret icon
├─ Arrow: Down chevron (Prestige Blue)
├─ Options: Scroll or dropdown
└─ Focus state: Blue border + focus ring

CHECKBOX
├─ Size: 18px × 18px
├─ Unchecked: Empty square, light border
├─ Checked: Prestige Blue background + white checkmark
├─ Label positioned: Right of checkbox
└─ Cursor: Pointer

RADIO BUTTON
├─ Size: 18px diameter
├─ Unchecked: Empty circle, gray border
├─ Checked: Blue circle with white dot
└─ Label positioned: Right of radio

TEXTAREA
├─ Min height: 100px
├─ Resizable: Vertical only
├─ Scrollbar: Custom styled (Blue)
└─ Placeholder: Light gray

TOGGLE SWITCH
├─ Size: 44px × 24px (mobile-friendly)
├─ OFF: Gray background
├─ ON: Prestige Blue background
├─ Animation: Smooth slide 200ms
└─ Used for: Settings, preferences

DATE PICKER
├─ Format: DD/MM/YYYY
├─ Calendar popup: Prestige Blue header
├─ Today highlight: Light blue
├─ Selected: Prestige Blue
└─ Navigation: Month/Year controls

TIME PICKER
├─ Format: HH:MM (24-hour)
├─ Input: Numeric with colon separator
├─ Validation: 00:00 - 23:59
└─ AM/PM toggle (if 12-hour)
```

### Cards & Sections

```
CARD COMPONENT
├─ Background: White (#FFFFFF)
├─ Border: 1px Light border (#E5E7EB)
├─ Border-radius: 8px
├─ Padding: 16px
├─ Shadow: Subtle elevation
├─ Hover: Slight lift + enhanced shadow
└─ Used for: Job cards, customer cards, etc.

METRIC CARD (KPI)
├─ Header: Metric name
├─ Large value: Bold, large font
├─ Subtext: Trend & comparison
├─ Icon: Top-right corner
├─ Color: Gradient or solid based on status
└─ Size: 200px × 120px

JOB CARD (Dispatch)
├─ Top section: Time + Status badge
├─ Middle: Job details (address, service, price)
├─ Bottom: Assigned technician
├─ Right side: Quick actions (dots menu)
└─ Drag handle: Left side for reordering

SECTION
├─ Header: Title (H2 or H3)
├─ Divider: Light gray line
├─ Content: Multiple components
├─ Footer: Optional actions/pagination
└─ Margin: 24px bottom
```

### Alerts & Notifications

```
SUCCESS ALERT
├─ Background: Light green (#ECFDF5)
├─ Border: 1px Green (#10B981)
├─ Text: Dark green
├─ Icon: ✓ Checkmark
├─ Position: Top of page or inline
└─ Auto-dismiss: 5 seconds (optional)

ERROR ALERT
├─ Background: Light red (#FEF2F2)
├─ Border: 1px Red (#EF4444)
├─ Text: Dark red
├─ Icon: ✕ Cross
├─ Dismissible: [X] button
└─ Position: Top of page or inline

WARNING ALERT
├─ Background: Light orange (#FFFBEB)
├─ Border: 1px Orange (#F59E0B)
├─ Text: Dark orange
├─ Icon: ⚠️ Warning
└─ Position: Top of page

INFO ALERT
├─ Background: Light blue (#EFF6FF)
├─ Border: 1px Blue (#3B82F6)
├─ Text: Dark blue
├─ Icon: ℹ️ Information
└─ Dismissible: [X] button

TOAST NOTIFICATION
├─ Position: Bottom-right corner
├─ Width: 300px
├─ Auto-dismiss: 3-5 seconds
├─ Animation: Slide in from right
└─ Types: Success, Error, Info, Loading
```

---

## PARTIE 5: ACCESSIBILITY & MOBILE OPTIMIZATION

### Accessibility Features (WCAG 2.1 AA)

```
KEYBOARD NAVIGATION
├─ Tab order: Logical, left-to-right, top-to-bottom
├─ Focus indicators: Visible 2px outline
├─ Skip links: [Skip to main content]
├─ Keyboard shortcuts: [?] for help
└─ No keyboard traps

SCREEN READER SUPPORT
├─ ARIA labels: All buttons and icons
├─ Form labels: Associated with inputs
├─ Semantic HTML: Proper heading hierarchy
├─ Alt text: All images described
└─ Live regions: ARIA-live for dynamic content

COLOR CONTRAST
├─ Text: Minimum 4.5:1 ratio (normal text)
├─ Large text: Minimum 3:1 ratio
├─ Background: Sufficient contrast against text
└─ Color alone not used to convey meaning

TEXT SIZING
├─ Minimum: 14px (body text)
├─ Responsive: Scales on mobile
├─ Line height: 1.5 for readability
└─ Line length: Max 80 characters

MOBILE OPTIMIZATION
├─ Touch targets: Minimum 44px × 44px
├─ Spacing: Adequate padding between elements
├─ Responsive: Works on 320px - 1920px widths
├─ Performance: Load time < 3 seconds
└─ Offline support: Key pages cached
```

---

## PARTIE 6: DEPLOYMENT & LAUNCH ROADMAP

### Development Phases

```
PHASE 1: FOUNDATION (Weeks 1-4)
├─ Authentication & Authorization
├─ Database setup & migrations
├─ Core API endpoints
├─ Admin dashboard skeleton
└─ Team: Backend lead + Frontend lead

PHASE 2: CORE FEATURES (Weeks 5-8)
├─ Dispatch calendar (drag & drop)
├─ Job management (CRUD)
├─ Customer management
├─ GPS tracking implementation
└─ Team: Full dev team

PHASE 3: MOBILE APP (Weeks 9-12)
├─ React Native setup
├─ Offline-first data sync
├─ GPS integration
├─ Job tracking UI
└─ Team: Mobile specialist

PHASE 4: PAYMENT & REPORTS (Weeks 13-16)
├─ Stripe integration
├─ Invoice generation
├─ Commission tracking
├─ Advanced reporting
└─ Team: Backend + Finance specialist

PHASE 5: TESTING & OPTIMIZATION (Weeks 17-20)
├─ QA testing (manual + automated)
├─ Performance optimization
├─ Security audit
├─ User acceptance testing
└─ Team: QA lead + DevOps

PHASE 6: LAUNCH (Week 21+)
├─ Production deployment
├─ Staff training
├─ Customer support setup
├─ Monitoring & maintenance
└─ Team: DevOps + Support

TOTAL: 12 weeks for MVP launch
```

---

## RÉSUMÉ FINAL - UI/UX COMPLETE

```
✅ AUTHENTICATION
   ├─ Login / Register / Forgot Password
   ├─ 2FA (SMS + Authenticator)
   ├─ Session management
   └─ Security: Enterprise-grade

✅ DASHBOARD
   ├─ Admin Dashboard (Full view)
   ├─ Manager Dashboard (Team view)
   ├─ Sales Rep Dashboard (Personal)
   ├─ Technician Dashboard (Mobile-first)
   └─ Metrics: 15+ KPI cards

✅ DISPATCH MANAGEMENT
   ├─ Calendar (Week/Month view)
   ├─ Drag & Drop scheduling
   ├─ Conflict detection
   ├─ Auto-assignment (AI optional)
   └─ Real-time updates

✅ CUSTOMER MANAGEMENT
   ├─ Customer list with filters
   ├─ Detailed customer profiles
   ├─ Communication history
   ├─ Job history
   └─ Blacklist management

✅ GPS & TRACKING
   ├─ Live map with technician markers
   ├─ Route tracking
   ├─ Geofence check-in/out
   ├─ Distance calculations
   └─ Battery-efficient pinging

✅ REPORTS & ANALYTICS
   ├─ Revenue analysis
   ├─ Team performance
   ├─ Customer insights
   ├─ Quality metrics
   ├─ Commission tracking
   └─ Export (CSV/PDF)

✅ PAYMENTS & BILLING
   ├─ Invoice generation
   ├─ Payment tracking
   ├─ Commission calculation
   ├─ Payroll statements
   └─ Stripe + Interac integration

✅ MOBILE APP
   ├─ Today's jobs view
   ├─ GPS check-in/out
   ├─ Real-time tracking
   ├─ Offline support
   ├─ Biometric auth
   └─ Quick actions

✅ BRANDING
   ├─ Prestige Blue color palette
   ├─ Professional typography
   ├─ Consistent component library
   ├─ Logo placement guidelines
   ├─ Responsive design (320px - 1920px)
   └─ Dark mode support (optional)

✅ SECURITY
   ├─ End-to-end encryption
   ├─ Multi-factor authentication
   ├─ Role-based access control
   ├─ Row-level security
   ├─ Audit logging
   └─ PIPEDA + Quebec Law 25 compliant

✅ PERFORMANCE
   ├─ Sub-second API responses
   ├─ Global CDN
   ├─ Automatic scaling
   ├─ 99.9% uptime SLA
   └─ Mobile optimization

TOTAL FEATURES: 40+ pages & 200+ components
DEVELOPMENT TIME: 12 weeks for MVP
ONGOING COST: $15-40/month (SMS only)
SCALABILITY: Enterprise-ready
```

---

**END OF UI/UX FEATURE LIST - PRODUCTION READY**

This complete document covers all pages, features, components, branding guidelines, and accessibility standards for Entretien Prestige application.

Development team can start immediately with this as the source of truth.
