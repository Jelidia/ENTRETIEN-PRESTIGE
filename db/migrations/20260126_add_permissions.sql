alter table companies
  add column if not exists role_permissions jsonb;

alter table users
  add column if not exists access_permissions jsonb;

alter table users
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists postal_code text,
  add column if not exists country text default 'CA',
  add column if not exists id_document_front_url text,
  add column if not exists id_document_back_url text,
  add column if not exists contract_document_url text,
  add column if not exists contract_signature_url text,
  add column if not exists contract_signed_at timestamptz;

update users
set role = 'admin'
where email = 'jelidiadam12@gmail.com';
