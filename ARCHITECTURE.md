# Arquitectura — BrandVortix

> Última actualización: 2026-03-09

---

## Visión General

BrandVortix es un **creador de landing pages con IA** que permite a usuarios crear, personalizar y publicar landings optimizadas para conversión. Cada cliente compra el software y lo despliega en su propia infraestructura.

---

## Stack Tecnológico

| Capa           | Tecnología                          | Versión    |
| -------------- | ----------------------------------- | ---------- |
| Framework      | Next.js (App Router)                | 16.0       |
| UI             | React + TypeScript                  | 19.0 / 5.7 |
| Estilos        | Tailwind CSS                        | 4.x        |
| Base de datos  | Supabase (PostgreSQL + Auth + RLS)  | SSR 0.6.x  |
| IA             | Google Gemini (via Vercel AI SDK)   | —          |
| Estado         | Zustand + Immer + Zundo (undo/redo) | 5.x        |
| Validación     | Zod                                 | 4.3.6      |
| Rate Limiting  | Upstash Redis                       | —          |
| Observabilidad | Sentry + Logger estructurado        | 10.x       |
| Testing        | Vitest (unit) + Playwright (E2E)    | —          |
| Deploy         | Vercel                              | —          |

---

## Estructura de Carpetas

```
src/
├── app/                        # Next.js App Router
│   ├── (app)/                 # Rutas protegidas (dashboard, wizard)
│   ├── (auth)/                # Login, signup
│   ├── (public)/              # Landings publicadas (/p/slug)
│   └── api/                   # 13 API routes
│
├── features/                   # Feature-First — UNA carpeta por funcionalidad
│   ├── admin/                 # Panel superadmin
│   ├── attack-plan/           # Vectores ZMOT
│   ├── auth/                  # Acciones de login/logout
│   ├── brandvortix/           # Hub principal
│   ├── leads/                 # Gestión de leads
│   ├── market-intel/          # Inteligencia competitiva
│   ├── onboarding/            # Wizard de marca (3 pasos)
│   ├── political-intel/       # Inteligencia política
│   ├── strategy/              # Estrategia de negocio
│   ├── templates/             # Galería de templates
│   └── wizard/                # Constructor de landings
│
├── shared/                     # Código reutilizable cross-feature
│   ├── components/            # ErrorBoundary, Layout
│   ├── hooks/                 # Hooks compartidos
│   ├── lib/                   # rate-limit, logger, supabase
│   └── types/                 # Tipos compartidos
│
├── lib/                        # Utilidades core
│   ├── supabase/              # Clients (server, client, service)
│   ├── env.ts                 # Validación de entorno
│   └── exports/               # Generadores PDF, DOCX, XLSX, PPTX
│
└── types/                      # Tipos globales
```

### Estructura de una Feature

```
features/[nombre]/
├── components/      # React components
├── hooks/           # Custom hooks
├── services/        # Lógica de negocio
├── store/           # Zustand store
├── types/           # TypeScript interfaces
├── config/          # Constantes y configuración
├── actions.ts       # Server Actions
└── __tests__/       # Tests unitarios
```

---

## Flujos Principales

### 1. Creación de Landing (Wizard)

```
Dashboard → "Nueva Landing" → Wizard
  │
  ├── Paso 1: Elegir template o libre
  ├── Paso 2: Personalizar secciones (drag & drop)
  ├── Paso 3: Ajustar diseño (colores, fuentes, estilos)
  └── Paso 4: Preview → Publicar
```

**Estado del wizard**: Zustand store (`wizardStore.ts`) con Immer para inmutabilidad y Zundo para undo/redo.

**Guardado**: Server Actions → Supabase (tabla `projects`).

**Compilación**: `htmlCompiler.ts` genera HTML estático a partir de las secciones.

### 2. Publicación de Landing

```
Wizard → "Publicar" → Server Action
  │
  ├── Compilar HTML (htmlCompiler)
  ├── Guardar en Supabase (compiled_html)
  └── Disponible en /p/[slug]
```

La landing publicada se sirve desde `/p/[slug]` con CSP relajado para permitir fuentes externas y estilos inline.

