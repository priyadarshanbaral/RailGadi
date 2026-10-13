# 🚂 RailGaadi

**Live Train Tracking & Journey Companion** — A premium full-stack application for tracking Indian Railways trains in real-time, exploring immersive journey maps, analyzing journey data, and accessing a smart travel companion.

---

## ✨ Features

### 1. Live Train Tracking
- Search by Train Number or Train Name
- Live train location, current station & next station
- Running status (On Time / Delayed)
- ETA to upcoming stations
- Distance covered & remaining
- Journey progress indicator
- Last live update timestamp
- Auto refresh (30s toggle)
- Share live journey link

### 2. Immersive Journey Map
- Full-screen interactive India map (dark theme)
- Smooth animated train marker
- Complete railway route visualization
- Completed vs remaining route
- Current station highlight
- Camera follow train mode
- Zoom, rotate & pitch controls
- Route glow animation

### 3. Journey Analytics
- Journey completion percentage
- Live delay analysis
- Distance analytics
- Elevation profile along route
- Highest elevation reached
- Travel timeline
- Station arrival history
- Journey statistics dashboard

### 4. Smart Travel Companion
- Current / next / destination weather
- Temperature, humidity & wind
- Rain forecast
- Nearby rivers, lakes & mountains
- Tourist attractions
- Local food recommendations
- Hotel & stay suggestions
- Emergency contacts & helplines
- Medical facilities, ATM & fuel
- Local transport options
- Safety alerts & travel tips

### 5. Premium User Experience
- Glassmorphism interface
- Fluid micro-animations (Framer Motion)
- Animated counters
- Skeleton loading states
- Smooth page transitions
- Responsive mobile experience
- Recent searches & favourite trains

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, React Router, Framer Motion, Leaflet, Recharts |
| Backend   | Node.js, Express |
| Styling   | CSS (Glassmorphism, dark theme) |

---

## 📁 Project Structure

```
REALGADI/
├── package.json              # Root scripts (concurrently)
├── server/                   # Node.js backend
│   ├── index.js              # Express server (port 5000)
│   ├── data/
│   │   ├── trains.js         # Train database
│   │   ├── stations.js       # Station coordinates & elevations
│   │   └── routes.js         # Route polylines, geo features, guides
│   ├── routes/
│   │   ├── trainRoutes.js    # /api/trains/*
│   │   ├── otpRoutes.js      # /api/otp/*
│   │   ├── analyticsRoutes.js# /api/analytics/*
│   │   ├── companionRoutes.js# /api/companion/*
│   │   ├── mapRoutes.js      # /api/map/*
│   │   ├── trainApiRoutes.js # /api/train/*
│   │   ├── weatherRoutes.js  # /api/weather/*
│   │   ├── userRoutes.js     # /api/user/*
│   │   ├── authRoutes.js     # /api/auth/*
│   │   └── aiRoutes.js       # /api/ai/*
│   └── utils/
│       ├── geo.js            # Haversine, interpolation, elevation
│       ├── twilioVerify.js   # Twilio Verify REST integration
│       ├── authToken.js      # Signed, expiring JWTs
│       └── passwords.js      # scrypt password hashing
└── client/                   # React frontend
    ├── vite.config.js        # Proxy /api -> localhost:5000
    └── src/
        ├── App.jsx           # Router
        ├── api/client.js     # API service
        ├── context/          # Global state (recent, favourites)
        ├── components/       # UI components
        ├── pages/            # Home, TrainPage, RouteMap
        └── styles/           # Global CSS
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Twilio account with a Verify service configured for SMS

### 1. Install dependencies

```bash
# From the project root
npm run install-all
```

### 2. Configure Twilio Verify SMS

Copy `server/.env.example` to `server/.env`. Configure MongoDB, a unique
`JWT_SECRET` (at least 32 random characters), and a Twilio Verify service with
SMS enabled. Put the Twilio Account SID, Auth Token, and Verify Service SID in
the server environment only. Never put these secrets in `client/.env` or commit
them. Confirm that India is enabled in Twilio's destination/Geo Permissions
settings and comply with any account, sender, and local regulatory requirements
shown in Twilio Console. The server reports missing or placeholder values at
startup; OTP endpoints return a configuration error until valid values exist.

Twilio Verify generates, sends, expires, and checks the OTP. RailGaadi does not
store or return OTP values. The sign-up form defaults to India (+91), but also
supports several other country calling codes.

### 3. Start the backend & frontend together

```bash
npm run dev
```

- **Backend API**: http://localhost:5000
- **Frontend app**: http://localhost:3000

### Run separately

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

---

## 🔌 API Endpoints

### Legacy Feature APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/trains/all` | List all trains |
| GET | `/api/trains/search?q=` | Search trains |
| GET | `/api/trains/:number` | Live tracking detail |
| GET | `/api/map/:number` | Immersive map data |
| GET | `/api/analytics/:number` | Journey analytics |
| GET | `/api/companion/:number` | Travel companion data |

