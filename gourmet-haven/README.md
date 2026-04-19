# Gourmet Haven

Gourmet Haven is a zero-commission, subscription-based food delivery platform for Hyderabad. The project is being rebuilt as a full-stack application while preserving the visual identity and media direction from the original static prototype.

## Current status

The workspace is scaffolded and running with:

- React 18 + Vite + Tailwind frontend structure
- Express backend structure
- Supabase Auth integration for signup and login
- Supabase schema migration with UUID tables, paise-based money fields, profile auto-creation, and RLS policies
- Role-aware dashboards for customer, owner, and delivery users
- Realtime order lifecycle across customer, owner, and delivery workflows
- Legacy theme preservation through reused visual assets and the original green-on-dark brand language

Major milestone history now lives in `progress.md`.

## Tech stack

- Frontend: React 18, Vite, Tailwind CSS, React Router v6, Zustand
- Backend: Node.js, Express
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth
- Payments: Razorpay subscriptions
- Media: Cloudinary
- Realtime: Supabase Realtime
- Hosting target: Vercel for frontend, Railway for backend

## Workspace layout

```text
gourmet-haven/
|-- frontend/
|   |-- public/
|   |   `-- legacy/
|   `-- src/
|       |-- components/
|       |   |-- common/
|       |   |-- customer/
|       |   `-- owner/
|       |-- hooks/
|       |-- lib/
|       |-- pages/
|       |-- services/
|       |-- store/
|       |-- App.jsx
|       |-- index.css
|       `-- main.jsx
|-- backend/
|   `-- src/
|       |-- config/
|       |-- controllers/
|       |-- middleware/
|       |-- routes/
|       |-- utils/
|       `-- app.js
|-- supabase/
|   `-- migrations/
|       `-- 0001_initial_schema.sql
|-- README.md
`-- progress.md
```

The previous static HTML/CSS/JS prototype is archived outside this workspace at `../legacy-static-prototype/`. It is kept only as reference material and is not part of the active React/Express runtime.

## Implemented so far

### Frontend

- Landing page with preserved cinematic hero style and legacy media assets
- Login and signup screens wired to Supabase Auth
- Customer, owner, and delivery dashboard routes
- Orders page with live customer tracking
- Owner dashboard with live order queue controls
- Owner restaurant setup, menu add/edit forms, and subscription management panel
- Delivery dashboard with open pickup queue and delivery status controls
- Profile page
- Zustand-based auth bootstrap and shared state structure
- Realtime order subscriptions through the Supabase client
- Service layer for auth, restaurants, orders, subscriptions, uploads, and base API calls
- Protected route handling for role-aware access

### Backend

- Express app with Helmet, CORS, JSON parsing, and Morgan
- Route and controller structure for auth, restaurants, menu items, orders, subscriptions, delivery, and uploads
- Supabase, Razorpay, and Cloudinary config entry points
- Authentication and role middleware
- Delivery queue endpoint and role-aware order status transition handling
- Shared error and not-found handling

### Database

- `profiles`
- `restaurants`
- `menu_items`
- `addresses`
- `subscriptions`
- `orders`

Database rules currently baked into the migration:

- all IDs are UUIDs
- all money values are stored in paise
- profile rows are created from new auth users
- row level security is enabled on all tables
- starter policies exist for customer, owner, and delivery access paths
- `orders` is prepared for Supabase Realtime publication

## Run locally

From `gourmet-haven/`:

```bash
npm install
```

Run the frontend:

```bash
npm run dev:frontend
```

Run the backend in another terminal:

```bash
npm run dev:backend
```

Useful local URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`

## Environment setup

Create these files before running the full stack:

- `frontend/.env`
- `backend/.env`

Frontend variables:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_CLOUDINARY_CLOUD_NAME=
```

Backend variables:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Supabase setup

Apply the schema in:

`supabase/migrations/0001_initial_schema.sql`

This migration creates the app tables, updated-at triggers, auth-to-profile trigger, and RLS policies.

If you already applied the migration before the realtime work landed, rerun the latest `0001_initial_schema.sql` once so the new delivery queue policy and `orders` publication update are applied.

## Working conventions

- Use `gourmet-haven/` for all new implementation work
- Treat `../legacy-static-prototype/` as archived reference material only
- Add only major milestones to `progress.md`
- Keep future changes aligned with the existing Gourmet Haven visual direction unless a redesign is explicitly requested


# directory: cd "c:\Users\teju\OneDrive\Desktop\new dwsk\python\java sir project\gourmet-haven 
