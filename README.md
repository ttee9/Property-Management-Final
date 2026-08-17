# Property Management App

A small full-stack app for property managers and tenants:

- **Tenants** sign in with just their cell phone number (SMS one-time code, no password) and can submit maintenance requests and check their rent payment status.
- **Property managers** sign in with email/password and can see every tenant's payment status (paid / unpaid / late) and manage maintenance requests across their properties.

## Stack

- **Backend**: FastAPI + SQLAlchemy (SQLite by default), JWT auth
- **Frontend**: Next.js (App Router) + TypeScript, no UI framework dependency

## Project layout

```
backend/    FastAPI API, database models, auth, seed script
frontend/   Next.js app (tenant + manager UIs)
```

## Running locally

### 1. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/python -m app.seed      # creates demo manager, property, tenants, sample data
.venv/bin/uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The app runs at `http://localhost:3000`.

## Demo credentials (after running the seed script)

**Property manager**
- Email: `manager@demo.com`
- Password: `manager123`

**Tenants** (phone login, OTP-based)
- Jordan Lee — `+14155550101`
- Sam Patel — `+14155550102`
- Casey Kim — `+14155550103`
- Morgan Diaz — `+14155550104`

No real SMS provider is required for local development: when `ENVIRONMENT=development` (the default), the login code is both logged to the backend console and returned in the API response (`debug_code`), and the tenant login screen displays it directly so you can sign in end-to-end without any SMS account.

To send real text messages, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` in `backend/.env` and set `ENVIRONMENT=production`.

## How tenant login works

1. Tenant enters their phone number → `POST /auth/tenant/request-otp`
2. Backend generates a 6-digit code, stores a hash of it (5 minute expiry), and sends it via SMS (or logs it in dev mode)
3. Tenant enters the code → `POST /auth/tenant/verify-otp` → backend returns a JWT
4. The JWT is used as a Bearer token for all subsequent tenant requests

Only phone numbers that already belong to a tenant record (created by a property manager, e.g. via the seed script) can request a code — there is no public sign-up.

## Core features

- **Tenant dashboard**: submit a maintenance request (title, description, category, priority), see your own requests and their status, see your current rent payment status
- **Manager dashboard**: see every tenant with their current payment status and outstanding maintenance requests; update a tenant's payment status (unpaid/paid/late); update a maintenance request's status (open/in progress/completed/cancelled)

## Notes on scope

This is an MVP: a single manager account manages one or more properties (seeded with one), and rent payments are simple monthly records rather than a full billing/invoicing system. It's meant as a solid starting point rather than a production-ready SaaS.
