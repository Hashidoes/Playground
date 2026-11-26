# Kaam

A shared to-do planner for households: families and roommates. Built with Expo (SDK 58), Expo Router and TypeScript, for iOS and Android first.

Design source: the Kaam design system (tokens, components and the Copy section), built from the *portfolio_Kalm* Figma file.

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go on your phone, or press `i` / `a` for a simulator. Press `w` to open it in a browser.

Checks:

```bash
npm run typecheck
npm run lint
```

## What works now

The app runs on **sample data** for an example household (the Nair home). Nothing is saved yet: reloading the app resets it. Connecting Supabase is the next step.

- **Onboarding:** three illustrated slides (the Figma panorama), sign in with an email code or Google, your name and greeting language, then start a household (you become its admin, and invite people with a code) or join one. Until Supabase is connected, any 6-digit code except 000000 signs you in, Google sign-in is simulated, and code **NAI-428** joins the example household as a member.
- **Home:** greeting in the member's language, today's progress gauge, Up next, and a floating + to add a task.
- **Tasks:** two views, **Everyone** (shared tasks, with a person filter) and **Mine** (yours, private ones included), each showing one list: overdue, today (finished tasks sink to the bottom), then coming up. Tick to finish, with Undo. Finishing a repeating task schedules its next occurrence. The add button floats at the bottom right.
- **Private tasks:** turn on **Private for you** when adding a task. Only you see it (marked with a lock), it's always yours, and it doesn't count on the score board. The store filters private tasks out for everyone else, so no screen can show them by mistake.
- **New and edit task:** who, when, time, repeat, reminder and a note, with "Add again" suggestions. Delete with Undo.
- **Calendar:** week strip and each day's tasks.
- **Scores:** tasks done this week. Scores start fresh every Monday; private tasks don't count; a point goes to the person the task belongs to, even when an admin ticks it for them.
- **Roles, like a WhatsApp group:**
  - **Admins** add people (invite code, or someone without the app), remove people, make others admin or dismiss them, edit or delete any task, and tick off anyone's task.
  - **Members** add tasks and give them to anyone, edit or delete tasks they created, and tick off only their own tasks (or an unassigned one, which becomes theirs). Tapping someone else's task explains who can tick it.
  - The creator is the first admin; there can be several; the household always keeps at least one. If the last admin leaves, the longest-standing member becomes admin.
  - These rules are enforced in the store, not only on screen.
- **Household:** everyone with today's load and role. Admins get a + (bottom right) to add people and a ⋯ on each person for Make admin / Dismiss as admin / Remove. Everyone can leave the household or sign out.
- **Theme:** Sunlit from sunrise to sunset and Evening from sunset to sunrise, Indian Standard Time (calculated for the IST meridian, 82.5°E). Choosing the other theme on Household holds it until the next sunrise or sunset, then the sun takes over again.

## Structure

```
src/
  app/                 Routes (Expo Router)
    _layout.tsx        Fonts, splash, providers, and the guard that sends new people to onboarding
    (onboarding)/      Welcome slides, sign in, code, profile, household setup, invite, join
    (tabs)/            Home, Tasks, Calendar, Scores, Household
    task/new.tsx       New / edit task sheet (?id= to edit, ?date= to prefill)
    member/new.tsx     Add someone (admins): invite code, or add without the app
  components/          UI built from the design system
  copy/strings.ts      Every user-facing string (mirrors the Copy section)
  data/                Types, sample data, store and selectors
  lib/                 Date, time, email and sunrise/sunset helpers
  theme/               Tokens (Sunlit and Evening) and ThemeProvider
```

`src/data/types.ts` matches the Supabase tables, so the store in `src/data/store.tsx` can be replaced by the backend without changing screens.

## Database

`supabase/` holds the database setup (one SQL file to run in Supabase's SQL Editor), the steps for email codes and Google sign-in, and a test suite for the access rules. See [supabase/README.md](supabase/README.md).

## Not built yet

- Connecting the app to the database (the setup is written and tested; the app still uses sample data).
- Push notifications and reminders.
- Real email codes and Google sign-in (both come with Supabase Auth).
- A profile photo, and the menu and settings screens (Sign out is on Household for now).
- A native time and date picker (the task sheet offers preset times and the next three weeks for now).
