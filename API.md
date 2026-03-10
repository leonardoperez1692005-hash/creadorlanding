# BrandVortix — API Reference

Base URL: `https://<your-domain>` (e.g. `https://app.brandvortix.com`)

---

## Table of Contents

1. [GET /api/health](#get-apihealth)
2. [POST /api/leads/capture](#post-apileadscapture)
3. [POST /api/license/verify](#post-apilicenseverify)
4. [GET /api/license/projects](#get-apilicenseprojects)
5. [GET /api/license/project/:slug](#get-apilicenseprojectslug)
6. [GET /api/intelligence/dashboard](#get-apiintelligencedashboard)

---

## GET /api/health

Health check endpoint. Returns server status and current timestamp.

| Property          | Value |
| ----------------- | ----- |
| **Auth required** | No    |
| **Rate limiting** | None  |

### Response

```json
{
    "status": "ok",
    "timestamp": "2026-03-06T12:00:00.000Z"
}
```

### Example

```bash
curl https://app.brandvortix.com/api/health
```

---

## POST /api/leads/capture

Public endpoint for capturing leads from published landing pages. Uses the Supabase service role (no user session required). Supports CORS for cross-origin form submissions.

| Property          | Value                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| **Auth required** | No (public endpoint)                                                       |
| **Rate limiting** | Same email + project blocked within 5 minutes (duplicate prevention)       |
| **CORS**          | Yes — responds to OPTIONS preflight and sets `Access-Control-Allow-Origin` |

### Request Body

| Field       | Type     | Required | Validation                       |
| ----------- | -------- | -------- | -------------------------------- |
| `projectId` | `string` | Yes      | Must be a valid UUID             |
| `email`     | `string` | Yes      | Valid email, max 320 chars       |
| `name`      | `string` | No       | Max 200 chars, defaults to `""`  |
| `phone`     | `string` | No       | Max 30 chars, defaults to `""`   |
| `source`    | `string` | No       | Max 200 chars, defaults to `""`  |
| `message`   | `string` | No       | Max 2000 chars, defaults to `""` |

### Responses

**201 Created** — Lead captured successfully:

```json
{
    "message": "Lead capturado",
    "leadId": "uuid-of-new-lead"
}
```

**400 Bad Request** — Validation error:

```json
{
    "error": "Email inválido"
}
```

**404 Not Found** — Project does not exist:

```json
{
    "error": "Proyecto no encontrado"
}
```

**429 Too Many Requests** — Duplicate email within 5-minute window:

```json
{
    "error": "Recibimos tu solicitud hace poco. Por favor, esperá unos minutos."
}
```

**500 Internal Server Error**:

```json
{
    "error": "Error al guardar lead"
}
```

### Example

```bash
curl -X POST https://app.brandvortix.com/api/leads/capture \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+5491112345678",
    "source": "landing-hero-form",
    "message": "Interested in your product"
  }'
```

---

## POST /api/license/verify

Verifies a license key and returns license + user details. Uses the service role to query licenses and profiles.

| Property          | Value                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| **Auth required** | No (uses license key)                                                       |
| **Rate limiting** | 10 attempts per IP per 15 minutes (via Upstash Redis or in-memory fallback) |

### Request Body

| Field | Type     | Required | Description               |
| ----- | -------- | -------- | ------------------------- |
| `key` | `string` | Yes      | The license key to verify |

### Responses

**200 OK** — Valid license:

```json
{
    "valid": true,
    "license": {
        "key": "SL-XXXX-XXXX-XXXX",
        "domain": "client-domain.com",
        "userId": "user-uuid",
        "userName": "John Doe",
        "userEmail": "john@example.com"
    }
}
```

**200 OK** — Invalid license (various reasons):

```json
{
    "valid": false,
    "error": "Licencia no encontrada"
}
```

Possible `error` values:

- `"Licencia no encontrada"` — key does not exist
- `"Licencia suspended"` / `"Licencia revoked"` — license status is not `active`
- `"Licencia expirada"` — license past `expires_at` (also updates status to `expired` in DB)
- `"Usuario inactivo. Contacta al administrador."` — profile status is not `active`
- `"Dominio no autorizado para esta licencia"` — request domain does not match `license.domain`

**400 Bad Request** — Missing key:

```json
{
    "valid": false,
    "error": "License key es requerida"
}
```

**429 Too Many Requests** — Rate limit exceeded:

```json
{
    "valid": false,
    "error": "Demasiados intentos. Intentá más tarde."
}
```

**500 Internal Server Error**:

```json
{
    "valid": false,
    "error": "Error de verificación"
}
```

### Example

```bash
curl -X POST https://app.brandvortix.com/api/license/verify \
  -H "Content-Type: application/json" \
  -d '{"key": "SL-XXXX-XXXX-XXXX"}'
```

---

## GET /api/license/projects

Lists all compiled projects (with `html_output`) for the user associated with the provided license key. Used by external integrations (e.g. WordPress plugin) to fetch available landing pages.

| Property          | Value                            |
| ----------------- | -------------------------------- |
| **Auth required** | Yes — via `x-license-key` header |
| **Rate limiting** | None (beyond license validation) |

### Request Headers

| Header          | Required | Description        |
| --------------- | -------- | ------------------ |
| `x-license-key` | Yes      | Active license key |

### Responses

**200 OK** — Success:

```json
{
    "projects": [
        {
            "id": "uuid",
            "slug": "my-landing",
            "name": "My Landing Page",
            "structure_type": "vsl",
            "updated_at": "2026-03-06T12:00:00.000Z"
        }
    ]
}
```

**400 Bad Request** — Missing header:

```json
{
    "error": "x-license-key header requerido"
}
```

**403 Forbidden** — Invalid, inactive, or expired license:

```json
{
    "error": "Licencia inválida, inactiva o expirada"
}
```

**500 Internal Server Error**:

```json
{
    "error": "Error al obtener proyectos"
}
```

### Example

```bash
curl https://app.brandvortix.com/api/license/projects \
  -H "x-license-key: SL-XXXX-XXXX-XXXX"
```

---

## GET /api/license/project/:slug

Returns the compiled HTML output for a specific project by slug. Used by external integrations to fetch the full HTML of a landing page for rendering.

| Property          | Value                            |
| ----------------- | -------------------------------- |
| **Auth required** | Yes — via `x-license-key` header |
| **Rate limiting** | None (beyond license validation) |

### URL Parameters

| Parameter | Type     | Description      |
| --------- | -------- | ---------------- |
| `slug`    | `string` | The project slug |

### Request Headers

| Header          | Required | Description        |
| --------------- | -------- | ------------------ |
| `x-license-key` | Yes      | Active license key |

### Responses

**200 OK** — Success:

```json
{
    "slug": "my-landing",
    "html": "<!DOCTYPE html><html>...</html>"
}
```

**400 Bad Request** — Missing header:

```json
{
    "error": "x-license-key header requerido"
}
```

**403 Forbidden** — Invalid, inactive, or expired license:

```json
{
    "error": "Licencia inválida, inactiva o expirada"
}
```

**404 Not Found** — Project not found or no compiled HTML:

```json
{
    "error": "Proyecto no encontrado"
}
```

or

```json
{
    "error": "Proyecto sin HTML compilado"
}
```

### Example

```bash
curl https://app.brandvortix.com/api/license/project/my-landing \
  -H "x-license-key: SL-XXXX-XXXX-XXXX"
```

---

## GET /api/intelligence/dashboard

Returns the latest political intelligence dashboard as raw HTML. Requires an authenticated user session (cookie-based auth via Supabase).

| Property          | Value                       |
| ----------------- | --------------------------- |
| **Auth required** | Yes — user session (cookie) |
| **Rate limiting** | None                        |
| **Content-Type**  | `text/html; charset=utf-8`  |

### Responses

**200 OK** — Returns raw HTML content:

```
Content-Type: text/html; charset=utf-8

<html>...dashboard content...</html>
```

**401 Unauthorized** — No active session:

```json
{
    "error": "No autenticado"
}
```

**404 Not Found** — No dashboard generated yet (returns HTML):

```html
<h1>No hay dashboard generado</h1>
<p>Genera un reporte desde la sección de Inteligencia.</p>
```

**500 Internal Server Error** (returns HTML):

```html
<h1>Error</h1>
<p>No se pudo cargar el dashboard.</p>
```

### Example

```bash
# Requires a valid session cookie
curl https://app.brandvortix.com/api/intelligence/dashboard \
  -H "Cookie: sb-access-token=eyJ...; sb-refresh-token=eyJ..."
```

---

## Rate Limiting Details

The rate limiting system (`src/shared/lib/rate-limit.ts`) supports two backends:

1. **Upstash Redis** (recommended for production) — set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables. Provides persistent, cross-instance rate limiting with fixed-window algorithm.

2. **In-memory fallback** — automatically used when Upstash env vars are not configured. Works for single-instance deployments but resets on restart and does not share state across instances.

Currently rate-limited endpoints:

- `POST /api/license/verify` — 10 requests per IP per 15 minutes
- `POST /api/leads/capture` — 1 submission per email+project per 5 minutes (duplicate prevention via DB query, not the rate-limit lib)

---

## Authentication Methods

| Method                 | Used by                                               | Description                                                |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| **Session cookie**     | Dashboard pages, `/api/intelligence/dashboard`        | Supabase Auth session via `createClient()` (reads cookies) |
| **License key header** | `/api/license/projects`, `/api/license/project/:slug` | `x-license-key` header validated against `licenses` table  |
| **License key body**   | `/api/license/verify`                                 | `key` field in JSON request body                           |
| **None (public)**      | `/api/health`, `/api/leads/capture`                   | No authentication required                                 |
