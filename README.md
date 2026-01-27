# Entretien Prestige

**Mobile-First ERP for Professional Cleaning Services**

Full-stack operations platform for Quebec cleaning company with dispatch, CRM, billing, SMS automation, sales pipeline, and commission tracking.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth + RLS)
- **Validation:** Zod schemas for all external data
- **Testing:** Vitest + React Testing Library (100% coverage required)
- **Integrations:** Twilio (SMS), Stripe (payments), Resend (email), Google Maps

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and configure:

```bash
# Required immediately
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_ENCRYPTION_KEY=your_32_byte_base64_key

# Configure as you get credentials
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Database Setup
Run migrations in Supabase SQL Editor in this order:

1. **Base schema:** `db/schema.sql`
2. **Permissions:** `db/migrations/20260126_add_permissions.sql`
3. **Complete tables:** `db/migrations/20260127_complete_spec_implementation.sql`

See `SQL_MIGRATION_GUIDE.md` if you encounter errors.

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests with coverage
npm run test:watch   # Watch mode for development
```

## Project Structure

```
├── app/
│   ├── (app)/              # Authenticated pages
│   │   ├── dashboard/      # Admin/Manager dashboard
│   │   ├── sales/          # Sales rep pages
│   │   ├── technician/     # Technician pages
│   │   └── ...
│   ├── (public)/           # Public pages (login, rating)
│   └── api/                # API routes
├── components/             # Shared React components
│   ├── BottomNavMobile.tsx # Main navigation (5 tabs)
│   ├── Pagination.tsx      # No-scroll pagination
│   ├── BottomSheet.tsx     # Mobile modal pattern
│   └── ...
├── lib/                    # Business logic & utilities
│   ├── auth.ts            # Authentication helpers
│   ├── permissions.ts     # Permission resolution
│   ├── supabaseServer.ts  # Supabase client factories
│   ├── pricing.ts         # Dynamic pricing engine
│   ├── smsTemplates.ts    # French SMS templates
│   └── ...
├── db/
│   ├── schema.sql         # Base database schema
│   └── migrations/        # Incremental changes
└── tests/                 # Vitest test files
```

## Key Features

### Mobile-First Design
- Bottom navigation on **ALL** devices (no sidebar)
- 640px max width (centered on desktop)
- 5 tabs per role (see Navigation section)
- No scrolling - pagination instead

### Role-Based Access
- **Admin:** Full system access
- **Manager:** Operations management (limited settings)
- **Sales Rep:** Personal sales pipeline, leads, earnings
- **Technician:** Field operations, today's jobs, equipment check
- **Customer:** SMS-only (no login)

### SMS Automation (Twilio)
- Auto-triggers: Job scheduled, 24h reminder, 1h reminder, completed, no-show
- Two-way inbox with role-based filtering
- All messages in French
- Manager sees all conversations, Tech/Sales see assigned only

### Dynamic Pricing
- Size-based (sq ft, windows)
- Time surcharges (+20% evening/weekend)
- Holiday surcharges (+15% Quebec holidays)
- Volume discounts (-10% for 5+ jobs)
- Subscription discounts (-10% permanent)
- Loyalty points (100 points = $10 off)

### Quality Control
- **Mandatory photos:** Before/after, 4 sides minimum
- Customer rating system (1-5 stars)
- 4-5★ ratings → Google redirect + $5 tech bonus
- Re-work protocol with commission adjustments

### Commission Tracking
- Commission-only model (no hourly wages)
- Pending vs confirmed earnings visibility
- Multi-technician job splits
- Equipment damage deductions
- Monthly payroll statements

## Navigation Structure

### Admin / Manager (5 tabs)
```
[📊 Home] [📅 Schedule] [👥 Customers] [🧑‍💼 Team] [⚙️ Settings]
```

### Sales Rep (5 tabs)
```
[📊 Home] [🎯 Leads] [📅 Schedule] [💰 Earnings] [⚙️ Settings]
```

### Technician (5 tabs)
```
[🏠 Today] [📅 Schedule] [📸 Equipment] [💰 Earnings] [⚙️ Profile]
```

## Development Guidelines

### Authentication Pattern
```typescript
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { user, profile } = auth;
  // ... your logic
}
```

### Database Queries (RLS-Enforced)
```typescript
import { createUserClient } from "@/lib/supabaseServer";

const client = createUserClient(token);
const { data } = await client
  .from("jobs")
  .select("*")
  .eq("company_id", profile.company_id); // Always filter by company
```

### Input Validation
```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+1[0-9]{10}$/), // E.164 format
});

const validated = schema.parse(input);
```

### Testing
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Component", () => {
  it("renders correctly", () => {
    render(<Component />);
    expect(screen.getByText("Expected")).toBeInTheDocument();
  });
});
```

## Security

- **RLS Enabled:** All tables have Row Level Security policies
- **Rate Limiting:** 300 req/min default, 20 req/15min for auth
- **Encryption:** 2FA secrets encrypted with APP_ENCRYPTION_KEY
- **Session Management:** httpOnly cookies, no localStorage
- **Input Validation:** Zod schemas on all API routes
- **SQL Injection:** Prevented by Supabase parameterized queries

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production
- All variables from `.env.example`
- `NEXT_PUBLIC_BASE_URL` - Your production domain
- Ensure `APP_ENCRYPTION_KEY` is properly generated (32 bytes)
- Configure webhook URLs (Stripe, Twilio)

## Documentation

- **CLAUDE.md** - Full architecture guide for AI assistants
- **ENTRETIEN_PRESTIGE_FINAL_SPEC (1).md** - Complete project specification (48+ requirements)
- **SQL_MIGRATION_GUIDE.md** - Database migration troubleshooting
- **READY_TO_DEPLOY.md** - Current implementation status

## Business Requirements

### Quebec Compliance
- GST/QST breakdown on receipts
- 7-year data retention (Law 25)
- French language interface
- Interac payment support (0% fees)

### No-Show Protocol
1. Technician clicks "Customer not available"
2. Prompts to call, then SMS
3. After 10min, can skip to next job
4. Customer receives reschedule SMS
5. Manager/Sales notified

### Subscription Model
- Auto-billing: Monthly, Yearly, Bi-yearly, Tri-yearly
- 10% permanent discount
- Stripe + Interac integration

### Commission Rules
- Sales Rep: % of job value
- Technician: $ per job or %
- Multi-tech splits (50/50, 30/70, custom)
- Google review bonus: $5 for 4-5★ with name mention
- Rework deductions: None, 50%, or 100%

## Support

**Project:** Entretien Prestige
**Location:** Grand Montréal, Quebec, Canada
**Version:** 1.0 (In Development)
**Specification:** Version 2.0 - Final (January 27, 2026)

For technical questions, see CLAUDE.md or ENTRETIEN_PRESTIGE_FINAL_SPEC.
