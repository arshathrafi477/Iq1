# OTP Backend

A lightweight Node.js/Express service for generating, emailing, and verifying one-time passwords (OTPs).

---

## Features

- Cryptographically secure OTP generation (`crypto.randomInt` — no modulo bias)
- Email delivery via Nodemailer (SMTP)
- Configurable length (4–10 digits) and expiry window
- Brute-force protection (max 5 attempts per OTP)
- Single-use invalidation on successful verification

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env` and fill in your values:

```bash
cp .env .env.local
```

| Variable              | Description                              | Default  |
|-----------------------|------------------------------------------|----------|
| `PORT`                | HTTP port                                | `3000`   |
| `EMAIL_HOST`          | SMTP host (e.g. `smtp.gmail.com`)        | —        |
| `EMAIL_PORT`          | SMTP port                                | `587`    |
| `EMAIL_SECURE`        | `true` for port 465, `false` for STARTTLS| `false`  |
| `EMAIL_USER`          | SMTP username / sender address           | —        |
| `EMAIL_PASS`          | SMTP password or app password            | —        |
| `EMAIL_FROM`          | Display name + address in From header    | —        |
| `OTP_LENGTH`          | Digits in OTP (4–10)                     | `6`      |
| `OTP_EXPIRY_MINUTES`  | Minutes before OTP expires               | `10`     |

> **Gmail tip:** enable 2FA and use an [App Password](https://myaccount.google.com/apppasswords) as `EMAIL_PASS`.

### 3. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

### `POST /api/otp/send`

Generates an OTP and sends it to the given email.

**Request body**
```json
{ "email": "user@example.com" }
```

**Responses**

| Status | Meaning |
|--------|---------|
| `200`  | OTP sent successfully |
| `400`  | Missing or invalid email |
| `500`  | Server / SMTP error |

---

### `POST /api/otp/verify`

Verifies an OTP submitted by the user.

**Request body**
```json
{ "email": "user@example.com", "otp": "382910" }
```

**Responses**

| Status | Meaning |
|--------|---------|
| `200`  | OTP is valid — user verified |
| `400`  | Missing fields / wrong OTP / expired OTP |
| `429`  | Too many failed attempts — OTP invalidated |

---

## Project Structure

```
otp-backend/
├── routes/
│   └── otpRoutes.js        # Route definitions
├── controllers/
│   └── otpController.js    # Request handlers + in-memory OTP store
├── services/
│   └── emailService.js     # Nodemailer transport + send helper
├── utils/
│   └── generateOtp.js      # Secure OTP generation
├── server.js               # App entry point
├── package.json
└── .env                    # Environment variables (never commit this)
```

---

## Production Notes

- **Replace the in-memory store** (`Map`) with Redis so OTPs survive server restarts and work across multiple instances.
- **Rate-limit** `/api/otp/send` (e.g. `express-rate-limit`) to prevent OTP flooding.
- **HTTPS only** — never send OTPs over plain HTTP in production.
