# Gourmet Haven

Gourmet Haven is a zero-commission, subscription-based food delivery platform for Hyderabad. This scaffold sets up the project as a full-stack workspace with a React frontend, an Express backend, and a Supabase schema designed around customer, owner, and delivery roles.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router v6, Zustand
- Backend: Node.js, Express
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth
- Payments: Razorpay subscriptions
- Media: Cloudinary
- Realtime: Supabase Realtime
- Hosting targets: Vercel for frontend, Railway for backend

## Workspace layout

```text
gourmet-haven/
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |-- components/
|   |   |   |-- common/
|   |   |   |-- customer/
|   |   |   `-- owner/
|   |   |-- hooks/
|   |   |-- store/
|   |   |-- services/
|   |   |-- lib/
|   |   `-- App.jsx
|-- backend/
|   |-- src/
|   |   |-- routes/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- config/
|   |   `-- app.js
`-- supabase/
    `-- migrations/
```

## What is already scaffolded

### Frontend

- Vite + React entry setup
- Tailwind configuration
- Legacy theme preservation:
  - old neon green brand color
  - dark cinematic landing page feel
  - light dashboard surfaces
  - existing image and video assets copied into `frontend/public/legacy`
- Route structure for:
  - landing
  - login
  - signup
  - customer dashboard
  - owner dashboard
  - delivery dashboard
  - orders
  - profile
- Zustand stores for auth, cart, and UI state
- Service layer for:
  - auth
  - restaurants
  - orders
  - subscriptions
  - uploads
- Supabase client bootstrap
- Reusable common, customer, and owner components

### Backend

- Express app with JSON, CORS, Helmet, and Morgan
- Route modules for:
  - auth
  - restaurants
  - menu items
  - orders
  - subscriptions
  - delivery
  - uploads
- Middleware for:
  - auth verification with Supabase JWT lookup
  - role enforcement
  - not found handling
  - error handling
- Controllers with starter logic and clear extension points
- Environment templates for Supabase, Razorpay, Cloudinary, and app URLs

### Supabase

- Initial schema migration
- UUID primary keys across all tables
- Paise-based money columns
- Auth-triggered profile creation
- RLS enabled on every table
- Starter policies for customer, owner, and delivery access patterns

## Core domain model

- `profiles`
- `restaurants`
- `menu_items`
- `orders`
- `subscriptions`
- `addresses`

All IDs are UUIDs. All money values are stored in paise. The schema is written to support Supabase Auth and role-aware RLS from the beginning.

## Local setup

### 1. Install dependencies

From `gourmet-haven/`:

```bash
npm install
```

### 2. Add environment files

Copy:

- `frontend/.env.example` -> `frontend/.env`
- `backend/.env.example` -> `backend/.env`

### 3. Run the frontend

```bash
npm run dev:frontend
```

### 4. Run the backend

```bash
npm run dev:backend
```

### 5. Apply the database migration

Run the SQL in:

`supabase/migrations/0001_initial_schema.sql`

through your Supabase SQL editor or your normal migration workflow.

## Notes for the next tasks

- The scaffold is intentionally ready for incremental implementation.
- Frontend pages use sensible fallback/sample data where the backend is not fully wired yet.
- Backend controllers are shaped around the final architecture, but some integrations still return placeholder responses until we implement them task by task.
- Upload signing and Razorpay verification are intentionally left as follow-up work so we can design them carefully.