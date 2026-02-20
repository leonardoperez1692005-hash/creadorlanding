# 🚀 Guía de Despliegue: Backend (Render) + Frontend (Vercel)

> **Auto-Blindaje SaaS Factory** — Documento generado tras 2hs de debugging.
> Usa esta guía para deploys futuros. Tiempo estimado: **< 15 minutos**.

---

## 🏗️ Stack

| Capa | Tecnología | Plataforma |
|------|------------|------------|
| Backend | Fastify + Prisma + PostgreSQL | [Render](https://render.com) |
| Frontend | React + Vite | [Vercel](https://vercel.com) |
| DB | Supabase (PostgreSQL) | Supabase |

---

## ⚡ Checklist Rápido (Primer Deploy)

```
[ ] 1. Repositorio en GitHub creado y código pusheado
[ ] 2. Variables de entorno en Render configuradas
[ ] 3. Backend desplegado en Render — URL anotada
[ ] 4. Variables de entorno en Vercel configuradas con URL de Render
[ ] 5. Frontend desplegado en Vercel
[ ] 6. Verificar login en la URL de producción
```

---

## 📦 FASE 1: Backend en Render

### 1.1 Crear el Web Service

1. Ir a [render.com](https://render.com) → **New → Web Service**
2. Conectar el repositorio de GitHub
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Name** | `nombre-del-proyecto` |
| **Root Directory** | `backend` |
| **Build Command** | `npm install && node_modules/.bin/prisma generate` |
| **Start Command** | `node src/server.js` |
| **Plan** | Free |

> ⚠️ **CRÍTICO:** El Build Command usa `node_modules/.bin/prisma generate` (NO `npx prisma generate`).
> `npx` en Render busca en un PATH diferente y falla silenciosamente.

### 1.2 Variables de Entorno en Render

Agregar en **Environment → Add Environment Variable**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de Supabase (postgresql://...) |
| `JWT_SECRET` | String aleatorio largo (min 32 chars) |
| `FRONTEND_URL` | `https://TU-APP.vercel.app` ← **sin trailing slash** |
| `PORT` | `3001` (Render lo sobreescribe con su propio Puerto) |

> ⚠️ **NOTA:** `FRONTEND_URL` ya NO afecta el CORS (ver sección CORS más abajo).
> Se mantiene para compatibilidad con lógica de negocio.

### 1.3 Deploy Manual

- Tras guardar env vars → **Manual Deploy → Deploy latest commit**
- Esperar ~3-5 min a que el build termine
- Verificar logs: debe aparecer `Server listening on port XXXX`

---

## 🌐 FASE 2: Frontend en Vercel

### 2.1 Import del Proyecto

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repositorio de GitHub
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `frontend` |
| **Framework** | Vite |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |

### 2.2 Variables de Entorno en Vercel

**Settings → Environment Variables:**

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-BACKEND.onrender.com/api` ← **incluir /api** |

> ⚠️ **CRÍTICO:** Las variables `VITE_*` se "hornean" en el build.
> Si cambias la variable, **DEBES hacer redeploy** para que tome efecto.
> Sin esta variable, el frontend llama a rutas relativas (`/api`) y falla en producción.

### 2.3 Configurar vercel.json (SPA Routing)

El archivo `frontend/vercel.json` **DEBE existir** con este contenido:

```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\.).*)",
      "destination": "/index.html"
    }
  ]
}
```

> ⚠️ **CRÍTICO:** El regex `/((?!.*\\.).*)`  solo reescribe rutas **sin extensión de archivo**.
> Sin esto, los assets CSS/JS devuelven el HTML del `index.html` → app rota.
> Otros patrones comunes como `"/(.*)"` rompen los assets.

### 2.4 Configurar vite.config.js

```js
export default defineConfig({
  plugins: [react()],
  base: '/', // NUNCA poner /nombre-del-proyecto/ — rompe Vercel
  server: {
    port: 3005,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
```

> ⚠️ **NO usar** `base: '/nombre-proyecto/'` — Vercel no sirve desde subcarpetas.

### 2.5 main.jsx — Sin basename en BrowserRouter

```jsx
// ✅ CORRECTO
<BrowserRouter>
  <App />
</BrowserRouter>

// ❌ INCORRECTO — rompe el routing en Vercel
<BrowserRouter basename="/nombre-proyecto">
  <App />
</BrowserRouter>
```

---

## 🔒 FASE 3: CORS (El Mayor Dolor de Cabeza)

### Configuración Definitiva (Fastify)

```js
// backend/src/server.js
await app.register(cors, {
  origin: true, // ← Refleja el origen del request. Simple y que funciona.
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**¿Por qué `origin: true` y no una lista?**

El callback con lista de orígenes allowlist es propenso a errores en Fastify:

```js
// ❌ PELIGROSO — Estos dos patrones causan problemas distintos en Fastify:

// Patrón A: Causa HTTP 500 en requests OPTIONS (preflight)
cb(new Error(`CORS blocked`), false);

// Patrón B: No crashea pero tampoco envía Access-Control-Allow-Origin
// → El browser lo interpreta como bloqueo CORS igualmente
cb(null, false);
```

La seguridad de los endpoints la manejan los **JWT tokens**, no el CORS.
CORS es solo un mecanismo del browser — las APIs protegidas siguen siendo seguras.

---

## 🔧 FASE 4: Variables en api.js (Fallback Robusto)

```js
// frontend/src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? '/api' : 'https://TU-BACKEND.onrender.com/api');
```

**¿Por qué el doble fallback?**
- En **Desarrollo**: `/api` → el proxy de Vite lo redirige a `localhost:3001`
- En **Producción**: si `VITE_API_URL` no está seteada en Vercel, usa la URL hardcodeada
- Sin este fallback, en prod llama a `vercel-app.vercel.app/api` → 405 Method Not Allowed

---

## 🐛 Errores Comunes y sus Fixes

### Error: `405 Method Not Allowed` en Login

**Causa:** El frontend llama a una URL relativa (`/api/auth/login`) en producción.
Vercel no tiene esa ruta — la responde con su propia página de error.

**Fix:**
1. Verificar que `VITE_API_URL` esté seteada en Vercel con la URL de Render
2. Hacer redeploy tras agregar la variable
3. Agregar fallback robusto en `api.js` (ver sección anterior)

---

### Error: `CORS blocked — No 'Access-Control-Allow-Origin' header`

**Causa:** El callback CORS rechaza el origen de Vercel (silenciosamente).

**Fix:** Cambiar a `origin: true` en `server.js` (ver sección CORS).

---

### Error: `500 Internal Server Error` en OPTIONS (Preflight)

**Causa:** `cb(new Error(...), false)` en el callback de CORS de Fastify.
Fastify interpreta el `Error` como una excepción del servidor.

**Fix:** No usar `new Error()` en el callback. Usar `cb(null, false)` o directamente `origin: true`.

---

### Error: Assets 404 (CSS/JS no cargan)

**Causa:** El `vercel.json` reescribe TODAS las rutas, incluyendo los assets.

**Fix:** Usar el regex correcto que excluye rutas con extensión de archivo:
```json
"source": "/((?!.*\\.).*)"
```

---

### Error: El build de Render falla con Prisma

**Causa:** `npx prisma generate` no encuentra el binario en el PATH de Render.

**Fix:** Usar la ruta directa: `node_modules/.bin/prisma generate`

---

## 🔁 Deploys Subsiguientes

### Flujo Standard (después del primer deploy)

```bash
git add .
git commit -m "feat(feature-name): descripción"
git push
```

- **Vercel** auto-deploya en ~1 min ✅
- **Render** (Free plan) puede requerir **Manual Deploy** en el dashboard

### Auto-deploy en Render Free

Por defecto, Render en plan Free puede no auto-deployar.
Para habilitarlo: **Settings → Auto-Deploy → Yes**

---

## 📋 Datos Críticos del Proyecto

```
Backend URL:   https://creadorlanding.onrender.com
Frontend URL:  https://creadorlanding.vercel.app
Admin Email:   admin@staticlaunch.com
Admin Pass:    admin123
Admin Role:    superadmin
```

---

## ⏱️ Tiempo Estimado por Fase

| Fase | Primera vez | Subsiguientes |
|------|-------------|---------------|
| Backend Render | 10 min | 3 min (manual deploy) |
| Frontend Vercel | 5 min | Automático |
| Debug CORS | 0 min (con esta guía) | 0 min |
| **Total** | **~15 min** | **~5 min** |

---

*Generado: 2026-02-19 | Auto-Blindaje SaaS Factory V3*
