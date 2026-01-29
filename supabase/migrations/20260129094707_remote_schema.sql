drop extension if exists "pg_net";

create type "public"."user_role" as enum ('admin', 'manager', 'sales_rep', 'technician', 'customer');

drop policy "challenges_owner_read" on "public"."auth_challenges";

drop policy "blacklist_company_read" on "public"."customer_blacklist";

drop policy "blacklist_company_write" on "public"."customer_blacklist";

drop policy "comm_company_read" on "public"."customer_communication";

drop policy "commissions_company_read" on "public"."employee_commissions";

drop policy "commissions_company_write" on "public"."employee_commissions";

drop policy "geofence_company_read" on "public"."geofences";

drop policy "gps_company_read" on "public"."gps_locations";

drop policy "gps_company_write" on "public"."gps_locations";

drop policy "incidents_company_read" on "public"."incidents";

drop policy "incidents_company_write" on "public"."incidents";

drop policy "assignments_company_read" on "public"."job_assignments";

drop policy "history_company_read" on "public"."job_history";

drop policy "quality_company_read" on "public"."job_quality_issues";

drop policy "quality_company_write" on "public"."job_quality_issues";

drop policy "leaderboard_company_read" on "public"."leaderboard";

drop policy "leads_company_read" on "public"."leads";

drop policy "leads_company_write" on "public"."leads";

drop policy "payroll_company_read" on "public"."payroll_statements";

drop policy "payroll_company_write" on "public"."payroll_statements";

drop policy "territories_company_read" on "public"."sales_territories";

drop policy "territories_company_write" on "public"."sales_territories";

drop policy "checklist_company_read" on "public"."shift_checklists";

drop policy "checklist_company_write" on "public"."shift_checklists";

drop policy "sms_company_read" on "public"."sms_messages";

drop policy "audit_owner_read" on "public"."user_audit_log";

drop policy "users_admin_manage" on "public"."users";

drop policy "users_self_or_admin" on "public"."users";

alter table "public"."users" drop constraint "users_email_key";

alter table "public"."users" drop constraint "users_phone_key";

alter table "public"."users" drop constraint "users_role_check";

drop index if exists "public"."users_email_key";

drop index if exists "public"."users_phone_key";

drop index if exists "public"."idx_users_role";


  create table "public"."customer_ratings" (
    "rating_id" uuid not null default gen_random_uuid(),
    "job_id" uuid,
    "customer_id" uuid,
    "rating" integer not null,
    "comment" text,
    "rated_at" timestamp without time zone default now(),
    "google_review_link_clicked" boolean default false,
    "google_redirect_at" timestamp without time zone
      );


