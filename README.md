<div align="center">

# ⚡ NexusOne

**A full-stack multi-model AI workspace — one prompt, multiple AI perspectives, side by side.**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🧠 What is NexusOne?

NexusOne lets users send a single prompt and receive responses from **multiple AI model personalities simultaneously** — displayed side by side in a clean, responsive interface. Built for power users who want to compare, contrast, and get the best out of AI without switching tabs.

- 🔀 **SmartMix** — route one prompt to multiple AI personalities at once
- 🎭 **Conversation Modes** — Study, Content, or Career coaching — locked per conversation
- 📊 **Plan-based limits** — Trial, Free, Pro, Super tiers with enforced quotas
- 🛡️ **Admin Console** — full control over users, plans, API keys, and system config
- 🔐 **Auth** — JWT + Google/GitHub OAuth

---

## 🗂️ Repository Layout

```
NexusOne/
├── backend/          Node.js + Express + MongoDB API
├── frontend/         React + Vite + Zustand + Tailwind CSS
├── rulebook.txt      Business rules and policy reference
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 5, Mongoose |
| **Frontend** | React 19, Vite 7, Zustand, Tailwind CSS, Framer Motion |
| **Auth** | JWT + Passport (Google & GitHub OAuth) |
| **AI Provider** | Groq (multi-personality label abstraction) |
| **Scheduler** | node-cron |
| **Email** | Nodemailer |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### 1 — Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=10000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev        # nodemon watch mode
npm start          # production
```

Seed default models (run once):

```bash
node scripts/seedModels.js
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:10000 |

---

## 👥 Roles & Plans

### Roles

| Role | Access |
|---|---|
| `user` | Chat, history, account actions, Pro upgrade request |
| `admin` | Dashboard, users, plans, upgrade review, system control |

### Plan Limits

| Plan | Chats/Day | Messages/Chat | Models | History |
|---|---|---|---|---|
| **Trial** | 10 | 50 | Unlimited | Today |
| **Free** | 10 | 10 | 1 only | Today |
| **Pro** | 20 | 50 | Up to 3 | 10 days |
| **Super** | 50 | 100 | Unlimited | 30 days |
| **Admin** | ∞ | ∞ | ∞ | ∞ |

---

## 🎭 Conversation Modes

Selected before the first message and **locked for the lifetime of that conversation**.

| Mode | Style |
|---|---|
| 📚 **Study** | Teacher-style explanations, definitions, step-by-step breakdowns |
| ✍️ **Content** | Copywriter-style posts, emails, captions, ad copy |
| 💼 **Career** | Career coach and business advisor guidance |

---

## 🖥️ UI Behaviour

### Output Cards
- **1 model** → full-width card
- **2–3 models** → responsive CSS grid
- **4+ models** → horizontal scroll carousel with snap
- **Mobile** → single tabbed card with animated sliding indicator

### Sidebar Usage Bars
- 🔵 Free / Trial — blue bars
- 🟣 Pro — violet bars
- 🟡 Super — amber/gold bars

---

## 🔌 Core API Routes

<details>
<summary><strong>Auth & Account</strong> — <code>/auth</code></summary>

| Method | Path | Auth |
|---|---|---|
| POST | `/signup` | Public |
| POST | `/login` | Public |
| GET | `/google` | Public |
| GET | `/google/callback` | Public |
| GET | `/github` | Public |
| GET | `/github/callback` | Public |
| GET | `/getme` | User |
| GET | `/getHistory` | User |
| DELETE | `/history/clear` | User |
| DELETE | `/delete-me` | User |
| POST | `/forgot-password` | Public |
| PUT | `/reset-password/:token` | Public |
| GET | `/pro-upgrade/status` | User |
| POST | `/pro-upgrade/request` | User |

</details>

<details>
<summary><strong>SmartMix</strong> — <code>/smartmix</code></summary>

| Method | Path | Auth |
|---|---|---|
| POST | `/process` | User + guard |
| POST | `/terminate` | User |
| POST | `/persist-partial` | User |
| GET | `/history/:id` | User |
| DELETE | `/history/:id` | User |

</details>

<details>
<summary><strong>Admin</strong> — <code>/admin</code></summary>

| Method | Path | Auth |
|---|---|---|
| GET | `/dashboard` | Admin |
| PATCH | `/user/:id` | Admin |
| POST | `/plan` | Admin |
| PATCH | `/plan/:id` | Admin |
| DELETE | `/plan/:id` | Admin |
| GET | `/pro-upgrade-requests` | Admin |
| PATCH | `/pro-upgrade-requests/:id/review` | Admin |
| GET | `/api-keys` | Owner admin |
| POST | `/api-keys` | Owner admin |
| PUT | `/api-keys/:id` | Owner admin |
| DELETE | `/api-keys/:id` | Owner admin |
| GET | `/system-config` | Owner admin |
| POST | `/system-config` | Owner admin |
| DELETE | `/system-config/:key` | Owner admin |

</details>

---

## ⏰ Scheduled Jobs

| Schedule | Purpose |
|---|---|
| `00:00` daily | Reset user `dailyQueryCount` and `dailyChatCount` |
| `00:00` daily | Reset API key `usedRequests` and `usedTokens` |
| `00:10` daily | Downgrade expired Trial/Pro subscriptions to Free |

---

## ⚙️ Runtime Configuration

Config resolution order:
1. `global.SystemEnv` — loaded from `SystemConfig` collection at startup
2. `process.env` fallback

Manage SMTP, OAuth keys, available models, and API key strategy through the **Admin → System Config** panel.

**Minimum required in `.env`:**
```
MONGO_URI
JWT_SECRET
PORT
```

---

## 📜 Common Commands

```bash
# Backend
cd backend && npm run dev       # dev with hot reload
cd backend && npm start         # production

# Frontend
cd frontend && npm run dev      # dev server
cd frontend && npm run build    # production build

# Seed
cd backend && node scripts/seedModels.js
```

---

## 👨‍💻 Developer

<div align="center">

**Built by [Surjeet Karan](https://github.com/SurjeetKaran)**

[![GitHub](https://img.shields.io/badge/GitHub-SurjeetKaran-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SurjeetKaran)

</div>

---

<div align="center">
<sub>NexusOne — one prompt, infinite perspectives.</sub>
</div>
