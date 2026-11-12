# 🌍 DisasterReady

### Gamified Disaster Preparedness and Emergency Response Training

DisasterReady is an AI-powered disaster preparedness training platform that teaches users how to respond to emergency situations through interactive Unity 2D simulations, backend-evaluated decision making, and Gemini AI-generated performance feedback.

---

## 🎯 Problem Statement

Many people lack practical knowledge about how to respond during natural disasters. Traditional awareness programs rely on passive learning, making it difficult to retain the correct actions during real emergencies.

DisasterReady addresses this gap through interactive disaster simulations, real-time scoring, and personalised AI feedback delivered directly in a web browser.

---

## ✅ Implemented Features

### Frontend (React Portal)
- Landing page with platform introduction
- User registration and login with form validation
- Protected dashboard showing live stats fetched from PostgreSQL
- Live leaderboard showing top 10 trainees ranked by points
- Fully embedded Unity 2D earthquake simulation at `/play/earthquake`
- Secure in-memory authentication bridge between React and Unity
- Auto-refresh of dashboard stats after game completion
- Responsive design across desktop and tablet

### Backend (Node.js + Express)
- User registration with bcrypt password hashing
- JWT-based login and protected route authentication
- Disaster scenario listing and detail retrieval
- Server-side answer evaluation and score calculation
- Attempt submission and history tracking
- User total points persistence and automatic increment
- Top 10 leaderboard endpoint
- Gemini AI feedback generation service

### Unity 2D Earthquake Simulation
- 3-stage earthquake decision scenario
- Character animations and 2D environment interactions
- Decision UI with timed response handling
- Backend attempt submission after scenario completion
- Gemini AI result display in-game
- WebGL web build integrated into the React portal
- Seamless JWT session handoff from React to Unity (no double login)

---

## 🛠️ Technology Stack

| Component       | Technology                      |
|-----------------|---------------------------------|
| Frontend        | React 18, Vite, React Router    |
| Styling         | Custom CSS, Lucide React icons  |
| HTTP Client     | Axios                           |
| Backend         | Node.js, Express.js 5           |
| Database        | PostgreSQL                      |
| ORM             | Prisma ORM v7 with PrismaPg     |
| Authentication  | JWT, bcrypt                     |
| AI Integration  | Google Gemini API               |
| Game Engine     | Unity 6 (6000.6.7f1) — 2D      |
| Unity Web Build | Unity WebGL / WebAssembly       |
| Version Control | Git, GitHub                     |

---

## 🏗️ Project Architecture

```
DisasterReady/
│
├── Assets/                          ← Unity project source
│   ├── Plugins/
│   │   └── WebGL/
│   │       └── DisasterReadyBridge.jslib   ← Unity → React event bridge
│   ├── Resources/
│   │   ├── Audio/
│   │   └── Sprites/
│   ├── Scenes/
│   │   └── SampleScene.unity
│   └── Scripts/
│       ├── Audio/
│       ├── Backend/
│       │   ├── ApiClient.cs         ← HTTP calls to Express backend
│       │   └── AuthManager.cs       ← JWT auth + SetWebSession() bridge
│       ├── Character/
│       ├── Core/
│       │   ├── Bootstrap.cs
│       │   ├── GameLayoutManager.cs
│       │   └── GameManager.cs
│       ├── Editor/
│       │   └── WebGLBuilder.cs      ← One-click WebGL build menu command
│       ├── Scenario/
│       │   └── ScenarioRunner.cs    ← Gameplay logic + attempt submission
│       ├── UI/
│       └── Views/
│
├── backend/                         ← Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                ← Prisma singleton with PrismaPg adapter
│   │   │   └── gemini.js            ← Gemini API client
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── attempt.controller.js
│   │   │   ├── attemptHistory.controller.js
│   │   │   ├── leaderboard.controller.js
│   │   │   └── scenario.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   ← JWT verification
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   └── services/
│   │       └── gemini.service.js
│   ├── .env                         ← Local only, never commit
│   ├── package.json
│   └── server.js
│
├── frontend/                        ← React + Vite portal
│   ├── public/
│   │   └── unity/
│   │       └── earthquake/
│   │           └── Build/           ← Unity WebGL build output
│   │               ├── earthquake.loader.js
│   │               ├── earthquake.framework.js
│   │               ├── earthquake.data
│   │               └── earthquake.wasm
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      ← Global auth state + token management
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   └── PlayGamePage.jsx     ← Unity WebGL host + auth bridge
│   │   ├── styles/
│   │   │   ├── theme.css
│   │   │   └── index.css
│   │   └── utils/
│   │       ├── api.js               ← Axios instance with auth interceptor
│   │       └── storage.js
│   ├── .env                         ← Local only, never commit
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** running locally
- **Git**
- **Unity Hub** with Unity 6 (6000.6.7f1) installed (required only to rebuild the WebGL game)

---

### 1. Clone the Repository

```bash
git clone https://github.com/iswekshasingh/DisasterReady.git
cd DisasterReady
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=4000
NODE_ENV=development

DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/disasterready?schema=public"

JWT_SECRET="your_long_random_secret_here"

GEMINI_API_KEY="your_gemini_api_key_here"
```

> **Never commit your `.env` file.** It is listed in `.gitignore`.
>
> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/).

**Run database migrations:**

```bash
npx prisma migrate dev
```

**Seed the earthquake scenario:**

```bash
npm run prisma:seed
```

**Start the backend:**

```bash
npm run dev
```

The API will be available at `http://localhost:4000`.
Verify it is running: `http://localhost:4000/api/health`

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

**Start the frontend:**

```bash
npm run dev
```

The website will be available at `http://localhost:5173`.

---

## 🌐 Application Pages

| Route              | Access      | Description                                 |
|--------------------|-------------|---------------------------------------------|
| `/`                | Public      | Landing page                                |
| `/signup`          | Guest only  | User registration                           |
| `/login`           | Guest only  | User login                                  |
| `/dashboard`       | Authenticated | Stats, points, level, Play Now button     |
| `/leaderboard`     | Public      | Top 10 trainees by total points             |
| `/play/earthquake` | Authenticated | Unity 2D earthquake simulation in browser |

---

## 🔌 Backend API Endpoints

| Method | Endpoint             | Auth Required | Description                       |
|--------|----------------------|---------------|-----------------------------------|
| GET    | `/api/health`        | No            | Server health check               |
| POST   | `/api/auth/register` | No            | Register a new user               |
| POST   | `/api/auth/login`    | No            | Login and receive JWT             |
| GET    | `/api/auth/me`       | Yes           | Get the authenticated user        |
| GET    | `/api/scenarios`     | No            | List all published scenarios      |
| GET    | `/api/scenarios/:id` | No            | Get a specific scenario           |
| POST   | `/api/attempts`      | Yes           | Submit answers and calculate score|
| GET    | `/api/attempts`      | Yes           | Get current user's attempt history|
| GET    | `/api/leaderboard`   | No            | Top 10 users by total points      |

**Protected endpoints require a Bearer token:**

```
Authorization: Bearer <your_jwt_token>
```

### Key request / response shapes

**POST `/api/auth/register`**
```json
{ "username": "sweksha", "email": "s@example.com", "password": "secret123", "fullName": "Sweksha" }
```
Returns `201` with the created user. No JWT is returned on registration — log in separately.

**POST `/api/auth/login`**
```json
{ "email": "s@example.com", "password": "secret123" }
```
Returns `{ "success": true, "token": "<jwt>", "user": { ... } }`.

**POST `/api/attempts`**
```json
{
  "scenarioId": "60717a20-e54e-4b95-9253-c9b132a1374e",
  "answers": [
    { "questionId": "q1", "selectedOptionId": "opt_a" }
  ],
  "timeSpent": 120
}
```
Returns score, per-question results, pass/fail status. User `totalPoints` is incremented in the same database transaction.

**GET `/api/leaderboard`**
```json
{
  "success": true,
  "count": 10,
  "leaderboard": [
    { "rank": 1, "username": "sweksha", "totalPoints": 300, "level": 2 }
  ]
}
```

---

## 🗄️ Database Models

Defined in `backend/prisma/schema.prisma`:

| Model      | Description                                                   |
|------------|---------------------------------------------------------------|
| `User`     | Trainee accounts — email, username, hashed password, role, totalPoints, level |
| `Scenario` | Disaster training scenarios — questions, options, correct answers, scoring rules stored as JSON |
| `Attempt`  | Per-run records — user choices, score, time spent, status     |
| `Feedback` | Gemini AI-generated feedback linked to an attempt             |

---

## 🎮 Unity Web Integration

### How it works

```
React Portal (browser)
       │
       │  1. User logs in → JWT stored in AuthContext
       │  2. User navigates to /play/earthquake
       │
       ▼
PlayGamePage.jsx
       │
       │  3. Loads earthquake.loader.js from /unity/earthquake/Build/
       │  4. createUnityInstance() initialises WebAssembly engine
       │  5. SendMessage('[Managers]', 'SetWebSession', JSON)
       │     — passes { token, username, baseUrl } in memory
       │
       ▼
Unity (WebAssembly in browser)
       │
       │  6. AuthManager.SetWebSession() receives token
       │  7. GameManager transitions to StarterScreen (skips login)
       │  8. User plays the earthquake simulation
       │  9. ScenarioRunner submits attempt to POST /api/attempts
       │ 10. DisasterReadyBridge.jslib dispatches 'unity:attemptSubmitted' event
       │
       ▼
React Portal
      11. Dashboard listens for 'unity:attemptSubmitted'
      12. Automatically refetches GET /api/leaderboard
      13. Points and rank update without page reload
```

### Unity WebGL build files

The compiled build lives in:
```
frontend/public/unity/earthquake/Build/
├── earthquake.loader.js     ← Unity bootstrap loader (~26 KB)
├── earthquake.framework.js  ← Unity runtime framework (~430 KB)
├── earthquake.data           ← Game assets (~23 MB)
└── earthquake.wasm           ← WebAssembly binary (~48 MB)
```

