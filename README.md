# Retired Defence Officers Portal (React + Node.js)

Complete full-stack implementation using:

- `frontend`: React + Vite
- `backend`: Node.js + Express
- persistence: JSON database (`backend/data/db.json` auto-created)

## Implemented Features

- secure user account management (register/login, optional TOTP 2FA, password recovery)
- pension dashboard (payment history, pension requests, monthly expense and remaining balance tracking)
- healthcare services (provider directory, appointment booking, telehealth links, claims)
- career module (job board, resume builder, applications, workshops)
- community forum (posts, replies, report for moderation)
- notifications and alerts center (mark read / mark all read)
- resource center (category filtering)
- feedback ticketing
- accessibility preferences (high contrast, font scaling, text-to-speech)
- profile and notification preference management

## Project Structure

- [backend](/Users/satvikgupta/Downloads/defence/project/backend)
- [frontend](/Users/satvikgupta/Downloads/defence/project/frontend)

## Backend Setup

```bash
cd /Users/satvikgupta/Downloads/defence/project/backend
cp .env.example .env
npm install
npm run dev
```

Backend URL: `http://localhost:4000`

Health check:

```bash
curl http://localhost:4000/health
```

## One-Command Judge Demo

From project root:

```bash
cd /Users/satvikgupta/Downloads/defence/project
npm run demo
```

This starts both backend and frontend and prints the exact URLs to open.
Keep this terminal open during the demo.

Stop both services:

```bash
npm run demo:stop
```

## Frontend Setup

```bash
cd /Users/satvikgupta/Downloads/defence/project/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Demo Accounts

- Officer: `retired.officer@example.com` / `ChangeMe123!`
- Admin: `admin@example.com` / `Admin@12345`

## Notes

- Backend seeds demo data automatically on first run.
- Password recovery returns reset token in API response for development.
- Use HTTPS, secure secret management, and a real DB (PostgreSQL/MySQL) for production.
- If Vite hangs when running from `Downloads`, move the project to a non-Downloads path (example: `/Users/satvikgupta/defence-portal`) and run frontend there.
- Frontend routing fallback for hosting is included via `frontend/public/_redirects` so direct links like `/login` work after deployment.

## Production Hardening Checklist

- move persistence from JSON file to relational DB
- integrate SMTP/SMS providers for reset and notifications
- enforce strict RBAC/ABAC by role and data domain
- add request audit log export and retention policies
- add file/document upload scanning for claims and pension requests
# Test Yourself 
https://aegis-5cc9.onrender.com
