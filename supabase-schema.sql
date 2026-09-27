-- Mesa de trabajo: ejecuta este archivo completo en Supabase > SQL Editor.
-- El formulario público sólo puede INSERTAR tickets nuevos.
-- La mesa de Julio sólo puede leer/editar después de iniciar sesión.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  area text not null,
  type text not null,
  priority text not null,
  module text not null default '',
  requester text not null default '',
  requester_email text not null default '',
  environment text not null default 'Cliente',
  acceptance text not null,
  status text not null default 'new' check (status in ('new', 'review', 'qa', 'blocked', 'done')),
  source text not null default 'public' check (source in ('public', 'desk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_created_at_idx on public.tickets (created_at desc);
create index if not exists tickets_status_idx on public.tickets (status);

create or replace function public.set_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_updated_at on public.tickets;
create trigger tickets_updated_at
before update on public.tickets
for each row execute function public.set_tickets_updated_at();

alter table public.tickets enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.tickets to anon, authenticated;
grant select, update on public.tickets to authenticated;

drop policy if exists "Public form can create new tickets" on public.tickets;
create policy "Public form can create new tickets"
on public.tickets
for insert
to anon
with check (status = 'new' and source = 'public');

drop policy if exists "Signed in desk can create tickets" on public.tickets;
create policy "Signed in desk can create tickets"
on public.tickets
for insert
to authenticated
with check (status = 'new' and source in ('public', 'desk'));

drop policy if exists "Signed in desk can read tickets" on public.tickets;
create policy "Signed in desk can read tickets"
on public.tickets
for select
to authenticated
using (true);

drop policy if exists "Signed in desk can update tickets" on public.tickets;
create policy "Signed in desk can update tickets"
on public.tickets
for update
to authenticated
using (true)
with check (true);
