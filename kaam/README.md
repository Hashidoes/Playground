# Kaam

A shared to-do planner for households: families, roommates and the helpers who work with them. Built with Expo (SDK 58), Expo Router and TypeScript, for iOS and Android first.

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

- **Onboarding:** three illustrated slides (the Figma panorama), sign in with a phone number and a 6-digit code, your name and greeting language, then start a household (and invite people with a code) or join one. Until Supabase is connected, any 6-digit code except 000000 signs you in, and code **NAI-428** joins the example household.
- **Home:** greeting in the member's language, today's progress gauge, the notice board, and Up next.
- **Tasks:** two views, **Everyone** (shared tasks, with a person filter) and **Mine** (yours, private ones included), each with Today (overdue, today, then coming up) and Done. Tick to finish, with Undo. Finishing a repeating task schedules its next occurrence. The add button floats at the bottom right.
- **Private tasks:** choose "Only me" under "Who can see it?". Only you see them (marked with a lock), they're always yours, and they don't count on the score board. The store filters them out for everyone else, so no screen can show them by mistake.
- **New and edit task:** who, when, time, repeat, reminder and a note, with "Add again" suggestions. Delete with Undo.
- **Notice board:** post a notice that shows until a chosen date.
- **Calendar:** week strip, each day's tasks, and helper leave.
- **Scores:** tasks done this week, this month and all time.
- **Household:** members and helpers with today's load; tap someone to see their tasks. **+** adds someone: invite them with a code, or add them without the app (for example a helper without a smartphone).
- **Theme:** Sunlit from sunrise to sunset and Evening from sunset to sunrise, Indian Standard Time (calculated for the IST meridian, 82.5°E). Choosing the other theme on Household holds it until the next sunrise or sunset.

## Structure

```
src/
  app/                 Routes (Expo Router)
    _layout.tsx        Fonts, splash, providers, and the guard that sends new people to onboarding
    (onboarding)/      Welcome slides, sign in, code, profile, household setup, invite, join
    (tabs)/            Home, Tasks, Calendar, Scores, Household
    task/new.tsx       New / edit task sheet (?id= to edit, ?date= to prefill)
    notice/new.tsx     Share a notice sheet
  components/          UI built from the design system
  copy/strings.ts      Every user-facing string (mirrors the Copy section)
  data/                Types, sample data, store and selectors
  lib/                 Date, time, phone and sunrise/sunset helpers
  theme/               Tokens (Sunlit and Evening) and ThemeProvider
```

`src/data/types.ts` matches the planned Supabase tables, so the store in `src/data/store.tsx` can be replaced by the backend without changing screens.

## Not built yet

- Supabase: accounts, households, invites, live sync between phones, saving data.
- Push notifications and reminders.
- Real text messages for sign-in, and invites by phone number (both need Supabase).
- A profile photo, and the menu and settings screens (Sign out is on Household for now).
- Helper pages (leave and notes), urgent alerts.
- A native time and date picker (the task sheet offers preset times and the next three weeks for now).
