-- Albrige Smart Transport — Routes & Stations schema
-- Run in Supabase SQL Editor (or any PostgreSQL 14+)

create extension if not exists "pgcrypto";

-- =========================================================
-- routes (جدول الخطوط)
-- =========================================================
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  route_number text not null,
  name text not null,
  name_en text,
  slug text not null unique,
  subtitle text,
  subtitle_en text,
  badge text,
  badge_en text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists routes_active_order_idx
  on public.routes (is_active, display_order);

-- =========================================================
-- stations (جدول المحطات / نقاط التجمع)
-- =========================================================
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  station_index integer not null,
  name text not null,
  name_en text,
  description text,
  description_en text,
  default_time text not null default '07:00 AM',
  status text not null default 'clear'
    check (status in ('clear', 'moderate', 'congested')),
  notes text not null default '',
  lat double precision,
  lng double precision,
  google_maps_url text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (route_id, station_index)
);

create index if not exists stations_route_idx
  on public.stations (route_id, station_index);

-- =========================================================
-- Row Level Security (public read of active routes; writes via service / authenticated)
-- =========================================================
alter table public.routes enable row level security;
alter table public.stations enable row level security;

drop policy if exists "Public can read active routes" on public.routes;
create policy "Public can read active routes"
  on public.routes for select
  using (is_active = true);

drop policy if exists "Public can read stations of active routes" on public.stations;
create policy "Public can read stations of active routes"
  on public.stations for select
  using (
    exists (
      select 1 from public.routes r
      where r.id = stations.route_id and r.is_active = true
    )
  );

-- Optional: allow anon writes for demo dashboards (tighten in production)
drop policy if exists "Anon can manage routes" on public.routes;
create policy "Anon can manage routes"
  on public.routes for all
  using (true)
  with check (true);

drop policy if exists "Anon can manage stations" on public.stations;
create policy "Anon can manage stations"
  on public.stations for all
  using (true)
  with check (true);

comment on table public.routes is 'Transport lines — is_active controls public visibility';
comment on table public.stations is 'Stops / pickup points belonging to a route';
comment on column public.stations.status is 'clear=سالك | moderate=بطيء | congested=مزدحم';
