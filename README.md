# Taskbook 

Taskbook is a small project: a clean REST API for tasks with auth and roles, plus a minimal React UI to kick the tires. It aims to be readable, easy to run, and practical for interviews or small demos.

## What you get

- Auth with email/password and JWT
- Roles: `user` and `admin`
- Task CRUD with validation and ownership checks
- React dashboard wired to the API
- Postman collection and inline docs
- A short, realistic note on scaling

## Quick start

1) Clone and install
```bash
git clone https://github.com/<your-org-or-user>/<your-repo>.git
npm install
```

2) Run the app
```bash
npm run dev
```
Open `http://localhost:5173`.

3) Log in
- Admin: `admin@example.com` / `admin123`
- Or register a new user

## API:

For quick testing, import `postman_collection.json` and set `baseUrl = http://localhost:5173/api`.

- POST `/register` — create a user. Needs `email`, `password` (>=6), `fullName` (>=2). Returns a token.
- POST `/login` — get a token. Needs `email`, `password`.
- GET `/verify` — check your token; returns the current user.
- GET `/users` — list all users. Admin only.

Tasks
- POST `/tasks` — create a task. Needs `title` (>=3). Optional `description`, `status` (`pending|in_progress|completed`), `priority` (`low|medium|high`).
- GET `/tasks` — your tasks if you’re a user; all tasks if you’re admin.
- GET `/tasks/:id` — read one. Owners or admin only.
- PUT `/tasks/:id` — update fields. Owners or admin only.
- DELETE `/tasks/:id` — delete. Owners or admin only.

Responses follow this shape:
```json
{
  "success": true,
  "data": {},
  "statusCode": 200
}
```
On errors you’ll also get `error.message` and sometimes `error.errors[]` with field messages.

Use the Postman collection `postman_collection.json`. Set `baseUrl = http://localhost:5173/api`. The login request saves `{{token}}` for the rest.

## Frontend notes

The UI is simple. Log in or register, then create/edit tasks from the dashboard. If you’re admin, you will see a Users table. Styling is Tailwind; components live under `src/components/*`.

## Roles and guardrails

- Users see and edit only their own tasks.
- Admins can see everything and call the `/users` endpoint.
- Tokens expire in 24h. Passwords are hashed with bcrypt.

## Where things live

```
src/
├─ api/          # API logic (auth, tasks, in-memory db)
├─ components/   # React screens & bits
├─ context/      # Auth context
└─ types/        # TypeScript types
```

This project serves the API from Vite for convenience in dev. For production, lift the code in `src/api` into an Express app or serverless functions.

## Scaling this without overthinking it

- Split services: auth, tasks, users behind an API gateway when it grows.
- Use a real DB (Postgres), add indexes on `userId`, `status`, `createdAt`.
- Cache hot reads (Redis). Invalidate on writes.
- Run multiple app instances behind a load balancer; store sessions in Redis if needed.
- Add pagination, filtering, and rate limits.

## Build & deploy

```bash
npm run build
```
Deploy `/dist` to a static host for the frontend. Host the API on Node/Express or serverless.
