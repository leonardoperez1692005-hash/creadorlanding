# Seguridad — BrandVortix

> Última actualización: 2026-03-09

---

## Modelo de Amenazas

BrandVortix es un **creador de landing pages con IA** que maneja:

- Credenciales de usuario (Supabase Auth)
- Contenido generado por IA (Gemini)
- Datos de marca y estrategia (confidenciales)
- Leads capturados desde landings publicadas
- Claves de licencia para integración API

**NO maneja**: pagos directos, datos de tarjetas, ni información médica/legal.

---

## Capas de Defensa

### 1. Autenticación (Supabase Auth)

| Componente         | Implementación                                         |
| ------------------ | ------------------------------------------------------ |
| Session management | Supabase SSR cookies (HttpOnly, Secure, SameSite=Lax)  |
| Server-side auth   | `createClient()` en `src/lib/supabase/server.ts`       |
| Client-side auth   | `createClient()` en `src/lib/supabase/client.ts`       |
| Admin operations   | `createServiceClient()` (bypass RLS, service_role_key) |
| License auth       | Header `x-license-key` para API pública                |
| Middleware         | `src/middleware.ts` — verifica auth en cada request    |

**Flujo de autenticación:**

```
Request → middleware.ts → Supabase getUser()
  ├── Autenticado → continuar
  ├── No autenticado + ruta protegida → redirect /login
  └── No autenticado + ruta pública → continuar
```

### 2. Content Security Policy (CSP)

- **Nonce por request**: Generado criptográficamente en `middleware.ts`
- **strict-dynamic**: Solo scripts con nonce válido se ejecutan
- **Política dual**:
    - App (`/dashboard`, `/wizard`): CSP estricto
    - Landings publicadas (`/p/`): CSP relajado para embeds

```
script-src 'nonce-{random}' 'strict-dynamic';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://*.supabase.co;
form-action 'self';
base-uri 'self';
```

### 3. Rate Limiting (Upstash Redis)

| Endpoint                      | Key                       | Límite  | Identificador |
| ----------------------------- | ------------------------- | ------- | ------------- |
| `/api/exports/pdf`            | `export-pdf:{userId}`     | 10/60s  | User ID       |
| `/api/exports/docx`           | `export-docx:{userId}`    | 10/60s  | User ID       |
| `/api/exports/xlsx`           | `export-xlsx:{userId}`    | 10/60s  | User ID       |
| `/api/exports/pptx`           | `export-pptx:{userId}`    | 10/60s  | User ID       |
| `/api/exports/summary`        | `export-summary:{userId}` | 10/60s  | User ID       |
| `/api/exports/widget`         | `widget:{ip}`             | 60/60s  | IP            |
| `/api/license/verify`         | `license:{ip}`            | 10/900s | IP            |
| `/api/license/projects`       | `license-projects:{ip}`   | 20/60s  | IP            |
| `/api/license/project/[slug]` | `license-project:{ip}`    | 30/60s  | IP            |
| `/api/leads/capture`          | `leads:{ip}`              | 20/60s  | IP            |
| `/api/health`                 | `health:{ip}`             | 60/60s  | IP            |
| `/api/intelligence/dashboard` | Session-based             | —       | Session       |

**Backend**: Upstash Redis (producción) con fallback in-memory (desarrollo).
**Implementación**: `src/shared/lib/rate-limit.ts`

### 4. Protección XSS

| Medida                                     | Ubicación                                              |
| ------------------------------------------ | ------------------------------------------------------ |
| DOMPurify                                  | `isomorphic-dompurify` — sanitiza HTML generado por IA |
| CSP con nonce                              | Bloquea scripts inyectados                             |
| Zod validation                             | Valida inputs antes de procesarlos                     |
| No `dangerouslySetInnerHTML` sin sanitizar | Regla del proyecto                                     |

### 5. Validación de Inputs (Zod)

- **100% de Server Actions** usan `safeParse()` (nunca `parse()` directo)
- **Patrón obligatorio**:

```typescript
const parsed = Schema.safeParse(input)
if (!parsed.success) return { error: 'Datos inválidos' }
```

### 6. Row-Level Security (RLS)

- PostgreSQL RLS policies en Supabase
- Cada tabla con policies por rol (anon, authenticated, service_role)
- `createServiceClient()` solo para operaciones admin explícitas

### 7. Validación de Entorno

- `src/lib/env.ts` — lazy getters con validación explícita
- `validateEnv()` se ejecuta al iniciar — falla ruidosamente si faltan variables
- Secrets NUNCA en código — solo en env vars

### 8. Observabilidad de Seguridad

| Componente          | Implementación                                   |
| ------------------- | ------------------------------------------------ |
| Logger estructurado | `src/shared/lib/logger.ts` (JSON en prod)        |
| Sentry              | Client + Server + Edge                           |
| Audit logging       | `audit_logs` table (migración pendiente en prod) |

### 9. Headers de Seguridad

Configurados en `next.config.ts`:

| Header                      | Valor                                      |
| --------------------------- | ------------------------------------------ |
| `X-Content-Type-Options`    | `nosniff`                                  |
| `X-Frame-Options`           | `SAMEORIGIN`                               |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`      |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy`   | Per-request nonce (middleware)             |

### 10. CORS

- Solo habilitado en `/api/leads/capture` (captura de leads desde landings externas)
- Resto de API: same-origin only

---

## Pendientes para Score 9+

1. `npm audit` con 0 vulnerabilidades críticas
2. 2FA para admin
3. Penetration testing documentado
4. SAST integrado en CI
5. Rotación de secrets documentada

---

## Reporte de Vulnerabilidades

Si encontrás una vulnerabilidad, contactá al equipo de desarrollo directamente. No publicar vulnerabilidades sin notificación previa.
