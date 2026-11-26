# Kaam database (Supabase)

`migrations/20261126000000_kaam_init.sql` sets up everything the app needs: the tables, the access rules, the functions the app calls, repeating tasks, the weekly score board and live updates. It's tested by `tests/access_rules.test.sql` (54 checks).

## 1. Run the setup (once)

1. Open your project in the Supabase dashboard.
2. Go to **SQL Editor** and start a new query.
3. Paste the whole of `migrations/20261126000000_kaam_init.sql` and click **Run**.

It should finish with "Success. No rows returned". Run it only once on a project: it creates tables, so a second run stops with "already exists" errors.

It needs Postgres 15 or newer, which every new Supabase project has.

## 2. Turn on email codes

Supabase sends a sign-in link by default. Kaam asks for the 6-digit code instead:

1. Go to **Authentication → Sign In / Providers** and check **Email** is enabled.
2. Go to **Authentication → Emails** (email templates) and open the **Magic Link** template.
3. Put the code in the email, for example: `Your Kaam code is {{ .Token }}`. You can remove the link.

Supabase's free email sending is rate-limited and meant for testing. Before launch, add your own email provider under **Authentication → Emails → SMTP settings**.

## 3. Turn on Google sign-in

1. In the Google Cloud Console, create an OAuth client ID (type **Web application**).
2. In Supabase, open **Authentication → Sign In / Providers → Google**. Copy the **Callback URL** shown there into the Google client's **Authorized redirect URIs**.
3. Paste Google's **Client ID** and **Client secret** into the Supabase Google provider and save.
4. In **Authentication → URL Configuration**, add `kaam://**` to **Redirect URLs** so Google can hand the person back to the app.

Dashboard names change from time to time; if a label differs, look for the nearest match.

## Who can do what

The rules live in the database, so they hold even if someone modifies the app.

| | Admin | Member | Not in the household |
|---|---|---|---|
| See the household, its people and shared tasks | ✓ | ✓ | |
| See a private task | only their own | only their own | |
| Add a task (as themselves) | ✓ | ✓ | |
| Edit or delete a shared task | any | ones they created | |
| Tick off a task | anyone's | their own, or an unassigned one (it becomes theirs) | |
| Add someone without the app, reset the invite code | ✓ | | |
| Make admin / dismiss as admin, remove someone | ✓ | | |
| Rename the household | ✓ | | |
| Leave the household | ✓ | ✓ | |

- A household always has an admin: the last one can't step down, and if they leave, the longest-standing member becomes admin.
- A point goes to the person the task belongs to, even when an admin ticks it.
- Private tasks never count on the score board and are deleted when their owner leaves.
- Signed-out visitors can't read or call anything.

## Functions the app calls

| Function | What it does |
|---|---|
| `create_household(name, kind)` | Starts a household; you become its admin |
| `join_household(code)` | Joins with an invite code (case and spacing don't matter) |
| `reset_invite_code(household)` | Admin: new code, valid 7 days |
| `add_member_without_app(household, name)` | Admin: adds someone who won't use the app |
| `set_member_role(member, role)` | Admin: `admin` or `member` |
| `remove_member(member)` | Admin: removes someone else |
| `leave_household(household)` | Leaves; your private tasks are deleted |
| `complete_task(task)` / `uncomplete_task(task)` | Ticks off or unticks, with the rules above |

Everything else (reading, adding and editing tasks, your profile) uses the tables directly, filtered by the access rules. The score board is the `weekly_scores` view: Monday to Sunday, India time.

## Testing locally

The tests run against plain Postgres, with `tests/local_supabase_shim.sql` standing in for the parts of Supabase the setup uses. Never run the shim on Supabase.

```bash
createdb kaam_test
psql -v ON_ERROR_STOP=1 -d kaam_test -f tests/local_supabase_shim.sql -f migrations/20261126000000_kaam_init.sql
psql -v ON_ERROR_STOP=1 -d kaam_test -f tests/access_rules.test.sql
```

## Known limits

- Invite codes are short so they're easy to share. They expire after 7 days and admins can reset them, but there's no limit on how many codes someone can try. Add rate limiting before a public launch.
- The app still runs on sample data until it's connected to this database (the next step).
