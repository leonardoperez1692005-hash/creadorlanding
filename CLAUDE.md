# BrandVortix — Factory OS

> Creador de landings con IA. Proyecto privado (no SaaS público), pero el código debe ser limpio y seguro.
> Directorio activo: `BrandVortix/`. NUNCA editar `staticlaunch-v3/`, `ZentrixOS/` ni `staticlaunch-v2/`.

---

## Estado Real del Proyecto (2026-03-09)

**Score: 7.95/10** — Medido con la rúbrica ISO 25010 de `../QUALITY_RUBRIC.md`

| Dimensión      | Peso | Score | Estado                                                                        |
| -------------- | :--: | :---: | ----------------------------------------------------------------------------- |
| Seguridad      | 15%  | **9** | Rate limit 11/13, RLS, CSP nonce, DOMPurify, audit logging, npm audit 0 vulns |
| Type Safety    | 15%  | **7** | ~2 `any`. 0 errores TS. Tipos fuertes.                                        |
| Testing        | 15%  | **8** | 34 E2E + 159 unitarios = 193 tests. Coverage con V8.                          |
| Observabilidad | 10%  | **8** | Logger estructurado + Sentry. 0 console.error/log en src/                     |
| Mantenibilidad | 10%  | **8** | Feature-First, ESLint+Prettier+Husky, Conventional Commits (commitlint)       |
| Rendimiento    | 10%  | **7** | `<Image>` en React, WebP/AVIF. Falta: Lighthouse >80                          |
| Accesibilidad  |  5%  | **7** | 54 aria-labels, cobertura completa en interactivos                            |
| Documentación  | 20%  | **8** | CLAUDE.md, DEPLOY.md, API.md, SECURITY.md, ARCHITECTURE.md, .env.example      |

### Para subir a 9/10

1. **Rendimiento 7→9**: Lighthouse >90, ISR, bundle analysis en CI
2. **Type Safety 7→9**: Eliminar últimos 2 `any`, tipos fuertes para sectionContent
3. **Testing 8→9**: Coverage >60%, tests de integración API

> Rúbrica: [`QUALITY_RUBRIC.md`](../QUALITY_RUBRIC.md)

---

## Reglas Absolutas

### PROHIBIDO

1. **PROHIBIDO usar `any`** — Siempre tipar con interfaces, types concretos, o `unknown`.
2. **PROHIBIDO usar `console.log/warn/error` directo** — Usar `logger` de `src/shared/lib/logger.ts`.
3. **PROHIBIDO crear API route pública sin `rateLimit()`** — Todo endpoint sin auth DEBE tener rate limiting.
4. **PROHIBIDO crear Server Action sin validación Zod** — Todo input DEBE validarse con `safeParse()`.
5. **PROHIBIDO crear componente interactivo sin `aria-label`** — Botones, links, inputs, modales.
6. **PROHIBIDO usar `<img>`** — Usar `<Image>` de `next/image`.
7. **PROHIBIDO editar fuera de `BrandVortix/`** — NUNCA tocar `staticlaunch-v3/`, `ZentrixOS/`, `staticlaunch-v2/`.
8. **PROHIBIDO usar `supabase db reset`** sin permiso explícito del usuario.

### OBLIGATORIO

1. **Toda función pública debe tener tipo de retorno explícito**.
2. **Todo endpoint público debe validar auth O rate limit**.
3. **Después de `migration up`** → `NOTIFY pgrst, 'reload schema'`.
4. **Feature-First architecture** — Todo en `src/features/[nombre]/`.
5. **Zustand stores**: Usar Immer middleware + `set()` atómico para cambios múltiples. NUNCA setters individuales secuenciales.
6. **Tests**: Todo bug fix debe incluir test que previene regresión.
7. **Verificar path antes de editar**: Debe contener `BrandVortix/`.

### Definition of Done — Checklist ISO 25010

**Toda feature, bugfix o cambio se considera "terminado" SOLO si cumple TODOS estos puntos:**

