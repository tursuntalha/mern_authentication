# MERN Stack Authentication — Full Stack Auth System

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

A production-ready full-stack authentication system using the MERN stack. Built with a focus on security — JWT tokens are stored in HTTP-only cookies to prevent XSS attacks, and all sensitive routes are protected by server-side middleware.

---

## Why This Approach?

| Decision | Reason |
|----------|--------|
| **HTTP-only cookies for JWT** | Prevents JavaScript from accessing the token — stops XSS-based token theft |
| **Stateless JWT (no sessions)** | No server-side session storage needed — scales horizontally |
| **bcrypt password hashing** | Industry-standard adaptive hashing with configurable work factor |
| **Protected route middleware** | Token verification happens at the API layer, not just the frontend |

---

## Architecture

```
┌───────────────────────────────────────┐
│          React Frontend               │
│           localhost:3000              │
│  ─ Auth context (useContext)         │
│  ─ ProtectedRoute component          │
└─────────────────┬─────────────────────┘
                  │  Axios + HTTP-only Cookie
┌─────────────────▼─────────────────────┐
│         Express REST API              │
│           localhost:4000              │
│  ┌─────────────────────────────────┐  │
│  │  protect middleware             │  │
│  │  Reads cookie → verifies JWT   │  │
│  └─────────────────────────────────┘  │
└─────────────────┬─────────────────────┘
                  │
┌─────────────────▼─────────────────────┐
│               MongoDB                 │
│       Users collection (bcrypt)       │
└───────────────────────────────────────┘
```

---

## Features

- Register with email + password (bcrypt hashed)
- Login returns JWT stored in `HttpOnly; Secure` cookie
- Logout clears the cookie server-side
- `protect` middleware guards all private endpoints
- React frontend with auth state managed via Context API

---

## API Endpoints

| Method | Endpoint              | Description              | Auth Required |
|--------|-----------------------|--------------------------|:-------------:|
| POST   | `/api/auth/register`  | Create new user account  | No            |
| POST   | `/api/auth/login`     | Authenticate + set cookie | No            |
| POST   | `/api/auth/logout`    | Clear auth cookie        | Yes           |
| GET    | `/api/auth/profile`   | Get current user profile | Yes           |

---

## Environment Variables

Create `backend/.env`:

| Variable      | Description                 | Example             |
|---------------|-----------------------------|---------------------|
| `PORT`        | Backend server port         | `4000`              |
| `MONGO_URI`   | MongoDB connection string   | `mongodb+srv://...` |
| `JWT_SECRET`  | Secret for signing tokens   | `your_secret_here`  |

---

## Prerequisites

- Node.js v18+
- MongoDB — local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## Installation & Running

```bash
git clone https://github.com/tursuntalha/mern_authentication.git
cd mern_authentication

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

```bash
# Terminal 1 — API
cd backend && npm start

# Terminal 2 — React app
cd frontend && npm start
```

---

## Project Structure

```
mern_authentication/
├── backend/
│   ├── controllers/    # Register, login, logout, profile handlers
│   ├── middleware/      # protect — JWT cookie verification
│   ├── models/         # User schema (email, password hash)
│   ├── routes/         # /api/auth router
│   └── server.js
└── frontend/
    └── src/
        ├── components/ # Login, Register, Profile components
        ├── context/    # AuthContext — global auth state
        └── screens/    # Page-level components
```
