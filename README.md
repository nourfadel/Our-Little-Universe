# Our Little Universe

A private memories site built with Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, and Motion. GitHub is the source of truth; Vercel's native GitHub integration handles preview and production deployments.

## Local development

Requirements: Node.js 24 and pnpm 11.25.0 (declared in `package.json`).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with a Supabase project URL and public anon/publishable key before signing in. Never commit `.env.local` or other environment files.

## Environment variables

| Variable | Required | Use |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon/publishable key. Database and Storage RLS enforce access. |

The app does not use `SUPABASE_SERVICE_ROLE_KEY`. Do not add a service-role key to Vercel or expose one with a `NEXT_PUBLIC_` prefix. `.env.example` contains placeholders only.

Configure the two required variables separately for Vercel **Development**, **Preview**, and **Production**. Use a separate Supabase project for Development and Preview when possible. Preview deployments pointed at production will use production data and the production auth project.

## Supabase setup and migrations

1. Create a Supabase project. In **Authentication → Providers → Email**, turn off **Allow new users to sign up**.
2. In the Supabase SQL Editor, apply `supabase/migrations/001_schema.sql`, then `002_rls_storage.sql`, then `003_audio_memories.sql`.
3. Create the admin and viewer users in **Authentication → Users**. The migration trigger creates each user's profile as a viewer.
4. Promote only the admin account:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

Migrations are version-controlled and applied manually in order. Review SQL before applying it to production. CI and Vercel builds do not run database migrations or reset data.

## GitHub and Vercel deployment

The existing repository is `nourfadel/Our-Little-Universe`; `master` is the production branch. Do not create a duplicate repository.

1. In Vercel, choose **Add New → Project**, import `nourfadel/Our-Little-Universe`, and authorize the Vercel GitHub App for this repository.
2. Set the **Production Branch** to `master` under **Project Settings → Environments → Production → Branch Tracking**.
3. Set the **Root Directory** to `./`. Confirm the framework is **Next.js**. Leave the install, build, and output directory settings on their detected Next.js defaults; the build is `next build` and the output is managed by Next.js/Vercel.
4. Add the two Supabase variables to Development, Preview, and Production, using the appropriate project values for each environment.
5. Leave automatic Git deployments enabled. Vercel's native integration creates Preview deployments for non-production branches and pull requests, and production deployments for pushes to `master`. No Vercel CLI or deployment workflow is used by GitHub Actions.
6. In GitHub, protect `master`: require pull requests and require the `CI / quality` status check before merging. Enable **Require branches to be up to date before merging** if desired. This makes failed CI a merge blocker; the repository rule must be enabled in GitHub Settings.

Feature branches and pull requests leave production unchanged. Merge a passing pull request into `master` to trigger the production deployment. Vercel only promotes a successful production build; a failed build leaves the current production deployment serving traffic.

## CI checks

`.github/workflows/ci.yml` runs for pull requests targeting `master` and pushes to `master`. It installs the frozen pnpm lockfile and runs ESLint, TypeScript, Vitest, and the production build. The workflow has read-only repository permissions and no deployment secrets. Vercel handles all deployments.

## Deployment health check

After Vercel reports a deployment as **Ready**, verify its commit and URL in the Vercel Deployments page. Then:

1. Open `/login` and confirm the page loads.
2. While signed out, open `/` and `/memories`; each should send you to `/login`.
3. Sign in as the viewer and confirm memories, images, videos, and voice recordings load and play.
4. Sign in as the admin and confirm `/admin` loads and a small test upload can be attached to a memory. Remove the test item afterward.
5. Sign out and confirm protected pages again redirect to `/login`.

## Rollback and troubleshooting

- To roll back, open **Vercel → Project → Deployments**, select the previous successful production deployment, and promote it to production (or use Vercel's rollback control if shown). You can also revert the faulty commit and push the revert to `master`; Git integration will build and deploy that commit.
- For failed CI, open the failed GitHub Actions run and inspect the first failing step. Reproduce locally with `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- For failed Vercel builds, inspect the deployment's Build Logs, confirm the framework and root directory, and verify the Node.js version is 24.x.
- For Supabase connection errors, check that the environment has the correct URL and public key for that deployment. Environment changes apply to new deployments, so redeploy after editing them.
- For audio upload MIME errors, confirm `003_audio_memories.sql` ran successfully in the Supabase project used by that deployment and that the private `memories` bucket allows the audio MIME types in the migration.

## Local quality commands

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
