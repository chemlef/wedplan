# MyWedPlan

A wedding-planning workspace for planners, couples and their koumbaroi. Apple-inspired interface, built on Node.js with **zero npm dependencies**, hosted on **Vercel**, data in **Turso**.

## Features

| Area | What it does |
| --- | --- |
| **Overview** | Countdown, guest/RSVP, checklist, budget and seating progress, overdue tasks, upcoming payments and events, latest RSVPs, team activity. |
| **Guest list** | Guests with contact details, side, group, household (shared invitation), plus-ones, children, VIPs, RSVP, meal choice, dietary needs, kitchen notes, who they know / must be kept apart from, gifts and thank-you tracking. CSV import/export, filters, bulk actions, printing. |
| **Seating** | Tables of any shape and size (round, rectangular, square, head, sweetheart, kids') and floor items (dance floor, stage, bar…). Drag-and-drop floor plan and table cards, per-guest table suggestions, and **auto-arrange**, which offers three plans (friends together / by family & group / mix & mingle). It keeps households together and never seats keep-apart pairs at the same table. Exports CSV, table plan, "find your seat" list, place cards, a kitchen sheet and the floor plan. |
| **Invitations & RSVP** | A design editor with templates: classic, romantic florals, modern, Greek olive, Aegean arch, save the date, menu. You can add text with automatic details ({couple}, {date_long}, {guest}…), photos, flowers and bouquets, ornaments, shapes and frames, and use layers, undo/redo, snapping and keyboard shortcuts. Prints to PDF, optionally one card per guest. Every guest gets a personal **online invitation + RSVP page** (English or Greek) for the whole household: meal choice, dietary needs, plus-one, song request and a message. |
| **Emails** | MyWedPlan never sends email. It **exports** personalised drafts instead: a ZIP of `.eml` drafts (one per guest, opens in Apple Mail, Outlook or Thunderbird) or a **mail-merge CSV** (Word, Outlook, YAMM, GMass). |
| **Checklist** | A full planning timeline generated from the wedding date (with Greek Orthodox or civil extras), squeezed to fit if the wedding is sooner than a year away. Relative or fixed due dates, categories, owners and notes. |
| **Calendar** | A month view of tasks, appointments, tastings, fittings, payment due dates and the wedding day. Download as `.ics`, or **subscribe** with a private link (Apple, Google or Outlook calendar). |
| **Budget** | Categories with suggested split, expenses with estimates vs. actuals and payment schedules (deposit/balance), an allocation donut, spent-vs-planned bars, cost per guest and upcoming payments. CSV export. |
| **Vendors & quotes** | Venues, catering, photo, florists, music and more, plus custom categories and fields. Quotes, deposits, ratings, pros and cons, links and status. Side-by-side **comparison** (CSV/print). "Book" adds the vendor to the budget with a payment schedule. |
| **Colours & flowers** | Palette generator (monochrome, analogous, complementary…) and curated palettes. A library of **61 illustrated flowers** with Greek names, seasons, colours and symbolism. A **bouquet maker** that suggests matching, in-season bouquets (round, garden, cascade, posy, boho, buttonhole, centrepiece), editable and saved, with a florist sheet. A **bomboniere (μπομπονιέρες) maker** with 17 container styles, koufeta count and colours, ribbon, decorations (olive, lavender, mati, wax seal…), tag text, quantity and cost, an order sheet and "add to budget". |
| **Menu & dietary** | Dietary summary from guests, a check that every need is covered in each course, meal choices for the RSVP, a dish library (Greek, Mediterranean, Italian, classic…), a menu generator, a printable menu card and a dietary sheet for the caterer. |
| **Music** | Playlist by moment (processional, first dance, Kalamatiano/Zeibekiko, do-not-play…), guest requests from RSVPs, CSV/print/copy for the DJ, plus optional **Spotify** search and export to a Spotify playlist. |
| **Inspiration** | Mood board for photos, notes and links, with Pinterest pins and Instagram posts as live embeds. Optional **Pinterest** connection to import pins from your boards. |
| **Day-of schedule** | A run sheet with times, people responsible and locations, booked vendors' phone numbers, a print version, and optional publishing of selected moments on the guest page. |
| **Notes** | Shared notes (vows, speeches, emergency kit…). |
| **Team & access** | Planner accounts can run **many weddings** and add co-planners. Each wedding has its own **helper logins** (koumbaros/koumbara, couple, bridesmaid, family, view-only), with per-section **hidden / view / edit** permissions and an activity log. |

## Accounts

- **Planners** sign up with email + password and can create any number of weddings.
- **Helpers** (koumbaroi, family) sign in at `/join` with the wedding code, a username and a password the planner creates in *Team & access*. They see only the sections they're allowed to.
- **Guests** never sign in: they use their personal link `/rsvp/<token>`.

## Run locally

Requires Node 22.5+ (uses the built-in `node:sqlite` for local data).

```bash
cp .env.example .env   # optional
npm run dev            # http://localhost:3000, data in ./data/wedplan.db
npm run check          # syntax-check every file
```

## Deploy (Vercel + Turso)

1. **Create the database**
   ```bash
   turso db create wedplan
   turso db show wedplan --url          # → TURSO_DATABASE_URL
   turso db tokens create wedplan       # → TURSO_AUTH_TOKEN
   ```
   Tables are created automatically on first request.
2. **Vercel project** linked to this repo (framework preset *Other*, no build command). Set the environment variables:

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `TURSO_DATABASE_URL` | yes | `libsql://…turso.io` |
   | `TURSO_AUTH_TOKEN` | yes | |
   | `SESSION_SECRET` | yes | long random string (`openssl rand -hex 32`) |
   | `APP_URL` | recommended | e.g. `https://mywedplan.vercel.app`, used for OAuth redirects |
   | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | optional | redirect URI: `$APP_URL/api/spotify/callback` |
   | `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET` | optional | redirect URI: `$APP_URL/api/pinterest/callback` |

3. Push to `main` and Vercel deploys.

### Spotify notes
Since February 2026, Spotify Development-Mode apps need the developer to have **Spotify Premium** and allow up to **5 users** (add them under *User Management* in the Spotify dashboard). That's plenty for one wedding. MyWedPlan uses the current endpoints (`POST /me/playlists`, `/playlists/{id}/items`).

### Pinterest & Instagram
Pinterest's API lets you read your own boards and pins once you create an app at developers.pinterest.com (trial access is enough for your own account). Instagram no longer offers an API for personal accounts, so MyWedPlan embeds posts from pasted links instead.

## Project layout

```
api/index.js           Vercel function: every /api/* request
lib/db.js              Turso over HTTP (prod) / node:sqlite (local)
lib/schema.js          Tables, record types and permission areas
lib/auth.js            Password hashing (scrypt), signed cookies, permissions
lib/routes/*.js        Auth, weddings, records, team, RSVP, iCal, Spotify, Pinterest
public/index.html      The app (ES modules, no build step)
public/rsvp.html       Guest invitation + RSVP page
public/js/lib/         UI kit, store, flowers, bouquets, bomboniere, designs, seating algorithm…
public/js/views/       One file per section
server.js              Local dev server
```

Feature data is stored as JSON documents per wedding (`records` table), so sections can grow new fields without migrations.
