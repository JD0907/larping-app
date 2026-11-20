# LARPING APP 👁‍🗨

> **Solo-player productivity tool designed to physically and psychologically deter phone usage through simulated surveillance.**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-003B57.svg)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Executive Summary

The **LARPING APP** addresses phone distraction and loss of focus by leveraging behavioral psychology: users **"role-play" (LARP) being monitored** in a high-security focus chamber.

By mirroring a live local camera stream and enforcing strict tab-switching rules, the app creates immediate psychological accountability and friction against checking your phone, without any of the video processing or cloud storage costs associated with streaming video to external servers.

---

## 2. Core Features & User Stories

### 📷 1. Accountability Stream (Local Mirror)
* **Zero Cloud Privacy Risk:** The user's camera feed is streamed directly to the local HTML5 canvas/video element using vanilla JavaScript `navigator.mediaDevices.getUserMedia()`.
* **Zero Server Storage:** Video frames are strictly rendered in-browser and never recorded or transmitted across the network.
* **HUD Overlay:** Cyberpunk/security camera HUD displaying real-time session stamps and focus status.

### ⏱ 2. Session Configuration
* Standard Pomodoro interval presets: **25 min Focus**, **50 min Deep Work**, **15 min Sprint**.
* Custom timer selector allowing customized focus blocks up to 180 minutes.
* Digital high-precision countdown display with audio feedback.

### 🚨 3. Strict Tab-Switch Enforcement
* Implements the **Page Visibility API** (`visibilitychange`) and window blur detection.
* **15-Second Grace Period:** If the user switches tabs, minimizes the window, or navigates away, a high-contrast visual warning overlay is immediately triggered with an audible alarm.
* **Automatic Failure:** If the user does not return before the 15-second grace period hits zero, the session automatically transitions to **"Failed"** and is permanently logged in the audit history.

### 🏆 4. Gamification & Dashboard
* **Daily Streaks:** Consecutive days with completed sessions increment a persistent streak counter.
* **Cumulative Focus Hours:** Aggregates total completed minutes and displays total focus hours.
* **Audit Trail:** Historical session records tracking date, intended duration, status (`Completed` vs. `Failed`), and outcome metrics.

---

## 3. Database Schema

Built with **SQLAlchemy ORM** supporting **SQLite** (local default) and **PostgreSQL** (production ready).

### `users` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID (String 36) | Primary Key |
| `email` | VARCHAR(255) | Unique, Indexed, User Identifier |
| `password_hash` | VARCHAR(255) | Secure PBKDF2 / BCrypt Hash |
| `current_streak` | INT | Consecutive active days (Default: `0`) |
| `total_focus_minutes` | INT | Cumulative focus time logged (Default: `0`) |
| `last_active_date` | DATE | Used to calculate and preserve daily streaks |

### `sessions` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | UUID (String 36) | Primary Key |
| `user_id` | UUID (String 36) | Foreign Key (`users.id`, CASCADE) |
| `target_duration` | INT | Intended session length in minutes |
| `status` | VARCHAR(20) | Session state (`InProgress`, `Completed`, `Failed`) |
| `created_at` | DATETIME | Session start timestamp |

---

## 4. Project Structure

```text
larping-app/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
├── LICENSE                   # MIT License
├── README.md                 # Project documentation
├── requirements.txt          # Python dependencies
├── run.py                    # Application launch script
└── app/
    ├── __init__.py           # App package identifier
    ├── config.py             # Settings & environment parser
    ├── database.py           # SQLAlchemy engine & session maker
    ├── models.py             # SQLAlchemy ORM schemas
    ├── schemas.py            # Pydantic data validation schemas
    ├── auth.py               # Password hashing & JWT token handling
    ├── main.py               # FastAPI entrypoint & router assembly
    ├── routers/
    │   ├── __init__.py
    │   ├── auth.py           # /api/auth (Register, Login, Me)
    │   └── sessions.py       # /api/sessions (Start, Finish, History, Stats)
    └── static/
        ├── index.html        # Single-page application interface
        ├── css/
        │   └── styles.css    # High-contrast surveillance theme
        └── js/
            ├── api.js        # REST client & token storage
            ├── camera.js     # getUserMedia local mirror controller
            ├── timer.js      # Pomodoro logic & 15s grace tab enforcement
            └── app.js        # Main coordinator & dashboard updater
```

---

## 5. Getting Started

### Prerequisites
* Python 3.10 or higher
* Modern web browser with webcam access (Chrome, Edge, Firefox, Safari)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/larping-app.git
   cd larping-app
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   # Copy example environment configuration
   cp .env.example .env
   ```

5. **Run the server:**
   ```bash
   python run.py
   # Or using uvicorn directly:
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. **Open in browser:**
   Navigate to [http://localhost:8000](http://localhost:8000). Grant camera permission when prompted to activate the local surveillance mirror.

---

## 6. Pushing to GitHub

To push this repository to your GitHub account:

### Option A: Using GitHub CLI (`gh`)
```bash
# 1. Log into GitHub
gh auth login

# 2. Create the repository on your GitHub account and push
gh repo create larping-app --public --source=. --remote=origin --push
```

### Option B: Using Git and Web Browser
1. Create a new empty repository named `larping-app` on [GitHub](https://github.com/new).
2. Add the remote and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/larping-app.git
   git branch -M main
   git push -u origin main
   ```

---

## 7. Development Roadmap (4-Week Build Plan)

- [x] **Week 1: Core Framework & Stream**
  - [x] Initialize FastAPI backend scaffolding and route mounting.
  - [x] Build dark-mode surveillance UI layout.
  - [x] Implement local zero-overhead `getUserMedia()` camera stream.
- [x] **Week 2: Timer Logic & Strict Enforcement**
  - [x] Pomodoro & custom duration interval engine.
  - [x] Page Visibility API integration (`visibilitychange`, `blur`).
  - [x] 15-second grace countdown banner with synthesized audio alarm.
  - [x] Automatic session failure state transition.
- [x] **Week 3: Database & Authentication**
  - [x] SQLite & PostgreSQL ORM configuration with SQLAlchemy.
  - [x] JWT-based user authentication (Register, Login, Token validation).
  - [x] Endpoints for starting, completing, and abandoning sessions.
- [x] **Week 4: Gamification & Polish**
  - [x] Daily streak tracking and consecutive-day verification.
  - [x] Total cumulative focus minutes aggregation.
  - [x] User dashboard with completion statistics and audit log.

---

## 8. License

Distributed under the MIT License. See `LICENSE` for more information.
