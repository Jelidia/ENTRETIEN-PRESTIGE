# Entretien Prestige

Full-stack operations webapp for dispatch, CRM, billing, and field service workflows.

## Quick start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill values
3. Apply database schema from `db/schema.sql` to your Supabase project
4. Run `npm run dev`

## Production checklist

- Configure Supabase URL + keys in `.env.local`
- Add `APP_ENCRYPTION_KEY` (32-byte base64) for 2FA/session encryption
- Paste Twilio, Stripe, Resend, Google Maps keys as you receive them
- Deploy with `NEXT_PUBLIC_BASE_URL` set to your domain

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - lint

## Structure

- `app/` - Next.js App Router pages and API routes
- `components/` - shared UI components and forms
- `lib/` - auth, security, integrations, data helpers
- `db/schema.sql` - database schema for Supabase/Postgres
