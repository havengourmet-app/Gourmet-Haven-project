# Gourmet Haven Progress

This file tracks major project milestones only. Small fixes, minor polish, and tiny refactors do not need to be listed here.

## Update rule

When a major feature or important architectural step lands, add a new entry at the top with:

- date
- feature or milestone name
- short summary of what changed
- impact on the project

## Major milestones

### 2026-04-19 - Legacy static prototype archived after React migration

- Moved the old root-level HTML, CSS, JavaScript, image, and video prototype files into `legacy-static-prototype/`
- Grouped archived media assets under one `legacy-static-prototype/media/` folder
- Grouped archived styles under `legacy-static-prototype/styles/` and scripts under `legacy-static-prototype/scripts/`
- Updated archived prototype references so the old pages can still be opened for design comparison if needed
- Kept the active `gourmet-haven/` React and Express workspace untouched

Impact:
The repository root is now cleaner, and the active project is clearly separated from legacy reference material.

### 2026-04-06 - Owner dashboard management flows implemented

- Replaced the placeholder owner dashboard controls with real restaurant setup, menu add/edit, and subscription management flows
- Added owner-side restaurant creation so new owner accounts can create a real operating restaurant before managing menu items
- Added functional add item and edit item forms backed by the existing menu API
- Wired the `Manage subscription` button to a working panel that can refresh subscription state and start checkout attempts when a Razorpay plan ID is available
- Tightened backend menu ownership checks so owners can only create or edit menu items for restaurants they actually own

Impact:
The owner dashboard is now operational instead of mostly presentational, which removes a major workflow blocker for restaurant onboarding and day-to-day management.

### 2026-04-06 - Realtime order lifecycle across customer, owner, and delivery roles

- Added a live customer order feed with status tracking on the orders page
- Turned the owner dashboard into a live operating queue with accept, prepare, and cancel actions
- Turned the delivery dashboard into a realtime dispatch view with open pickup jobs, claim flow, and delivery status updates
- Added backend support for delivery queue listing and safer role-aware order status transitions
- Updated the Supabase migration so the `orders` table is ready for Realtime publication and delivery users can see unclaimed jobs

Impact:
The platform now has its first real cross-role business loop where one order can move live from customer creation to owner action to delivery completion.

### 2026-04-06 - Supabase auth and database integration

- Connected the frontend and backend to the Supabase project through local environment configuration
- Verified Supabase Auth signup and login flow against the project setup
- Applied and hardened the initial SQL migration so it is safer to rerun
- Confirmed `profiles` row creation for signed up users through the auth-triggered flow

Impact:
The project now has a working auth foundation and a real hosted database schema instead of placeholder-only local wiring.

### 2026-04-04 - Legacy brand and theme preservation in the new app

- Reused media assets from the original static prototype inside the React frontend
- Preserved the original dark cinematic landing page direction and neon green brand accent
- Updated the main pages and shared UI pieces so the new stack still feels like the older Gourmet Haven concept

Impact:
The rebuild now keeps continuity with the original project identity instead of feeling like a disconnected rewrite.

### 2026-04-04 - Full-stack workspace scaffold created

- Created the `gourmet-haven/` workspace with separate frontend, backend, and Supabase folders
- Added React, Vite, Tailwind, React Router, and Zustand frontend structure
- Added Express backend structure with routes, controllers, middleware, and configuration folders
- Added the initial Supabase migration covering profiles, restaurants, menu items, addresses, subscriptions, and orders

Impact:
The project moved from a static prototype to a scalable full-stack foundation that can now be extended feature by feature.
