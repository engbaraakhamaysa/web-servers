# Web Servers

A REST API built with **TypeScript, Express.js, and PostgreSQL**.

The project implements user authentication, JWT-based authorization, refresh tokens, password hashing, database management with Drizzle ORM, and Chirp management.

## Features

- RESTful API with Express.js
- User registration and login
- Password hashing with Argon2
- JWT authentication
- Refresh token management
- User profile updates
- Create, read, and delete Chirps
- Chirp content validation
- API key authentication for webhooks
- PostgreSQL database with Drizzle ORM
- Database migrations
- Centralized error handling
- Request and response logging
- API metrics
- Health check endpoint

## Tech Stack

- **TypeScript**
- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Drizzle ORM**
- **JWT**
- **Argon2**
- **Vitest**

## API

| Method   | Endpoint               | Description            |
| -------- | ---------------------- | ---------------------- |
| `GET`    | `/api/healthz`         | Health check           |
| `POST`   | `/api/users`           | Create a user          |
| `PUT`    | `/api/users`           | Update user            |
| `POST`   | `/api/login`           | Login                  |
| `POST`   | `/api/refresh`         | Refresh access token   |
| `POST`   | `/api/revoke`          | Revoke refresh token   |
| `POST`   | `/api/chirps`          | Create a Chirp         |
| `GET`    | `/api/chirps`          | Get Chirps             |
| `GET`    | `/api/chirps/:chirpId` | Get a Chirp            |
| `DELETE` | `/api/chirps/:chirpId` | Delete a Chirp         |
| `POST`   | `/api/validate_chirp`  | Validate Chirp content |
| `POST`   | `/api/polka/webhooks`  | Handle upgrade webhook |
| `GET`    | `/admin/metrics`       | View server metrics    |
| `POST`   | `/admin/reset`         | Reset development data |

## Getting Started

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file with the required database and API configuration.

### Run database migrations

```bash
npm run db:migrate
```

### Start the server

```bash
npm run dev
```

### Build the project

```bash
npm run build
```

### Run tests

```bash
npm test
```

## Project Structure

```text
web-servers/
├── src/
│   ├── db/
│   ├── app/
│   ├── auth.ts
│   ├── config.ts
│   └── index.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Purpose

This project was built as part of my backend development training, with a focus on building REST APIs, authentication, database integration, and server-side development using TypeScript.