1. **Type Safety**: 0 `any` nuevo. Tipos explícitos en parámetros y retornos. `tsc --noEmit` pasa.
2. **Testing**: Incluir al menos 1 test unitario por función de lógica nueva. Bug fixes incluyen test de regresión.
3. **Seguridad**: Inputs validados con Zod. Endpoints públicos con rate limit. Sin secrets hardcodeados.
4. **Accesibilidad**: Todo botón/link/input interactivo tiene `aria-label` o texto visible. `<Image>` con `alt`.
5. **Observabilidad**: Errores logueados con `logger.error()`. No `console.log`.
6. **Documentación**: Si es API nueva, documentar en API.md. Si cambia env vars, actualizar .env.example.
7. **Build limpio**: `npm run build` sin errores ni warnings.

> Esta checklist se basa en la rúbrica [`QUALITY_RUBRIC.md`](../QUALITY_RUBRIC.md). No se negocia.

---

## Golden Path Stack

| Capa            | Tecnología                          | Versión             |
| --------------- | ----------------------------------- | ------------------- |
| Framework       | Next.js + React + TypeScript        | 16.1.6 / 19.2.3 / 5 |
| Estilos         | Tailwind CSS v4                     | 4.0                 |
| Backend         | Supabase (Auth + PostgreSQL + RLS)  | SSR 0.9.0           |
| AI Engine       | Google Gemini (@google/genai)       | 1.44                |
| Validación      | Zod                                 | 4.3.6               |
| Estado          | Zustand + Immer + Zundo (undo/redo) | 5.0.11              |
| Exports         | docx, exceljs, pptxgenjs, pdfkit    | -                   |
| XSS Protection  | isomorphic-dompurify                | 3.0.0               |
| Rate Limiting   | Upstash Redis                       | 2.0.8               |
| Observabilidad  | Sentry                              | 10.42               |
| Toasts          | Sonner                              | 2.0.7               |
| Testing E2E     | Playwright                          | 1.58                |
| Testing Unit    | Vitest                              | 4.0                 |
| Linting         | ESLint + eslint-plugin-jsx-a11y     | 9                   |
| Formatting      | Prettier                            | 3.8                 |
| Pre-commit      | Husky + lint-staged                 | 9.1.7 / 16.3        |
| Bundle Analysis | @next/bundle-analyzer               | 16.1.6              |
| Deploy          | Vercel                              | -                   |

---

## Arquitectura

```
src/
├── app/                       # Next.js App Router
│   ├── (app)/                # Rutas autenticadas (dashboard, wizard)
│   ├── (auth)/               # Login, signup
│   ├── (public)/             # Landings públicas /p/[slug]
│   └── api/                  # API routes (14 endpoints)
│
├── features/                  # Feature-First
│   ├── admin/                # Panel de administración
│   ├── attack-plan/          # Vectores de ataque ZMOT
│   ├── auth/                 # Autenticación Supabase
│   ├── brandvortix/          # Hub central BrandVortix
│   ├── leads/                # Captura y gestión de leads
│   ├── market-intel/         # Inteligencia de mercado
│   ├── onboarding/           # Wizard de onboarding (3 pasos)
│   ├── political-intel/      # Inteligencia política
│   ├── strategy/             # Estrategia de negocio
│   ├── templates/            # Templates de landings
│   └── wizard/               # Wizard de creación de landings
│       ├── store/            # wizardStore.ts (Zustand + Immer + Zundo)
│       ├── config/           # TEMPLATE_CATALOG, THEME_PRESETS, constants
│       ├── components/       # WizardClient, PersonalizationSidebar
│       ├── lib/              # htmlCompiler, sectionRenderer
│       ├── actions.ts        # saveProjectAction, loadProjectAction
│       └── __tests__/        # Tests unitarios
│
├── shared/                    # Cross-feature
│   ├── components/           # UI components
│   ├── lib/                  # logger.ts, supabase clients
│   ├── hooks/                # Shared hooks
│   └── types/                # Shared types
│
└── lib/                       # Core
    ├── ai/                   # Gemini integration
    ├── canvas/               # HTML-to-image
    ├── exports/              # PDF, DOCX, Excel, PPTX generation
    └── supabase/             # DB clients
```

