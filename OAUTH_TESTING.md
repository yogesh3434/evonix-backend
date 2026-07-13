# Testing OAuth Login (UC1/UC2/UC3) Locally

Make sure email is added as a test user in the Google Cloud Console.


## 1. Get the repo running

```bash
git clone <repo-url>
cd evonix-backend
npm install
```

## 2. Set up your `.env`

Copy `.env.example` to `.env` in the repo root, and fill in the real values
(get from the discord server):

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

`FRONTEND_URL` must exactly match the URL you'll serve the test page from in
step 4 below (port included), or requests will get silently blocked by CORS.

## 3. Start the backend

```bash
npm run dev
```

Confirm it's running by opening **http://localhost:5050/api/health** in a
browser - you should see `{"status":"ok", ...}`. (Swap `5050` for whatever
you set `PORT` to.)

## 4. Serve the test page

Save `test-oauth.html` (shared separately) anywhere on your machine, then open another
terminal in that folder and use:

```bash
npx serve .
```

It'll print a URL like `http://localhost:3000` - open that in your browser.
**This exact URL must match `FRONTEND_URL` in your `.env`** from step 2. If
it doesn't, update `.env` and restart `npm run dev`.

If you get a "running scripts is disabled on this system" error use the following command:
```bash
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```
## 5. Confirm the redirect URL is allowed in Supabase

In the Supabase dashboard → Authentication → URL Configuration → Redirect
URLs, confirm your test page's URL (e.g. `http://localhost:3000`) is in the
list. If not, add it.

## 6. Test it

On the test page:
1. **Step 1**: paste in `SUPABASE_URL` and `SUPABASE_ANON_KEY`, set **Backend URL** to match your `PORT`
   (e.g. `http://localhost:5050`), click **Save**.
2. **Step 2**: click **Sign in with Google**, log in with your test-listed
   Gmail account.
3. **Step 3**: try the buttons:
   - `GET /api/auth/me` → should return your user info + profile as JSON
   - Fill in the phone/address fields → `PATCH /api/auth/profile` → should
     return `200 success`
   - `POST /api/auth/logout` → signs you out server-side; trying `/me`
     again afterward should now fail with `401`
4. **Step 4: Check it actually wrote to the database**: Supabase dashboard →
     Table Editor → `profiles` table → find your row (matches your email) →
     confirm `phone` updated. Then check the `addresses` table for a new
     row with a matching `user_id`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Google says "access blocked" | Your Gmail isn't in the Test users list yet (step 0) |
| Buttons do nothing, no output | `FRONTEND_URL` in `.env` doesn't match the test page's actual URL |

