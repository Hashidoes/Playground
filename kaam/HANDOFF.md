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

1. Apply `supabase/migrations/20261126000000_kaam_init.sql` to the project through the Supabase connector, then check the access rules on the real project.
2. Turn on email codes (Magic Link template with `{{ .Token }}`) and Google sign-in (see `supabase/README.md`).
3. Connect the app: supabase-js with persisted sessions, real sign-in, and replace the sample store in `src/data/store.tsx` with Supabase reads, writes and live updates. Keep the store's interface so screens don't change.
4. Loading, offline and "couldn't save" states.
