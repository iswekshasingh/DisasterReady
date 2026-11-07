# 🌍 DisasterReady

### Gamified Disaster Preparedness and Emergency Response Training

DisasterReady is an AI-powered disaster preparedness training platform designed to help users learn how to respond to emergency situations through interactive, gamified simulations.

The project aims to make disaster preparedness more engaging by combining virtual reality simulations, performance evaluation, gamification, and AI-generated personalized feedback.

## 🎯 Problem Statement

Many people lack practical knowledge about how to respond during natural disasters and emergency situations.

Traditional awareness programs often rely on passive learning, making it difficult for individuals to remember the correct actions during real emergencies.

DisasterReady aims to address this gap through interactive disaster simulations and performance-based learning.

## ✨ Key Features

### Implemented Backend Features

- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication and protected routes.
- Disaster scenario listing and details.
- Backend-side answer evaluation.
- Automatic score calculation.
- Attempt history tracking.
- User points persistence.
- Top trainees leaderboard.
- Gemini AI feedback generation service.

### Planned Platform Features

- Interactive Unity VR disaster simulations.
- Google Cardboard-based mobile VR experience.
- React-based user dashboard.
- Personalized learning experience.
- Gamified achievements and badges.
- AI-powered performance explanations.

_Note: React frontend, Unity VR integration, and end-to-end AI feedback integration are still under development._

## 🛠️ Technology Stack

| Component       | Technology          |
| --------------- | ------------------- |
| Frontend        | React.js (planned)  |
| Backend         | Node.js, Express.js |
| Database        | PostgreSQL          |
| ORM             | Prisma ORM v7       |
| Authentication  | JWT, bcrypt         |
| AI Integration  | Google Gemini API   |
| VR Development  | Unity               |
| Version Control | Git, GitHub         |

## 🏗️ Project Architecture

```text
DisasterReady/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── gemini.js
│   │   │
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/iswekshasingh/DisasterReady.git

cd DisasterReady
```

### 2. Navigate to Backend

```bash
cd backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Add the following variables:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/disasterready?schema=public"

JWT_SECRET="your_private_jwt_secret"

GEMINI_API_KEY="your_gemini_api_key"

PORT=4000
```

Replace the placeholders with your local configuration.

**Never commit your `.env` file or expose your API keys and secrets.**

### 5. Set Up the Database

Make sure PostgreSQL is running and the `disasterready` database exists.

Run:

```bash
npx prisma migrate dev
```

### 6. Seed the Database

```bash
npm run prisma:seed
```

This adds the initial earthquake safety training scenario.

### 7. Start the Backend Server

```bash
npm run dev
```

The backend will run at:

`http://localhost:4000`

Health check:

`http://localhost:4000/api/health`

## 🔌 Backend API Endpoints

| Method | Endpoint             | Description                    | Authentication |
| ------ | -------------------- | ------------------------------ | -------------- |
| POST   | `/api/auth/register` | Register a user                | No             |
| POST   | `/api/auth/login`    | Login and generate JWT         | No             |
| GET    | `/api/auth/me`       | Get authenticated user         | Yes            |
| GET    | `/api/scenarios`     | List published scenarios       | No             |
| GET    | `/api/scenarios/:id` | Get scenario details           | No             |
| POST   | `/api/attempts`      | Submit and evaluate an attempt | Yes            |
| GET    | `/api/attempts`      | Get user's attempt history     | Yes            |
| GET    | `/api/leaderboard`   | Get top trainees               | No             |

For protected endpoints, include the JWT in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🗄️ Database Models

The current Prisma schema includes:

- **User:** Stores user accounts, authentication information, roles and points.
- **Scenario:** Stores disaster scenarios, questions and evaluation rules.
- **Attempt:** Stores user submissions, scores and completion details.
- **Feedback:** Stores personalized feedback associated with attempts.

## 🤖 AI Feedback

DisasterReady uses Google's Gemini API to generate personalized training feedback.

The backend evaluates answers and calculates scores independently. Gemini is used to explain performance and provide constructive learning feedback.

The AI service is designed to use verified evaluation results and supplied safety explanations rather than independently inventing emergency instructions.

## 🚀 Current Development Status

- [x] Backend project setup
- [x] PostgreSQL configuration
- [x] Prisma schema and initial migration
- [x] Earthquake scenario seeding
- [x] User registration and login
- [x] JWT authentication
- [x] Scenario APIs
- [x] Attempt submission and scoring
- [x] Attempt history
- [x] Leaderboard API
- [x] Gemini feedback service
- [ ] AI feedback persistence and attempt API integration
- [ ] React frontend
- [ ] Unity VR earthquake simulation
- [ ] Frontend-backend integration
- [ ] Unity-backend integration
- [ ] End-to-end testing

## 👥 Team

**DisasterReady** is being developed as a collaborative academic project.

- Backend and Database Development
- Frontend Development
- Unity VR Development

## 📌 Project Vision

Our vision is to make disaster preparedness more accessible, interactive, and engaging through technology.

By combining immersive simulations, gamification, and AI-assisted learning, DisasterReady aims to help individuals build the knowledge and confidence needed to respond to emergencies.

---

_Built with the goal of making disaster preparedness a skill everyone can learn._
