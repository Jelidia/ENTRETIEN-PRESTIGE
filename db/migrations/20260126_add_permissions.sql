alter table companies
  add column if not exists role_permissions jsonb;

alter table users
  add column if not exists access_permissions jsonb;
