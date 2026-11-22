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

- **Home:** greeting in the member's language, today's progress gauge, the notice board, and Up next.
- **Tasks:** Today, Upcoming and Done, filtered by person. Tick to finish, with Undo. Finishing a repeating task schedules its next occurrence.
- **New and edit task:** who, when, time, repeat, reminder and a note, with "Add again" suggestions. Delete with Undo.
- **Notice board:** post a notice that shows until a chosen date.
- **Calendar:** week strip, each day's tasks, and helper leave.
- **Scores:** tasks done this week, this month and all time.
- **Household:** members and helpers, today's load, the invite code, and appearance (Sunlit, Evening or Match my phone).

## Structure

```
src/
  app/                 Routes (Expo Router)
    _layout.tsx        Fonts, splash, providers, root stack
    (tabs)/            Home, Tasks, Calendar, Scores, Household
    task/new.tsx       New / edit task sheet (?id= to edit, ?date= to prefill)
    notice/new.tsx     Share a notice sheet
  components/          UI built from the design system
  copy/strings.ts      Every user-facing string (mirrors the Copy section)
  data/                Types, sample data, store and selectors
  lib/                 Date and time helpers
  theme/               Tokens (Sunlit and Evening) and ThemeProvider
```

`src/data/types.ts` matches the planned Supabase tables, so the store in `src/data/store.tsx` can be replaced by the backend without changing screens.

## Not built yet

- Supabase: accounts, households, invites, live sync between phones, saving data.
- Push notifications and reminders.
- Onboarding, sign-in, profile setup, menu and settings screens.
- Helper pages (leave and notes), urgent alerts.
- A native time and date picker (the task sheet offers preset times and the next three weeks for now).
