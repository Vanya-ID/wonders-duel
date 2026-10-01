# 7 Wonders Duel helper

Phone-first PWA for two players of «7 Чудес: Дуэль» (Russian edition) with the Pantheon and Agora expansions:
hidden two-phone scoring, shared game history with stats, setup checklists and a rules reference.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (`http://localhost:5173/wonders-duel/`) |
| `npm test` | Vitest unit tests for scoring, stats, layouts and trading |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run lint` | Oxlint |
| `npm run icons` | Regenerate PWA icons from `public/favicon.svg` |

Without Supabase keys the app still works: history is stored on the device only, and two-phone scoring shows a
"not configured" message.

## Supabase

1. Create a new project at https://supabase.com/dashboard.
2. **SQL Editor** → run [supabase/schema.sql](supabase/schema.sql). It creates the `games` and `score_sessions`
   tables with row-level security and adds `score_sessions` to the `supabase_realtime` publication.
3. **Authentication → Providers → Email**: turn off **Confirm email**, otherwise the shared account has to be
   confirmed from the mailbox before it can sign in.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

Local `.env` in the project root:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Both phones sign in with the same email and password (Settings → Account). Player names are stored in the
shared account and synced to both phones.

## GitHub Pages

1. Repository **Settings → Pages → Source**: GitHub Actions.
2. **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — used by the build (the deploy fails if they are missing);
   - `SUPABASE_ACCESS_TOKEN` — personal access token from https://supabase.com/dashboard/account/tokens, used by
     the keep-alive workflow to restore a paused project.
3. Push to `main` — [deploy.yml](.github/workflows/deploy.yml) runs the tests, builds and publishes to
   `https://vanya-id.github.io/wonders-duel/`.

[keep-alive.yml](.github/workflows/keep-alive.yml) pings the `games` table daily so the free-tier project does not
pause; [keep-repo-active.yml](.github/workflows/keep-repo-active.yml) keeps scheduled workflows enabled.

## Install on a phone

Open the site in the phone browser → "Add to Home Screen". The app works offline except for two-phone scoring,
which needs internet on both phones.
