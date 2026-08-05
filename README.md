# Testing OAuth Login (UC1/UC2/UC3) Locally

## 1. Get the repo running

```bash
git clone <repo-url>
cd evonix-backend
npm install
```

## 2. Set up your `.env`

Copy `.env.example` to `.env` in the repo root, and fill in the real values
(found in document):

```
PORT=5050
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
NODE_ENV=
```

## 3. Start the backend

```bash
npm run dev
```

Confirm it's running by opening **http://localhost:5050/api/health** in a
browser - you should see `{"status":"ok", ...}`. (Swap `5050` for whatever
you set `PORT` to.)

## 4. Confirm the redirect URL is allowed in Supabase

The login page redirects back to itself after Google sign-in. In the
Supabase dashboard → Authentication → URL Configuration → Redirect URLs,
confirm `http://localhost:5050/login.html` is in the list (swap `5050` for
your actual `PORT`).

## 5. Test it

1. Open **http://localhost:5050/login.html**
2. Click **Sign in with Google**, log in with your Gmail account
3. You should land back on the page showing "You are signed in" with your
   user info
4. Click **Complete your profile** → fill in phone and/or address → **Save
   Profile** → should show "Profile saved successfully."
5. **Check it actually wrote to the database**: Supabase dashboard → Table
   Editor → `profiles` table → find your row (matches your email) → confirm
   `phone` updated. Then check the `addresses` table for a new row with a
   matching `user_id`.
6. Click **Sign Out** → page should revert to the signed-out view. Reloading
   `/login.html` afterward should not show you as signed in.
7. Demo Account with Admin privileges (example: See Reports tab)
   Email: Amralhamwi2@gmail.com
   Password: 123456789

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Redirected back to a Google/Supabase error page instead of `login.html` | `http://localhost:<PORT>/login.html` isn't in Supabase's Redirect URLs list (step 4) |
| `/login.html` shows signed out right after a successful login | Check the browser console for errors calling `/api/auth/me` - confirm the backend is running and `PORT` matches the URL you're visiting |
| "Session invalid" message after signing in | Your token may have been revoked (e.g. you signed out elsewhere) - try signing in again |

