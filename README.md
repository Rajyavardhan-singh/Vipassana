# Your Path — Vipassana Course Tracker

A mobile-first tracker for Vipassana course history and long-course (20/30/45/60-Day)
eligibility, backed by MongoDB and deployable on Vercel.

## What it does

- Logs every course you've attended or served (type, dates, location, teacher).
- Automatically computes progress toward the 20/30/45/60-Day requirements from
  Long_Course_Requirements.jpg — served courses are never counted as "attended."
- Tracks the four criteria that can't be derived from dates (daily sitting, full
  commitment, sīla, AT/service role) as simple toggles in Settings.
- Single password gate — this is built for one user (you), not a multi-account system.

## 1. Set up MongoDB Atlas

You've already got a cluster and connection string. In Atlas, under **Network Access**,
add `0.0.0.0/0` (allow from anywhere) so Vercel's serverless functions can reach it —
or add Vercel's specific IP ranges if you'd rather keep it tighter.

## 2. Local setup

```bash
npm install
```

`.env.local` is already filled in with your connection string, a placeholder
`APP_PASSWORD=changeme`, and a generated `SESSION_SECRET`. **Change `APP_PASSWORD`
to something real before you deploy.** This file is gitignored — it will never be
committed.

Seed your existing 4 courses into MongoDB (safe to run once; it skips seeding if the
collection already has data):

```bash
npm run seed
```

Run it locally:

```bash
npm run dev
```

Visit `http://localhost:3000`, log in with your `APP_PASSWORD`.

## 3. Deploy to Vercel

```bash
npx vercel
```

Then, in the Vercel project's **Settings → Environment Variables**, add the same four
variables from `.env.local` (`MONGODB_URI`, `MONGODB_DB`, `APP_PASSWORD`,
`SESSION_SECRET`) — Vercel never reads your local `.env.local` file, so this step is
required. Redeploy after adding them (`npx vercel --prod`).

## Notes on the eligibility logic

All of it lives in `lib/eligibility.js`, in one place, so you can tweak it as MPA/
your center's requirements change:

- **20-Day**: 5 attended 10-Day + 1 Satipatthana Sutta + 1 served 10-Day + 2 yrs on the path
- **30-Day**: 6 attended 10-Day + 1 attended 20-Day + 1 Satipatthana + a 10-Day completed
  after your 20-Day + 2 yrs
- **45-Day**: 7 attended 10-Day + 2 attended 30-Day + a 10-Day completed after your
  30-Day + AT/service role + 3 yrs
- **60-Day**: 2 attended 45-Day + senior AT/service role + 5 yrs
- Every tier also needs the three self-declared toggles (daily sitting, full
  commitment, sīla) set to true in Settings.
- A banner warns if you're inside the 6-month gap required between long courses, or
  the 10-day gap required after any course.

3-Day, 1-Day, and Teacher Self-Course entries are logged for your record but don't
feed into any of the eligibility math above, since the requirements table doesn't
reference them.
