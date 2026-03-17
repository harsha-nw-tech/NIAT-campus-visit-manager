# Workspace

## Overview

NIAT Campus Visit Manager — A production-ready fullstack internal tool for managing campus visits and walk-in users. Built for admins and sales staff.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite (Wouter routing, TanStack Query)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── middlewares/ # auth.ts — JWT auth middleware
│   │       ├── routes/      # auth.ts, search.ts, campus.ts, admin.ts, logs.ts
│   │       └── services/    # niatClient.ts, templateService.ts, authService.ts
│   └── niat-campus/        # React + Vite frontend (preview: /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/
│       └── src/schema/     # users.ts, auditLogs.ts
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Auth

- Token-based (simple HMAC-signed JWT in localStorage)
- Roles: `admin` | `sales`
- Default admin seeded on first startup: `phoneNumber=admin, password=admin123`
- Login: `POST /api/auth/login`

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | public | Login |
| POST | /api/search-user | any | Search NIAT user by phone |
| POST | /api/get-completion | any | Get campus visit completion % |
| POST | /api/mark-visited | sales | Mark campus visited (logs audit) |
| POST | /api/generate-link | any | Generate direct visit link (runs template init first) |
| POST | /api/admin/create-sales | admin | Create a sales user |
| GET | /api/admin/sales-users | admin | List all sales users |
| GET | /api/logs | any | Audit logs (filterable by phoneNumber, performedBy) |

## External API Integration

All NIAT API calls go through `artifacts/api-server/src/services/niatClient.ts`. Template initialization happens in `templateService.ts` before link generation.

## Environment Variables (Required Secrets)

- `GAMMA_NIAT_API_BASE_URL` — NIAT API base URL
- `GAMMA_NIAT_API_KEY` — NIAT API key
- `COMMON_DATA_CLIENT_KEY_DETAILS_ID` — Used in template response API
- `TEMPLATE_ID`, `SECTION_ID`, `FIELD_ID` — Template configuration

## Database Schema

- `users` — id, phoneNumber, password (sha256), role
- `audit_logs` — id, actionType, performedBy, performerPhone, targetUserId, applicationId, phoneNumber, timestamp

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Run `pnpm run typecheck` from root for full check.

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — full typecheck with project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client & Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
