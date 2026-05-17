# QuickDyne Feature Tracker

This document explains the current feature set, how each feature is technically implemented, current limitations, and future scope. It is written for review by a senior/mentor so they can quickly understand the project direction and suggest next improvements.

Note: The filename follows the requested name `feture_tracker.md`. If preferred later, it can be renamed to `feature_tracker.md`.

## Project Summary

QuickDyne is a Hyderabad-first, zero-commission food delivery platform. The business model is subscription-based for restaurant owners instead of commission-based per order.

The project has moved from a static HTML/CSS/JS prototype to a React + Express + Supabase architecture. The old static prototype is archived in `../legacy-static-prototype/`, while the active application lives in this workspace.

## Current Architecture

Frontend:
- React 18 with Vite
- Tailwind CSS for styling
- React Router v6 for routing
- Zustand for auth, cart, and UI state
- Supabase JS client for Auth and Realtime
- Service layer under `frontend/src/services/`

Backend:
- Node.js + Express
- Route/controller/middleware structure
- Supabase admin client for privileged database operations
- Role middleware for customer, owner, and delivery access
- Razorpay and Cloudinary configuration entry points

Database:
- PostgreSQL via Supabase
- Supabase Auth for users
- Row Level Security enabled
- UUID primary keys
- Money values stored in paise
- Main tables: `profiles`, `restaurants`, `menu_items`, `addresses`, `subscriptions`, `orders`

## Implemented Features

### 1. React Full-Stack Workspace

Status:
- Implemented

What it does:
- Separates the active project into `frontend/`, `backend/`, and `supabase/`.
- Keeps the old static prototype archived separately.

How it was achieved:
- React app lives in `frontend/src/`.
- Express app lives in `backend/src/`.
- Supabase schema lives in `supabase/migrations/0001_initial_schema.sql`.
- Root README points developers to the active QuickDyne workspace.

Important files:
- `package.json`
- `frontend/src/App.jsx`
- `backend/src/app.js`
- `supabase/migrations/0001_initial_schema.sql`

Future scope:
- Add tests and CI checks.
- Add deployment-specific docs for Vercel and Railway.
- Add seed/demo scripts for fresh setup.

### 2. Legacy Static Prototype Archive

Status:
- Implemented

What it does:
- Moves old HTML/CSS/JS files out of the root so the active React project is clear.
- Keeps old design files available for reference.

How it was achieved:
- Old HTML files moved to `../legacy-static-prototype/`.
- Old CSS files moved to `../legacy-static-prototype/styles/`.
- Old JS files moved to `../legacy-static-prototype/scripts/`.
- Old images and videos moved to `../legacy-static-prototype/media/`.
- Archived file references were updated so the old prototype can still be opened.

Important files:
- `../legacy-static-prototype/README.md`
- `../legacy-static-prototype/index.html`
- `../legacy-static-prototype/media/`

Future scope:
- Delete the archive once the team confirms it is no longer needed.
- Keep only selected design screenshots if the full archive becomes unnecessary.

### 3. Legacy Theme Preservation

Status:
- Implemented

What it does:
- Preserves the original QuickDyne visual direction inside the new React app.
- Reuses the dark cinematic landing page feel, green brand accent, and existing food media.

How it was achieved:
- Media assets were copied into `frontend/public/legacy/`.
- Asset paths are centralized in `frontend/src/lib/legacyAssets.js`.
- Tailwind and CSS were adjusted to keep the brand direction.
- Landing, dashboard, profile, and order pages use the preserved media and visual language.

