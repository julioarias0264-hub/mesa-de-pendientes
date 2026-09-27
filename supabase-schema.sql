-- Mesa de trabajo: ejecuta este archivo completo en Supabase > SQL Editor.
-- El formulario público sólo puede INSERTAR tickets nuevos.
-- La mesa de Julio sólo puede leer/editar después de iniciar sesión.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  area text not null,
  subarea text not null default '',
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

alter table public.tickets add column if not exists subarea text not null default '';

create table if not exists public.form_config (
  id integer primary key check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.form_config (id, config)
values (1, '{"areas":[{"name":"Odoo","subareas":["PDV","Inventario","Ventas","Compras"]},{"name":"Administración","subareas":["Facturación","Contabilidad","Reportes"]},{"name":"Clientes","subareas":["Solicitud","Seguimiento","Entrega"]},{"name":"Operación","subareas":["Almacén","Compras","Recepción"]},{"name":"Automatización","subareas":["Hojas de cálculo","Flujos","Integraciones"]},{"name":"Desarrollo","subareas":["Frontend","Backend","QA"]}],"types":["Solicitud","Bug","Mejora","Seguimiento","Configuración","Documentación"],"priorities":["Media","Alta","Baja"],"theme":{"mode":"workspace","accent":"#f06a3c","hot":"#ff8051","ink":"#9c361b","initials":"J","workspaceName":"Julio"}}'::jsonb)
on conflict (id) do nothing;

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

create or replace function public.set_form_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists form_config_updated_at on public.form_config;
create trigger form_config_updated_at
before update on public.form_config
for each row execute function public.set_form_config_updated_at();

alter table public.tickets enable row level security;
alter table public.form_config enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.tickets to anon, authenticated;
grant select, update on public.tickets to authenticated;
grant select on public.form_config to anon, authenticated;
grant insert, update on public.form_config to authenticated;

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

drop policy if exists "Public form can read form config" on public.form_config;
create policy "Public form can read form config"
on public.form_config
for select
to anon, authenticated
using (id = 1);

drop policy if exists "Signed in desk can update form config" on public.form_config;
create policy "Signed in desk can update form config"
on public.form_config
for update
to authenticated
using (id = 1)
with check (id = 1);

drop policy if exists "Signed in desk can create form config" on public.form_config;
create policy "Signed in desk can create form config"
on public.form_config
for insert
to authenticated
with check (id = 1);