---

## Patrones Críticos

### Zustand Store — Carga Atómica (PATRÓN CORRECTO)

```typescript
// CORRECTO: loadProject() carga todo en UN solo set()
loadProject: (data) =>
    set(() => ({
        name: data.name,
        structureType: data.structureType,
        sections: data.sections,
        designTokens: data.designTokens,
    }))

// INCORRECTO: setters secuenciales causan re-renders y race conditions
store.setName(data.name)
store.setStructureType(data.structureType) // Esto llama initializeSections() y pisa todo
store.setSections(data.sections)
```

### Template Libre — No inyectar defaults

```typescript
// Para structureType === 'libre' || 'zmot_attack':
// NO inyectar secciones de STRUCTURE_TYPES como "faltantes"
// Solo devolver las secciones guardadas del usuario
```

---

## Seguridad

| Capa           | Estado                                                    |
| -------------- | --------------------------------------------------------- |
| RLS            | Configurado                                               |
| Zod validation | 10/10 Server Actions validadas                            |
| Rate Limiting  | 11/13 routes (exports + license + health + leads + intel) |
| DOMPurify      | XSS protection en HTML generado                           |
| CSP con nonce  | Configurado                                               |
| Audit logging  | Implementado                                              |
| Env validation | Implementado                                              |
| E2E tests      | 34 tests pasando                                          |

---

## Puerto Dev

Puerto default: **3006** (o siguiente disponible). Usar `npm run dev`.

---

## Comandos

```bash
npm run dev           # Dev server (puerto 3006+)
npm run build         # Build producción
npm run typecheck     # TypeScript check (0 errores requerido)
npm run lint          # ESLint (incluye jsx-a11y)
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run test          # Vitest unit tests (159 tests)
npm run test:coverage # Vitest con reporte de cobertura (V8)
npm run test:e2e      # Playwright E2E (34 tests)
npm run analyze       # Bundle analyzer
```

---

## Interaction Preferences

- **Idioma**: Siempre responder en castellano
- **Autonomía**: Ejecutar completamente si la tarea es clara
- **Honestidad**: Reportar el estado real, no asumir que está todo bien

---

## Auto-Blindaje (Errores Documentados)

### 2026-03-07: normalizeAndMergeSections() inyectaba secciones de VSL en template libre

- **Error**: `getStructureType('libre')` caía a `STRUCTURE_TYPES[0]` (VSL) → se inyectaban 7 secciones de VSL.
- **Fix**: Para `structureType === 'libre' || 'zmot_attack'`, NO inyectar defaults. Solo devolver secciones del usuario.

### 2026-03-07: setStructureType() pisaba secciones guardadas

- **Error**: `setStructureType()` llamaba `initializeSections()` que reseteaba todo.
- **Fix**: Método `store.loadProject()` con `set()` atómico. WizardClient usa `loadProject()`.

### 2026-03-07: revalidatePath('/dashboard') sacaba del wizard

- **Error**: `saveProjectAction` llamaba `revalidatePath('/dashboard')` que invalidaba Router Cache → re-render de layout → redirect.
- **Fix**: Removido `revalidatePath` de save. Dashboard usa `force-dynamic`.

### 2026-03-08: Brand Forge Protocol — design_tokens nunca se populaba

- **Error**: Colores de marca NO fluían al wizard porque `design_tokens` no se llenaba en OnboardingFlow.
- **Fix**: Reescritura completa de OnboardingFlow.tsx con 10 THEME_PRESETS y populación correcta de design_tokens.

### 2026-03-08: XSS en services.ts

- **Error**: HTML generado sin sanitización podía inyectar scripts.
- **Fix**: DOMPurify aplicado en toda salida HTML generada por IA.

---

_Directorio activo: `BrandVortix/`. NUNCA editar fuera de este directorio._