Important files:
- `frontend/public/legacy/`
- `frontend/src/lib/legacyAssets.js`
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/src/pages/LandingPage.jsx`

Future scope:
- Replace placeholder/fallback media with Cloudinary-hosted restaurant/menu images.
- Create a formal design system with reusable tokens and components.

### 4. Supabase Authentication

Status:
- Implemented

What it does:
- Supports signup and login using Supabase Auth.
- Stores role metadata for customer, owner, and delivery users.
- Loads the logged-in user profile from Supabase.

How it was achieved:
- Frontend Supabase client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Auth service wraps Supabase auth calls.
- Zustand auth store manages session, profile, loading state, and role-based default routes.
- Backend auth middleware validates Bearer tokens with Supabase.

Important files:
- `frontend/src/lib/supabase.js`
- `frontend/src/services/authService.js`
- `frontend/src/store/authStore.js`
- `frontend/src/hooks/useAuth.js`
- `backend/src/middleware/requireAuth.js`
- `backend/src/middleware/requireRole.js`

Future scope:
- Add password reset UI.
- Add email confirmation callback page.
- Add profile completion flow after signup.
- Improve local setup error messages when env vars are missing.

### 5. Role-Based Routing and Dashboards

Status:
- Implemented

What it does:
- Routes users into different dashboards based on role.
- Protects customer, owner, and delivery pages from unauthorized roles.

How it was achieved:
- React Router defines routes in `frontend/src/App.jsx`.
- `ProtectedRoute` checks session and allowed roles.
- `Shell` renders role-aware navigation links.
- `defaultRouteForRole()` decides where users go after login.

Important files:
- `frontend/src/App.jsx`
- `frontend/src/components/common/ProtectedRoute.jsx`
- `frontend/src/components/common/Shell.jsx`
- `frontend/src/store/authStore.js`

Future scope:
- Add a dashboard redirect after Supabase email confirmation.
- Add admin role if required later.
- Add route-level loading/error states for failed profile lookup.

### 6. Supabase Database Schema and RLS

Status:
- Implemented

What it does:
- Defines the core database model for the platform.
- Enables Row Level Security.
- Creates profile rows automatically when new users sign up.
- Prepares `orders` for Supabase Realtime publication.

How it was achieved:
- `0001_initial_schema.sql` creates tables, indexes, triggers, functions, and policies.
- `handle_new_user()` inserts into `public.profiles` after a Supabase Auth user is created.
- Updated-at triggers keep timestamps fresh.
- RLS policies control customer, owner, and delivery access.

Important files:
- `supabase/migrations/0001_initial_schema.sql`

Future scope:
- Add `order_items` table instead of relying only on `orders.items` JSONB.
- Add `order_events` table for audit/history of status changes.
- Add richer address constraints and default-address enforcement.
- Add indexes based on real query patterns after testing.

### 7. Backend API Structure

Status:
- Implemented foundation

What it does:
- Provides route/controller structure for core domains.
- Handles auth checks, role checks, errors, and not-found responses.

How it was achieved:
- Express app mounts domain routes under `/api`.
- Controllers use Supabase admin client where privileged writes are required.
- `asyncHandler` keeps route error handling consistent.
- `errorHandler` and `notFound` handle failures consistently.

Important files:
- `backend/src/app.js`
- `backend/src/routes/`
- `backend/src/controllers/`
- `backend/src/middleware/`
- `backend/src/config/supabaseClient.js`

Future scope:
- Add request validation with a schema library.
- Add rate limiting.
- Add centralized structured logging.
- Add integration tests for API endpoints.

### 8. Customer Restaurant Discovery

Status:
- Partially implemented

What it does:
- Shows restaurants to customers on the customer dashboard.
- Falls back to preserved static restaurant data/images if real backend data is unavailable.

How it was achieved:
- Customer dashboard calls `listRestaurants()`.
- Restaurant cards use `RestaurantCard`.
- Legacy images are used as fallback visuals.

Important files:
- `frontend/src/pages/CustomerDashboardPage.jsx`
- `frontend/src/components/customer/RestaurantCard.jsx`
- `frontend/src/services/restaurantService.js`
- `backend/src/controllers/restaurantController.js`

Current limitations:
- Search/filter is not fully implemented.
- Restaurant detail page is not implemented.
- Customer menu browsing still needs to be connected fully to real menu items per restaurant.

Future scope:
- Add restaurant detail route.
- Add cuisine/search filters.
- Show only currently available restaurants and menu items in realtime.

### 9. Cart and Order Placement

Status:
- Partially implemented

What it does:
- Lets customers add items to cart.
- Calculates subtotal, delivery fee, platform fee, and total in paise.
- Places orders against a restaurant through the backend.

How it was achieved:
- Zustand cart store stores items and totals.
- Orders page uses `createOrder()`.
- Backend `createOrder()` validates paise values and inserts into `orders`.
- Current sample/fallback items are transformed into cart items.

Important files:
- `frontend/src/store/cartStore.js`
- `frontend/src/pages/OrdersPage.jsx`
- `frontend/src/components/customer/MenuItemCard.jsx`
- `frontend/src/services/orderService.js`
- `backend/src/controllers/orderController.js`

Current limitations:
- Customer address selection is not implemented yet.
- Menu items are still partially sample-driven.
- `orders.items` stores item data as JSONB instead of normalized `order_items`.

Future scope:
- Add customer address management.
- Add real restaurant-specific menu browsing.
- Add `order_items` table and order summary snapshots.
- Add payment collection for customer orders if required by the business model.

### 10. Realtime Order Lifecycle

Status:
- Implemented first version

What it does:
- Moves orders through a live lifecycle across customer, owner, and delivery roles.
- Customer can see live tracking.
- Owner can accept, prepare, or cancel.
- Delivery can claim, mark picked up, start trip, and complete delivery.

How it was achieved:
- Supabase Realtime listens to `orders`.
- `useRealtimeOrders()` subscribes to order changes and refreshes relevant UI.
- Backend enforces role-aware status transitions.
- Shared order presentation utilities format statuses, timeline, and actions.

Important files:
- `frontend/src/hooks/useRealtimeOrders.js`
- `frontend/src/lib/orderPresentation.js`
- `frontend/src/components/common/OrderStatusBadge.jsx`
- `frontend/src/pages/OrdersPage.jsx`
- `frontend/src/pages/OwnerDashboardPage.jsx`
- `frontend/src/pages/DeliveryDashboardPage.jsx`
- `backend/src/controllers/orderController.js`
- `backend/src/controllers/deliveryController.js`
- `supabase/migrations/0001_initial_schema.sql`

Current limitations:
- Realtime refresh currently reloads lists instead of applying granular local patches.
- No order event history table exists yet.
- Delivery assignment is manual claim-based, not optimized dispatch.

Future scope:
- Add `order_events` audit table.
- Add smarter delivery assignment rules.
- Add realtime notifications/toasts.
- Add ETA calculation and delivery map tracking.

### 11. Owner Restaurant Setup

Status:
- Implemented

What it does:
- Allows owners to create restaurant profiles.
- Lets owners switch between owned restaurants.
- Enables menu management only after a restaurant exists.

How it was achieved:
- Owner dashboard calls `listOwnerRestaurants()` and `createRestaurant()`.
- Backend creates restaurants with `owner_id` from the authenticated owner profile.
- UI shows the active restaurant and connects menu management to that restaurant.

Important files:
- `frontend/src/pages/OwnerDashboardPage.jsx`
- `frontend/src/services/restaurantService.js`
- `backend/src/controllers/restaurantController.js`
- `backend/src/routes/restaurantRoutes.js`

Current limitations:
- Restaurant edit flow is not fully exposed in UI.
- Logo, cover image, operating hours, and availability controls are not implemented.

Future scope:
- Add restaurant edit form.
- Add Cloudinary uploads for logo and cover images.
- Add open/closed scheduling and pause restaurant controls.

### 12. Owner Menu Add/Edit

Status:
- Implemented

What it does:
- Allows owners to add menu items.
- Allows owners to edit existing menu items.
- Supports name, description, category, price, vegetarian flag, and availability.

How it was achieved:
- `OwnerMenuManager` contains create/edit forms.
- `restaurantService` exposes `listMenuItems`, `createMenuItem`, and `updateMenuItem`.
- Backend menu controller validates paise values.
- Backend ownership checks ensure owners can only manage menu items for restaurants they own.

Important files:
- `frontend/src/components/owner/OwnerMenuManager.jsx`
- `frontend/src/pages/OwnerDashboardPage.jsx`
- `frontend/src/services/restaurantService.js`
- `backend/src/controllers/menuController.js`
- `backend/src/routes/menuRoutes.js`

Current limitations:
- Menu item image upload is not wired into the UI yet.
- Delete/archive menu item is not implemented.
- Bulk availability controls are not implemented.

Future scope:
- Add Cloudinary image upload for each item.
- Add delete or soft-delete menu items.
- Add category grouping and drag/reorder controls.

### 13. Owner Subscription Management Panel

Status:
- Partially implemented

What it does:
- Shows subscription state to restaurant owners.
- Can refresh subscription status.
- Can start a Razorpay checkout attempt when a plan ID is provided.

How it was achieved:
- Owner dashboard has a subscription panel behind `Manage subscription`.
- Frontend calls `getSubscriptionStatus()` and `createSubscriptionCheckout()`.
- Backend exposes `/subscriptions/me`, `/subscriptions/checkout`, and `/subscriptions/verify`.
- Razorpay config is read from backend env vars.

Important files:
- `frontend/src/pages/OwnerDashboardPage.jsx`
- `frontend/src/components/owner/SubscriptionBanner.jsx`
- `frontend/src/services/subscriptionService.js`
- `backend/src/controllers/subscriptionController.js`
- `backend/src/config/razorpay.js`

Current limitations:
- Razorpay webhook verification is not implemented.
- Subscription activation is not fully automated.
- Checkout is blocked if Razorpay keys or plan ID are missing.

Future scope:
- Implement Razorpay webhook endpoint.
- Verify payment signatures.
- Add idempotency handling.
- Sync subscription status into restaurant access/visibility.

### 14. Delivery Dashboard and Dispatch Queue

Status:
- Implemented first version

What it does:
- Shows open pickup jobs to delivery users.
- Allows delivery users to claim an accepted/preparing order.
- Allows delivery users to update order status through pickup, on the way, and delivered.

How it was achieved:
- Backend exposes `/delivery/queue` and `/delivery`.
- Delivery dashboard fetches available and assigned orders.
- Realtime order updates refresh delivery queues.
- Backend restricts delivery users from claiming already assigned orders.

Important files:
- `frontend/src/pages/DeliveryDashboardPage.jsx`
- `frontend/src/services/deliveryService.js`
- `backend/src/controllers/deliveryController.js`
- `backend/src/routes/deliveryRoutes.js`
- `backend/src/controllers/orderController.js`

Current limitations:
- No location tracking.
- No delivery partner availability status.
- No auto-assignment or distance-based matching.

Future scope:
- Add delivery partner online/offline toggle.
- Add assignment algorithm.
- Add map/location support.
- Add delivery earnings summary.

### 15. Profile Page

Status:
- Implemented basic version

What it does:
- Displays logged-in user identity, role, email, phone placeholder, and profile UUID.

How it was achieved:
- Profile page reads `user` and `profile` from auth store.
- Role badge component displays user role.
- Legacy avatar asset is used for visual continuity.

Important files:
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/components/common/RoleBadge.jsx`
- `frontend/src/store/authStore.js`

