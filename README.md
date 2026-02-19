# 🚀 StaticLaunch

> **Tu Fábrica de Landing Pages de Alto Rendimiento**

Genera landing pages estáticas optimizadas para marketing digital. Wizard interactivo, branding automático, y conexión directa con WordPress.

---

## 📦 Arquitectura

```
staticlaunch/
├── backend/           → Node.js + Fastify + Prisma + SQLite (Port 3001)
├── frontend/          → React + Vite + TailwindCSS (Port 3005)
└── wordpress-plugin/  → PHP Plugin connector
```

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../frontend
npm install
```

### 2. Arrancar los servidores

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Acceder

- **Frontend:** http://localhost:3005/creadorlanding/
- **Backend API:** http://localhost:3001/api/health

---

## 🎨 Templates Disponibles

| Template | Descripción |
|----------|-------------|
| **VSL** | Video Sales Letter — Venta directa con video |
| **Webinar** | Registro a masterclass/evento |
| **Long Letter** | Carta de ventas con storytelling |

## 🔧 WordPress Plugin

1. Comprimir `wordpress-plugin/` en un ZIP
2. Subir a WordPress → Plugins → Añadir nuevo
3. Configurar URL del backend y clave de licencia
4. Sincronizar landing pages

## 📐 Tech Stack

- **Backend:** Fastify 5, Prisma 6, SQLite, Sharp, Node-Vibrant, EJS
- **Frontend:** React 19, Vite 6, TailwindCSS 3.4, Zustand 5, Lucide Icons
- **Plugin:** PHP 7.4+, WordPress API

---

*Construido con la estética BrandGen 🌙*
