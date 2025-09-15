# Local Booking App (Parking + Meeting)

Stack: **Node.js (Express) + Sequelize**, **MySQL** (users & parking), **PostgreSQL** (meeting & logs), **FullCalendar** + **Google Sign‑In** on the client. Deployable via **Docker Compose** for local network.

## Features
- User & Admin (JWT auth). Default admin: `admin@example.com` / `admin123`
- Parking booking (MySQL). Remaining slots in dashboard.
- Meeting booking (PostgreSQL) with **FullCalendar**. Requires Google login (client‑side) before creating events. New events are created in the user's Google Calendar (client‑side) and simultaneously stored in backend DB.
- Admin with Sidebar: manage parking slots, meeting rooms, Slack webhook URL, Google Client ID.
- Logs (logins & bookings) downloadable as **CSV**.
- Simple UI (vanilla HTML/JS/CSS) served by Express.

## Quick Start (Docker)
1) Copy `.env.example` to `.env` and edit if needed.
2) `docker compose up --build`
3) Open `http://localhost:8080`
   - Login using default: `admin@example.com` / `admin123`

> For Google Sign‑In to work locally, add your **Authorized JavaScript origins** and **Redirect URIs** in Google Cloud Console to match your base URL (e.g., `http://localhost:8080`). Use the same **Google Client ID** you paste in **Admin → Settings**.

## Non‑Docker (dev only)
- Ensure MySQL & PostgreSQL running locally; adjust `.env`.
- `cd backend && npm i && npm run dev`
- App runs on `http://localhost:8080`.

## Notes
- Client uses **Google Identity Services** (token client) + `gapi` to call Calendar API directly (insert events). The backend stores the meeting booking metadata and enforces room availability. This keeps server simple for local setups.
- Slack webhook (optional): if set in **Admin → Settings**, the app will POST a message when a new booking is created.


## New Features
- **Meeting Cancel/Reschedule**: drag & drop event untuk reschedule; click event untuk cancel (menghapus juga dari Google Calendar).
- **Parking Slot Calendar**: tampilan FullCalendar per slot untuk melihat availability.
- **Monthly Reports**: halaman **Reports** untuk ekspor **CSV**, **Excel (.xlsx)**, atau **PDF** (per bulan, parking/meeting).
