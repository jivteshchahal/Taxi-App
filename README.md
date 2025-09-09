# Taxi Booking

A small production-ready Taxi Booking web app built with Node.js, Express, EJS, Tailwind (via CLI), and Nodemailer.

## Features

- Booking form with server-side validation and accessible UI
- Honeypot field and lightweight rate limiting
- Emails booking to admin, optional CC to customer
- Friendly error handling; hides stack traces in production
- Helmet, CORS, morgan, dotenv configuration

## Requirements

- Node.js >= 18

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file and configure:

   ```bash
   cp .env.example .env
   # Edit .env and set SMTP_* and ADMIN_EMAIL
   ```

   For local testing, you can use a test SMTP provider like Mailtrap (https://mailtrap.io/).

3. Run in development (Tailwind watch + nodemon):

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000

4. Build CSS for production:

   ```bash
   npm run build:css
   ```

5. Start in production:

   ```bash
   npm start
   ```

## Environment Variables

Required:

- `PORT` (default 3000)
- `NODE_ENV` (`development` or `production`)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` or `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `ADMIN_EMAIL`
- `BOOKING_CC_CUSTOMER` (`true` or `false`)

Optional for Canva integration:

- `CANVA_CLIENT_ID`
- `CANVA_CLIENT_SECRET`
- `CANVA_REDIRECT_URI` (e.g., `http://localhost:3000/auth/canva/callback`)
- `SESSION_SECRET`

The server fails fast if any required SMTP or admin email variables are missing.

## Canva Integration

1. Create a Canva developer account and register an application to obtain your OAuth client ID and secret.
2. Add `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REDIRECT_URI`, and `SESSION_SECRET` to your `.env`.
3. Use the "Import from Canva" button on the home page to begin the OAuth flow and fetch designs.

## Notes

- No secrets are logged. Avoid printing SMTP credentials anywhere.
- The in-memory rate limiter is for single-instance deployments; use a shared store for horizontal scaling.

