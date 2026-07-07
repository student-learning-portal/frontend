# Student Learning Portal — Frontend

Next.js (App Router) frontend for the Student Learning Portal, talking to
the Go backend over its REST API (`../backend`). Server Components / Server
Actions call the backend directly with the caller's JWT; there is no
separate client-side API layer.

## Prerequisites
- Node.js 22+
- The backend running and reachable (see `../backend/README.md`), or the
  shared dev stack in `../infra`.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

The app reads exactly one backend-related variable, server-side only:

| Variable | Meaning |
|---|---|
| `BACKEND_URL` | Base URL of the Go backend, e.g. `http://localhost:8080`. Read directly via `process.env.BACKEND_URL` in every `src/lib/api/*.ts` file — there is no client-side/`NEXT_PUBLIC_*` variant in the current code. |
| `AUTH_SECRET` | NextAuth session encryption secret. |
| `AUTH_TRUST_HOST` | Set `true` when running behind a reverse proxy. |

There is no `.env.example` inside `frontend/` — these are documented (and
templated) in `../infra/.env.example` / `../infra/README.md` for the shared
Compose stack. Note: `../infra/.env.example` currently defines
`NEXT_PUBLIC_API_URL` rather than `BACKEND_URL`; that variable is not read
anywhere in this app's source, so set `BACKEND_URL` directly when running the
frontend outside of `infra`'s Compose stack.

## Project structure

```
src/app/            Next.js App Router pages
src/components/     Reusable UI (AppShell, CourseCard, LoginForm, nav bar, generic UI/ widgets, ...)
src/lib/api/        Server-side fetch wrappers around the Go backend (one file per resource)
src/lib/actions.ts  Server Actions
src/lib/hooks.ts    Shared client-side hooks
src/models/         Domain types (Course, Lesson, User)
src/types/          next-auth session/JWT augmentation, misc prop types
src/constants/      App-wide constants (icon names, nav links, sort options)
src/auth.ts         NextAuth v5 setup (Credentials provider → backend /auth/login)
src/auth.config.ts  Route-gating + JWT/session callbacks (no providers — kept separate so middleware can import it without pulling in the Credentials provider)
```

`@reduxjs/toolkit` / `react-redux` are listed in `package.json` but there is
currently no store, slice, or `<Provider>` anywhere in `src` — treat them as
an unused/planned dependency, not a wired-up state layer.

### Routes (`src/app`)

| Route | Purpose |
|---|---|
| `/` | Redirects to `/login` |
| `/login`, `/registration` | Auth forms (route group `(auth)`) |
| `/catalog` | Course catalog: search, subject/price filter, sort |
| `/course` | Course detail — locked (buy CTA) vs. unlocked (open lessons CTA) view |
| `/course/lessons` | Lesson list for a course |
| `/course/lesson` | Lesson player (video/media, resume-position tracking) |
| `/dashboard` | Student home |
| `/dashboard/my-courses`, `/payments`, `/results`, `/settings` | Student account pages |
| `/dashboard/teacher` | Teacher analytics — learner activity / at-risk ranking |
| `/dashboard/teacher/courses`, `/courses/new`, `/courses/[id]`, `/courses/[id]/lessons/[lessonId]` | Teacher course/lesson authoring (create, edit, manage content) |

## Auth

NextAuth v5 (beta), Credentials provider only:
- `src/auth.ts` calls `authorizeUser()` (`src/lib/api/auth.ts`), which `POST`s
  email/password to the Go backend's `/api/v1/auth/login`.
- The backend's JWT becomes `session.accessToken` via the `jwt`/`session`
  callbacks in `src/auth.config.ts`; every `src/lib/api/*.ts` call attaches it
  as `Authorization: Bearer <token>` when calling the backend.
- `src/auth.config.ts`'s `authorized()` callback gates `/dashboard`,
  `/catalog`, and `/course` behind a session, and bounces a logged-in user
  away from public routes (e.g. `/login`) back to `/dashboard`.
- `src/types/next-auth.d.ts` augments the session/JWT/User types with
  `fullName`, `role` (`teacher`/`student`), and the backend `accessToken`.

## Testing

```bash
npm test          # vitest run
npm run test:watch
```

Current suite is small — 2 files:
- `src/app/course/lesson/__tests__/LessonViewer.test.tsx` — resume-seek
  behavior (seeks to the last saved position on `loadedmetadata`, never seeks
  past the media duration).
- `src/app/course/__tests__/CourseDetail.test.tsx` — locked vs. unlocked
  course detail rendering.

**Known issue:** `CourseDetail.test.tsx` currently fails to even load
(`Cannot find module '.../node_modules/next/server' imported from
next-auth/lib/env.js`) — a Next 16 / `next-auth@5.0.0-beta.31` resolution
incompatibility, not a bug in the test itself. Only the `LessonViewer` suite
runs today. See "Test Coverage Baseline" below for the numbers this produces.
`lib/api/*`, the auth callbacks, and the teacher-analytics ranking logic
(the most non-trivial pure logic in the app) currently have no tests at all.

## Test Coverage Baseline

Snapshot from 2026-07-07 (`npx vitest run --coverage`, `@vitest/coverage-v8`):
with the broken suite excluded, overall statement coverage is **~4.6%** —
effectively just `LessonViewer.tsx` (~54%) and a couple of small UI/constants
files picked up incidentally. Nothing under `src/lib/api`, `src/auth*.ts`, or
`src/app/dashboard/teacher` is exercised by an automated test. Re-run the
command above for a current number before relying on this snapshot.

## Linting

```bash
npm run lint
```
Currently clean (no errors/warnings from ESLint itself). You may see a Node
`MODULE_TYPELESS_PACKAGE_JSON` warning because `package.json` lacks
`"type": "module"` while `eslint.config.js` uses ESM syntax — cosmetic, does
not affect the lint result.