### 3. Captura de Leads

```
Visitante → Landing publicada → Formulario
  │
  ├── POST /api/leads/capture (rate limited, CORS)
  ├── Validación Zod
  ├── Insertar en Supabase (tabla leads)
  └── Respuesta al visitante
```

### 4. Exportaciones

```
Dashboard → "Exportar" → API Route
  │
  ├── Auth check (Supabase session)
  ├── Rate limit check (Upstash)
  ├── Generar archivo (PDF/DOCX/XLSX/PPTX)
  └── Retornar blob al cliente
```

### 5. Onboarding (Brand DNA)

```
Primer login → Onboarding wizard (3 pasos)
  │
  ├── Paso 1: Nombre de marca, industria
  ├── Paso 2: Público objetivo, tono
  ├── Paso 3: Colores, fuentes, estilo visual
  └── Guardar → design_tokens + brand profile
```

El middleware verifica que el onboarding esté completo antes de permitir acceso al dashboard.

---

## Estado (State Management)

### Zustand + Immer + Zundo

El wizard usa un store centralizado:

```typescript
// wizardStore.ts
interface WizardState {
    name: string
    structureType: StructureType
    sections: Section[]
    designTokens: DesignTokens
    // ... más campos
}

// Carga atómica — evita race conditions
loadProject: (data) =>
    set(() => ({
        name: data.name,
        structureType: data.structureType,
        sections: data.sections,
        designTokens: data.designTokens,
    }))
```

- **Immer**: Permite mutaciones "inmutables" dentro de `set()`
- **Zundo**: Historial de undo/redo para el wizard

---

## Middleware

`src/middleware.ts` intercepta TODAS las requests:

1. **Genera nonce** criptográfico para CSP
2. **Verifica autenticación** via Supabase
3. **Enforce onboarding** — redirige a `/onboarding` si no está completo
4. **Aplica headers** de seguridad (CSP, HSTS, etc.)

```
Request → middleware
  ├── Rutas públicas (/p/, /api/leads, /login) → pasar
  ├── Rutas protegidas sin auth → redirect /login
  ├── Auth + sin onboarding → redirect /onboarding
  └── Auth + onboarding OK → continuar
```

---

## Base de Datos

### Supabase (PostgreSQL)

Tablas principales:

- `projects` — Landings del usuario (secciones, design_tokens, compiled_html)
- `leads` — Leads capturados desde landings publicadas
- `brand_profiles` — Perfil de marca (onboarding)
- `audit_logs` — Registro de acciones (pendiente en prod)

### Row-Level Security (RLS)

Cada tabla tiene policies que aseguran:

- Un usuario solo ve sus propios datos
- `service_role` puede acceder a todo (para operaciones admin)
- Leads son visibles solo para el dueño del proyecto

---

## Testing

### Pirámide de Tests

```
       ┌──────────┐
       │   E2E    │  34 tests (Playwright)
       │ (Flujos) │  Auth, wizard, publicación, exports
       ├──────────┤
       │  Unit    │  70+ tests (Vitest)
       │ (Lógica) │  Stores, servicios, utils
       └──────────┘
```

- **E2E**: Corren contra `next start` (producción). Auth via API cookie injection.
- **Unit**: Vitest con mocks para Supabase y APIs externas.

---

## Deployment

Ver `DEPLOY.md` para el proceso completo. Resumen:

1. Cliente crea cuenta Vercel + Supabase
2. Configura env vars (ver `.env.example`)
3. Ejecuta migraciones SQL
4. Despliega en Vercel
5. Configura dominio custom

---

## Dependencias Externas

| Servicio      | Uso                        | Requerido                        |
| ------------- | -------------------------- | -------------------------------- |
| Supabase      | Auth + DB + Storage        | Sí                               |
| Vercel        | Hosting + Edge             | Sí                               |
| Google Gemini | Generación de contenido IA | Sí                               |
| Upstash Redis | Rate limiting              | Recomendado (fallback in-memory) |
| Sentry        | Error tracking             | Recomendado                      |
| Bright Data   | Inteligencia competitiva   | Opcional                         |
