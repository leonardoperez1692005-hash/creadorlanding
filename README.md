# ZentrixOS

Fábrica de landing pages con IA. Crea, personaliza y publica landing pages optimizadas para conversión en minutos.

## Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript strict)
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **IA**: Google Gemini (análisis competitivo, generación de contenido)
- **State**: Zustand + Immer + Zundo (undo/redo)
- **Estilos**: Tailwind CSS v4
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Seguridad**: CSP con nonce, DOMPurify, rate limiting (Upstash Redis)

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus keys de Supabase y servicios IA

# 3. Iniciar servidor de desarrollo
npm run dev
```

## Scripts

| Comando                | Descripción                 |
| ---------------------- | --------------------------- |
| `npm run dev`          | Servidor de desarrollo      |
| `npm run build`        | Build de producción         |
| `npm run start`        | Iniciar build de producción |
| `npm run lint`         | ESLint                      |
| `npm run format`       | Prettier (formatear)        |
| `npm run format:check` | Prettier (verificar)        |
| `npm run typecheck`    | TypeScript check            |
| `npm run test`         | Unit tests (Vitest)         |
| `npm run test:e2e`     | E2E tests (Playwright)      |
| `npm run analyze`      | Bundle analyzer             |

## Estructura

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Register
│   ├── (main)/             # Dashboard, Wizard, Admin (auth required)
│   ├── api/                # API routes (health, leads, license)
│   └── p/[slug]/           # Landing pages públicas
├── features/               # Módulos de negocio
│   ├── admin/              # Panel superadmin
│   ├── attack-plan/        # Plan de ataque marketing
│   ├── auth/               # Acciones de autenticación
│   ├── leads/              # Gestión de leads
│   ├── market-intel/       # Inteligencia de mercado
│   ├── onboarding/         # Brand Identity setup
│   ├── strategy/           # Estrategia competitiva
│   ├── templates/          # Galería de plantillas
│   └── wizard/             # Editor de landing pages
├── lib/                    # Clientes (Supabase, env)
├── shared/                 # Componentes y utilidades compartidas
│   ├── components/         # Layout, ErrorBoundary
│   └── lib/                # sanitize, rate-limit, audit, logger
└── types/                  # Tipos TypeScript
```

## Testing

- **68 unit tests** — seguridad, schemas, renderers, utilidades
- **34 E2E tests** — auth, onboarding, wizard, landing pages, lead capture, admin

```bash
npm run test         # Unit tests
npm run test:e2e     # E2E (requiere build de producción + Supabase)
```

## Deployment

Ver [DEPLOY.md](./DEPLOY.md) para guía completa de deployment.
