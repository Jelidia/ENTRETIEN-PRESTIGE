-- Secure customer rating tokens and remove public access

create extension if not exists "pgcrypto";

alter table customer_rating_tokens
  add column if not exists token_hash text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'customer_rating_tokens'
      and column_name = 'token'
  ) then
    update customer_rating_tokens
    set token_hash = encode(extensions.digest(token::bytea, 'sha256'::text), 'hex')
    where token_hash is null and token is not null;

    drop index if exists idx_rating_tokens_token;
    alter table customer_rating_tokens drop column token;
  end if;
end $$;

alter table customer_rating_tokens
  alter column token_hash set not null;

create unique index if not exists idx_rating_tokens_hash
  on customer_rating_tokens(token_hash);

drop policy if exists rating_tokens_public_read on customer_rating_tokens;
drop policy if exists rating_tokens_public_update on customer_rating_tokens;
