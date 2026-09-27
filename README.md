# 📧 Email Automation & Performance Analytics

> **Task 1:** Automated Daily Report Email Checker with Gmail API + Reminder System  
> **Task 2:** Performance Dashboard with Chart.js + ML Analytics (Regression & Clustering)

---

## 🚀 Live Demo

- **GitHub:** [github.com/kripalsingh6/email-automation](https://github.com/kripalsingh6/email-automation)
- **Live:** Deployed on Vercel / your hosting

---

## ✨ Features

### Task 1 — Email Automation
- **Automated 8:00 PM Weekday Check** — cron job scans Gmail inbox for daily task update emails from interns
- **Smart Email Parsing** — matches emails by sender, date, and subject pattern (fuzzy matching)
- **Automatic Reminder Emails** — sends styled HTML reminder to interns who haven't submitted
- **Google OAuth 2.0** — one-time Gmail authentication, tokens persisted for subsequent runs
- **SQLite Database** — stores check runs, results, and reminder logs
- **Real-time Dashboard** — shows live compliance status, employee cards, filter/search

### Task 2 — Performance Dashboard
- **Daily / Weekly / Monthly Trends** — toggle time granularity for performance metrics
- **7 Interactive Charts** (Chart.js + react-chartjs-2):
  - 📈 Rating Trends with Linear Regression Predictions
  - 📊 Completion Rate & Task Volume Bar Chart
  - 👥 Employee Comparison Line Chart
  - 🎯 Performance Radar (multi-dimensional)
  - 🍩 Work Category Distribution (Doughnut)
  - 🍩 Task Severity Distribution (Doughnut)
- **ML: Linear Regression** — predicts performance trend direction with R² score
- **ML: K-Means Clustering** — classifies employees into 3 tiers:
  - 🟢 Top Performer
  - 🟡 Mid Performer
  - 🔴 Needs Improvement
- **Performance Leaderboard** — ranked table with composite score, ratings, completion %

---

## 🏗 Architecture

```
email-automation/
├── client/                 # Vite + React + TailwindCSS frontend
│   └── src/
│       ├── components/     # Dashboard, Header, PerformanceDashboard, etc.
│       ├── hooks/          # useApi hook for server communication
│       ├── types/          # TypeScript interfaces
│       └── utils/          # ml-analytics.ts (regression, clustering, aggregation)
├── server/                 # Express v5 backend
│   ├── config/             # Environment configuration
│   ├── db/                 # SQLite (better-sqlite3) connection, migrations, queries
│   ├── middleware/         # Logging, error handling
│   ├── routes/             # API routes (status, check, remind, reports, auth)
│   ├── services/           # Gmail, Checker, Reminder, Scheduler services
│   ├── types/              # Server-side types
│   └── utils/              # Date, parser, email template utilities
├── data/
│   ├── employees.json      # Active intern roster
│   └── daily-reports.json  # Daily work report data (simulated Excel data)
└── .env                    # Gmail OAuth credentials + config
```

---

## 🛠 Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Frontend   | React 19, Vite 8, TailwindCSS 4, Chart.js 4       |
| Backend    | Express 5, TypeScript, SQLite (better-sqlite3)     |
| Auth       | Google OAuth 2.0, Gmail API (googleapis)           |
| Scheduler  | node-cron (weekdays 8:00 PM IST)                   |
| ML         | Custom Linear Regression + K-Means (pure TS, zero deps) |
| Icons      | Lucide React                                       |

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Google Cloud project with Gmail API enabled

### 1. Clone & Install

```bash
git clone https://github.com/kripalsingh6/email-automation.git
cd email-automation
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your Google OAuth credentials:
# GMAIL_CLIENT_ID=
# GMAIL_CLIENT_SECRET=
# GMAIL_REDIRECT_URI=http://localhost:3001/auth/callback
# TEAM_LEAD_EMAIL=thakurkripalsingh6@gmail.com
```

### 3. Run Development

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend dev server
npm run dev

# Or run both together:
npm run dev:all
```

### 4. Connect Gmail
Navigate to `http://localhost:5173`, click "Connect Gmail" → complete OAuth flow → tokens auto-saved.

### 5. Build for Production

```bash
npm run build
npm run start   # Serves both API + frontend from port 3001
```

---

## 📊 ML Methodology

### Linear Regression (Trend Prediction)
- **Input:** Time-indexed manager ratings
- **Method:** Ordinary Least Squares (OLS) regression
- **Output:** Trend direction (improving / stable / declining), R² goodness of fit, next 3 period predictions
- **Implementation:** Pure TypeScript, no external ML libraries

### K-Means Clustering (Performance Tiers)
- **Features:** Performance score, manager rating, completion rate, deadline adherence
- **Initialization:** K-Means++ for stable centroid selection
- **K:** 3 clusters → mapped to tier labels by average cluster score
- **Output:** Each employee assigned a tier (Top / Mid / Needs Improvement)

### Composite Performance Score
```
Score = (Manager Rating × 5)     // 50% weight
      + (Completion Rate × 0.2)   // 20% weight
      + (Deadline Rate × 0.2)     // 20% weight
      + (Tasks/Day × 2.5)         // 10% weight
```

---

## 📄 API Endpoints

| Method | Path                | Description                                |
| ------ | ------------------- | ------------------------------------------ |
| GET    | `/api/health`       | Server health check                        |
| GET    | `/api/status`       | Today's compliance status                  |
| POST   | `/api/check`        | Trigger manual inbox check + reminders     |
| POST   | `/api/remind`       | Send reminder to specific employee         |
| GET    | `/api/logs`         | Historical check runs                      |
| GET    | `/api/employees`    | Active intern roster                       |
| GET    | `/api/reports`      | Daily report data for Performance Dashboard|
| GET    | `/api/scheduler`    | Cron scheduler status                      |
| GET    | `/auth/google`      | Start Gmail OAuth flow                     |
| GET    | `/auth/callback`    | OAuth callback handler                     |

---

## 👤 Author

**Kripal Singh Thakur**  
[github.com/kripalsingh6](https://github.com/kripalsingh6)
