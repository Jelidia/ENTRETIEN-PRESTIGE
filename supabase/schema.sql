create extension if not exists "pgcrypto";

create table companies (
  company_id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  timezone text default 'America/Montreal',
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  settings jsonb,
  role_permissions jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table users (
  user_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  email text unique not null,
  email_verified boolean default false,
  phone text unique,
  phone_verified boolean default false,
  full_name text not null,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  avatar_url text,
  role text check (role in ('admin', 'manager', 'sales_rep', 'technician', 'customer', 'dispatcher')),
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  last_login timestamptz,
  login_count int default 0,
  failed_login_attempts int default 0,
  last_failed_login timestamptz,
  two_factor_enabled boolean default true,
  two_factor_method text check (two_factor_method in ('sms', 'authenticator')) default 'sms',
  two_factor_secret text,
  password_last_changed timestamptz,
  password_expiry timestamptz,
  department text,
  manager_id uuid references users(user_id),
  hire_date date,
  employee_id text,
  notification_settings jsonb,
  access_permissions jsonb,
  id_document_front_url text,
  id_document_back_url text,
  contract_document_url text,
  contract_signature_url text,
  contract_signed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table auth_challenges (
  challenge_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  method text check (method in ('sms', 'authenticator')),
  code_hash text not null,
  session_payload text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);

create table user_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  ip_address inet,
  user_agent text,
  device_type text check (device_type in ('web', 'mobile_ios', 'mobile_android')),
  token_hash text,
  expires_at timestamptz,
  last_activity timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table user_audit_log (
  audit_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  action text,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  status text check (status in ('success', 'failed', 'denied')) default 'success',
  reason text,
  created_at timestamptz default now()
);

create table idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  scope text not null,
  request_hash text not null,
  response_status int,
  response_body jsonb,
  status text check (status in ('processing', 'completed')) default 'processing',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customers (
  customer_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  alternate_phone text,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  customer_type text check (customer_type in ('residential', 'commercial', 'industrial')) default 'residential',
  company_name text,
  total_spent numeric(12, 2) default 0,
  account_balance numeric(10, 2) default 0,
  credit_limit numeric(10, 2) default 0,
  preferred_payment_method text check (preferred_payment_method in ('interac', 'credit_card', 'cash')) default 'interac',
  status text check (status in ('active', 'inactive', 'prospect', 'archived')) default 'active',
  customer_source text,
  referring_customer_id uuid references customers(customer_id),
  assigned_sales_rep_id uuid references users(user_id),
  sms_opt_in boolean default true,
  email_opt_in boolean default true,
  marketing_opt_in boolean default true,
  preferred_contact_method text check (preferred_contact_method in ('sms', 'email', 'phone', 'in_app')) default 'sms',
  first_job_date date,
  last_service_date date,
  total_jobs int default 0,
  average_rating numeric(3, 2),
  gdpr_consent boolean default false,
  terms_accepted boolean default false,
  terms_accepted_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table customer_blacklist (
  blacklist_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id),
  company_id uuid references companies(company_id),
  reason text check (reason in ('non_payment', 'dispute', 'difficult_customer', 'fraud', 'other')),
  description text,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')) default 'medium',
  recommended_action text,
  date_added timestamptz,
  added_by uuid references users(user_id),
  last_incident timestamptz,
  incident_count int default 1,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customer_communication (
  comm_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id),
  communication_type text check (communication_type in ('sms', 'email', 'phone_call', 'in_app_msg', 'visit')),
  subject text,
  content text,
  direction text check (direction in ('inbound', 'outbound')),
  sent_by uuid references users(user_id),
  sent_at timestamptz,
  read_at timestamptz,
  delivery_status text check (delivery_status in ('pending', 'sent', 'delivered', 'failed')) default 'pending',
  related_job_id uuid,
  attachments jsonb,
  created_at timestamptz default now()
);


create table jobs (
  job_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  sales_rep_id uuid references users(user_id),
  technician_id uuid references users(user_id),
  manager_id uuid references users(user_id),
  service_type text,
  service_package text check (service_package in ('basique', 'premium', 'prestige')),
  description text,
  scheduled_date date,
  scheduled_start_time time,
  scheduled_end_time time,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  duration_minutes int,
  address text,
  city text,
  postal_code text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  status text check (status in ('created', 'quoted', 'confirmed', 'dispatched', 'in_progress', 'completed', 'invoiced', 'paid', 'cancelled', 'rescheduled', 'no_show')) default 'created',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  estimated_revenue numeric(10, 2),
  actual_revenue numeric(10, 2),
  discount_percentage numeric(5, 2) default 0,
  discount_reason text,
  discount_approved_by uuid references users(user_id),
  discount_approved_at timestamptz,
  upsells jsonb,
  quality_issue boolean default false,
  quality_notes text,
  customer_notes text,
  technician_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(user_id),
  updated_by uuid references users(user_id),
  deleted_at timestamptz
);

create table customer_rating_tokens (
  token_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table job_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id),
  technician_id uuid references users(user_id),
  assigned_at timestamptz,
  assigned_by uuid references users(user_id),
  previous_technician_id uuid references users(user_id),
  reassignment_reason text,
  reassignment_count int default 1,
  created_at timestamptz default now()
);

create table job_history (
  history_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id),
  field_name text,
  old_value text,
  new_value text,
  changed_by uuid references users(user_id),
  reason text,
  created_at timestamptz default now()
);