Current limitations:
- Profile editing is not implemented.
- Avatar upload is not implemented.
- Phone update is not implemented.

Future scope:
- Add edit profile form.
- Add avatar upload through Cloudinary or Supabase Storage.
- Add phone verification if needed.

### 16. Service Layer and API Client

Status:
- Implemented

What it does:
- Centralizes frontend API calls.
- Automatically attaches Supabase access token to backend requests.
- Separates auth, restaurant, order, delivery, subscription, and upload service functions.

How it was achieved:
- `apiClient.js` reads the Supabase session and attaches `Authorization: Bearer <token>`.
- Domain services call backend endpoints.

Important files:
- `frontend/src/services/apiClient.js`
- `frontend/src/services/authService.js`
- `frontend/src/services/restaurantService.js`
- `frontend/src/services/orderService.js`
- `frontend/src/services/deliveryService.js`
- `frontend/src/services/subscriptionService.js`
- `frontend/src/services/uploadService.js`

Future scope:
- Add retry handling for transient failures.
- Add typed response contracts.
- Add better user-facing error mapping.

### 17. Cloudinary Upload Preparation

Status:
- Integration-ready foundation

What it does:
- Provides config and service placeholders for media upload signing.

How it was achieved:
- Backend has Cloudinary config and upload route/controller.
- Frontend has upload service for requesting upload signatures.

