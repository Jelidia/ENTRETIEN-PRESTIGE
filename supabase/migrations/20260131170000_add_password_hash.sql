-- Add password_hash column to users table (critical missing field)

alter table users
  add column if not exists password_hash text;

-- Create index for performance
create index if not exists idx_users_email on users(email) where deleted_at is null;
create index if not exists idx_users_phone on users(phone) where deleted_at is null;
create index if not exists idx_users_company_role on users(company_id, role) where deleted_at is null;

-- Add comment
comment on column users.password_hash is 'Bcrypt hashed password using crypt(password, gen_salt(''bf''))';
