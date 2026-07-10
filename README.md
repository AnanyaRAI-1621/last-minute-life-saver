# 🚨 Last Minute Life Saver - AI Productivity Companion

An AI-powered, high-fidelity productivity web application designed to help users beat procrastination, optimize focus, and rescue close deadlines using real-time priority scores, dynamic time block scheduling, and proactive AI assistance.

---

## 🚀 Key Features

*   **Urgent AI Priority Queue**: Dynamically calculates a real-time priority score (0–100) and deadline risk meter based on estimated duration, importance, and historical procrastination slips.
*   **AI Daily Planner**: Automatically splits available slots into sequential work focus blocks (type: `work`) and rest intervals (type: `break`), exporting directly to standard `.ics` files and Google Calendar.
*   **Proactive Voice Assistant**: An action-oriented conversational widget that responds with context-aware advice about task schedules and links directly to system views.
*   **Emergency Rescue Planner**: Generates barebones crash sprints when deadlines are close, prioritizing must-do steps and recommending items to skip.
*   **Interactive Calendar View**: Correlates scheduled focus blocks and task deadlines across an interactive grid.
*   **Productivity Profiler & Charts**: Visualizes 7-day completion load, category allocation, and difficulty trends via Recharts.

---

## 🛠 Tech Stack

### Frontend
*   **Core**: React (Vite)
*   **Styling**: Tailwind CSS & Lucide Icons
*   **Charts**: Recharts
*   **Router**: React Router DOM (v6)

### Backend
*   **Server**: Node.js & Express
*   **AI Engine**: Google Gemini API (`@google/generative-ai`)
*   **Database**: Firebase Firestore (with an in-memory Mock Firestore fallback for local development)
*   **Auth**: Firebase Auth (with mock JWT bypass options)

---

## 📁 Project Structure

```text
├── backend/
│   ├── config/             # Firebase configuration & Mock Firestore client
│   ├── middleware/         # Auth token validations & dev bypass handlers
│   ├── routes/             # Express API routers (auth, tasks, schedules, ai, analytics, calendar)
│   ├── services/           # Priority scoring rules & Gemini integration logic
│   └── server.js           # Server application startup
└── frontend/
    ├── src/
    │   ├── components/     # App Layout sidebar & floating Voice Assistant widget
    │   ├── contexts/       # React contexts for Auth and Dark/Light Mode Themes
    │   ├── pages/          # Dashboard, Task Manager, AI Planner, Calendar, Analytics
    │   ├── utils/          # API fetch request wrapper
    │   └── main.jsx        # App mounting with Providers wrapped
    ├── tailwind.config.js  # Styling variables
    └── vite.config.js      # Bundler configurations
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   npm

### 1. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables:
   *   `PORT`: Port for the API server (default is `5000`).
   *   `DEV_MODE_BYPASS`: Set to `true` to run without Firestore credentials (uses in-memory database and mock auth).
   *   `GEMINI_API_KEY`: Provide your Google Gemini API key to activate natural language processing. (If omitted, the server operates in a rules-based smart fallback mock mode).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## 🔌 API Documentation

All routes require a `Bearer <token>` inside the `Authorization` header. In `DEV_MODE_BYPASS=true` mode, you can pass any string starting with `mock-uid-` (e.g. `mock-uid-user123`) as the token.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Register user credentials / sync profile. |
| **POST** | `/api/auth/login` | Log in user and fetch productivity metrics. |
| **GET** | `/api/tasks` | Fetch user's tasks sorted by dynamic priority. |
| **POST** | `/api/tasks` | Create a new task and trigger AI subtask breakdown. |
| **PUT** | `/api/tasks/:id` | Update properties (log procrastination skips/mark complete). |
| **DELETE**| `/api/tasks/:id` | Remove task and clean up associated schedules. |
| **POST** | `/api/ai/generate-schedule` | Calculate focus and break blocks for specified hours. |
| **POST** | `/api/ai/rescue-plan` | Create condensed sprint steps for a task. |
| **POST** | `/api/ai/voice-assistant` | Send conversational speech prompts to the AI agent. |
| **GET** | `/api/schedule` | Retrieve saved daily timeline blocks. |
| **PUT** | `/api/schedule/:id` | Toggle completion status of schedule blocks. |
| **GET** | `/api/calendar` | Retrieve unified task deadlines & schedules calendar feed. |
| **GET** | `/api/analytics` | Fetch category counts, completions, and progress trends. |