Important files:
- `backend/src/config/cloudinary.js`
- `backend/src/controllers/uploadController.js`
- `backend/src/routes/uploadRoutes.js`
- `frontend/src/services/uploadService.js`

Current limitations:
- Upload UI is not implemented.
- Signed upload response still needs full production hardening.

Future scope:
- Add owner logo upload.
- Add restaurant cover upload.
- Add menu item image upload.
- Add file validation and image transformation presets.

## Known Gaps and Risks

Current MVP gaps:
- Customer address management is not implemented.
- Customer menu browsing should be fully connected to real restaurant-specific menu items.
- `orders.items` should eventually move to a normalized `order_items` table.
- `order_events` should be added for auditability.
- Razorpay webhook verification is not complete.
- Cloudinary upload UI is not complete.
- Delivery dispatch is manual and basic.
- There are no automated tests yet.

Current operational risks:
- Service role key must stay backend-only.
- Rerunning the latest Supabase migration is required after schema policy changes.
- Realtime depends on Supabase publication settings being applied.
- Friend/teammate machines need their own `frontend/.env` and `backend/.env` files.

## Suggested Future Scope

Priority 1:
- Add customer address CRUD and default address selection.
- Connect customer menu browsing to real `menu_items`.
- Add restaurant detail page and real cart creation from selected restaurant.
- Add profile editing for all roles.

Priority 2:
- Add `order_items` table and migrate away from JSONB-only item storage.
- Add `order_events` table for status history and auditing.
- Add customer-facing order timeline from real event data.
- Add notification/toast system for realtime events.

Priority 3:
- Complete Razorpay webhook verification and subscription activation.
- Complete Cloudinary image upload flows.
- Add restaurant availability controls and operating hours.
- Add delivery partner availability and auto-assignment.

Priority 4:
- Add tests for auth, restaurant creation, menu management, order placement, and status transitions.
- Add rate limiting, validation, structured logging, and monitoring.
- Add deployment docs and environment setup checklists.
- Add demo seed data for local testing.

## Recommended Next Feature

The strongest next feature is customer address management plus real restaurant-specific menu browsing.

Reason:
- It completes the customer ordering path.
- It removes dependency on sample menu items.
- It makes order placement more realistic.
- It prepares the app for proper delivery flow and order history.

Suggested implementation:
- Add frontend address page or profile address section.
- Add backend address endpoints.
- Add customer address selection on checkout.
- Add restaurant detail/menu route.
- Load menu items from `menu_items` by selected restaurant ID.
- Store selected address ID in `orders.delivery_address_id`.
