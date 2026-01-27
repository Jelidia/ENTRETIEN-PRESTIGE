# ENTRETIEN PRESTIGE - COMPLETE SPECIFICATION & ANSWERS
## All 48+ Questions Answered | Final Requirements Document

**Date:** January 27, 2026  
**Version:** 2.0 - Final Specification  
**Company:** Entretien Prestige - Services de Nettoyage Professionnel  
**Status:** READY FOR DEVELOPMENT  
**Timeline:** 12-16 weeks for v1.0 Launch  

---

## 📋 COMPLETE ANSWERS TO ALL REQUIREMENTS QUESTIONS

### **INFORMATION GATHERING SECTION**

**Q: Roles in the system?**
- ✅ Admin (Full access)
- ✅ Manager/Operations Manager (Admin minus core settings)
- ✅ Sales Rep (Personal sales focus)
- ✅ Technician (Field operations)
- ✅ Customer (Portal - SMS/Email updates only, NO login)
- ❌ NO Dispatch role (Dispatch is a page inside Schedule)

---

### **NAVIGATION & INTERFACE**

**Q: Desktop vs Tablet vs Mobile Navigation?**
- ✅ **Mobile-first ONLY** on ALL devices (phones, tablets, desktops)
- ✅ Bottom navigation bar (Instagram-style)
- ✅ **NO left sidebar ever**
- ✅ Single-column layout (max 640px width, centered on desktop)
- ✅ Same experience across 320px to 4K screens

**Q: Scrolling on pages?**
- ✅ **NO big scrolling**
- ✅ Fits on 1-2 screen heights per page
- ✅ Pagination instead of infinite lists (5-10 items per page)
- ✅ Modals for details (not full-page scrolls)
- ✅ Accordion-style collapsible sections
- ✅ Tabs to organize content
- ✅ Bottom sheet modals (swipe to close)
- ✅ "View All" buttons for extended lists

---

### **CUSTOMER PORTAL & COMMUNICATION**

**Q: Should customers have login access?**
- ❌ **NO customer portal login**
- ✅ SMS/Email updates only
- ✅ No ability for customer to cancel (prevent lost business)
- ✅ Customers receive SMS reminders only (24h before + 1h before)

**Q: Can customers reply to SMS?**
- ✅ **YES - Two-way SMS inbox**
- ✅ Manager sees ALL customer conversations
- ✅ Technician sees ONLY their assigned customers
- ✅ Sales Rep sees ONLY their assigned customers

---

### **SCHEDULING & JOB MANAGEMENT**

**Q: Job Confirmation Flow?**
- ✅ Customer receives reminder SMS only
- ✅ **NO customer choice to cancel** (prevent lost business)
- ✅ SMS at: Job scheduled + 24h reminder + 1h reminder

**Q: Recurring Jobs?**
- ❌ **NO automatic recurring appointments**
- ✅ Each job must be scheduled manually every time

**Q: Job Cancellation - Who can cancel?**
- ✅ **Admin + Manager + Sales Rep (if their customer)**
- ❌ Technician cannot cancel
- ❌ Customer cannot cancel

**Q: No-Show Protocol?**
- ✅ Technician sees "Customer not available" button
- ✅ Prompts: [📞 CALL CUSTOMER] [📱 SMS CUSTOMER]
- ✅ After 10min no answer → [SKIP TO NEXT JOB]
- ✅ Customer receives SMS: "Désolé, vous n'étiez pas disponible. Veuillez nous texter pour reprogrammer."
- ✅ Manager & Sales Rep notified

**Q: Job Time Buffer?**
- ❌ **NO automatic travel time buffer**
- ✅ Manager manually adds buffer if needed

**Q: Who can assign jobs?**
- ✅ **Admin** can assign any job
- ✅ **Manager** can assign jobs in their territory
- ✅ **Sales Rep** can assign their own leads to technicians

---

### **PRICING & PACKAGES**