### REST API Spec

#### `/api/train`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/train/search?q=` | Search train by number/name |
| GET | `/api/train/live/:trainNumber` | Live train location & running status |
| GET | `/api/train/route/:trainNumber` | Complete railway route (polyline + stations) |
| GET | `/api/train/stations/:trainNumber` | Station arrival history |
| GET | `/api/train/analytics/:trainNumber` | Journey analytics dashboard |

#### `/api/weather`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/current?station=CODE` | Current weather at a station |
| GET | `/api/weather/forecast?station=CODE` | 5-day forecast for a station |
| GET | `/api/weather/route-weather?trainNumber=NUM` | Weather for every station on a route |

#### `/api/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/register` | Disabled; registration requires SMS OTP verification |
| POST | `/api/user/login` | Login (returns token) |
| POST | `/api/user/forgot-password` | Disabled; password recovery requires verified phone OTP |
| GET | `/api/user/favorites` | List favourite trains *(Bearer token)* |
| POST | `/api/user/favorite` | Add favourite train *(Bearer token)* |
| DELETE | `/api/user/favorite` | Remove favourite train *(Bearer token)* |

#### `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send a registration verification code by SMS |
| POST | `/api/auth/verify-otp` | Verify the SMS code and create the account |
| POST | `/api/auth/resend-otp` | Resend the SMS verification code |
| POST | `/api/auth/login` | Login with the registered email and password |

#### `/api/otp`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send a Twilio Verify SMS to a valid E.164 mobile number |
| POST | `/api/otp/verify` | Verify the code, then create the account or log in the verified phone account |

`/api/auth/send-otp` and `/api/auth/verify-otp` remain as compatible aliases.
Send accepts `{ "phone": "+919876543210" }`; for new accounts also send
`name`, `email`, and `password`. Verify accepts `phone` and `otp`; new-account
verification additionally requires `name`, `email`, and `password`. If the
number is already registered, a correct OTP logs that account in and ignores
registration details. Phone numbers must be international E.164 numbers; the
API also normalizes an Indian 10-digit number to +91.

For password recovery, call `/api/otp/send` with
`{"phone":"+919876543210","purpose":"password-reset"}`, then call
`/api/otp/verify` with that phone, the SMS `otp`, and `newPassword`. The server
uses the purpose attached to the pending verification and only changes the
password after Twilio approves the code; the legacy email-only reset endpoint
is disabled.

#### `/api/ai`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/assistant` | Smart travel assistant reply |

### Example calls

```bash
# Train search
curl "http://localhost:5000/api/train/search?q=rajdhani"

# Live location
curl "http://localhost:5000/api/train/live/12301"

# Complete route
curl "http://localhost:5000/api/train/route/12301"

# Station history
curl "http://localhost:5000/api/train/stations/12301"

# Journey analytics
curl "http://localhost:5000/api/train/analytics/12301"

# Weather
curl "http://localhost:5000/api/weather/current?station=NDLS"
curl "http://localhost:5000/api/weather/forecast?station=NDLS"
curl "http://localhost:5000/api/weather/route-weather?trainNumber=12301"

# Request a Twilio Verify session (the API sends the real SMS)
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","name":"Aarav","email":"aarav@example.com","password":"secret"}'

# Verify the received code and create the account
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","name":"Aarav","email":"aarav@example.com","password":"secret","otp":"123456"}'

# Existing phone account: send OTP, then verify without registration details
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}'

# User favorites
curl -X POST http://localhost:5000/api/user/favorite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"trainNumber":"12301"}'

# AI assistant
curl -X POST http://localhost:5000/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the status of train 12301?"}'
```

