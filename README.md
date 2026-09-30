# 🚀 Web Servers

A REST API built with **TypeScript, Express.js, and PostgreSQL**.

This project implements user authentication, JWT-based authorization, refresh tokens, password hashing, database management with Drizzle ORM, and Chirp management.

## ✨ Features

- 👤 User registration and login
- 🔐 JWT authentication and authorization
- 🔄 Refresh token management
- 🔑 Password hashing with Argon2
- 👥 User profile updates
- 🐦 Create, read, and delete Chirps
- 🧹 Chirp content validation
- 🔗 API key authentication for webhooks
- 🗄️ PostgreSQL database integration
- 🧩 Drizzle ORM and database migrations
- ⚠️ Centralized error handling
- 📋 Request and response logging
- 📊 API metrics
- ❤️ Health check endpoint

## 🛠️ Tech Stack

- **TypeScript**
- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Drizzle ORM**
- **JWT**
- **Argon2**
- **Vitest**

## 🔌 API Endpoints

|  Method  | Endpoint               | Description               |
| :------: | ---------------------- | ------------------------- |
|  `GET`   | `/api/healthz`         | ❤️ Health check           |
|  `POST`  | `/api/users`           | 👤 Create a user          |
|  `PUT`   | `/api/users`           | ✏️ Update user            |
|  `POST`  | `/api/login`           | 🔐 Login                  |
|  `POST`  | `/api/refresh`         | 🔄 Refresh access token   |
|  `POST`  | `/api/revoke`          | 🚫 Revoke refresh token   |
|  `POST`  | `/api/chirps`          | 🐦 Create a Chirp         |
|  `GET`   | `/api/chirps`          | 📋 Get Chirps             |
|  `GET`   | `/api/chirps/:chirpId` | 🔎 Get a Chirp            |
| `DELETE` | `/api/chirps/:chirpId` | 🗑️ Delete a Chirp         |
|  `POST`  | `/api/validate_chirp`  | 🧹 Validate Chirp content |
|  `POST`  | `/api/polka/webhooks`  | 🔗 Handle upgrade webhook |
|  `GET`   | `/admin/metrics`       | 📊 View server metrics    |
|  `POST`  | `/admin/reset`         | ♻️ Reset development data |

## 🚀 Getting Started

### 1. 📦 Install Dependencies

```bash
npm install
```

### 2. ⚙️ Configure Environment Variables

Create a `.env` file with the required database and API configuration.

### 3. 🗄️ Run Database Migrations

```bash
npm run db:migrate
```

### 4. ▶️ Start the Server

```bash
npm run dev
```

### 5. 🏗️ Build the Project

```bash
npm run build
```

### 6. 🧪 Run Tests

```bash
npm test
```

## 📁 Project Structure

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
