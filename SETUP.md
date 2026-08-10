# Modrinth Admin Panel Setup

## Prerequisites

1. **Supabase Account** - https://supabase.com
2. **Google Cloud Console** - https://console.cloud.google.com

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project name and database password
4. Wait for project to be created

## Step 2: Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `lib/supabase/schema.sql`
3. Paste and run the SQL

## Step 3: Get Supabase Keys

1. Go to Project Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon (public) key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Configure Google OAuth

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized redirect URI:
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback
   ```
7. Copy Client ID → `GOOGLE_CLIENT_ID`
8. Copy Client Secret → `GOOGLE_CLIENT_SECRET`

## Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in all values

## Step 6: Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Step 7: Update Supabase Auth Settings

1. In Supabase dashboard, go to Authentication → Providers → Google
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Set the redirect URL to: `https://your-vercel-domain.vercel.app/api/auth/callback`

## Default Owner Account

The email `lifegrading@gmail.com` is automatically recognized as the owner with full admin access.

## Features

- Google OAuth authentication
- Admin panel at `/admin`
- User management
- Role-based access control
- Webhook endpoints
- Audit logging
- Security events

## API Routes

- `/api/auth/login` - Initiate Google OAuth
- `/api/auth/callback` - OAuth callback
- `/api/auth/user` - Get current user
- `/api/auth/logout` - Sign out
- `/api/admin/users` - User management
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/endpoints` - Endpoint management
- `/api/admin/audit-logs` - Audit logs
- `/api/admin/security-events` - Security events
- `/api/webhooks/[id]` - Webhook endpoint receiver