---

## 🧪 Try It

1. Open http://localhost:3000
2. Search for train `12301` (Howrah Rajdhani Express) or click any train card
3. Explore the 4 tabs: **Live Status**, **Journey Map**, **Analytics**, **Companion**
4. Open the **fullscreen map** for the immersive experience

---

## 📱 OTP testing in Postman

1. Start with valid server-side Twilio and MongoDB settings. Make a `POST` to
   `http://localhost:5000/api/otp/send`, with JSON body
   `{"phone":"+919876543210","name":"Aarav","email":"aarav@example.com","password":"a-long-password"}`.
   A successful HTTP response confirms Twilio accepted the request, not that
   the recipient handset received the SMS.
2. Enter the actual SMS code in a `POST` to `/api/otp/verify` using the same
   phone and the received six-digit `otp`. A new number creates a MongoDB user;
   a phone already on an account logs that account in.
3. Send a wrong six-digit value to verify; expect HTTP 401. After five failed
   checks for a phone, the endpoint blocks further checks until a new code is
   sent.
4. To test expiry, wait until the configured Twilio Verify code validity period
   passes, then verify the old code; Twilio must reject it.
5. Try malformed values such as `123` or `not-a-phone`; expect HTTP 400 and no
   SMS request.
6. Resend immediately; expect HTTP 429 during the 30-second cooldown. The
   server also limits sends to five per IP per hour and checks to ten per IP
   per ten minutes. These counters are in-memory per server process; Twilio
   also applies its own service limits.
7. Check the returned user has the verified phone and that a successful
   response includes a signed, expiring token. With MongoDB enabled, confirm
   one user exists for that phone and a unique index prevents duplicate
   accounts. Email/password login remains available at `/api/auth/login`.

For a Postman request, select **Body → raw → JSON** and set
`Content-Type: application/json`. Use the same E.164 phone on send and verify.
Never include Twilio credentials or real OTP codes in shared Postman
collections or logs.

## 🚀 Deployment

- Deploy the `server/` app with `MONGODB_URI`, `JWT_SECRET`,
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
  `TWILIO_VERIFY_SERVICE_SID` set as private hosting-platform environment
  variables. Set `NODE_ENV=production`.
- Use a MongoDB Atlas URI with network access restricted to the backend host.
  Do not deploy with the in-memory fallback: it loses accounts on restart.
- Set `FRONTEND_URL` and/or comma-separated `CORS_ORIGINS` to the exact
  production frontend origin(s), including `https://`. The backend's public URL
  must use HTTPS.
- If deployed behind a trusted reverse proxy, set `TRUST_PROXY_HOPS` to the
  number of trusted proxy hops so IP-based OTP limits use the client address.
- Deploy the `client/` app separately or behind a frontend host. Set the
  public build-time `VITE_API_URL` to the backend API base, for example
  `https://api.example.com/api`. This variable must contain no secrets.
- Configure the Twilio Verify SMS service, permitted destination countries,
  billing, and any required India registration in Twilio Console. Test a real
  SMS and approved verification after deployment; do not consider the flow
  live until both succeed.
- Use HTTPS for the frontend and API. Rotate credentials immediately if they
  are ever exposed, and keep all `.env` files outside source control.

---

## 📝 Notes

- The app uses **mock data** (no external API keys required) to simulate live train data. The progress is deterministic per train number for consistent demo behavior.
- Maps use **CartoDB dark tiles** via Leaflet (free tier, no API key required).
- Weather and travel guide data are simulated for demo purposes.

---

Made with ❤️ for Indian Railways travellers.
