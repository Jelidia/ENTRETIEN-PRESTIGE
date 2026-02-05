# How to Properly Seed Users

## The Problem

Your app uses **Supabase Auth** (the `auth.users` table managed by Supabase) for authentication. The seed migration only created users in the `public.users` table, but NOT in Supabase Auth. That's why login fails - Supabase Auth doesn't know about these users.

## The Solution

We need to create users via the Supabase Admin API, which will create them in BOTH places:
1. `auth.users` (Supabase Auth) - stores email/password
2. `public.users` (your custom table) - stores profile/role/company

## Option 1: Use Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/becejyadekmnxuarxtna/auth/users
2. Click "Add user" → "Create new user"
3. Create each user with:
   - Email: (from the list below)
   - Password: `DemoPassword2026!`
   - Auto Confirm: ✅ YES
   - User metadata: Leave empty for now

After creating in Auth, we'll link them to the existing profile records in `public.users`.

## Option 2: Use SQL to Fix Existing Records (Requires manual password creation)

Since Supabase Auth can't be directly manipulated via SQL for security reasons, we need a different approach.

## Option 3: Create Users via API Endpoint (Recommended)

I'll create a special admin seeding endpoint.