**Q: Dynamic Pricing?**
- ✅ **ALL factors included:**
  - Size-based (sq ft / # of windows)
  - Time-based (evening/weekend +20%)
  - Holiday surcharge (+%)
  - Volume discount (5+ jobs = 10% off)

**Q: Upsells Management?**
- ✅ **Pre-approved list** - Technician picks from list, customer approves on-site
- ✅ **NOT in list** → Technician calls manager
- ✅ **Manager can add** upsell to list:
  - For this job only (temporary)
  - For all jobs (permanent)

**Q: Discounts - Who can apply?**
- ✅ **Admin** - Full access
- ✅ **Manager** - Full access
- ✅ **Sales Rep** - Max 10% without approval

**Q: Subscription Pricing Model?**
- ✅ **Auto-Billing** - Customer pays monthly via credit card/Interac (recurring charge)
- ✅ **Payment frequencies:** Yearly, Bi-yearly (every 6 months), Tri-yearly, Monthly
- ✅ **10% permanent discount** for subscription customers

---

### **INVOICES, RECEIPTS & PAYMENTS**

**Q: Invoice Generation Timing?**
- ✅ **Manager approval flow:**
  - Technician completes job → Manager reviews → Manager approves → Invoice sent

**Q: Payment Due Date?**
- ✅ **Default: Due Upon Receipt** (configurable)
- ✅ **Admin & Manager can set per customer** different terms
- ✅ Options: Due Upon Receipt, Net 7, Net 15, Net 30, Custom

**Q: Late Payment - What happens?**
- ✅ **Automatic SMS reminders:**
  - 3 days overdue
  - 7 days overdue
  - 14 days overdue

**Q: Receipt Requirements?**
- ✅ **Quebec Legal Format** (MANDATORY)
  - GST/QST breakdown
  - Company name & number
  - Company address
  - All transaction details

**Q: Payment Methods Supported?**
- ✅ **Interac** (primary, 0% fees)
- ✅ **Stripe** (credit cards, 2.9% + $0.30 CAD)
- ✅ **Cash** (manual tracking)
- ✅ **Subscriptions** (monthly/yearly auto-billing)

**Q: SMS Payment Triggers?**
- ✅ Job completed → SMS with payment method:
  - **Interac selected:** "Facture envoyée par email. Payez par Interac: [email]"
  - **Stripe selected:** "Payez ici: [Stripe link]"
  - **Cash selected:** No extra message (already paid on-site)

---

### **QUALITY CONTROL & FEEDBACK**

**Q: Before/After Photos?**
- ✅ **Mandatory for EVERY job**
- ✅ **Minimum:** 1 photo per side of house (4 sides = 4 min photos)
- ✅ Technician uploads before job + after job
- ✅ Manager reviews and approves

**Q: Quality Check Process?**
- ✅ **Photo-based review** - Manager reviews before/after photos
- ✅ **Customer rating link sent** after job completion
- ✅ **Rating page displays:** "Comment était votre service? ⭐⭐⭐⭐⭐"

**Q: Rating Logic & Google Review Bonus?**
- ✅ **1-3 stars:** Save to database (internal), manager notified
- ✅ **4-5 stars:**
  - Save to database
  - Redirect to Google review link: https://share.google/AfjIytoyGPTNKgmm3
  - Message: "Merci! Laissez-nous un avis Google"
  - **$5 bonus added to technician commission** if customer mentions technician NAME in review

**Q: Re-Work Policy?**
- ✅ **Custom [🔄 RE-WORK REQUIRED] button** with options:
  - ☐ Same technician (no commission)
  - ☐ Different technician (original keeps commission)
  - ☐ Remove 100% commission from original
  - ☐ Remove 50% commission from original
  - ☐ Customer refund (full)
  - ☐ Customer refund (partial: $____)
  - Notes field + [APPLY]
- ✅ System auto-adjusts commission

**Q: Customer Complaints?**
- ✅ **Phone call required** - No automated complaint system
- ✅ Manager manually logs complaint in customer profile
- ✅ Creates ticket for resolution

---

### **EMPLOYEE MANAGEMENT**

**Q: Technician Availability?**
- ✅ **Self-Service Availability Calendar:**
  - Weekly grid: Monday-Sunday
  - Hourly blocks: 7am - 11pm (or custom)
  - Green cells = Available, Gray = Not available
  - Technician clicks to toggle
  - Updated every week (reminder SMS Sunday night)
  - **SAME FOR SALES REPS** - hourly availability setting
  - Example: "Free Monday 9-14h, Thursday 10-16h"

**Q: Overtime Rules?**
- ✅ **NO overtime calculation**
- ✅ **Commission-only model** (no hourly wage)

**Q: Commission Deductions?**
- ✅ **Equipment damage/loss only** (manual entry by manager)
- ✅ Example: Broken ladder = -$50 from commission
- ✅ NO deductions for quality complaints
- ✅ NO deductions for no-shows
- ✅ NO deductions for late arrivals

**Q: Onboarding Checklist?**
- ✅ **YES - New technician must complete:**
  - Safety training (videos + quiz)
  - Equipment training
  - Customer service guidelines
  - First job shadowing (with senior tech)

**Q: Employee Termination?**
- ✅ **Immediate account lockout** (same day)
- ✅ **Auto-generate commission statement:**
  - All pending commissions (estimated + confirmed)
  - Deductions applied
  - Net total
- ✅ **Email statement to employee** with PDF attachment (for taxes)
- ✅ **Archive employee data** (7-year retention for Quebec Law 25)

---

### **TERRITORY & ROUTING**

**Q: Territory Assignment?**
- ✅ **Admin/Manager can DRAW on map:**
  - Interactive map with polygon drawing tools
  - Each sales rep assigned to drawn boundaries
  - Shows customer density in territory
  - Can edit/delete territories

**Q: Route Optimization?**
- ❌ **NO automatic route planning**
- ✅ Manager manually arranges jobs

**Q: Multi-Technician Jobs?**
- ✅ **YES - Large commercial jobs can have 2+ technicians**
- ✅ **Custom commission split:**
  - Can be 50/50, 10/90, 30/70, etc.
  - Admin/Manager sets split when assigning
  - System auto-adjusts commission for each tech

---

### **GPS TRACKING & GEOFENCING**

**Q: GPS Tracking Frequency?**
- ✅ **Active ONLY when user is on web page**
- ✅ **Frequency:** Every 30min minimum interval
- ✅ **Stops when:** User leaves page or inactive 30min+
- ✅ **Resumes when:** User returns to page
- ✅ Battery-friendly (no constant pinging)

---

### **REPORTS & DATA EXPORT**

**Q: Who can export data?**
- ✅ **Admin ONLY** (most secure)
- ❌ Manager cannot export
- ❌ Sales Rep cannot export

**Q: Reports Access?**
- ✅ Accessible via:
  - Settings [📊 Reports] button
  - Home dashboard [📊 REPORTS] quick action
- ✅ All role-based filtering applied

---

### **COMMISSION & EARNINGS VISIBILITY**

**Q: Can technicians see estimated earnings?**
- ✅ **YES - Hybrid approach:**
  - See estimated earnings: $4,500
  - Label: "⏳ Pending Confirmation"
  - Once approved by manager: "✅ Confirmed"

**Q: Can sales reps see pending earnings?**
- ✅ **YES - Same as technicians:**
  - "⏳ Pending Confirmation" label on estimated
  - "✅ Confirmed" when manager approves

**Q: Leaderboard Display?**
- ✅ **HYBRID - Everyone sees:**
  - Rank only: "#2 of 5"
  - Percentage comparison: "+5% above #1, -10% below average"
- ✅ **Earnings HIDDEN** (not visible to other employees)

---

### **DATA RETENTION & SECURITY**

**Q: Customer Data Retention?**
- ✅ **7 years** (Quebec Law 25 compliance)
- ✅ Customers must be contacted for deletion request
- ✅ Invoices, receipts retained for 7 years

**Q: Employee Data Retention?**
- ✅ **7 years after termination**
- ✅ Commission statements archived
- ✅ Performance records retained

**Q: Backup Schedule?**
- ✅ **Daily at midnight** (sufficient for small business)
- ✅ 7-day rolling backups maintained

---

### **ADVANCED FEATURES**

**Q: Weather Integration?**
- ❌ **NO automatic weather alerts**
- ✅ Manager checks weather manually

**Q: Referral Program?**
- ✅ **YES - $50 gift card per referral**
  - Customer refers friend → Friend books job
  - Referring customer gets $50 gift card
  - Sent via email/SMS
  - Tracked in CRM

**Q: Loyalty Program?**
- ✅ **Subscription discount:** 10% permanent for monthly/yearly subscribers
- ✅ **Points system:** 1 point per $1 spent
- ✅ **Redemption:** 100 points = $10 off next service
- ✅ Auto-applied at checkout

**Q: Blacklist Management?**
- ✅ **Hard block** - Cannot book jobs (rejected automatically)
- ✅ Shows alert when attempting to schedule
- ✅ Requires admin to whitelist if needed

**Q: Multi-Company Support?**
- ✅ **Future-proof database design:**
  - All tables have `company_id` field
  - Row-Level Security (RLS) enforces isolation
  - Company switcher dropdown (when >1 company)
  - User can be assigned to multiple companies (future)

---

## 🗂️ ROLE-BASED NAVIGATION STRUCTURE

### **ADMIN - 5 TABS (Bottom Navigation)**
```
[📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
```

**Home (Dashboard):**
- KPI cards (Today's jobs, Revenue, Customers, Rating)
- Performance graphs
- Quick actions
- Today's schedule (3 jobs visible)
- Alerts & notifications
- Team status
- Top customers this month
- Revenue forecast

**Schedule (Dispatch Calendar):**
- Week view, drag & drop
- Technicians with collapsed job lists (3 jobs visible per tech)
- [VIEW ALL] opens modal with pagination
- Unassigned jobs panel
- Filter by status, technician, service type

**Customers (CRM):**
- Customer list (4 per page)
- Pagination (1/72)
- Search & filters
- Tap customer → Bottom sheet modal with tabs
- Modal tabs: [INFO] [JOBS] [SMS]
- Quick actions: [📅 NEW JOB] [📱 SMS] [🚫 BLACKLIST]

**Team (Management):**
- Employee list (4 per page, pagination)
- Tabs: [LIST] [GPS] [COMMISSIONS] [🗺️ TERRITORY]
- GPS tab: Mini map + 3 status cards
- Territory tab: Interactive map with polygon drawing tools
- Availability grid: Edit hours per employee (Mon-Sun, hourly)

**Settings (Admin):**
- [👤 Profile]
- [🏢 Company Info]
- [💳 Payments]
- [💼 Services & Pricing]
- [📸 Equipment Checklist] (customizable by admin)
- [🔌 Integrations]
- [🔐 Security]
- [🔔 Notifications]
- [💰 Billing]
- [❓ Support]

---

### **MANAGER - 5 TABS (Same as Admin, limited Settings)**
```
[📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
```

**Difference:**
- ⚙️ **Settings Tab Limited to:**
  - [👤 Profile]
  - [🧑‍💼 Team Settings] (approval workflows, checklists)
  - [🔔 Notifications]
- ❌ Cannot access: Company, Payments, Integrations, Security, Billing

---

### **SALES REP - 5 TABS**
```
[📊 Home] [🎯 Leads & Customers] [📅 My Schedule] [💰 Earnings] [⚙️ Settings]
```

**Home (Dashboard):**
- Personal KPIs: This month, This week, Conversion rate, Avg deal size
- Rank on leaderboard (#2 of 5, % comparison)
- Pipeline visualization (New → Contacted → Estimated → Won/Lost)
- Follow-up reminders with [CALL] [SMS] buttons

**Leads & Customers:**
- **TAB 1: MY LEADS** (5 states: New, Contacted, Estimated, Won, Lost)
- **TAB 2: MY CUSTOMERS** (assigned customers in territory)
- Lead cards with: Name, phone, address, estimated value, follow-up date
- Quick actions: [CALL] [SMS] [CONVERT TO JOB]

**My Schedule:**
- Calendar view (their own visits/estimates only)
- Upcoming appointments
- Past visits log

**Earnings:**
- This Month: $2,500 (pending confirmation)
- Last Month: $2,100 (paid)
- YTD Total: $18,750
- Commission breakdown by job (3 shown, [VIEW ALL])
- Payment history
- Next payment date

**Settings:**
- [👤 Profile]
- [🧑‍💼 Territory] (read-only, assigned territory)
- [🔔 Notifications]

---

### **TECHNICIAN - 5 TABS**
```
[🏠 Today] [📅 My Schedule] [📸 Equipment Check] [💰 Earnings] [⚙️ Settings]
```

**Today (My Day - Default Screen):**
- GPS status: [ON] with current location
- Stats: Today's jobs, Revenue potential, On-time rate
- **Current Job Card (Big, primary focus):**
  - Time, Address, Service, Package, Est. time, Revenue
  - [✓ CHECK IN] (big blue button)
  - [📞 CALL] [🗺️ DIRECTIONS]
- **Next Job Preview** (1 job, compact)
- Quick actions: [📞 SUPPORT] [🔴 INCIDENT]

**My Schedule:**
- Week view (assigned jobs only)
- Cannot edit/move jobs (read-only)
- [View Details] for each job

**Equipment Check:**
- **START OF SHIFT:** Accordion checklist
  - ☐ LADDER → [📸 TAKE PHOTO] [Add notes]
  - ☐ CLEANING SUPPLIES
  - ☐ VEHICLE CONDITION
  - ☐ SAFETY EQUIPMENT
  - [✓ SUBMIT CHECK-IN] (enabled when all 4 done)
- **END OF SHIFT:** Same checklist for returns

**Earnings:**
- This Month: $4,500 (⏳ Pending Confirmation)
- Last Month: $2,100 (✅ Paid)
- YTD Total: $18,750
- Recent (3 transactions shown, [VIEW ALL])
- Deductions: Equipment damage -$50
- Payment history

**Settings:**
- [👤 Profile]
- [🔔 Notifications]
- [❓ Support]
- [🚪 Logout]

---

## 🎨 BRANDING & DESIGN SPECIFICATIONS

### **Color Palette**
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
```

### **Typography**
```
HEADINGS: Poppins Bold / Inter Bold
BODY TEXT: Inter Regular / Open Sans
BUTTONS: Poppins Medium
DATA/TABLES: IBM Plex Mono

SIZE HIERARCHY
├─ H1: 32px, Bold, #1E3A8A
├─ H2: 24px, Bold, #1E40AF
├─ H3: 18px, SemiBold, #1E40AF
├─ Body: 14px, Regular, #374151
├─ Small: 12px, Regular, #6B7280
└─ Button: 14px, Medium, #FFFFFF
```

### **Mobile Specifications**
```
BORDER RADIUS: 8px (standard), 12px (large), 4px (small)
SHADOWS: Subtle 0 2px 8px rgba(0,0,0,0.08)
SPACING: 8px grid system
TRANSITIONS: 200ms ease-in-out
ICONS: Feather Icons (24px standard)
TOUCH TARGETS: Minimum 44px × 44px
```

---

## 📱 NO-SCROLL PAGE EXAMPLES

### **Admin Home - No Scroll Version**
```
[🏠 ENTRETIEN PRESTIGE]

KPI GRID (Fits screen)
┌──────────┬──────────┬──────────┐
│ TODAY    │ REVENUE  │ RATING   │
│ 12 jobs  │ $4,250   │ ⭐ 4.8   │
└──────────┴──────────┴──────────┘

[+ JOB] [📅 SCHEDULE] [📊 REPORTS]

TODAY'S JOBS (3/12 shown) [NEXT →]
├─ 09:00 John · $250 · ✅
├─ 10:30 Jane · $180 · ⏳
└─ 13:00 Mike · $400 · 📍

ALERTS (2) [VIEW ALL →]
TEAM STATUS
TOP CUSTOMERS
FORECAST

[📊][📅][👥][🧑‍💼][⚙️]
```

### **Schedule - No Scroll Version**
```
[📅 SCHEDULE - Jan 27]
[← JAN 27] [TODAY] [JAN 28 →]

TECHNICIANS (expand/collapse)
┌──────────────────────┐
│ 🟢 JOHN DOE (6)  [▲] │ ← Expanded
├──────────────────────┤
│ 09:00 - $250 ✅      │ (3 jobs visible)
│ 11:00 - $180 ⏳      │
│ 14:00 - $400 📍      │
│ [+3 more] [VIEW ALL] │
└──────────────────────┘
┌──────────────────────┐
│ 🟢 JANE SMITH (8) [▼] │ ← Collapsed
└──────────────────────┘

UNASSIGNED (2)
ACTIONS: [+ NEW JOB]

[📊][📅][👥][🧑‍💼][⚙️]
```

---

## 🚀 IMPLEMENTATION TIMELINE

### **Phase 1: Foundation (Weeks 1-4)**
- Authentication & 2FA setup
- Database schema & RLS
- Admin dashboard skeleton
- Core API endpoints

### **Phase 2: Core Features (Weeks 5-8)**
- Dispatch calendar (drag & drop)
- Job CRUD operations
- Customer CRM
- GPS tracking (basic)

### **Phase 3: Operations (Weeks 9-12)**
- SMS integration (Twilio)
- Email integration (Resend)
- Equipment check-in/out
- Invoice generation

### **Phase 4: Advanced (Weeks 13-16)**
- Payment processing (Stripe + Interac)
- Commission tracking
- Reports & analytics
- Google review bonus system
- Mobile PWA optimization

### **Total:** 16 weeks for v1.0 launch

---

## ✅ CRITICAL SPECIFICATIONS SUMMARY

```
✅ Mobile-first only (no left sidebar)
✅ No big scrolling (pagination + modals)
✅ 5 tabs per role (bottom navigation)
✅ No customer login portal
✅ SMS reminders only (no customer cancellation)
✅ Two-way SMS inbox (role-based access)
✅ Admin-customizable equipment checklist
✅ Dynamic pricing (all factors)
✅ Upsells with manager override
✅ Manager approval for invoices
✅ Auto-billing subscriptions (yearly/bi-yearly/tri-yearly/monthly)
✅ Quebec legal receipts (GST/QST)
✅ Manager-customizable payment terms
✅ Late payment SMS reminders (3/7/14 days)
✅ Self-service availability calendar (hourly grid)
✅ Commission-only model (no overtime)
✅ Equipment damage deductions only
✅ Mandatory before/after photos (1 per side)
✅ Photo-based quality review
✅ Google review bonus ($5 per 4-5⭐ with name)
✅ Custom re-work options (commission adjustments)
✅ Territory drawing on map
✅ Multi-technician jobs (custom commission split)
✅ 7-year data retention
✅ Immediate employee termination + email statement
✅ Daily backups at midnight
✅ GPS tracking (30min intervals when page open)
✅ Hybrid commission visibility (pending label)
✅ Hybrid leaderboard (rank visible, earnings hidden)
✅ Referral: $50 gift card per customer
✅ Loyalty: 10% subscription + points system
✅ Blacklist = hard block
✅ No-show protocol with SMS retry
✅ Technician can skip no-show job
✅ Customer receives SMS for no-show
✅ Manager & Sales Rep notified on no-show
✅ French only (Quebec)
✅ Light + Dark mode
✅ Multi-company future-proof architecture
✅ Subscription payments: Interac auto-billing
✅ Admin + Manager + Sales Rep can assign jobs
✅ Sales Rep can assign own leads
✅ Discount approval: Sales Rep max 10% without approval
✅ Admin-only data exports
✅ Phone call required for complaints
✅ Hourly availability grid (Mon-Sun)
✅ Same for Sales Reps & Technicians
✅ SMS inbox: Manager sees all, Tech/Rep see assigned only
✅ Equipment check-in/out: Detailed checklist with photos
✅ Job completed SMS: Different message per payment method
```

---

## 📞 CONTACT & SUPPORT

**Company:** Entretien Prestige  
**Location:** Grand Montréal, Quebec, Canada  
**Development Team:** Ready to start immediately  
**Next Step:** Hand this document to development team  

---

**END OF COMPLETE SPECIFICATION DOCUMENT**

This document contains ALL answers to 48+ questions and is production-ready.
Developers can start building immediately without further clarification needed.

Version: 2.0 | Date: January 27, 2026 | Status: FINAL ✅
