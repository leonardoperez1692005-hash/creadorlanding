# Implementación Fase 1: Sistema de Permisos y Restricciones

> **Fecha**: 2026-02-19  
> **Estado**: ✅ Completado  
> **Próxima Fase**: Fase 2 - Frontend (authStore + UI condicional)

---

## 📋 Resumen de Cambios

Esta fase implementa el sistema de control de acceso por plan en el backend, permitiendo:
- Validar membresía activa del usuario
- Verificar features disponibles según el plan
- Controlar límites de proyectos y análisis AI
- Crear membresía por defecto para usuarios existentes

---

## 📁 Archivos Modificados

### 1. [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

**Cambios**: Agregados campos al modelo `Plan`

```prisma
model Plan {
  // ... campos existentes ...
  
  // NUEVOS CAMPOS AGREGADOS:
  maxAIAnalysis Int      @default(3)   // Análisis ZentrixOs por mes
  aiAnalysisUsed Int    @default(0)    // Contador usado este mes
  
  // El campo features ya existía pero no se usaba:
  // features String @default("[]")  // JSON array de features
}
```

---

### 2. [`backend/src/middleware/permissions.js`](backend/src/middleware/permissions.js) - **NUEVO**

**Propósito**: Middleware para validar permisos por plan

#### Features disponibles:
```javascript
export const FEATURES = {
    PROJECTS: 'projects',
    ZENTRIX_OS: 'zentrix_os',
    CUSTOM_DOMAIN: 'custom_domain',
    WHITE_LABEL: 'white_label',
    API_ACCESS: 'api_access',
    TEAM_MEMBERS: 'team_members',
    PRIORITY_SUPPORT: 'priority_support',
    ADVANCED_ANALYTICS: 'advanced_analytics',
};
```

#### Funciones exportadas:

| Función | Descripción |
|---------|-------------|
| `getUserMembership(userId)` | Obtiene membresía activa del usuario |
| `getOrCreateDefaultMembership(userId)` | Obtiene o crea membresía starter |
| `hasFeature(plan, feature)` | Verifica si el plan tiene la feature |
| `checkPlanFeature(feature)` | Middleware para verificar una feature |
| `checkProjectLimit()` | Middleware para verificar límite de proyectos |
| `checkAILimit()` | Middleware para verificar límite de análisis AI |
| `incrementAIUsage(planId)` | Incrementa contador de análisis |

---

### 3. [`backend/src/routes/auth.js`](backend/src/routes/auth.js)

**Cambios**: Ahora retorna `membership` y `plan` en las respuestas

#### Endpoints afectados:

- `POST /api/auth/register` - Retorna membership en respuesta
- `POST /api/auth/login` - Retorna membership en respuesta  
- `GET /api/auth/me` - Retorna membership y plan completo

#### Respuesta ejemplo (login):
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user",
    "membership": {
      "id": 1,
      "status": "active",
      "startDate": "2026-02-19T00:00:00.000Z",
      "expiresAt": null,
      "plan": {
        "id": 1,
        "name": "Starter",
        "slug": "starter",
        "price": 0,
        "maxProjects": 3,
        "maxLeads": 500,
        "maxAIAnalysis": 3,
        "aiAnalysisUsed": 0,
        "features": "[\"projects\",\"basic_analytics\"]"
      }
    }
  }
}
```

---

### 4. [`backend/src/routes/projects.js`](backend/src/routes/projects.js)

**Cambios**: Agregado middleware `checkProjectLimit()` en endpoint de creación

```javascript
import { checkProjectLimit } from '../middleware/permissions.js';

// Middleware agregado en POST /
app.post('/', { preHandler: [authenticate, checkProjectLimit()] }, async (request, reply) => {
    // ... código existente ...
});
```

#### Comportamiento:
- Si el usuario excede `maxProjects` de su plan → Error 403
- Si no tiene membresía → Se crea una automáticamente con plan "starter"

---

### 5. [`backend/src/routes/strategy.js`](backend/src/routes/strategy.js)

**Cambios**: 
1. Agregado middleware `checkAILimit()` en endpoint `/analyze`
2. Agregado incremento de contador después de análisis exitoso

```javascript
import { checkAILimit, incrementAIUsage } from '../middleware/permissions.js';

// Middleware agregado
app.post('/analyze', { preHandler: [authenticate, checkAILimit()] }, async (request, reply) => {
    // ... código existente ...
    
    // Después de análisis exitoso:
    if (request.plan) {
        await incrementAIUsage(request.plan.id);
    }
});
```

#### Comportamiento:
- Verifica que el plan tenga feature `zentrix_os`
- Verifica que no exceda `maxAIAnalysis`
- Incrementa `aiAnalysisUsed` después de cada análisis

---

## 🔧 Cómo Aplicar los Cambios

### Paso 1: Generar cliente Prisma
```bash
cd backend
npx prisma generate
```

### Paso 2: Actualizar base de datos
```bash
cd backend
npx prisma db push
```

### Paso 3: (Opcional) Crear planes por defecto
El sistema crea automáticamente el plan "starter" si no existe cuando un usuario sin membresía intenta acceder.

---

## 🧪 Cómo Probar

### 1. Login y verificar membership
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staticlaunch.com","password":"admin123"}'
```

Debería retornar `membership` con `plan`.

### 2. Verificar restricción de proyectos
Crear más proyectos de los permitidos (3 para plan starter) y verificar que retorne 403.

### 3. Verificar restricción de ZentrixOs
Intentar acceder a `/api/strategy/analyze` sin la feature y verificar 403.

---

## ⚠️ Notas Importantes

1. **Usuarios existentes**: El middleware `getOrCreateDefaultMembership` crea automáticamente una membresía "starter" para usuarios que no tengan una.

2. **Plan starter por defecto**: Si no existe un plan con slug "starter", se crea automáticamente.

3. **Contador AI**: Se incrementa después de cada análisis exitoso. Currently no se resetea mensualmente (falta implementar cron job).

4. **Features en JSON**: El campo `features` es un string JSON array. Se parsea en tiempo de ejecución.

---

## 🔄 Siguiente Fase

**Fase 2: Frontend - authStore + UI Condicional**

- Actualizar `frontend/src/stores/authStore.js` para incluir membership
- Modificar `Dashboard.jsx` para mostrar/ocultar features según plan
- Crear página de upgrade/pricing

---

## 📞 Soporte

Si algo no funciona, verificar:
1. Que `npx prisma generate` haya corrido sin errores
2. Que la base de datos tenga los nuevos campos
3. Que el servidor backend se haya reiniciado después de los cambios
