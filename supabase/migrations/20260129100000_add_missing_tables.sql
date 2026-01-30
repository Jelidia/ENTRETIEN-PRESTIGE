-- Add missing tables referenced by code and RLS policies
-- Add helper functions used in policies

create or replace function public.current_user_company_id()
 returns uuid
 language sql
 stable security definer
 set search_path = public
as $$
  select company_id from users where user_id = auth.uid() and deleted_at is null;
$$;

create or replace function public.is_admin()
 returns boolean
 language plpgsql
 security definer
 set search_path = public
as $$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role = 'admin'
    and deleted_at is null
  );
end;
$$;

create or replace function public.is_manager_or_admin()
 returns boolean
 language plpgsql
 security definer
 set search_path = public
as $$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role in ('admin', 'manager')
    and deleted_at is null
  );
end;
$$;

create table if not exists customer_ratings (
  rating_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  customer_id uuid references customers(customer_id) on delete cascade,
  technician_id uuid references users(user_id),
  rating int not null check (rating between 1 and 5),
  comment text,
  rated_at timestamptz default now(),
  google_review_link_clicked boolean default false,
  google_redirect_at timestamptz
);

create table if not exists customer_subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id) on delete cascade,
  frequency text not null check (frequency in ('yearly', 'bi_yearly', 'tri_yearly', 'monthly')),
  base_price numeric(10, 2) not null,
  discounted_price numeric(10, 2) not null,
  billing_date date not null,
  next_billing_date date not null,
  stripe_subscription_id text,
  status text default 'active' check (status in ('active', 'paused', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists employee_availability (
  availability_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  user_id uuid references users(user_id) on delete cascade,
  day_of_week text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  hour int not null check (hour between 0 and 23),
  is_available boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day_of_week, hour)
);

create table if not exists equipment_checklist_templates (
  template_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  item_name text not null,
  requires_photo boolean default false,
  shift_type text check (shift_type in ('start', 'end', 'both')),
  display_order int default 0,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists google_review_bonuses (
  bonus_id uuid primary key default gen_random_uuid(),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  bonus_amount numeric(10, 2) default 5.00,
  google_review_text text,
  verified_at timestamptz default now(),
  paid boolean default false,
  payment_date date
);

create table if not exists job_photos (
  photo_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  photo_type text not null check (photo_type in ('before', 'after')),
  side text not null check (side in ('front', 'back', 'left', 'right')),
  photo_url text not null,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references users(user_id),
  unique (job_id, photo_type, side)
);

create table if not exists job_rework (
  rework_id uuid primary key default gen_random_uuid(),
  original_job_id uuid references jobs(job_id),
  rework_job_id uuid references jobs(job_id),
  original_technician_id uuid references users(user_id),
  rework_technician_id uuid references users(user_id),
  commission_adjustment_percentage numeric(5, 2),
  customer_refund_amount numeric(10, 2) default 0,
  reason text not null,
  created_by uuid references users(user_id),
  created_at timestamptz default now()
);

create table if not exists upsell_items (
  upsell_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  is_permanent boolean default true,
  created_by uuid references users(user_id),
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists job_upsells (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  upsell_id uuid references upsell_items(upsell_id),
  quantity int default 1,
  price numeric(10, 2) not null,
  approved_by_customer boolean default false,
  approved_at timestamptz,
  added_by uuid references users(user_id),
  created_at timestamptz default now()
);

create table if not exists loyalty_points (
  points_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id) on delete cascade,
  points_balance int default 0,
  lifetime_points int default 0,
  last_updated timestamptz default now(),
  unique (customer_id)
);

create table if not exists loyalty_transactions (
  transaction_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id) on delete cascade,
  points_change int not null,
  reason text not null,
  job_id uuid references jobs(job_id),
  created_at timestamptz default now()
);

create table if not exists onboarding_progress (
  progress_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) on delete cascade,
  step text not null,
  completed boolean default false,
  completed_at timestamptz,
  verified_by uuid references users(user_id),
  notes text,
  created_at timestamptz default now(),
  unique (user_id, step)
);

create table if not exists referrals (
  referral_id uuid primary key default gen_random_uuid(),
  referrer_customer_id uuid references customers(customer_id),
  referred_customer_id uuid references customers(customer_id),
  referral_code text unique,
  job_id uuid references jobs(job_id),
  gift_card_amount numeric(10, 2) default 50.00,
  gift_card_sent_at timestamptz,
  status text default 'pending' check (status in ('pending', 'completed', 'redeemed')),
  created_at timestamptz default now()
);

create table if not exists termination_records (
  termination_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  termination_date date not null,
  final_commission numeric(10, 2) default 0,
  deductions numeric(10, 2) default 0,
  net_total numeric(10, 2) default 0,
  pdf_statement_url text,
  email_sent_at timestamptz,
  reason text,
  terminated_by uuid references users(user_id),
  archived_at timestamptz default now()
);

create index if not exists idx_ratings_customer on customer_ratings(customer_id);
create index if not exists idx_ratings_job on customer_ratings(job_id);
create index if not exists idx_subscriptions_customer on customer_subscriptions(customer_id);
create index if not exists idx_subscriptions_next_billing on customer_subscriptions(next_billing_date) where status = 'active';
create index if not exists idx_availability_company on employee_availability(company_id);
create index if not exists idx_availability_user on employee_availability(user_id);
create index if not exists idx_checklist_company on equipment_checklist_templates(company_id) where deleted_at is null;
create index if not exists idx_review_bonuses_tech on google_review_bonuses(technician_id) where paid = false;
create index if not exists idx_job_photos_job_id on job_photos(job_id);
create index if not exists idx_job_photos_type on job_photos(photo_type);
create index if not exists idx_job_upsells_job on job_upsells(job_id);
create index if not exists idx_loyalty_customer on loyalty_points(customer_id);
create index if not exists idx_loyalty_transactions_customer on loyalty_transactions(customer_id);
create index if not exists idx_onboarding_user on onboarding_progress(user_id);
create index if not exists idx_referrals_code on referrals(referral_code);
create index if not exists idx_referrals_referred on referrals(referred_customer_id);
create index if not exists idx_referrals_referrer on referrals(referrer_customer_id);
create index if not exists idx_rework_original_job on job_rework(original_job_id);
create index if not exists idx_rework_rework_job on job_rework(rework_job_id);
create index if not exists idx_termination_date on termination_records(termination_date);
create index if not exists idx_termination_user on termination_records(user_id);
create index if not exists idx_upsell_items_company on upsell_items(company_id) where deleted_at is null;

alter table customer_ratings enable row level security;
alter table customer_subscriptions enable row level security;
alter table employee_availability enable row level security;
alter table equipment_checklist_templates enable row level security;
alter table google_review_bonuses enable row level security;
alter table job_photos enable row level security;
alter table job_rework enable row level security;
alter table job_upsells enable row level security;
alter table loyalty_points enable row level security;
alter table loyalty_transactions enable row level security;
alter table onboarding_progress enable row level security;
alter table referrals enable row level security;
alter table termination_records enable row level security;
alter table upsell_items enable row level security;