create table gps_locations (
  location_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  accuracy_meters int,
  source text check (source in ('manual_checkin', 'geofence', 'hourly_ping', 'job_start', 'job_end')),
  is_geofenced_checkin boolean default false,
  distance_from_job_address_m int,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

create table geofences (
  geofence_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  job_id uuid references jobs(job_id),
  customer_id uuid references customers(customer_id),
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  radius_meters int default 50,
  is_active boolean default true,
  notify_on_enter boolean default true,
  notify_on_exit boolean default true,
  created_at timestamptz default now()
);

create table technician_location_daily (
  daily_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  work_date date,
  total_distance_km numeric(10, 2),
  total_time_hours numeric(10, 2),
  jobs_completed int,
  route_coordinates jsonb,
  idle_time_minutes int,
  driving_time_minutes int,
  job_time_minutes int,
  created_at timestamptz default now()
);

create table sales_territories (
  territory_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  territory_name text,
  neighborhoods jsonb,
  polygon_coordinates jsonb,
  total_customers int default 0,
  active_customers int default 0,
  monthly_revenue numeric(12, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leads (
  lead_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  first_name text,
  last_name text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  status text check (status in ('new', 'contacted', 'estimated', 'won', 'lost', 'recycled')) default 'new',
  lost_reason text,
  estimated_job_value numeric(10, 2),
  estimated_date date,
  follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leaderboard (
  leaderboard_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  month int,
  year int,
  total_revenue numeric(12, 2),
  commission_estimated numeric(10, 2),
  commission_confirmed numeric(10, 2),
  leads_generated int,
  leads_converted int,
  conversion_rate numeric(5, 2),
  average_deal_size numeric(10, 2),
  rank int,
  discreet_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table shift_checklists (
  checklist_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  work_date date,
  start_checklist_completed boolean default false,
  start_checklist_time timestamptz,
  start_checklist_photo_url text,
  start_checklist_items jsonb,
  end_checklist_completed boolean default false,
  end_checklist_time timestamptz,
  end_checklist_photo_url text,
  end_checklist_items jsonb,
  shift_status text check (shift_status in ('pending', 'approved', 'incomplete')) default 'pending',
  approved_by uuid references users(user_id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table incidents (
  incident_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  description text not null,
  incident_type text,
  severity text check (severity in ('minor', 'moderate', 'severe', 'critical')) default 'moderate',
  estimated_cost numeric(10, 2),
  actual_cost numeric(10, 2),
  photo_urls jsonb,
  report_date timestamptz,
  status text check (status in ('reported', 'under_review', 'approved', 'denied', 'resolved')) default 'reported',
  reviewed_by uuid references users(user_id),
  reviewed_at timestamptz,
  reviewer_notes text,
  commission_deduction numeric(10, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table job_quality_issues (
  issue_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  job_id uuid references jobs(job_id),
  customer_id uuid references customers(customer_id),
  complaint_type text,
  description text,
  severity text check (severity in ('minor', 'major', 'critical')) default 'major',
  reported_by text,
  reported_via text check (reported_via in ('sms', 'email', 'phone', 'in_app', 'inspection')) default 'sms',
  reported_date timestamptz,
  status text check (status in ('new', 'acknowledged', 'in_progress', 'resolved', 'escalated')) default 'new',
  assigned_to uuid references users(user_id),
  resolution_date date,
  resolution_notes text,
  follow_up_job_id uuid references jobs(job_id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  job_id uuid references jobs(job_id),
  invoice_number text unique,
  issued_date timestamptz,
  due_date date,
  subtotal numeric(10, 2),
  tax_amount numeric(10, 2),
  total_amount numeric(10, 2),
  payment_method text check (payment_method in ('interac', 'credit_card', 'check', 'cash')) default 'interac',
  payment_status text check (payment_status in ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue')) default 'draft',
  paid_amount numeric(10, 2) default 0,
  paid_date timestamptz,
  description text,
  notes text,
  pdf_url text,
  email_sent_date timestamptz,
  sms_reminder_sent_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table employee_commissions (
  commission_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  employee_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  service_price numeric(10, 2),
  commission_rate numeric(5, 2),
  estimated_commission numeric(10, 2),
  confirmed_commission numeric(10, 2),
  incident_deduction numeric(10, 2) default 0,
  quality_issue_deduction numeric(10, 2) default 0,
  final_commission numeric(10, 2),
  status text check (status in ('estimated', 'confirmed', 'paid', 'disputed')) default 'estimated',
  payment_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table payroll_statements (
  statement_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  employee_id uuid references users(user_id),
  year int,
  month int,
  base_salary numeric(10, 2),
  jobs_completed int,
  total_revenue numeric(12, 2),
  commission_confirmed numeric(10, 2),
  deductions numeric(10, 2),
  net_pay numeric(10, 2),
  pdf_url text,
  sent_date timestamptz,
  viewed_date timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  notif_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  user_id uuid references users(user_id),
  type text check (type in ('job_assigned', 'schedule_change', 'payment_received', 'commission_statement', 'weather_alert', 'quality_issue', 'no_show', 'incident', 'referral_earned')),
  title text,
  body text,
  icon_url text,
  related_resource_id uuid,
  related_resource_type text,
  channel text check (channel in ('in_app', 'email', 'sms', 'push')) default 'in_app',
  status text check (status in ('sent', 'delivered', 'read', 'failed')) default 'sent',
  is_read boolean default false,
  read_at timestamptz,
  action_url text,
  created_at timestamptz default now()
);

create table sms_messages (
  sms_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  phone_number text,
  content text,
  direction text check (direction in ('inbound', 'outbound')),
  twilio_sid text unique,
  status text check (status in ('queued', 'sending', 'sent', 'delivered', 'failed')) default 'queued',
  related_job_id uuid references jobs(job_id),
  message_thread_id uuid,
  thread_id uuid,
  is_read boolean default false,
  assigned_to uuid references users(user_id),
  created_at timestamptz default now(),
  delivered_at timestamptz
);

create table customer_ratings (
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

create table customer_subscriptions (
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

create table employee_availability (
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

create table equipment_checklist_templates (
  template_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  item_name text not null,
  requires_photo boolean default false,
  shift_type text check (shift_type in ('start', 'end', 'both')),
  display_order int default 0,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table google_review_bonuses (
  bonus_id uuid primary key default gen_random_uuid(),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  bonus_amount numeric(10, 2) default 5.00,
  google_review_text text,
  verified_at timestamptz default now(),
  paid boolean default false,
  payment_date date
);

create table job_photos (
  photo_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  photo_type text not null check (photo_type in ('before', 'after')),
  side text not null check (side in ('front', 'back', 'left', 'right')),
  photo_url text not null,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references users(user_id),
  unique (job_id, photo_type, side)
);

create table job_rework (
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

create table upsell_items (
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

create table job_upsells (
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

create table loyalty_points (
  points_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id) on delete cascade,
  points_balance int default 0,
  lifetime_points int default 0,
  last_updated timestamptz default now(),
  unique (customer_id)
);

create table loyalty_transactions (
  transaction_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id) on delete cascade,
  points_change int not null,
  reason text not null,
  job_id uuid references jobs(job_id),
  created_at timestamptz default now()
);

create table onboarding_progress (
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

create table referrals (
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

create table termination_records (
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

create index idx_users_company_id on users(company_id);
create index idx_users_email on users(email);
create index idx_users_role on users(role);
create index idx_users_status on users(status);
create index idx_sessions_user_id on user_sessions(user_id);
create index idx_audit_user_id on user_audit_log(user_id);
create index idx_idempotency_key_scope on idempotency_keys(idempotency_key, scope);
create index idx_customers_company_id on customers(company_id);
create index idx_jobs_company_id on jobs(company_id);
create index idx_jobs_customer_id on jobs(customer_id);
create index idx_jobs_technician_id on jobs(technician_id);
create index idx_rating_tokens_job on customer_rating_tokens(job_id);
create index idx_rating_tokens_token on customer_rating_tokens(token);
create index idx_invoices_company_id on invoices(company_id);
create index idx_invoices_customer_id on invoices(customer_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_sms_thread on sms_messages(thread_id);
create index idx_sms_assigned on sms_messages(assigned_to) where is_read = false;
create index idx_ratings_customer on customer_ratings(customer_id);
create index idx_ratings_job on customer_ratings(job_id);
create index idx_subscriptions_customer on customer_subscriptions(customer_id);
create index idx_subscriptions_next_billing on customer_subscriptions(next_billing_date) where status = 'active';
create index idx_availability_company on employee_availability(company_id);
create index idx_availability_user on employee_availability(user_id);
create index idx_checklist_company on equipment_checklist_templates(company_id) where deleted_at is null;
create index idx_review_bonuses_tech on google_review_bonuses(technician_id) where paid = false;
create index idx_job_photos_job_id on job_photos(job_id);
create index idx_job_photos_type on job_photos(photo_type);
create index idx_job_upsells_job on job_upsells(job_id);
create index idx_loyalty_customer on loyalty_points(customer_id);
create index idx_loyalty_transactions_customer on loyalty_transactions(customer_id);
create index idx_onboarding_user on onboarding_progress(user_id);
create index idx_referrals_code on referrals(referral_code);
create index idx_referrals_referred on referrals(referred_customer_id);
create index idx_referrals_referrer on referrals(referrer_customer_id);
create index idx_rework_original_job on job_rework(original_job_id);
create index idx_rework_rework_job on job_rework(rework_job_id);
create index idx_termination_date on termination_records(termination_date);
create index idx_termination_user on termination_records(user_id);
create index idx_upsell_items_company on upsell_items(company_id) where deleted_at is null;

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

alter table users enable row level security;
alter table idempotency_keys enable row level security;
alter table companies enable row level security;
alter table jobs enable row level security;
alter table customers enable row level security;
alter table invoices enable row level security;
alter table notifications enable row level security;
alter table leads enable row level security;
alter table sales_territories enable row level security;
alter table leaderboard enable row level security;
alter table shift_checklists enable row level security;
alter table incidents enable row level security;
alter table job_quality_issues enable row level security;
alter table employee_commissions enable row level security;
alter table payroll_statements enable row level security;
alter table sms_messages enable row level security;
alter table gps_locations enable row level security;
alter table geofences enable row level security;
alter table auth_challenges enable row level security;
alter table user_sessions enable row level security;
alter table user_audit_log enable row level security;
alter table technician_location_daily enable row level security;
alter table customer_rating_tokens enable row level security;
alter table customer_blacklist enable row level security;
alter table customer_communication enable row level security;
alter table job_assignments enable row level security;
alter table job_history enable row level security;
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

create policy users_self_or_admin on users
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = users.company_id
    )
  );

create policy users_admin_manage on users
  for all
  using (
    exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = users.company_id
    )
  );

create policy companies_company_read on companies
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy companies_company_write on companies
  for update
  using (company_id = (select company_id from users where user_id = auth.uid()))
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sessions_owner_read on user_sessions
  for select
  using (user_id = auth.uid());

create policy sessions_owner_write on user_sessions
  for insert
  with check (user_id = auth.uid());

create policy sessions_owner_update on user_sessions
  for update
  using (user_id = auth.uid());

create policy idempotency_owner_read on idempotency_keys
  for select
  using (scope = concat('user:', auth.uid()::text));

create policy idempotency_owner_write on idempotency_keys
  for insert
  with check (scope = concat('user:', auth.uid()::text));

create policy idempotency_owner_update on idempotency_keys
  for update
  using (scope = concat('user:', auth.uid()::text));

create policy audit_owner_read on user_audit_log
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = (select company_id from users where user_id = user_audit_log.user_id)
    )
  );

create policy audit_owner_write on user_audit_log
  for insert
  with check (user_id = auth.uid());

create policy tech_daily_company_read on technician_location_daily
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy tech_daily_company_write on technician_location_daily
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy jobs_company_read on jobs
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy jobs_company_write on jobs
  for insert
  with check (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy customers_company_read on customers
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy invoices_company_read on invoices
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy notifications_owner_read on notifications
  for select
  using (user_id = auth.uid());

create policy leads_company_read on leads
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy leads_company_write on leads
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy territories_company_read on sales_territories
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy territories_company_write on sales_territories
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy leaderboard_company_read on leaderboard
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy checklist_company_read on shift_checklists
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy checklist_company_write on shift_checklists
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy incidents_company_read on incidents
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy incidents_company_write on incidents
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy quality_company_read on job_quality_issues
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy quality_company_write on job_quality_issues
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy commissions_company_read on employee_commissions
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy commissions_company_write on employee_commissions
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy payroll_company_read on payroll_statements
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy payroll_company_write on payroll_statements
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_read on sms_messages
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_write on sms_messages
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_update on sms_messages
  for update
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy gps_company_read on gps_locations
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy gps_company_write on gps_locations
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy geofence_company_read on geofences
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy challenges_owner_read on auth_challenges
  for select
  using (user_id = auth.uid());

create policy blacklist_company_read on customer_blacklist
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy blacklist_company_write on customer_blacklist
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy comm_company_read on customer_communication
  for select
  using (
    exists (
      select 1 from customers
      where customers.customer_id = customer_communication.customer_id
        and customers.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy assignments_company_read on job_assignments
  for select
  using (
    exists (
      select 1 from jobs
      where jobs.job_id = job_assignments.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy assignments_company_write on job_assignments
  for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.job_id = job_assignments.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy history_company_read on job_history
  for select
  using (
    exists (
      select 1 from jobs
      where jobs.job_id = job_history.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy rating_tokens_public_read on customer_rating_tokens
  for select
  using (true);

create policy rating_tokens_public_update on customer_rating_tokens
  for update
  using (used_at is null);

create policy auth_challenges_owner_insert on auth_challenges
  for insert
  with check (user_id = auth.uid());

create policy auth_challenges_owner_update on auth_challenges
  for update
  using (user_id = auth.uid());

create policy comm_company_write on customer_communication
  for insert
  with check (
    exists (
      select 1 from customers
      where customers.customer_id = customer_communication.customer_id
        and customers.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy history_company_write on job_history
  for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.job_id = job_history.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy ratings_company_read on customer_ratings
  for select
  using (
    exists (
      select 1 from customers c
      where c.customer_id = customer_ratings.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy ratings_company_write on customer_ratings
  for insert
  with check (
    exists (
      select 1 from customers c
      where c.customer_id = customer_ratings.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy subscriptions_company_read on customer_subscriptions
  for select
  using (
    exists (
      select 1 from customers c
      where c.customer_id = customer_subscriptions.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy subscriptions_company_write on customer_subscriptions
  for insert
  with check (
    exists (
      select 1 from customers c
      where c.customer_id = customer_subscriptions.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy availability_own_or_manager on employee_availability
  for select
  using (
    user_id = auth.uid()
    or public.is_manager_or_admin()
  );

create policy availability_own_or_manager_insert on employee_availability
  for insert
  with check (
    user_id = auth.uid()
    or public.is_manager_or_admin()
  );

create policy bonuses_company_isolation on google_review_bonuses
  for select
  using (
    exists (
      select 1 from users u
      where u.user_id = google_review_bonuses.technician_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy bonuses_company_write on google_review_bonuses
  for insert
  with check (
    exists (
      select 1 from users u
      where u.user_id = google_review_bonuses.technician_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy job_photos_company_isolation on job_photos
  for select
  using (
    exists (
      select 1 from jobs j
      where j.job_id = job_photos.job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy job_photos_company_write on job_photos
  for insert
  with check (
    exists (
      select 1 from jobs j
      where j.job_id = job_photos.job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy rework_company_isolation on job_rework
  for select
  using (
    exists (
      select 1 from jobs j
      where j.job_id = job_rework.original_job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy rework_company_write on job_rework
  for insert
  with check (
    exists (
      select 1 from jobs j
      where j.job_id = job_rework.original_job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy job_upsells_company_read on job_upsells
  for select
  using (
    exists (
      select 1 from jobs j
      where j.job_id = job_upsells.job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy job_upsells_company_write on job_upsells
  for insert
  with check (
    exists (
      select 1 from jobs j
      where j.job_id = job_upsells.job_id
        and j.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy loyalty_points_company_read on loyalty_points
  for select
  using (
    exists (
      select 1 from customers c
      where c.customer_id = loyalty_points.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy loyalty_points_company_write on loyalty_points
  for insert
  with check (
    exists (
      select 1 from customers c
      where c.customer_id = loyalty_points.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy loyalty_transactions_company_read on loyalty_transactions
  for select
  using (
    exists (
      select 1 from customers c
      where c.customer_id = loyalty_transactions.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy loyalty_transactions_company_write on loyalty_transactions
  for insert
  with check (
    exists (
      select 1 from customers c
      where c.customer_id = loyalty_transactions.customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy onboarding_company_read on onboarding_progress
  for select
  using (
    exists (
      select 1 from users u
      where u.user_id = onboarding_progress.user_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy onboarding_company_write on onboarding_progress
  for insert
  with check (
    exists (
      select 1 from users u
      where u.user_id = onboarding_progress.user_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy referrals_company_read on referrals
  for select
  using (
    exists (
      select 1 from customers c
      where c.customer_id = referrals.referrer_customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy referrals_company_write on referrals
  for insert
  with check (
    exists (
      select 1 from customers c
      where c.customer_id = referrals.referrer_customer_id
        and c.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy termination_company_read on termination_records
  for select
  using (
    exists (
      select 1 from users u
      where u.user_id = termination_records.user_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy termination_company_write on termination_records
  for insert
  with check (
    exists (
      select 1 from users u
      where u.user_id = termination_records.user_id
        and u.company_id = (select company_id from users where user_id = auth.uid())
    )
  );
