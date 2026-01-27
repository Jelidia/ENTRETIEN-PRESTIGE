-- ============================================================================
-- ENTRETIEN PRESTIGE - COMPLETE SPECIFICATION IMPLEMENTATION
-- Migration Date: 2026-01-27
-- Description: All 48+ requirements from ENTRETIEN_PRESTIGE_FINAL_SPEC
-- ============================================================================

-- ============================================================================
-- PHASE 1: REMOVE DISPATCHER ROLE
-- ============================================================================

-- Update existing dispatcher users to manager role
UPDATE users
SET role = 'manager'
WHERE role = 'dispatcher';

-- Remove dispatcher from role enum (safe approach)
DO $$
BEGIN
  -- Check if the type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Rename old type
    ALTER TYPE user_role RENAME TO user_role_old;

    -- Create new type without dispatcher
    CREATE TYPE user_role AS ENUM (
      'admin',
      'manager',
      'sales_rep',
      'technician',
      'customer'
    );

    -- Update column to use new type
    ALTER TABLE users
    ALTER COLUMN role TYPE user_role
    USING role::text::user_role;

    -- Drop old type
    DROP TYPE user_role_old;
  ELSE
    -- Create type if it doesn't exist
    CREATE TYPE user_role AS ENUM (
      'admin',
      'manager',
      'sales_rep',
      'technician',
      'customer'
    );

    -- Update users table if role column exists but isn't typed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
      ALTER TABLE users
      ALTER COLUMN role TYPE user_role
      USING role::text::user_role;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: JOB PHOTOS (MANDATORY BEFORE/AFTER)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_photos (
  photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('before', 'after')),
  side VARCHAR(20) NOT NULL CHECK (side IN ('front', 'back', 'left', 'right')),
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(user_id),

  CONSTRAINT unique_photo_per_side UNIQUE (job_id, photo_type, side)
);

CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_type ON job_photos(photo_type);

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_photos_company_isolation ON job_photos
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN customers c ON j.customer_id = c.customer_id
    WHERE j.job_id = job_photos.job_id
    AND c.company_id = (
      SELECT company_id FROM users WHERE user_id = auth.uid()
    )
  ));

