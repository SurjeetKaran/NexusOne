# NexusOne

NexusOne is a full-stack multi-model AI workspace. Users send a single prompt and receive
responses from multiple AI model personalities side by side. The platform supports
per-conversation modes, plan-based limits, and an admin console for operations.

Reference: rulebook.txt — source of truth for all business rules and limits.

## Repository Layout

```
NexusOne/
  backend/            Node.js + Express + MongoDB API
  frontend/           React + Vite + Zustand + Tailwind CSS app
  rulebook.txt        Rule and policy reference
  README.md           Technical setup and route map
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Mongoose |
| Frontend | React 19, Vite, Zustand, Tailwind CSS, Framer Motion |
| Authentication | JWT + Passport (Google and GitHub OAuth) |
| AI provider | Groq (single provider, multi-personality label abstraction) |
| Scheduler | node-cron |

## Roles

| Role | Access |
|---|---|
| user | Chat, history, account actions, Pro upgrade request |
| admin | Dashboard, users, plans, upgrade review, system control |

## Plan Limits

| Plan | New Chats/Day | Messages/Conversation | Model Selection | History Window |
|---|---|---|---|---|
| Trial | 10 | 50 | Unlimited (checkbox) | Today |
| Free | 10 | 10 | 1 model only | Today |
| Pro | 20 | 50 | Up to 3 models (checkbox, max enforced) | 10 days |
| Super | 50 | 100 | Unlimited (checkbox, no cap) | 30 days |
| Admin | Unlimited | Unlimited | Unlimited | Unlimited |

## Conversation Modes

Available on all plans:
- **study** — teacher-style explanations, definitions, step-by-step breakdowns
- **content** — copywriter-style posts, emails, captions, ad copy
- **career** — career coach and business advisor guidance

Mode is selected before the first message and locked for the lifetime of that conversation.

## UI Behaviour by Plan

### Model Selector (header dropdown)
- **Free** — single-select list, locked once conversation starts
- **Pro** — checkbox panel, max 3 selectable, unchecked rows disabled at cap, amber hint shown
- **Super / Trial** — checkbox panel, no cap, counter shows `N active`

### Output Cards (chat window)
- **1 model** — full-width card
- **2–3 models** — responsive CSS grid (fills full width)
- **4+ models** — horizontal scroll carousel with snap
- **Mobile (all counts > 1)** — single tabbed card; model tabs at top with animated sliding indicator; tabs fill width for ≤4 models, scroll for 5+

### Sidebar Usage Bars
- **Free / Trial** — blue progress bars
- **Pro** — violet progress bars
- **Super** — amber/gold progress bars
- All plans show: daily chats used / limit and current chat messages used / limit

## Local Development

### 1) Backend

```bash
cd backend
npm install
```

Create `.env` in `backend` with at minimum:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=10000
FRONTEND_URL=http://localhost:5173
```

Run:

```bash
npm run dev      # nodemon watch mode
npm start        # production
```

Seed default model list (run once):

```bash
node scripts/seedModels.js
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:10000

## Core API Routes

### Auth and Account (`/auth`)

| Method | Path | Auth |
|---|---|---|
| POST | /signup | Public |
| POST | /login | Public |
| GET | /google | Public |
| GET | /google/callback | Public |
| GET | /github | Public |
| GET | /github/callback | Public |
| GET | /getme | User |
| GET | /getHistory | User |
| DELETE | /history/clear | User |
| DELETE | /delete-me | User |
| POST | /forgot-password | Public |
| PUT | /reset-password/:token | Public |
| GET | /pro-upgrade/status | User |
| POST | /pro-upgrade/request | User |

### SmartMix (`/smartmix`)

| Method | Path | Auth |
|---|---|---|
| POST | /process | User + guard |
| POST | /terminate | User |
| POST | /persist-partial | User |
| GET | /history/:id | User |
| DELETE | /history/:id | User |

### Admin (`/admin`)

| Method | Path | Auth |
|---|---|---|
| GET | /plan | Public |
| GET | /system/models | Public |
| GET | /dashboard | Admin |
| PATCH | /user/:id | Admin |
| POST | /plan | Admin |
| PATCH | /plan/:id | Admin |
| DELETE | /plan/:id | Admin |
| GET | /pro-upgrade-requests | Admin |
| PATCH | /pro-upgrade-requests/:id/review | Admin |
| GET | /api-keys | Owner admin only |
| POST | /api-keys | Owner admin only |
| PUT | /api-keys/:id | Owner admin only |
| DELETE | /api-keys/:id | Owner admin only |
| PATCH | /api-keys/:id/toggle | Owner admin only |
| GET | /providers | Owner admin only |
| GET | /system-config | Owner admin only |
| POST | /system-config | Owner admin only |
| DELETE | /system-config/:key | Owner admin only |
| GET | /user-full-usage/:userId | Owner admin only |

## Runtime Configuration

Config resolution order:
1. `global.SystemEnv` — loaded from SystemConfig collection at startup
2. `process.env` fallback

Manage runtime values (SMTP, OAuth keys, payment instructions, API key strategy,
available models) through the admin System Config panel.

Minimum required in `.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `PORT`

## Scheduled Jobs

| Schedule | Purpose |
|---|---|
| 00:00 daily | Reset user `dailyQueryCount` and `dailyChatCount` |
| 00:00 daily | Reset API key `usedRequests` and `usedTokens` |
| 00:10 daily | Downgrade expired Trial/Pro subscriptions to Free |

## Common Commands

```bash
# Backend
cd backend
npm run dev
npm start

# Frontend
cd frontend
npm run dev
npm run build

# Seed models
cd backend
node scripts/seedModels.js
```

## Notes

- Share chat feature is not exposed in the UI. Backend routes exist but are unused.
- Manual payment flow is implemented for Pro upgrade requests only. Super is assigned by admin.
- For exact policy semantics, rulebook.txt is the source of truth.
