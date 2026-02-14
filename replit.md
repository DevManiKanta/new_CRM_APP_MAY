# FollowUp CRM

## Overview

FollowUp CRM is a mobile-first Customer Relationship Management application built with Expo (React Native). It helps users track customer interactions, manage follow-ups, and monitor sales pipeline status. The app organizes customers into three tabs (Active, Follow Later, Completed), supports status tracking through various stages (not responded, busy, picked call, asked time, interested, completed), and provides a stats dashboard with call logging.

The project uses a dual architecture: an Expo/React Native frontend for cross-platform mobile and web support, paired with an Express.js backend server. Data persistence is configured with PostgreSQL via Drizzle ORM, though the current implementation primarily uses in-memory/client-side state management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: File-based routing via `expo-router` with typed routes enabled. The app directory structure defines the navigation:
  - `app/index.tsx` — Login screen (root)
  - `app/signup.tsx` — Registration screen
  - `app/(tabs)/` — Main tab navigation with 4 tabs: Active, Follow Later, Completed, Stats
  - `app/customer/[id].tsx` — Individual customer detail screen
- **State Management**: React Context API with two main providers:
  - `AuthContext` — Handles authentication state using AsyncStorage for credential persistence
  - `CustomerContext` — Manages customer data, filtering, search, status updates, and call logs
- **Data Fetching**: TanStack React Query is set up with `@/lib/query-client.ts` providing `apiRequest` and `getQueryFn` utilities, though current customer data is managed client-side via context with hardcoded initial data in `@/data/customers.ts`
- **UI/Animations**: React Native Reanimated for animations, expo-haptics for haptic feedback, expo-linear-gradient for gradients, expo-blur for blur effects
- **Fonts**: Inter font family (400, 500, 600, 700 weights) via `@expo-google-fonts/inter`
- **Path Aliases**: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

### Backend (Express.js)

- **Server**: Express 5 running on the same Replit instance, located in `server/`
- **Entry Point**: `server/index.ts` — Sets up CORS (supporting Replit domains and localhost), serves static files in production
- **Routes**: `server/routes.ts` — Currently a skeleton with no API routes defined yet. Routes should be prefixed with `/api`
- **Storage**: `server/storage.ts` — Defines an `IStorage` interface and `MemStorage` implementation. Currently in-memory only, storing users in a Map. This is the layer to swap out for database-backed storage
- **CORS**: Automatically configured for Replit dev/deployment domains and localhost origins

### Database Schema (Drizzle ORM + PostgreSQL)

- **Config**: `drizzle.config.ts` — Uses `DATABASE_URL` environment variable, outputs migrations to `./migrations/`
- **Schema**: `shared/schema.ts` — Currently defines a single `users` table:
  - `id`: VARCHAR primary key with `gen_random_uuid()` default
  - `username`: TEXT, unique, not null
  - `password`: TEXT, not null
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions
- **Push Command**: `npm run db:push` runs `drizzle-kit push` to sync schema to database

### Build & Development

- **Dev Mode**: Two processes needed — `npm run expo:dev` for Expo and `npm run server:dev` for the Express backend
- **Production Build**: `npm run expo:static:build` builds the Expo web app, `npm run server:build` bundles the server with esbuild, `npm run server:prod` runs the production server
- **Proxy Setup**: In development, Expo's packager proxy is configured via environment variables to work with Replit's domain system

### Key Design Decisions

1. **Client-side state vs server API**: Customer data currently lives entirely in React Context with hardcoded initial data. The backend infrastructure (Express + Drizzle + PostgreSQL) is scaffolded but not yet wired up for customer CRUD operations. The `IStorage` interface pattern makes it straightforward to add database-backed implementations.

2. **Authentication**: Currently uses AsyncStorage-based local authentication (no server-side auth). The users table exists in the schema but auth routes haven't been implemented yet.

3. **Shared schema directory**: The `shared/` directory contains schemas used by both frontend and backend, enabling type sharing across the stack.

## External Dependencies

- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable. Used with Drizzle ORM for schema management and queries. Must be provisioned for database features to work.
- **AsyncStorage**: `@react-native-async-storage/async-storage` for client-side persistent storage (currently used for auth credentials)
- **Expo Services**: Standard Expo SDK services (splash screen, fonts, haptics, image picker, location, etc.)
- **TanStack React Query**: For server state management and API data fetching (infrastructure ready, not yet heavily used)
- **No external auth providers**: Authentication is self-managed, no OAuth or third-party auth services integrated