-- ============================================================================
-- PHASE 3: UPSELL MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS upsell_items (
  upsell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_permanent BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  upsell_id UUID REFERENCES upsell_items(upsell_id),
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  approved_by_customer BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  added_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_upsell_items_company ON upsell_items(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_upsells_job ON job_upsells(job_id);

-- Enable RLS
ALTER TABLE upsell_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY upsell_items_company_isolation ON upsell_items
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

CREATE POLICY job_upsells_company_isolation ON job_upsells
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN customers c ON j.customer_id = c.customer_id
    WHERE j.job_id = job_upsells.job_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 4: SUBSCRIPTION AUTO-BILLING
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('yearly', 'bi_yearly', 'tri_yearly', 'monthly')),
  base_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL, -- base_price * 0.90 (10% discount)
  billing_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  stripe_subscription_id TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX idx_subscriptions_next_billing ON customer_subscriptions(next_billing_date) WHERE status = 'active';

-- Enable RLS
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_company_isolation ON customer_subscriptions
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = customer_subscriptions.customer_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 5: CUSTOMER RATINGS & GOOGLE REVIEW BONUSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_ratings (
  rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_at TIMESTAMP DEFAULT NOW(),
  google_review_link_clicked BOOLEAN DEFAULT FALSE,
  google_redirect_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google_review_bonuses (
  bonus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  bonus_amount DECIMAL(10,2) DEFAULT 5.00,
  google_review_text TEXT,
  verified_at TIMESTAMP DEFAULT NOW(),
  paid BOOLEAN DEFAULT FALSE,
  payment_date DATE
);

CREATE INDEX idx_ratings_job ON customer_ratings(job_id);
CREATE INDEX idx_ratings_customer ON customer_ratings(customer_id);
CREATE INDEX idx_review_bonuses_tech ON google_review_bonuses(technician_id) WHERE paid = FALSE;

-- Enable RLS
ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_review_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY ratings_company_isolation ON customer_ratings
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = customer_ratings.customer_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

CREATE POLICY bonuses_company_isolation ON google_review_bonuses
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = google_review_bonuses.technician_id
    AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 6: JOB RE-WORK SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_rework (
  rework_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  rework_job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  original_technician_id UUID REFERENCES users(user_id),
  rework_technician_id UUID REFERENCES users(user_id),
  commission_adjustment_percentage DECIMAL(5,2), -- -100, -50, 0
  customer_refund_amount DECIMAL(10,2) DEFAULT 0,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rework_original_job ON job_rework(original_job_id);
CREATE INDEX idx_rework_rework_job ON job_rework(rework_job_id);

-- Enable RLS
ALTER TABLE job_rework ENABLE ROW LEVEL SECURITY;

CREATE POLICY rework_company_isolation ON job_rework
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN customers c ON j.customer_id = c.customer_id
    WHERE j.job_id = job_rework.original_job_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 7: EMPLOYEE AVAILABILITY CALENDAR
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_availability (
  availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the week
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
  hour INTEGER NOT NULL CHECK (hour >= 7 AND hour <= 22), -- 7am-10pm
  is_available BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_availability_slot UNIQUE (user_id, week_start_date, day_of_week, hour)
);

CREATE INDEX idx_availability_user ON employee_availability(user_id);
CREATE INDEX idx_availability_week ON employee_availability(week_start_date);

-- Enable RLS
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY availability_own_or_manager ON employee_availability
  USING (
    user_id = auth.uid()
    OR public.is_manager_or_admin()
  );

-- ============================================================================
-- PHASE 8: ONBOARDING CHECKLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  step VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  verified_by UUID REFERENCES users(user_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_onboarding_step UNIQUE (user_id, step)
);

CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_own_or_manager ON onboarding_progress
  USING (
    user_id = auth.uid()
    OR public.is_manager_or_admin()
  );

-- ============================================================================
-- PHASE 9: EMPLOYEE TERMINATION RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS termination_records (
  termination_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  termination_date DATE NOT NULL,
  final_commission DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_total DECIMAL(10,2) DEFAULT 0,
  pdf_statement_url TEXT,
  email_sent_at TIMESTAMP,
  reason TEXT,
  terminated_by UUID REFERENCES users(user_id),
  archived_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_termination_user ON termination_records(user_id);
CREATE INDEX idx_termination_date ON termination_records(termination_date);

-- Enable RLS
ALTER TABLE termination_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY termination_admin_only ON termination_records
  USING (public.is_admin());

-- ============================================================================
-- PHASE 10: REFERRAL PROGRAM
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE,
  job_id UUID REFERENCES jobs(job_id), -- First job from referred customer
  gift_card_amount DECIMAL(10,2) DEFAULT 50.00,
  gift_card_sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'redeemed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_customer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_customer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_company_isolation ON referrals
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = referrals.referrer_customer_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 11: LOYALTY POINTS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_points (
  points_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE UNIQUE,
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL, -- +100 earned or -100 redeemed
  reason TEXT NOT NULL,
  job_id UUID REFERENCES jobs(job_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loyalty_customer ON loyalty_points(customer_id);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);

-- Enable RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY loyalty_points_company_isolation ON loyalty_points
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = loyalty_points.customer_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

CREATE POLICY loyalty_transactions_company_isolation ON loyalty_transactions
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.customer_id = loyalty_transactions.customer_id
    AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- PHASE 12: EQUIPMENT CHECKLIST TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_checklist_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  requires_photo BOOLEAN DEFAULT FALSE,
  shift_type VARCHAR(20) CHECK (shift_type IN ('start', 'end', 'both')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_checklist_company ON equipment_checklist_templates(company_id)
WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE equipment_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_company_isolation ON equipment_checklist_templates
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

-- ============================================================================
-- PHASE 13: JOB ENHANCEMENTS
-- ============================================================================

-- Add no-show tracking
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_show_attempted_contact_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_show_contact_method VARCHAR(50);

-- Add multi-technician commission split
ALTER TABLE job_assignments
ADD COLUMN IF NOT EXISTS commission_split_percentage DECIMAL(5,2) DEFAULT 100.00
CHECK (commission_split_percentage >= 0 AND commission_split_percentage <= 100);

-- ============================================================================
-- PHASE 14: CUSTOMER BLACKLIST ENHANCEMENT
-- ============================================================================

-- Add hard block flag (prevent booking entirely)
ALTER TABLE customer_blacklist
ADD COLUMN IF NOT EXISTS hard_block BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- PHASE 15: SMS MESSAGE THREADING
-- ============================================================================

-- Add conversation threading to SMS
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS thread_id UUID;
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(user_id);

CREATE INDEX IF NOT EXISTS idx_sms_thread ON sms_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_sms_assigned ON sms_messages(assigned_to) WHERE is_read = FALSE;

-- ============================================================================
-- PHASE 16: DEFAULT DATA SETUP
-- ============================================================================

-- Insert default equipment checklist items
INSERT INTO equipment_checklist_templates (company_id, item_name, requires_photo, shift_type, display_order)
SELECT
  company_id,
  item_name,
  requires_photo,
  shift_type,
  display_order
FROM (
  SELECT
    c.company_id,
    'LADDER' as item_name,
    TRUE as requires_photo,
    'both' as shift_type,
    1 as display_order
  FROM companies c
  UNION ALL
  SELECT c.company_id, 'CLEANING SUPPLIES', FALSE, 'both', 2 FROM companies c
  UNION ALL
  SELECT c.company_id, 'VEHICLE CONDITION', TRUE, 'both', 3 FROM companies c
  UNION ALL
  SELECT c.company_id, 'SAFETY EQUIPMENT', FALSE, 'both', 4 FROM companies c
) defaults
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_checklist_templates ect
  WHERE ect.company_id = defaults.company_id
);

-- Insert default upsell items
INSERT INTO upsell_items (company_id, name, description, price, is_permanent)
SELECT
  c.company_id,
  item_name,
  description,
  price,
  TRUE
FROM (
  SELECT
    c.company_id,
    'Window Washing Interior' as item_name,
    'Interior window cleaning service' as description,
    50.00 as price
  FROM companies c
  UNION ALL
  SELECT c.company_id, 'Gutter Cleaning', 'Complete gutter cleaning and debris removal', 80.00 FROM companies c
  UNION ALL
  SELECT c.company_id, 'Pressure Washing Driveway', 'High-pressure driveway cleaning', 120.00 FROM companies c
  UNION ALL
  SELECT c.company_id, 'Deck Staining', 'Professional deck staining service', 200.00 FROM companies c
) defaults
WHERE NOT EXISTS (
  SELECT 1 FROM upsell_items ui
  WHERE ui.company_id = defaults.company_id
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Removed dispatcher role (updated to manager)
-- ✅ Job photos table (mandatory before/after, 4 sides minimum)
-- ✅ Upsell management (pre-approved list + manager override)
-- ✅ Subscription auto-billing (yearly/bi-yearly/tri-yearly/monthly)
-- ✅ Customer ratings + Google review bonuses ($5 per 4-5⭐ with name)
-- ✅ Job re-work system (commission adjustments)
-- ✅ Employee availability calendar (hourly grid Mon-Sun, 7am-10pm)
-- ✅ Onboarding checklist tracking
-- ✅ Termination records with PDF statements
-- ✅ Referral program ($50 gift card)
-- ✅ Loyalty points (1 point per $1, 100 points = $10 discount)
-- ✅ Equipment checklist templates (admin customizable)
-- ✅ Multi-technician commission splits
-- ✅ Hard blacklist blocking
-- ✅ SMS threading for inbox
-- ✅ No-show tracking fields

COMMENT ON TABLE job_photos IS 'Mandatory before/after photos: 1 per side (4 min per type)';
COMMENT ON TABLE upsell_items IS 'Pre-approved upsell list, manager can add temporary or permanent';
COMMENT ON TABLE customer_subscriptions IS 'Auto-billing subscriptions with 10% discount';
COMMENT ON TABLE customer_ratings IS 'Customer ratings: 4-5 stars redirect to Google review';
COMMENT ON TABLE google_review_bonuses IS '$5 bonus to technician if customer mentions name in Google review';
COMMENT ON TABLE job_rework IS 'Re-work tracking with commission adjustments';
COMMENT ON TABLE employee_availability IS 'Hourly availability grid for technicians and sales reps';
COMMENT ON TABLE referrals IS 'Referral program: $50 gift card per successful referral';
COMMENT ON TABLE loyalty_points IS 'Loyalty points: 1 point per $1 spent, 100 points = $10 off';
