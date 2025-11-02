# Predict Frank

This project contains a lightweight match prediction API with complementary React Native screens for login, viewing upcoming fixtures, and submitting line-ups.

## Getting started

Install dependencies (none required) and run the development server:

```bash
npm run dev
```

The API listens on port `3000` by default and exposes the following endpoints:

- `POST /api/auth/login`
- `GET /api/matches`
- `GET /api/matches/:id/prediction`
- `POST /api/matches/:id/prediction`

## Running tests

Unit and integration tests are powered by the Node.js test runner:

```bash
npm test
```

The suite covers validation helpers (duplicate players, roster checks, kickoff lock) and end-to-end prediction submission flows including authentication.

## Frontend reference screens

The `app/screens` directory includes React Native components demonstrating how to:

- Authenticate users (`Login.tsx`)
- Fetch and display upcoming fixtures (`Matches.tsx`)
- Build a prediction form with roster selection and formation helper (`PredictionForm.tsx`)

These screens consume the REST API directly and can be wired into an Expo or React Native navigation stack as needed.
