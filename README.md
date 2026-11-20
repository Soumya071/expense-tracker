# Expense Tracker

A full-stack web app to track income and expenses, with monthly filtering and category-wise spending summary.

**Stack:** React (Vite), Node.js, Express, MySQL, JWT auth, bcrypt

## Features
- Register / login (passwords hashed with bcrypt, JWT sessions)
- Add and delete income / expense transactions
- Filter by month, or view all-time
- Totals for income, expenses, balance
- Category-wise spending bars
- Each user sees only their own data

## Setup

### 1. Database
Install MySQL, then run:
```
mysql -u root -p < backend/schema.sql
```

### 2. Backend
```
cd backend
cp .env.example .env     # then edit DB_PASSWORD and JWT_SECRET
npm install
npm start                # runs on http://localhost:5000
```

### 3. Frontend (new terminal)
```
cd frontend
npm install
npm run dev              # opens on http://localhost:5173
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/transactions?month=YYYY-MM | List transactions |
| POST | /api/transactions | Add transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/summary?month=YYYY-MM | Totals + category breakdown |

## Ideas to extend
Edit transaction, pie chart, CSV export, budget limits per category, deploy (Render + PlanetScale/Railway).
