alter table "public"."customer_subscriptions" drop constraint "customer_subscriptions_frequency_check";

alter table "public"."customer_subscriptions" drop constraint "customer_subscriptions_status_check";

alter table "public"."equipment_checklist_templates" drop constraint "equipment_checklist_templates_shift_type_check";

alter table "public"."job_photos" drop constraint "job_photos_photo_type_check";

alter table "public"."job_photos" drop constraint "job_photos_side_check";

alter table "public"."referrals" drop constraint "referrals_status_check";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_frequency_check" CHECK (((frequency)::text = ANY ((ARRAY['yearly'::character varying, 'bi_yearly'::character varying, 'tri_yearly'::character varying, 'monthly'::character varying])::text[]))) not valid;

alter table "public"."customer_subscriptions" validate constraint "customer_subscriptions_frequency_check";

alter table "public"."customer_subscriptions" add constraint "customer_subscriptions_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."customer_subscriptions" validate constraint "customer_subscriptions_status_check";

alter table "public"."equipment_checklist_templates" add constraint "equipment_checklist_templates_shift_type_check" CHECK (((shift_type)::text = ANY ((ARRAY['start'::character varying, 'end'::character varying, 'both'::character varying])::text[]))) not valid;

alter table "public"."equipment_checklist_templates" validate constraint "equipment_checklist_templates_shift_type_check";

alter table "public"."job_photos" add constraint "job_photos_photo_type_check" CHECK (((photo_type)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[]))) not valid;

alter table "public"."job_photos" validate constraint "job_photos_photo_type_check";

alter table "public"."job_photos" add constraint "job_photos_side_check" CHECK (((side)::text = ANY ((ARRAY['front'::character varying, 'back'::character varying, 'left'::character varying, 'right'::character varying])::text[]))) not valid;

alter table "public"."job_photos" validate constraint "job_photos_side_check";

alter table "public"."referrals" add constraint "referrals_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'redeemed'::character varying])::text[]))) not valid;

alter table "public"."referrals" validate constraint "referrals_status_check";


