# Our Little Universe

A private romantic memories site. Next.js (App Router), TypeScript, Tailwind v4, Supabase, Motion.

## Setup

1. `npm install`
2. Create a Supabase project. In Authentication > Providers > Email, **turn off "Allow new users to sign up"**, then create the two users by hand (Authentication > Users).
3. Run `supabase/migrations/001_schema.sql` then `002_rls_storage.sql` in the SQL editor.
4. Make yourself admin (the other user stays a viewer):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   If a user was created before step 3, add the row first:
   `insert into public.profiles (id) select id from auth.users on conflict do nothing;`
5. `cp .env.example .env.local` and fill in the URL and anon key.
6. `npm run dev`

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public key, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Not used yet. Never expose it. |

## Privacy model

The entire site is private: signed-out visitors are redirected to `/login`. Two roles exist in `profiles`:
`admin` (full control) and `viewer` (read-only, can never write; enforced by RLS). Storage bucket `memories` is private; media is shown through short-lived signed URLs.

## Status

- [x] Phase 1: setup
- [x] Phase 2: landing page, heart animation, counter
- [x] Phase 5 (partial): schema, constraints, RLS, storage policies, auth gate
- [ ] Phase 3: gallery and viewer
- [ ] Phase 4: timeline and featured memory
- [ ] Phase 6: admin dashboard
- [ ] Phase 7: polish and testing
