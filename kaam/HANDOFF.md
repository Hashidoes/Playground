# Kaam: where things stand

A note for picking the work up in a new session.

## Done

- **App** (`kaam/`, branch `kaam-app`): Expo SDK 58 + Expo Router, running on sample data. Onboarding, Home, Tasks, Calendar, Scores and Household are built. See `README.md`.
- **Database setup** (`supabase/`): one migration with tables, access rules, functions, repeating tasks, weekly scores and live updates; 54 local tests pass. See `supabase/README.md`. **Not yet applied** to the Supabase project.
- **Design system** (tokens, components, copy): claude.ai artifact "Kaam Design System". It hasn't been updated since the onboarding work, so the app's `src/theme/tokens.ts` and `src/copy/strings.ts` are the current source.
- **Browser preview** of the app: claude.ai artifact "Kaam" (sample data).

## Decisions

- Sign-in: email with a 6-digit code, plus Google. No phone/SMS.
- Roles work like a WhatsApp group. Admins add and remove people, change roles, edit any shared task and tick anyone's. Members edit their own tasks and tick only their own or an unassigned one (which becomes theirs). Only admins add people. People can be added without the app; an admin ticks their tasks.
- Private tasks: the "Private for you" switch in the task sheet. Only the creator sees them, they're always the creator's own, and they never count on the score board.
- Scores: this week only, resetting Monday (IST). Points go to the task's owner.
- No helpers, leave or notice board.
- Theme: Sunlit from sunrise to sunset, Evening after, computed for the IST meridian. The Household page can hold the other theme until the next sunrise or sunset.
- Supabase project URL and publishable key go in `kaam/.env.local` (git-ignored):
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use the secret key in the app.

## Next

Done: the database setup is applied to the project, and the app is connected to it.
With `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (git-ignored),
the app signs in for real and reads and writes the database (`src/lib/supabase.ts`, `src/data/remote.ts`).
Changes show at once and save in the background; if a save fails the app reloads from the database and
shows a message. Other phones' changes arrive live. Without those settings it runs on sample data
(build the preview with `EXPO_NO_DOTENV=1`).

1. Email codes: set up custom SMTP, then put `{{ .Token }}` in the Magic Link template (see `supabase/README.md`).
2. Google sign-in: Google Cloud OAuth client, the Supabase Google provider, and `kaam://**` as a redirect URL.
3. Test the signed-in flows end to end against the project (needs a test account).
4. Optional: move `is_member`, `is_admin` and `my_member_id` to a private schema (security advisor warnings).
