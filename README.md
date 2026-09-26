# Daily Task Email Automation System 🚀

An automated enterprise-grade system that monitors daily intern task report submissions via the **Gmail REST API**, verifies subject lines with fuzzy matching, dispatches styled HTML reminder emails to missing interns, schedules checks automatically at **8:00 PM on weekdays**, and provides a **real-time React dashboard** with full audit logs backed by SQLite.

---

## 🌟 Key Features

- **Automated Weekday Scheduler**: Uses `node-cron` configured for `8:00 PM Monday through Friday` (`0 20 * * 1-5`), automatically skipping weekends.
- **Gmail REST API (OAuth 2.0)**: Secure Google OAuth2 authentication with persistent refresh tokens stored on disk.
- **Fuzzy Subject Parser**: Intelligently verifies incoming emails matching variations of:
  `Daily Task Update - [Name] - [DD/MM/YYYY]`
- **Responsive HTML Reminder Emails**: Automatically formats and sends branded HTML reminder emails with urgency banners and expected submission formats.
- **SQLite Persistence**: High-speed database with Write-Ahead Logging (`WAL`) mode tracking every check run and individual intern status.
- **Modern Interactive Dashboard**:
  - Live compliance statistics & percentage rates.
  - Search and filter interns by status (`Submitted`, `Missing`, `Reminded`).
  - Instant manual trigger button ("Run Check Now") and single-click direct reminders.
  - Expandable historical audit log of all checks.
- **Production-Ready**: Protected by `helmet` security headers, `express-rate-limit`, and unified static client hosting.

---

## 🏗️ Architecture

```
email-automation/
├── client/                     # Frontend (React 19, Vite, Tailwind CSS, Lucide)
│   ├── src/
│   │   ├── components/         # Header, Dashboard, EmployeeCard, StatusBadge, LogsTable
│   │   ├── hooks/useApi.ts     # Real-time polling & API data fetcher
│   │   ├── types/              # Frontend TypeScript definitions
│   │   └── App.tsx             # Root dashboard layout
│   ├── vite.config.ts          # Vite configuration with API proxy
│   └── tsconfig.json           # Frontend TypeScript config
│
├── server/                     # Backend (Express.js, TypeScript, better-sqlite3)
│   ├── config/env.ts           # Typed environment validator
│   ├── db/                     # SQLite connection, migrations, prepared queries
│   ├── middleware/             # Request logger, global error handler
│   ├── routes/                 # REST API (/api/*) & Google OAuth (/auth/*)
│   ├── services/
│   │   ├── gmail.service.ts    # Gmail API OAuth client, inbox search, email dispatch
│   │   ├── checker.service.ts  # Core compliance verification logic
│   │   ├── reminder.service.ts # Automated reminder builder & sender
│   │   └── scheduler.service.ts# node-cron 8:00 PM scheduler
│   └── utils/                  # Date helpers, fuzzy subject parser, HTML email templates
│
├── data/
│   ├── employees.json          # Active intern roster
│   └── email_automation.db     # SQLite database (auto-created on boot)
├── .env.example                # Environment variables template
└── package.json                # Project dependencies & orchestration scripts
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express.js 5, TypeScript, `tsx` |
| **Email & Auth** | Google OAuth 2.0, official `googleapis` Gmail REST API v1 |
| **Scheduler** | `node-cron` |
| **Database** | SQLite (`better-sqlite3` with WAL mode) |
| **Security** | Helmet.js, Express Rate Limit, CORS |

---

## 🚀 Quick Start Guide

### 1. Clone the repository
```bash
git clone https://github.com/kripalsingh6/email-automation.git
cd email-automation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# Google OAuth 2.0 Credentials (from Google Cloud Console)
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:3001/auth/callback
GMAIL_REFRESH_TOKEN=

# Team Lead / Application Inbox (Where updates are received & reminders sent from)
TEAM_LEAD_EMAIL=thakurkripalsingh6@gmail.com

# Schedule (8:00 PM Monday through Friday)
CHECK_CRON=0 20 * * 1-5

PORT=3001
NODE_ENV=production
```

### 4. Run the Application

#### Development Mode (Frontend + Backend concurrently):
```bash
npm run dev:all
```
- Frontend Dashboard: `http://localhost:5173`
- Backend API: `http://localhost:3001`

#### Production Mode:
```bash
npm run build
npm start
```
The unified production server serves both the API and the React frontend on `http://localhost:3001`.

---

## 🔑 Google Cloud OAuth 2.0 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API** ([Direct Link](https://console.developers.google.com/apis/api/gmail.googleapis.com/overview)).
3. Under **APIs & Services > Credentials**, create an **OAuth 2.0 Client ID** (Web application).
4. Add Authorized Redirect URI:
   `http://localhost:3001/auth/callback`
5. Under **OAuth consent screen > Test users**, add your Team Lead Gmail address (e.g. `thakurkripalsingh6@gmail.com`).
6. Visit `http://localhost:3001/auth/google` (or click **"Connect Gmail"** on the dashboard) to authenticate.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Today's live compliance status and intern check results |
| `POST` | `/api/check` | Trigger an immediate inbox check & send reminders |
| `POST` | `/api/remind` | Send a reminder to a specific intern or missing group |
| `GET` | `/api/logs` | Historical check run audit logs |
| `GET` | `/api/logs/:runId` | Detailed results for a specific run ID |
| `GET` | `/api/employees` | List of active interns from `data/employees.json` |
| `GET` | `/api/scheduler` | Status of `node-cron` schedule and next run time |
| `GET` | `/auth/status` | Status of Gmail OAuth2 connection |
| `GET` | `/auth/google` | Initiates Google OAuth consent screen |
| `GET` | `/api/health` | Service health check |

---

## 📄 License
MIT