These files are committed to the repository and served as static assets by Vite.

### Rebuilding the Unity WebGL game

> You only need to do this if you modify Unity C# scripts or game assets.

1. Open **Unity Hub** and load the project at the repository root.
2. Wait for the Editor to fully compile.
3. In the top menu click: **DisasterReady → Build WebGL for React Portal**
4. Wait for the build to complete (5–15 minutes).
5. The new files are written automatically to `frontend/public/unity/earthquake/`.

Alternatively, use **File → Build Settings**, switch to the **Web** platform, set the output path to `frontend/public/unity/earthquake`, and click **Build**.

---

## 🤖 AI Feedback (Gemini)

The backend uses Google Gemini API to generate personalised training feedback after each simulation attempt.

- The backend evaluates all answers independently and calculates the score.
- Gemini receives the verified results and safety explanations (not raw answers) to generate constructive feedback.
- Feedback is stored in the `Feedback` table and displayed inside Unity's result screen.

---

## 🔐 Authentication Flow

1. **Register** at `/signup` → user record created in PostgreSQL.
2. **Login** at `/login` → JWT returned and stored in `localStorage`.
3. **Dashboard / Play** routes → `ProtectedRoute` checks for valid token; redirects to `/login` if missing or expired.
4. **Unity session** → `PlayGamePage` calls `SendMessage` to pass the JWT directly into Unity's in-memory `AuthManager`. The token is never exposed in URLs or logs.
5. **Session expiry** → Axios response interceptor catches `401` responses, clears the token, and fires an `auth:expired` event that the `AuthContext` handles by logging the user out.

---

## 🔧 Environment Variables Reference

### `backend/.env`

| Variable       | Required | Description                                       |
|----------------|----------|---------------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string                      |
| `JWT_SECRET`   | Yes      | Secret used to sign and verify JWT tokens         |
| `GEMINI_API_KEY`| Yes     | Google Gemini API key for AI feedback generation  |
| `PORT`         | No       | HTTP port (default: `4000`)                       |
| `NODE_ENV`     | No       | `development` or `production`                     |

### `frontend/.env`

| Variable            | Required | Description                           |
|---------------------|----------|---------------------------------------|
| `VITE_API_BASE_URL` | Yes      | Full URL of the backend API           |

---

## 🧪 Testing the Integration

### 1. Backend health
```
GET http://localhost:4000/api/health
```
Expected: `{ "status": "ok" }`

### 2. Register and login
- Navigate to `http://localhost:5173/signup`
- Create an account
- You will be redirected to the login page
- Log in — you should land on the Dashboard

### 3. Dashboard stats
- After logging in, the Dashboard fetches your live `totalPoints`, `level` and leaderboard rank from PostgreSQL via `GET /api/leaderboard`

### 4. Play the simulation
- Click **Play Now** on the Dashboard or **Play Simulation** in the navbar
- The Unity game should load with a progress bar
- After loading, the game skips the internal login screen and starts directly (session was injected via `SetWebSession`)
- Complete all 3 decision stages

### 5. Verify attempt was saved
- After the simulation ends, Unity shows the result screen (score + AI feedback)
- Navigate back to the Dashboard — your points should have updated automatically
- Check the Leaderboard — your ranking should reflect the new total

### 6. Manual database check (optional)
```bash
cd backend
npx prisma studio
```
Open `http://localhost:5555` to browse the `users`, `attempts` and `feedbacks` tables.

---

## 🚀 Development Status

- [x] Backend project setup and PostgreSQL configuration
- [x] Prisma schema, migrations and earthquake scenario seed
- [x] User registration and login (JWT, bcrypt)
- [x] Scenario, attempt and leaderboard APIs
- [x] Gemini AI feedback service
- [x] Unity 2D earthquake simulation (3-stage decision gameplay)
- [x] Unity → backend attempt submission and scoring
- [x] React portal (Landing, Signup, Login, Dashboard, Leaderboard)
- [x] Unity WebGL build embedded in React at `/play/earthquake`
- [x] Secure React → Unity JWT bridge (`SetWebSession`)
- [x] Unity → React attempt event (`unity:attemptSubmitted`)
- [x] Dashboard auto-refresh after game completion
- [ ] AI feedback persistence to `Feedback` table from attempt API (service exists; wiring pending)
- [ ] User level auto-upgrade based on point thresholds
- [ ] Additional disaster simulations (flood, fire, etc.)

---

## 👥 Team

**DisasterReady** is developed as a collaborative academic project.

- Backend and Database Development
- Frontend Development
- Unity 2D Simulation Development

---

## 📌 Project Vision

DisasterReady aims to make disaster preparedness more accessible and engaging through interactive simulations, gamification, and AI-assisted learning — helping individuals build the knowledge and confidence to respond to real emergencies.

---

*Built with the goal of making disaster preparedness a skill everyone can learn.*
