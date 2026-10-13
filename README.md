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
│   │   ├── analyticsRoutes.js# /api/analytics/*
│   │   ├── companionRoutes.js# /api/companion/*
│   │   ├── mapRoutes.js      # /api/map/*
│   │   ├── trainApiRoutes.js # /api/train/*
│   │   ├── weatherRoutes.js  # /api/weather/*
│   │   ├── userRoutes.js     # /api/user/*
│   │   └── aiRoutes.js       # /api/ai/*
│   └── utils/
│       └── geo.js            # Haversine, interpolation, elevation
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

### 1. Install dependencies

```bash
# From the project root
npm run install-all
```

### 2. Start the backend & frontend together

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
| POST | `/api/user/register` | Register a new user (returns token) |
| POST | `/api/user/login` | Login (returns token) |
| GET | `/api/user/favorites` | List favourite trains *(Bearer token)* |
| POST | `/api/user/favorite` | Add favourite train *(Bearer token)* |
| DELETE | `/api/user/favorite` | Remove favourite train *(Bearer token)* |

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

# User registration & favorites
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav","email":"aarav@example.com","password":"secret"}'
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

## ✉️ Registration Confirmation Email

When a user successfully registers on the RailGaadi website, a professional
`Welcome to RailGaadi – Registration Successful` email is automatically sent to
the **same email address** used during registration.

### 🔐 Security
- The confirmation email **never includes the user's plain-text password**.
- Login uses the normal `/api/auth/login` flow; password recovery is handled
  via the app's secure "Forgot Password" process.
- Gmail credentials are read **only** from the server-side `.env` file, never
  from the React/frontend code.

### 📧 How it works
The reusable function `sendRegistrationConfirmation(user)` in
`server/utils/sendRegistrationConfirmation.js`:
- Accepts a `user` object — `{ name, email, userId, createdAt }`
- Uses **Nodemailer + Gmail SMTP** to send a branded, responsive HTML email
  (inline styles + table-based layout for Gmail, Outlook and mobile apps)
- Includes the RailGaadi name/logo, welcome message, account details
  (User ID, Name, Email, Registration date & time), a **Login to RailGaadi**
  button, the website link, a security reminder, support/contact info and a
  professional footer
- Returns `{ success: true, messageId }` on success, or
  `{ success: false, error }` on failure — it **never throws**, so a failed
  email never blocks a successful registration.

It is invoked automatically from `server/routes/authRoutes.js` in both the
MongoDB and in-memory registration paths.

### ⚙️ Setup (`.env`)
Create `server/.env` (see `server/.env.example`) with:

```dotenv
# Gmail that SENDS the confirmation emails
EMAIL_USER=yourgmail@gmail.com

# Gmail "App Password" (NOT your normal Gmail password)
# Create one at https://myaccount.google.com/apppasswords
EMAIL_PASS=your-16-char-app-password

# Public URL of the frontend (used in the Login button & links)
FRONTEND_URL=http://localhost:3000

# Support / contact email shown in the email footer
SUPPORT_EMAIL=support@railgaadi.com
```

> 💡 You must enable **2-Step Verification** on the Gmail account and generate
> an **App Password** for `EMAIL_PASS`. Your normal Gmail password will not work.

### 🛠️ Troubleshooting — "No confirmation email received"

If you register and the confirmation email doesn't arrive, the most common
cause is **invalid Gmail credentials** in `server/.env`:

1. **`EMAIL_USER` is a placeholder** — e.g. `youremail@gmail.com`. It must be
   your **real** Gmail address that sends the email.
2. **`EMAIL_PASS` is the wrong length** — a real Gmail **App Password is exactly
   16 characters**. If your value is a different length (e.g. 23), it is either
   your normal Gmail password or a placeholder. Gmail rejects it with
   `535-5.7.8 Username and Password not accepted` and **no email is sent**.
3. **App Password not generated** — Go to
   https://myaccount.google.com/apppasswords (after enabling **2-Step
   Verification**) and create an App Password for "Mail". Paste that 16-char
   code into `EMAIL_PASS`.

> The server now **verifies the SMTP connection** before sending, so a bad
> credential logs a clear `Gmail SMTP login REJECTED` error in the terminal
> instead of failing silently. Registration still succeeds regardless.

### 🧪 Testing
Register a new user via `POST /api/auth/register`:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav","email":"you@example.com","password":"secret"}'
```

If configured correctly, `you@example.com` receives the branded confirmation
email. If `EMAIL_USER`/`EMAIL_PASS` are missing, the server logs a warning and
registration still succeeds (no email is sent).

---

## 📝 Notes

- The app uses **mock data** (no external API keys required) to simulate live train data. The progress is deterministic per train number for consistent demo behavior.
- Maps use **CartoDB dark tiles** via Leaflet (free tier, no API key required).
- Weather and travel guide data are simulated for demo purposes.

---

Made with ❤️ for Indian Railways travellers.

