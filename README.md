# Our Little Universe

A private romantic memories site built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, and Motion.

## Setup

1. `pnpm install` (or `npm install`)
2. Create a Supabase project. In Authentication > Providers > Email, **turn off "Allow new users to sign up"**, then create the two users by hand (Authentication > Users).
3. Run `supabase/migrations/001_schema.sql`, `002_rls_storage.sql`, and `003_audio_memories.sql` in the SQL editor, in order.
4. Make yourself admin (the other user stays a viewer):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   If a user was created before step 3, add the row first:
   `insert into public.profiles (id) select id from auth.users on conflict do nothing;`
5. `cp .env.example .env.local` and fill in the URL and anon key.
6. `pnpm dev` (or `npm run dev`)

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public key, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Not required by this app. Never expose it. |

## Privacy model

The entire site is private: signed-out visitors are redirected to `/login`. Two roles exist in `profiles`:
`admin` (full control) and `viewer` (read-only, can never write; enforced by RLS). Storage bucket `memories` is private; media is shown through short-lived signed URLs. Admin server actions check the current Supabase user and role; database RLS remains the final access control layer.

## Status

- [x] Phase 1: setup
- [x] Phase 2: landing page, heart animation, counter
- [x] Phase 5 (partial): schema, constraints, RLS, storage policies, auth gate
- [x] Phase 3: gallery and viewer
- [x] Phase 4: timeline and featured memory
- [x] Phase 6: admin dashboard
- [ ] Phase 7: deployment-specific configuration and end-to-end testing

The app builds with `pnpm build`. Configure `.env.local` with a real Supabase project before signing in; with no credentials, requests are safely sent to a setup message on `/login`. Supabase migrations must be applied and admin/viewer users created before the full workflows can be exercised.
