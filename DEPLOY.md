# Guía de Deployment — BrandVortix

## Pre-requisitos

- Cuenta en [Vercel](https://vercel.com) (o cualquier plataforma con soporte Next.js)
- Proyecto en [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage)
- API key de [Google Gemini](https://ai.google.dev/) (para funciones de IA)

## Variables de entorno

### Requeridas

| Variable                        | Descripción                                               |
| ------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase (ej: `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase (pública, OK en cliente)        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clave de servicio (NUNCA exponer al cliente)              |
| `GEMINI_API_KEY`                | API key de Google Gemini                                  |

### Opcionales (recomendadas para producción)

| Variable                   | Descripción                                      |
| -------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SENTRY_DSN`   | DSN de Sentry (error tracking en producción)     |
| `UPSTASH_REDIS_REST_URL`   | URL de Upstash Redis (rate limiting persistente) |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash Redis                           |
| `FIRECRAWL_API_KEY`        | API key de Firecrawl (scraping de competidores)  |
| `PERPLEXITY_API_KEY`       | API key de Perplexity (análisis de mercado)      |

## Deploy en Vercel

1. Conectar el repositorio en Vercel
2. Configurar las variables de entorno en Settings > Environment Variables
3. Deploy automático en cada push a `main`

## Migraciones SQL

Ejecutar en el SQL Editor de Supabase (en orden):

1. `supabase/migrations/20260305000001_create_tables.sql`
2. `supabase/migrations/20260305000002_expand_brand_identity.sql`
3. `supabase/migrations/20260306000001_audit_logs.sql`
4. `supabase/migrations/20260306000002_political_intel_reports.sql`

## Post-deploy checklist

- [ ] Verificar `/api/health` retorna `{ status: "ok" }`
- [ ] Verificar `/login` carga correctamente con CSP header
- [ ] Verificar `/p/test-slug` retorna 404 (no redirect a /login)
- [ ] Crear usuario de prueba y completar onboarding
- [ ] Crear landing page de prueba y publicar
- [ ] Verificar que la landing publicada es accesible sin auth

## Rate Limiting

Sin Upstash Redis configurado, el rate limiting usa memoria in-process (se resetea con cada deploy/restart). Para producción, se recomienda configurar Upstash Redis (free tier suficiente).

## Monitoreo

- **Health check**: `GET /api/health` — para load balancers y uptime monitoring
- **Logs**: Structured JSON logging en producción (compatible con cualquier log aggregator)
- **Errores**: Sentry integrado — configurar `NEXT_PUBLIC_SENTRY_DSN` para activar. El logger (`src/shared/lib/logger.ts`) reenvía automáticamente errores y warnings a Sentry en producción.
- **API docs**: Ver `API.md` para documentación completa de endpoints.
