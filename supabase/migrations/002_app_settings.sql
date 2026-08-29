-- App-wide settings (e.g. show/hide office hours on public site)

create table if not exists public.app_settings (
  id text primary key default 'default',
  show_office_hours boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Public can read app settings" on public.app_settings;
create policy "Public can read app settings"
  on public.app_settings for select
  using (true);

drop policy if exists "Anon can manage app settings" on public.app_settings;
create policy "Anon can manage app settings"
  on public.app_settings for all
  using (true)
  with check (true);

comment on table public.app_settings is 'Global app toggles synced with admin dashboard';
comment on column public.app_settings.show_office_hours is 'When false, hide pickup schedules and return departures';