alter table "public"."customer_ratings" enable row level security;


  create table "public"."customer_subscriptions" (
    "subscription_id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "frequency" character varying(20) not null,
    "base_price" numeric(10,2) not null,
    "discounted_price" numeric(10,2) not null,
    "billing_date" date not null,
    "next_billing_date" date not null,
    "stripe_subscription_id" text,
    "status" character varying(20) default 'active'::character varying,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."customer_subscriptions" enable row level security;


  create table "public"."employee_availability" (
    "availability_id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "week_start_date" date not null,
    "day_of_week" integer not null,
    "hour" integer not null,
    "is_available" boolean default false,
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."employee_availability" enable row level security;


  create table "public"."equipment_checklist_templates" (
    "template_id" uuid not null default gen_random_uuid(),
    "company_id" uuid,
    "item_name" text not null,
    "requires_photo" boolean default false,
    "shift_type" character varying(20),
    "display_order" integer default 0,
    "created_at" timestamp without time zone default now(),
    "deleted_at" timestamp without time zone
      );


alter table "public"."equipment_checklist_templates" enable row level security;


  create table "public"."google_review_bonuses" (
    "bonus_id" uuid not null default gen_random_uuid(),
    "technician_id" uuid,
    "job_id" uuid,
    "bonus_amount" numeric(10,2) default 5.00,
    "google_review_text" text,
    "verified_at" timestamp without time zone default now(),
    "paid" boolean default false,
    "payment_date" date
      );


alter table "public"."google_review_bonuses" enable row level security;


  create table "public"."job_photos" (
    "photo_id" uuid not null default gen_random_uuid(),
    "job_id" uuid,
    "photo_type" character varying(20) not null,
    "side" character varying(20) not null,
    "photo_url" text not null,
    "uploaded_at" timestamp without time zone default now(),
    "uploaded_by" uuid
      );


alter table "public"."job_photos" enable row level security;


  create table "public"."job_rework" (
    "rework_id" uuid not null default gen_random_uuid(),
    "original_job_id" uuid,
    "rework_job_id" uuid,
    "original_technician_id" uuid,
    "rework_technician_id" uuid,
    "commission_adjustment_percentage" numeric(5,2),
    "customer_refund_amount" numeric(10,2) default 0,
    "reason" text not null,
    "created_by" uuid,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."job_rework" enable row level security;


  create table "public"."job_upsells" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid,
    "upsell_id" uuid,
    "quantity" integer default 1,
    "price" numeric(10,2) not null,
    "approved_by_customer" boolean default false,
    "approved_at" timestamp without time zone,
    "added_by" uuid,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."job_upsells" enable row level security;


  create table "public"."loyalty_points" (
    "points_id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "points_balance" integer default 0,
    "lifetime_points" integer default 0,
    "last_updated" timestamp without time zone default now()
      );


alter table "public"."loyalty_points" enable row level security;


  create table "public"."loyalty_transactions" (
    "transaction_id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "points_change" integer not null,
    "reason" text not null,
    "job_id" uuid,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."loyalty_transactions" enable row level security;


  create table "public"."onboarding_progress" (
    "progress_id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "step" character varying(100) not null,
    "completed" boolean default false,
    "completed_at" timestamp without time zone,
    "verified_by" uuid,
    "notes" text,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."onboarding_progress" enable row level security;


  create table "public"."referrals" (
    "referral_id" uuid not null default gen_random_uuid(),
    "referrer_customer_id" uuid,
    "referred_customer_id" uuid,
    "referral_code" text,
    "job_id" uuid,
    "gift_card_amount" numeric(10,2) default 50.00,
    "gift_card_sent_at" timestamp without time zone,
    "status" character varying(20) default 'pending'::character varying,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."referrals" enable row level security;


  create table "public"."termination_records" (
    "termination_id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "termination_date" date not null,
    "final_commission" numeric(10,2) default 0,
    "deductions" numeric(10,2) default 0,
    "net_total" numeric(10,2) default 0,
    "pdf_statement_url" text,
    "email_sent_at" timestamp without time zone,
    "reason" text,
    "terminated_by" uuid,
    "archived_at" timestamp without time zone default now()
      );


alter table "public"."termination_records" enable row level security;


  create table "public"."upsell_items" (
    "upsell_id" uuid not null default gen_random_uuid(),
    "company_id" uuid,
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "is_permanent" boolean default true,
    "created_by" uuid,
    "created_at" timestamp without time zone default now(),
    "deleted_at" timestamp without time zone
      );


alter table "public"."upsell_items" enable row level security;

alter table "public"."auth_challenges" disable row level security;

alter table "public"."customer_blacklist" add column "hard_block" boolean default true;

alter table "public"."customer_blacklist" disable row level security;

alter table "public"."customer_communication" disable row level security;

alter table "public"."employee_commissions" disable row level security;

alter table "public"."geofences" disable row level security;

alter table "public"."gps_locations" disable row level security;

alter table "public"."incidents" disable row level security;

alter table "public"."job_assignments" add column "commission_split_percentage" numeric(5,2) default 100.00;

alter table "public"."job_history" disable row level security;

alter table "public"."job_quality_issues" disable row level security;

alter table "public"."jobs" add column "no_show_attempted_contact_at" timestamp without time zone;

alter table "public"."jobs" add column "no_show_contact_method" character varying(50);

alter table "public"."leaderboard" disable row level security;

alter table "public"."leads" disable row level security;

alter table "public"."payroll_statements" disable row level security;

alter table "public"."sales_territories" disable row level security;

alter table "public"."shift_checklists" disable row level security;

alter table "public"."users" drop column "access_permissions";

alter table "public"."users" drop column "address";

alter table "public"."users" drop column "city";

alter table "public"."users" drop column "contract_document_url";

alter table "public"."users" drop column "contract_signature_url";

alter table "public"."users" drop column "contract_signed_at";

alter table "public"."users" drop column "country";

alter table "public"."users" drop column "id_document_back_url";

alter table "public"."users" drop column "id_document_front_url";

alter table "public"."users" drop column "postal_code";

alter table "public"."users" drop column "province";

alter table "public"."users" alter column "role" set data type public.user_role using "role"::public.user_role;

CREATE UNIQUE INDEX customer_ratings_pkey ON public.customer_ratings USING btree (rating_id);

CREATE UNIQUE INDEX customer_subscriptions_pkey ON public.customer_subscriptions USING btree (subscription_id);

CREATE UNIQUE INDEX employee_availability_pkey ON public.employee_availability USING btree (availability_id);

CREATE UNIQUE INDEX equipment_checklist_templates_pkey ON public.equipment_checklist_templates USING btree (template_id);

CREATE UNIQUE INDEX google_review_bonuses_pkey ON public.google_review_bonuses USING btree (bonus_id);

CREATE INDEX idx_availability_user ON public.employee_availability USING btree (user_id);

CREATE INDEX idx_availability_week ON public.employee_availability USING btree (week_start_date);

CREATE INDEX idx_checklist_company ON public.equipment_checklist_templates USING btree (company_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_job_photos_job_id ON public.job_photos USING btree (job_id);

CREATE INDEX idx_job_photos_type ON public.job_photos USING btree (photo_type);

CREATE INDEX idx_job_upsells_job ON public.job_upsells USING btree (job_id);

CREATE INDEX idx_loyalty_customer ON public.loyalty_points USING btree (customer_id);

CREATE INDEX idx_loyalty_transactions_customer ON public.loyalty_transactions USING btree (customer_id);

CREATE INDEX idx_onboarding_user ON public.onboarding_progress USING btree (user_id);

CREATE INDEX idx_ratings_customer ON public.customer_ratings USING btree (customer_id);

CREATE INDEX idx_ratings_job ON public.customer_ratings USING btree (job_id);

CREATE INDEX idx_referrals_code ON public.referrals USING btree (referral_code);

CREATE INDEX idx_referrals_referred ON public.referrals USING btree (referred_customer_id);

CREATE INDEX idx_referrals_referrer ON public.referrals USING btree (referrer_customer_id);

CREATE INDEX idx_review_bonuses_tech ON public.google_review_bonuses USING btree (technician_id) WHERE (paid = false);

CREATE INDEX idx_rework_original_job ON public.job_rework USING btree (original_job_id);

CREATE INDEX idx_rework_rework_job ON public.job_rework USING btree (rework_job_id);

CREATE INDEX idx_subscriptions_customer ON public.customer_subscriptions USING btree (customer_id);

CREATE INDEX idx_subscriptions_next_billing ON public.customer_subscriptions USING btree (next_billing_date) WHERE ((status)::text = 'active'::text);

CREATE INDEX idx_termination_date ON public.termination_records USING btree (termination_date);

CREATE INDEX idx_termination_user ON public.termination_records USING btree (user_id);

CREATE INDEX idx_upsell_items_company ON public.upsell_items USING btree (company_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX job_photos_pkey ON public.job_photos USING btree (photo_id);

CREATE UNIQUE INDEX job_rework_pkey ON public.job_rework USING btree (rework_id);

CREATE UNIQUE INDEX job_upsells_pkey ON public.job_upsells USING btree (id);

CREATE UNIQUE INDEX loyalty_points_customer_id_key ON public.loyalty_points USING btree (customer_id);

CREATE UNIQUE INDEX loyalty_points_pkey ON public.loyalty_points USING btree (points_id);

CREATE UNIQUE INDEX loyalty_transactions_pkey ON public.loyalty_transactions USING btree (transaction_id);

CREATE UNIQUE INDEX onboarding_progress_pkey ON public.onboarding_progress USING btree (progress_id);

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (referral_id);

CREATE UNIQUE INDEX referrals_referral_code_key ON public.referrals USING btree (referral_code);

CREATE UNIQUE INDEX termination_records_pkey ON public.termination_records USING btree (termination_id);

CREATE UNIQUE INDEX unique_availability_slot ON public.employee_availability USING btree (user_id, week_start_date, day_of_week, hour);

CREATE UNIQUE INDEX unique_onboarding_step ON public.onboarding_progress USING btree (user_id, step);

CREATE UNIQUE INDEX unique_photo_per_side ON public.job_photos USING btree (job_id, photo_type, side);

CREATE UNIQUE INDEX upsell_items_pkey ON public.upsell_items USING btree (upsell_id);

CREATE UNIQUE INDEX users_email_unique_active ON public.users USING btree (email) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX users_phone_unique_active ON public.users USING btree (phone) WHERE ((deleted_at IS NULL) AND (phone IS NOT NULL));

CREATE INDEX idx_users_role ON public.users USING btree (role);

alter table "public"."customer_ratings" add constraint "customer_ratings_pkey" PRIMARY KEY using index "customer_ratings_pkey";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_pkey" PRIMARY KEY using index "customer_subscriptions_pkey";

alter table "public"."employee_availability" add constraint "employee_availability_pkey" PRIMARY KEY using index "employee_availability_pkey";

alter table "public"."equipment_checklist_templates" add constraint "equipment_checklist_templates_pkey" PRIMARY KEY using index "equipment_checklist_templates_pkey";

alter table "public"."google_review_bonuses" add constraint "google_review_bonuses_pkey" PRIMARY KEY using index "google_review_bonuses_pkey";

alter table "public"."job_photos" add constraint "job_photos_pkey" PRIMARY KEY using index "job_photos_pkey";

alter table "public"."job_rework" add constraint "job_rework_pkey" PRIMARY KEY using index "job_rework_pkey";

alter table "public"."job_upsells" add constraint "job_upsells_pkey" PRIMARY KEY using index "job_upsells_pkey";

alter table "public"."loyalty_points" add constraint "loyalty_points_pkey" PRIMARY KEY using index "loyalty_points_pkey";

alter table "public"."loyalty_transactions" add constraint "loyalty_transactions_pkey" PRIMARY KEY using index "loyalty_transactions_pkey";

alter table "public"."onboarding_progress" add constraint "onboarding_progress_pkey" PRIMARY KEY using index "onboarding_progress_pkey";

alter table "public"."referrals" add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";

alter table "public"."termination_records" add constraint "termination_records_pkey" PRIMARY KEY using index "termination_records_pkey";

alter table "public"."upsell_items" add constraint "upsell_items_pkey" PRIMARY KEY using index "upsell_items_pkey";

alter table "public"."customer_ratings" add constraint "customer_ratings_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."customer_ratings" validate constraint "customer_ratings_customer_id_fkey";

alter table "public"."customer_ratings" add constraint "customer_ratings_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."customer_ratings" validate constraint "customer_ratings_job_id_fkey";

alter table "public"."customer_ratings" add constraint "customer_ratings_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."customer_ratings" validate constraint "customer_ratings_rating_check";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."customer_subscriptions" validate constraint "customer_subscriptions_customer_id_fkey";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_frequency_check" CHECK (((frequency)::text = ANY ((ARRAY['yearly'::character varying, 'bi_yearly'::character varying, 'tri_yearly'::character varying, 'monthly'::character varying])::text[]))) not valid;

alter table "public"."customer_subscriptions" validate constraint "customer_subscriptions_frequency_check";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."customer_subscriptions" validate constraint "customer_subscriptions_status_check";

alter table "public"."customers" add constraint "customers_alternate_phone_e164_check" CHECK (((alternate_phone IS NULL) OR (alternate_phone ~ '^\+1[0-9]{10}$'::text))) not valid;

alter table "public"."customers" validate constraint "customers_alternate_phone_e164_check";

alter table "public"."customers" add constraint "customers_phone_e164_check" CHECK (((phone IS NULL) OR (phone ~ '^\+1[0-9]{10}$'::text))) not valid;

alter table "public"."customers" validate constraint "customers_phone_e164_check";

alter table "public"."employee_availability" add constraint "employee_availability_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."employee_availability" validate constraint "employee_availability_day_of_week_check";

alter table "public"."employee_availability" add constraint "employee_availability_hour_check" CHECK (((hour >= 7) AND (hour <= 22))) not valid;

alter table "public"."employee_availability" validate constraint "employee_availability_hour_check";

alter table "public"."employee_availability" add constraint "employee_availability_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."employee_availability" validate constraint "employee_availability_user_id_fkey";

alter table "public"."employee_availability" add constraint "unique_availability_slot" UNIQUE using index "unique_availability_slot";

alter table "public"."equipment_checklist_templates" add constraint "equipment_checklist_templates_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE not valid;

alter table "public"."equipment_checklist_templates" validate constraint "equipment_checklist_templates_company_id_fkey";

alter table "public"."equipment_checklist_templates" add constraint "equipment_checklist_templates_shift_type_check" CHECK (((shift_type)::text = ANY ((ARRAY['start'::character varying, 'end'::character varying, 'both'::character varying])::text[]))) not valid;

alter table "public"."equipment_checklist_templates" validate constraint "equipment_checklist_templates_shift_type_check";

alter table "public"."google_review_bonuses" add constraint "google_review_bonuses_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."google_review_bonuses" validate constraint "google_review_bonuses_job_id_fkey";

alter table "public"."google_review_bonuses" add constraint "google_review_bonuses_technician_id_fkey" FOREIGN KEY (technician_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."google_review_bonuses" validate constraint "google_review_bonuses_technician_id_fkey";

alter table "public"."job_assignments" add constraint "job_assignments_commission_split_percentage_check" CHECK (((commission_split_percentage >= (0)::numeric) AND (commission_split_percentage <= (100)::numeric))) not valid;

alter table "public"."job_assignments" validate constraint "job_assignments_commission_split_percentage_check";

alter table "public"."job_photos" add constraint "job_photos_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."job_photos" validate constraint "job_photos_job_id_fkey";

alter table "public"."job_photos" add constraint "job_photos_photo_type_check" CHECK (((photo_type)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[]))) not valid;

alter table "public"."job_photos" validate constraint "job_photos_photo_type_check";

alter table "public"."job_photos" add constraint "job_photos_side_check" CHECK (((side)::text = ANY ((ARRAY['front'::character varying, 'back'::character varying, 'left'::character varying, 'right'::character varying])::text[]))) not valid;

alter table "public"."job_photos" validate constraint "job_photos_side_check";

alter table "public"."job_photos" add constraint "job_photos_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) not valid;

alter table "public"."job_photos" validate constraint "job_photos_uploaded_by_fkey";

alter table "public"."job_photos" add constraint "unique_photo_per_side" UNIQUE using index "unique_photo_per_side";

alter table "public"."job_rework" add constraint "job_rework_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id) not valid;

alter table "public"."job_rework" validate constraint "job_rework_created_by_fkey";

alter table "public"."job_rework" add constraint "job_rework_original_job_id_fkey" FOREIGN KEY (original_job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."job_rework" validate constraint "job_rework_original_job_id_fkey";

alter table "public"."job_rework" add constraint "job_rework_original_technician_id_fkey" FOREIGN KEY (original_technician_id) REFERENCES public.users(user_id) not valid;

alter table "public"."job_rework" validate constraint "job_rework_original_technician_id_fkey";

alter table "public"."job_rework" add constraint "job_rework_rework_job_id_fkey" FOREIGN KEY (rework_job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."job_rework" validate constraint "job_rework_rework_job_id_fkey";

alter table "public"."job_rework" add constraint "job_rework_rework_technician_id_fkey" FOREIGN KEY (rework_technician_id) REFERENCES public.users(user_id) not valid;

alter table "public"."job_rework" validate constraint "job_rework_rework_technician_id_fkey";

alter table "public"."job_upsells" add constraint "job_upsells_added_by_fkey" FOREIGN KEY (added_by) REFERENCES public.users(user_id) not valid;

alter table "public"."job_upsells" validate constraint "job_upsells_added_by_fkey";

alter table "public"."job_upsells" add constraint "job_upsells_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE not valid;

alter table "public"."job_upsells" validate constraint "job_upsells_job_id_fkey";

alter table "public"."job_upsells" add constraint "job_upsells_upsell_id_fkey" FOREIGN KEY (upsell_id) REFERENCES public.upsell_items(upsell_id) not valid;

alter table "public"."job_upsells" validate constraint "job_upsells_upsell_id_fkey";

alter table "public"."loyalty_points" add constraint "loyalty_points_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."loyalty_points" validate constraint "loyalty_points_customer_id_fkey";

alter table "public"."loyalty_points" add constraint "loyalty_points_customer_id_key" UNIQUE using index "loyalty_points_customer_id_key";

alter table "public"."loyalty_points" add constraint "loyalty_points_points_balance_check" CHECK ((points_balance >= 0)) not valid;

alter table "public"."loyalty_points" validate constraint "loyalty_points_points_balance_check";

alter table "public"."loyalty_transactions" add constraint "loyalty_transactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."loyalty_transactions" validate constraint "loyalty_transactions_customer_id_fkey";

alter table "public"."loyalty_transactions" add constraint "loyalty_transactions_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) not valid;

alter table "public"."loyalty_transactions" validate constraint "loyalty_transactions_job_id_fkey";

alter table "public"."onboarding_progress" add constraint "onboarding_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE not valid;

alter table "public"."onboarding_progress" validate constraint "onboarding_progress_user_id_fkey";

alter table "public"."onboarding_progress" add constraint "onboarding_progress_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES public.users(user_id) not valid;

alter table "public"."onboarding_progress" validate constraint "onboarding_progress_verified_by_fkey";

alter table "public"."onboarding_progress" add constraint "unique_onboarding_step" UNIQUE using index "unique_onboarding_step";

alter table "public"."referrals" add constraint "referrals_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) not valid;

alter table "public"."referrals" validate constraint "referrals_job_id_fkey";

alter table "public"."referrals" add constraint "referrals_referral_code_key" UNIQUE using index "referrals_referral_code_key";

alter table "public"."referrals" add constraint "referrals_referred_customer_id_fkey" FOREIGN KEY (referred_customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referred_customer_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_customer_id_fkey" FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_customer_id_fkey";

alter table "public"."referrals" add constraint "referrals_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'redeemed'::character varying])::text[]))) not valid;

alter table "public"."referrals" validate constraint "referrals_status_check";

alter table "public"."termination_records" add constraint "termination_records_terminated_by_fkey" FOREIGN KEY (terminated_by) REFERENCES public.users(user_id) not valid;

alter table "public"."termination_records" validate constraint "termination_records_terminated_by_fkey";

alter table "public"."termination_records" add constraint "termination_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) not valid;

alter table "public"."termination_records" validate constraint "termination_records_user_id_fkey";

alter table "public"."upsell_items" add constraint "upsell_items_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE not valid;

alter table "public"."upsell_items" validate constraint "upsell_items_company_id_fkey";

alter table "public"."upsell_items" add constraint "upsell_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id) not valid;

alter table "public"."upsell_items" validate constraint "upsell_items_created_by_fkey";

alter table "public"."users" add constraint "users_phone_e164_check" CHECK (((phone IS NULL) OR (phone ~ '^\+1[0-9]{10}$'::text))) not valid;

alter table "public"."users" validate constraint "users_phone_e164_check";

alter table "public"."users" add constraint "users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select company_id from users where user_id = auth.uid() and deleted_at is null;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role = 'admin'
    and deleted_at is null
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return exists (
    select 1
    from users
    where user_id = auth.uid()
    and role in ('admin', 'manager')
    and deleted_at is null
  );
end;
$function$
;

grant delete on table "public"."customer_ratings" to "anon";

grant insert on table "public"."customer_ratings" to "anon";

grant references on table "public"."customer_ratings" to "anon";

grant select on table "public"."customer_ratings" to "anon";

grant trigger on table "public"."customer_ratings" to "anon";

grant truncate on table "public"."customer_ratings" to "anon";

grant update on table "public"."customer_ratings" to "anon";

grant delete on table "public"."customer_ratings" to "authenticated";

grant insert on table "public"."customer_ratings" to "authenticated";

grant references on table "public"."customer_ratings" to "authenticated";

grant select on table "public"."customer_ratings" to "authenticated";

grant trigger on table "public"."customer_ratings" to "authenticated";

grant truncate on table "public"."customer_ratings" to "authenticated";

grant update on table "public"."customer_ratings" to "authenticated";

grant delete on table "public"."customer_ratings" to "service_role";

grant insert on table "public"."customer_ratings" to "service_role";

grant references on table "public"."customer_ratings" to "service_role";

grant select on table "public"."customer_ratings" to "service_role";

grant trigger on table "public"."customer_ratings" to "service_role";

grant truncate on table "public"."customer_ratings" to "service_role";

grant update on table "public"."customer_ratings" to "service_role";

grant delete on table "public"."customer_subscriptions" to "anon";

grant insert on table "public"."customer_subscriptions" to "anon";

grant references on table "public"."customer_subscriptions" to "anon";

grant select on table "public"."customer_subscriptions" to "anon";

grant trigger on table "public"."customer_subscriptions" to "anon";

grant truncate on table "public"."customer_subscriptions" to "anon";

grant update on table "public"."customer_subscriptions" to "anon";

grant delete on table "public"."customer_subscriptions" to "authenticated";

grant insert on table "public"."customer_subscriptions" to "authenticated";

grant references on table "public"."customer_subscriptions" to "authenticated";

grant select on table "public"."customer_subscriptions" to "authenticated";

grant trigger on table "public"."customer_subscriptions" to "authenticated";

grant truncate on table "public"."customer_subscriptions" to "authenticated";

grant update on table "public"."customer_subscriptions" to "authenticated";

grant delete on table "public"."customer_subscriptions" to "service_role";

grant insert on table "public"."customer_subscriptions" to "service_role";

grant references on table "public"."customer_subscriptions" to "service_role";

grant select on table "public"."customer_subscriptions" to "service_role";

grant trigger on table "public"."customer_subscriptions" to "service_role";

grant truncate on table "public"."customer_subscriptions" to "service_role";

grant update on table "public"."customer_subscriptions" to "service_role";

grant delete on table "public"."employee_availability" to "anon";

grant insert on table "public"."employee_availability" to "anon";

grant references on table "public"."employee_availability" to "anon";

grant select on table "public"."employee_availability" to "anon";

grant trigger on table "public"."employee_availability" to "anon";

grant truncate on table "public"."employee_availability" to "anon";

grant update on table "public"."employee_availability" to "anon";

grant delete on table "public"."employee_availability" to "authenticated";

grant insert on table "public"."employee_availability" to "authenticated";

grant references on table "public"."employee_availability" to "authenticated";

grant select on table "public"."employee_availability" to "authenticated";

grant trigger on table "public"."employee_availability" to "authenticated";

grant truncate on table "public"."employee_availability" to "authenticated";

grant update on table "public"."employee_availability" to "authenticated";

grant delete on table "public"."employee_availability" to "service_role";

grant insert on table "public"."employee_availability" to "service_role";

grant references on table "public"."employee_availability" to "service_role";

grant select on table "public"."employee_availability" to "service_role";

grant trigger on table "public"."employee_availability" to "service_role";

grant truncate on table "public"."employee_availability" to "service_role";

grant update on table "public"."employee_availability" to "service_role";

grant delete on table "public"."equipment_checklist_templates" to "anon";

grant insert on table "public"."equipment_checklist_templates" to "anon";

grant references on table "public"."equipment_checklist_templates" to "anon";

grant select on table "public"."equipment_checklist_templates" to "anon";

grant trigger on table "public"."equipment_checklist_templates" to "anon";

grant truncate on table "public"."equipment_checklist_templates" to "anon";

grant update on table "public"."equipment_checklist_templates" to "anon";

grant delete on table "public"."equipment_checklist_templates" to "authenticated";

grant insert on table "public"."equipment_checklist_templates" to "authenticated";

grant references on table "public"."equipment_checklist_templates" to "authenticated";

grant select on table "public"."equipment_checklist_templates" to "authenticated";

grant trigger on table "public"."equipment_checklist_templates" to "authenticated";

grant truncate on table "public"."equipment_checklist_templates" to "authenticated";

grant update on table "public"."equipment_checklist_templates" to "authenticated";

grant delete on table "public"."equipment_checklist_templates" to "service_role";

grant insert on table "public"."equipment_checklist_templates" to "service_role";

grant references on table "public"."equipment_checklist_templates" to "service_role";

grant select on table "public"."equipment_checklist_templates" to "service_role";

grant trigger on table "public"."equipment_checklist_templates" to "service_role";

grant truncate on table "public"."equipment_checklist_templates" to "service_role";

grant update on table "public"."equipment_checklist_templates" to "service_role";

grant delete on table "public"."google_review_bonuses" to "anon";

grant insert on table "public"."google_review_bonuses" to "anon";

grant references on table "public"."google_review_bonuses" to "anon";

grant select on table "public"."google_review_bonuses" to "anon";

grant trigger on table "public"."google_review_bonuses" to "anon";

grant truncate on table "public"."google_review_bonuses" to "anon";

grant update on table "public"."google_review_bonuses" to "anon";

grant delete on table "public"."google_review_bonuses" to "authenticated";

grant insert on table "public"."google_review_bonuses" to "authenticated";

grant references on table "public"."google_review_bonuses" to "authenticated";

grant select on table "public"."google_review_bonuses" to "authenticated";

grant trigger on table "public"."google_review_bonuses" to "authenticated";

grant truncate on table "public"."google_review_bonuses" to "authenticated";

grant update on table "public"."google_review_bonuses" to "authenticated";

grant delete on table "public"."google_review_bonuses" to "service_role";

grant insert on table "public"."google_review_bonuses" to "service_role";

grant references on table "public"."google_review_bonuses" to "service_role";

grant select on table "public"."google_review_bonuses" to "service_role";

grant trigger on table "public"."google_review_bonuses" to "service_role";

grant truncate on table "public"."google_review_bonuses" to "service_role";

grant update on table "public"."google_review_bonuses" to "service_role";

grant delete on table "public"."job_photos" to "anon";

grant insert on table "public"."job_photos" to "anon";

grant references on table "public"."job_photos" to "anon";

grant select on table "public"."job_photos" to "anon";

grant trigger on table "public"."job_photos" to "anon";

grant truncate on table "public"."job_photos" to "anon";

grant update on table "public"."job_photos" to "anon";

grant delete on table "public"."job_photos" to "authenticated";

grant insert on table "public"."job_photos" to "authenticated";

grant references on table "public"."job_photos" to "authenticated";

grant select on table "public"."job_photos" to "authenticated";

grant trigger on table "public"."job_photos" to "authenticated";

grant truncate on table "public"."job_photos" to "authenticated";

grant update on table "public"."job_photos" to "authenticated";

grant delete on table "public"."job_photos" to "service_role";

grant insert on table "public"."job_photos" to "service_role";

grant references on table "public"."job_photos" to "service_role";

grant select on table "public"."job_photos" to "service_role";

grant trigger on table "public"."job_photos" to "service_role";

grant truncate on table "public"."job_photos" to "service_role";

grant update on table "public"."job_photos" to "service_role";

grant delete on table "public"."job_rework" to "anon";

grant insert on table "public"."job_rework" to "anon";

grant references on table "public"."job_rework" to "anon";

grant select on table "public"."job_rework" to "anon";

grant trigger on table "public"."job_rework" to "anon";

grant truncate on table "public"."job_rework" to "anon";

grant update on table "public"."job_rework" to "anon";

grant delete on table "public"."job_rework" to "authenticated";

grant insert on table "public"."job_rework" to "authenticated";

grant references on table "public"."job_rework" to "authenticated";

grant select on table "public"."job_rework" to "authenticated";

grant trigger on table "public"."job_rework" to "authenticated";

grant truncate on table "public"."job_rework" to "authenticated";

grant update on table "public"."job_rework" to "authenticated";

grant delete on table "public"."job_rework" to "service_role";

grant insert on table "public"."job_rework" to "service_role";

grant references on table "public"."job_rework" to "service_role";

grant select on table "public"."job_rework" to "service_role";

grant trigger on table "public"."job_rework" to "service_role";

grant truncate on table "public"."job_rework" to "service_role";

grant update on table "public"."job_rework" to "service_role";

grant delete on table "public"."job_upsells" to "anon";

grant insert on table "public"."job_upsells" to "anon";

grant references on table "public"."job_upsells" to "anon";

grant select on table "public"."job_upsells" to "anon";

grant trigger on table "public"."job_upsells" to "anon";

grant truncate on table "public"."job_upsells" to "anon";

grant update on table "public"."job_upsells" to "anon";

grant delete on table "public"."job_upsells" to "authenticated";

grant insert on table "public"."job_upsells" to "authenticated";

grant references on table "public"."job_upsells" to "authenticated";

grant select on table "public"."job_upsells" to "authenticated";

grant trigger on table "public"."job_upsells" to "authenticated";

grant truncate on table "public"."job_upsells" to "authenticated";

grant update on table "public"."job_upsells" to "authenticated";

grant delete on table "public"."job_upsells" to "service_role";

grant insert on table "public"."job_upsells" to "service_role";

grant references on table "public"."job_upsells" to "service_role";

grant select on table "public"."job_upsells" to "service_role";

grant trigger on table "public"."job_upsells" to "service_role";

grant truncate on table "public"."job_upsells" to "service_role";

grant update on table "public"."job_upsells" to "service_role";

grant delete on table "public"."loyalty_points" to "anon";

grant insert on table "public"."loyalty_points" to "anon";

grant references on table "public"."loyalty_points" to "anon";

grant select on table "public"."loyalty_points" to "anon";

grant trigger on table "public"."loyalty_points" to "anon";

grant truncate on table "public"."loyalty_points" to "anon";

grant update on table "public"."loyalty_points" to "anon";

grant delete on table "public"."loyalty_points" to "authenticated";

grant insert on table "public"."loyalty_points" to "authenticated";

grant references on table "public"."loyalty_points" to "authenticated";

grant select on table "public"."loyalty_points" to "authenticated";

grant trigger on table "public"."loyalty_points" to "authenticated";

grant truncate on table "public"."loyalty_points" to "authenticated";

grant update on table "public"."loyalty_points" to "authenticated";

grant delete on table "public"."loyalty_points" to "service_role";

grant insert on table "public"."loyalty_points" to "service_role";

grant references on table "public"."loyalty_points" to "service_role";

grant select on table "public"."loyalty_points" to "service_role";

grant trigger on table "public"."loyalty_points" to "service_role";

grant truncate on table "public"."loyalty_points" to "service_role";

grant update on table "public"."loyalty_points" to "service_role";

grant delete on table "public"."loyalty_transactions" to "anon";

grant insert on table "public"."loyalty_transactions" to "anon";

grant references on table "public"."loyalty_transactions" to "anon";

grant select on table "public"."loyalty_transactions" to "anon";

grant trigger on table "public"."loyalty_transactions" to "anon";

grant truncate on table "public"."loyalty_transactions" to "anon";

grant update on table "public"."loyalty_transactions" to "anon";

grant delete on table "public"."loyalty_transactions" to "authenticated";

grant insert on table "public"."loyalty_transactions" to "authenticated";

grant references on table "public"."loyalty_transactions" to "authenticated";

grant select on table "public"."loyalty_transactions" to "authenticated";

grant trigger on table "public"."loyalty_transactions" to "authenticated";

grant truncate on table "public"."loyalty_transactions" to "authenticated";

grant update on table "public"."loyalty_transactions" to "authenticated";

grant delete on table "public"."loyalty_transactions" to "service_role";

grant insert on table "public"."loyalty_transactions" to "service_role";

grant references on table "public"."loyalty_transactions" to "service_role";

grant select on table "public"."loyalty_transactions" to "service_role";

grant trigger on table "public"."loyalty_transactions" to "service_role";

grant truncate on table "public"."loyalty_transactions" to "service_role";

grant update on table "public"."loyalty_transactions" to "service_role";

grant delete on table "public"."onboarding_progress" to "anon";

grant insert on table "public"."onboarding_progress" to "anon";

grant references on table "public"."onboarding_progress" to "anon";

grant select on table "public"."onboarding_progress" to "anon";

grant trigger on table "public"."onboarding_progress" to "anon";

grant truncate on table "public"."onboarding_progress" to "anon";

grant update on table "public"."onboarding_progress" to "anon";

grant delete on table "public"."onboarding_progress" to "authenticated";

grant insert on table "public"."onboarding_progress" to "authenticated";

grant references on table "public"."onboarding_progress" to "authenticated";

grant select on table "public"."onboarding_progress" to "authenticated";

grant trigger on table "public"."onboarding_progress" to "authenticated";

grant truncate on table "public"."onboarding_progress" to "authenticated";

grant update on table "public"."onboarding_progress" to "authenticated";

grant delete on table "public"."onboarding_progress" to "service_role";

grant insert on table "public"."onboarding_progress" to "service_role";

grant references on table "public"."onboarding_progress" to "service_role";

grant select on table "public"."onboarding_progress" to "service_role";

grant trigger on table "public"."onboarding_progress" to "service_role";

grant truncate on table "public"."onboarding_progress" to "service_role";

grant update on table "public"."onboarding_progress" to "service_role";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant references on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant trigger on table "public"."referrals" to "anon";

grant truncate on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant insert on table "public"."referrals" to "authenticated";

grant references on table "public"."referrals" to "authenticated";

grant select on table "public"."referrals" to "authenticated";

grant trigger on table "public"."referrals" to "authenticated";

grant truncate on table "public"."referrals" to "authenticated";

grant update on table "public"."referrals" to "authenticated";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant references on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant trigger on table "public"."referrals" to "service_role";

grant truncate on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."termination_records" to "anon";

grant insert on table "public"."termination_records" to "anon";

grant references on table "public"."termination_records" to "anon";

grant select on table "public"."termination_records" to "anon";

grant trigger on table "public"."termination_records" to "anon";

grant truncate on table "public"."termination_records" to "anon";

grant update on table "public"."termination_records" to "anon";

grant delete on table "public"."termination_records" to "authenticated";

grant insert on table "public"."termination_records" to "authenticated";

grant references on table "public"."termination_records" to "authenticated";

grant select on table "public"."termination_records" to "authenticated";

grant trigger on table "public"."termination_records" to "authenticated";

grant truncate on table "public"."termination_records" to "authenticated";

grant update on table "public"."termination_records" to "authenticated";

grant delete on table "public"."termination_records" to "service_role";

grant insert on table "public"."termination_records" to "service_role";

grant references on table "public"."termination_records" to "service_role";

grant select on table "public"."termination_records" to "service_role";

grant trigger on table "public"."termination_records" to "service_role";

grant truncate on table "public"."termination_records" to "service_role";

grant update on table "public"."termination_records" to "service_role";

grant delete on table "public"."upsell_items" to "anon";

grant insert on table "public"."upsell_items" to "anon";

grant references on table "public"."upsell_items" to "anon";

grant select on table "public"."upsell_items" to "anon";

grant trigger on table "public"."upsell_items" to "anon";

grant truncate on table "public"."upsell_items" to "anon";

grant update on table "public"."upsell_items" to "anon";

grant delete on table "public"."upsell_items" to "authenticated";

grant insert on table "public"."upsell_items" to "authenticated";

grant references on table "public"."upsell_items" to "authenticated";

grant select on table "public"."upsell_items" to "authenticated";

grant trigger on table "public"."upsell_items" to "authenticated";

grant truncate on table "public"."upsell_items" to "authenticated";

grant update on table "public"."upsell_items" to "authenticated";

grant delete on table "public"."upsell_items" to "service_role";

grant insert on table "public"."upsell_items" to "service_role";

grant references on table "public"."upsell_items" to "service_role";

grant select on table "public"."upsell_items" to "service_role";

grant trigger on table "public"."upsell_items" to "service_role";

grant truncate on table "public"."upsell_items" to "service_role";

grant update on table "public"."upsell_items" to "service_role";


  create policy "ratings_company_isolation"
  on "public"."customer_ratings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.customers c
  WHERE ((c.customer_id = customer_ratings.customer_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "subscriptions_company_isolation"
  on "public"."customer_subscriptions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.customers c
  WHERE ((c.customer_id = customer_subscriptions.customer_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "availability_own_or_manager"
  on "public"."employee_availability"
  as permissive
  for all
  to public
using (((user_id = auth.uid()) OR public.is_manager_or_admin()));



  create policy "checklist_company_isolation"
  on "public"."equipment_checklist_templates"
  as permissive
  for all
  to public
using ((company_id = ( SELECT users.company_id
   FROM public.users
  WHERE (users.user_id = auth.uid()))));



  create policy "bonuses_company_isolation"
  on "public"."google_review_bonuses"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.user_id = google_review_bonuses.technician_id) AND (u.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "job_photos_company_isolation"
  on "public"."job_photos"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.jobs j
     JOIN public.customers c ON ((j.customer_id = c.customer_id)))
  WHERE ((j.job_id = job_photos.job_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "rework_company_isolation"
  on "public"."job_rework"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.jobs j
     JOIN public.customers c ON ((j.customer_id = c.customer_id)))
  WHERE ((j.job_id = job_rework.original_job_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "job_upsells_company_isolation"
  on "public"."job_upsells"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.jobs j
     JOIN public.customers c ON ((j.customer_id = c.customer_id)))
  WHERE ((j.job_id = job_upsells.job_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "loyalty_points_company_isolation"
  on "public"."loyalty_points"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.customers c
  WHERE ((c.customer_id = loyalty_points.customer_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "loyalty_transactions_company_isolation"
  on "public"."loyalty_transactions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.customers c
  WHERE ((c.customer_id = loyalty_transactions.customer_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "onboarding_own_or_manager"
  on "public"."onboarding_progress"
  as permissive
  for all
  to public
using (((user_id = auth.uid()) OR public.is_manager_or_admin()));



  create policy "referrals_company_isolation"
  on "public"."referrals"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.customers c
  WHERE ((c.customer_id = referrals.referrer_customer_id) AND (c.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = auth.uid())))))));



  create policy "termination_admin_only"
  on "public"."termination_records"
  as permissive
  for all
  to public
using (public.is_admin());



  create policy "upsell_items_company_isolation"
  on "public"."upsell_items"
  as permissive
  for all
  to public
using ((company_id = ( SELECT users.company_id
   FROM public.users
  WHERE (users.user_id = auth.uid()))));



  create policy "users_admin_read_all"
  on "public"."users"
  as permissive
  for select
  to public
using (public.is_admin());



  create policy "users_self_read"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "audit_owner_read"
  on "public"."user_audit_log"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.users admin_user
  WHERE ((admin_user.user_id = auth.uid()) AND (admin_user.role = 'admin'::public.user_role) AND (admin_user.company_id = ( SELECT users.company_id
           FROM public.users
          WHERE (users.user_id = user_audit_log.user_id))))))));



  create policy "users_admin_manage"
  on "public"."users"
  as permissive
  for all
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "users_self_or_admin"
  on "public"."users"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR public.is_admin()));



