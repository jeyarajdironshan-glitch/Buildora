create type public.app_role as enum ('admin','customer','company');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  district text,
  language text default 'English',
  company_name text,
  registration_number text,
  service_districts text[] default '{}',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin profile update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- protect verified flag from self-edit
create or replace function public.protect_verified() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.verified is distinct from old.verified and not public.has_role(auth.uid(),'admin') then
    new.verified := old.verified;
  end if;
  return new;
end $$;
create trigger profiles_protect_verified before update on public.profiles for each row execute function public.protect_verified();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare r text := coalesce(new.raw_user_meta_data->>'account_type','customer');
begin
  if r not in ('customer','company') then r := 'customer'; end if;
  insert into public.profiles(id, full_name, phone, district, language, company_name, registration_number, service_districts)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'district',
    coalesce(new.raw_user_meta_data->>'language','English'), new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'registration_number',
    coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data->'service_districts')), '{}'));
  insert into public.user_roles(user_id, role) values (new.id, r::app_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null default 'My House',
  land jsonb not null default '{}',
  requirements jsonb not null default '{}',
  plans jsonb not null default '[]',
  selected_plan int,
  finishes jsonb not null default '{}',
  estimate jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "owner all" on public.projects for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "companies see published" on public.projects for select to authenticated using (status='published' and public.has_role(auth.uid(),'company'));
create policy "admin read projects" on public.projects for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid not null,
  amount numeric not null,
  duration_months int,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.quotations to authenticated;
grant all on public.quotations to service_role;
alter table public.quotations enable row level security;
create policy "company own quotes" on public.quotations for select to authenticated using (company_id = auth.uid());
create policy "owner sees quotes" on public.quotations for select to authenticated using (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
create policy "verified company insert" on public.quotations for insert to authenticated with check (
  company_id = auth.uid() and public.has_role(auth.uid(),'company')
  and exists (select 1 from public.profiles pr where pr.id=auth.uid() and pr.verified)
  and exists (select 1 from public.projects p where p.id=project_id and p.status='published'));
create policy "company update own" on public.quotations for update to authenticated using (company_id=auth.uid() and status='submitted');
create policy "owner accepts" on public.quotations for update to authenticated using (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
create policy "admin read quotes" on public.quotations for select to authenticated using (public.has_role(auth.uid(),'admin'));