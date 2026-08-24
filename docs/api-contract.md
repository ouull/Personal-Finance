# Personal Finance API Contract

This document outlines the REST API contract for the Personal Finance cross-platform architecture (Web, iOS, Android).

## Base URL
`/api/v1`

## Authentication
All endpoints (except login) require a Bearer token in the `Authorization` header.

`Authorization: Bearer <access_token>`

## Error Handling
Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional validation details
}
```

## Endpoints

### Auth
- `POST /auth/login`
  - Body: `{ email, password, deviceInfo }`
  - Returns: `{ success, data: { accessToken, refreshToken, user } }`
- `POST /auth/refresh`
  - Body: `{ refreshToken }`
  - Returns: `{ success, data: { accessToken, refreshToken } }`
- `POST /auth/logout`
  - Body: `{ refreshToken }`

### Dashboard
- `GET /dashboard`
  - Returns: `{ netWorth, availableCash, investedCapital, receivables, monthlyIncome, monthlyExpense, topSpendingCategory, upcomingPayments, recentTransactions }`

### Accounts
- `GET /accounts`
- `POST /accounts`
- `GET /accounts/:id`
- `PATCH /accounts/:id`
- `DELETE /accounts/:id`

### Transactions
- `GET /transactions?limit=50&offset=0&type=EXPENSE`
- `POST /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`

### Quick Capture
- `POST /quick-capture`
  - Body: `{ amount, description, type, accountId?, categoryId?, date? }`
  - Notes: Falls back to default active account and default category if none provided.

### Categories
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Merchants
- `GET /merchants`
- `POST /merchants`
- `PATCH /merchants/:id`
- `DELETE /merchants/:id`

### Lending (Loans & Receivables)
- `GET /lending`
- `POST /lending`
- `GET /lending/:id`
- `POST /lending/:id/repayments`

### Investments
- `GET /investments`
- `POST /investments`
- `GET /investments/:id`
- `PATCH /investments/:id` (Update currentValue)
- `POST /investments/:id/transactions` (Add BUY/SELL etc.)

### Goals
- `GET /goals`
- `POST /goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `DELETE /goals/:id`

### Recurring Payments
- `GET /recurring`
- `POST /recurring`
- `GET /recurring/:id`
- `PATCH /recurring/:id`
- `DELETE /recurring/:id`
- `POST /recurring/:id/process`

### Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /notifications/read-all`

### Profile
- `GET /profile`
- `POST /profile/change-password`
