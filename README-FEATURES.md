# Clarion AI — v4 Feature Upgrade Guide

## 🆕 New Features Added

### 🔐 Authentication (Already Present + Enhanced)
- Signup / Login / Logout ✅
- JWT tokens with 1-hour expiry ✅  
- Password hashing (bcrypt) ✅
- **NEW**: `POST /auth/change-password` endpoint
- Session persistence via localStorage ✅
- Protected routes via `DashboardLayout` ✅

### 👤 User Profile System (NEW)
- `/profile` page — full profile with avatar, bio, skill level, domain, learning style
- `GET /profile` — returns full user data including gamification stats
- `PUT /profile` — update bio, skill level, preferred domain, learning style, name
- Avatar upload (base64, client-side)

### 🔥 Streak System (NEW)
- Daily streak counter (computed from attempt timestamps)
- Longest streak tracking
- Streak displayed in: TopNav, Dashboard, Profile, Achievements
- `services/gamification.py` — `compute_streak()`

### ⭐ XP + Level System (NEW)
- XP formula: `XP += 20 + score * 2` per analysis
- Level formula: `Level = floor(sqrt(XP / 100)) + 1`
- Level progress bar (% to next level)
- XP shown on: results page (+XP badge), TopNav, Dashboard, Profile, Achievements
- `services/gamification.py` — `compute_xp()`, `calc_level()`

### 🏆 Badges & Achievements (NEW)
- `/achievements` page — all badges (earned + locked)
- 12 badges: First Steps 🚀, On a Roll 🔥, 7-Day Streak 🥇, Consistency King 👑, Sharp Mind 🧠, Perfect Score 💎, Explorer 🗺️, Concept Master 📚, Fast Learner ⚡, Dedicated 💪, Elite Scholar 🏆, Legend 🌟
- `GET /gamification` endpoint
- Badges shown on Profile page and Dashboard

### 📊 Activity Heatmap (NEW)
- GitHub-style heatmap component: `ActivityHeatmap.js`
- Shows 52 weeks × 7 days of activity
- Color-coded by intensity (1–4+ analyses per day)
- Integrated into: Dashboard homepage, Analytics page

### 📈 Dashboard Enhancements
- Streak + XP card on main dashboard
- Activity heatmap section
- Badges preview with "View All →" link

### 🎖️ StreakWidget Component (NEW)
- `StreakWidget.js` — compact or full display
- Shown in TopNav (desktop) with live data
- Shows: streak flame, XP, level

## 🗂️ New Files
```
backend/
  services/gamification.py        — XP, levels, streaks, badges, heatmap
  routes/gamification.py          — GET /gamification, GET /gamification/heatmap

frontend/src/
  app/profile/page.js             — Full profile page
  app/achievements/page.js        — Badges collection page
  components/ActivityHeatmap.js   — GitHub-style heatmap
  components/StreakWidget.js      — Streak/XP/Level widget
```

## 🔗 New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamification` | Streak, XP, level, badges, heatmap |
| GET | `/gamification/heatmap` | Activity heatmap only |
| GET | `/profile` | Full profile + gamification |
| PUT | `/profile` | Update profile fields |
| POST | `/auth/change-password` | Change password |

## 🚀 Running the Project
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables
```env
# backend/.env
MONGO_URL=mongodb+srv://...
SECRET_KEY=your-secret-key
```
```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```
