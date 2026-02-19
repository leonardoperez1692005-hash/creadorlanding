
# PLAN DE MEJORA Y CORRECCIÓN (Post-Implementación)

> **Fecha**: 2026-02-19
> **Estado**: 🟡 Pendiente de Aplicación

---

## 🚨 Hallazgos Críticos

Al verificar la base de datos, se encontraron los siguientes problemas que impiden el funcionamiento correcto del sistema:

1.  **Features Vacías**: Los planes `Starter` y `Pro` tienen `features=[]`.
    *   *Consecuencia*: Nadie puede usar ZentrixOs ni crear proyectos (el middleware bloquea si no está el flag).
2.  **Límites Incorrectos**: El plan `Pro` tiene `maxAIAnalysis=3` (el default), cuando debería tener más.

---

## 🛠️ Acciones Inmediatas (Data Fix)

Se debe ejecutar un script de "seeding" para corregir los planes existentes.

### Configuración Correcta:

| Plan | Features Requeridas | Límites Correctos |
| :--- | :--- | :--- |
| **Starter** | `projects`, `basic_analytics` | Proyectos: 3, AI: 3 |
| **Pro** | `projects`, `zentrix_os`, `custom_domain`, ... | Proyectos: 20, AI: 50 |

---

## 🚀 Mejoras Sugeridas (Roadmap)

### 1. Panel de Administración de Planes (UI)
Actualmente, los planes se gestionan por base de datos. Se sugiere crear una vista en `/admin/plans` para:
*   Editar features con checkboxes.
*   Ajustar límites sin tocar código/DB.
*   Crear nuevos planes dinámicamente.

### 2. Página de Pricing Dinámica
El frontend tiene los precios hardcodeados. Se debe crear un endpoint `/api/public/plans` que alimente la página de precios, asegurando que lo que se vende coincida con lo que se otorga.

### 3. Notificaciones de Límite
Implementar alertas en el Dashboard cuando el usuario llegue al 80% de su límite (proyectos o AI).

### 4. Cron de Reseteo (Mensual)
El campo `aiAnalysisUsed` no se resetea solo. Se necesita un cron job (ej: Github Action o endpoint protegido llamado por cron externo) que corra el 1 de cada mes:
```javascript
// reset-usage.js
await prisma.plan.updateMany({ data: { aiAnalysisUsed: 0 } });
```

---

## 📝 Script de Corrección (`seed_plans.js`)

Se ha preparado un script para aplicar las correcciones de datos inmediatamente.
