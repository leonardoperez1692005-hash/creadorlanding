# Implementación Fase 2: Frontend - authStore y UI Condicional

> **Fecha**: 2026-02-19  
> **Estado**: ✅ Completado  
> **Depende de**: Fase 1 (requiere migración de Prisma)

---

## 📋 Resumen de Cambios

Esta fase actualiza el frontend para:
- Cargar información de membresía y plan en el store de autenticación
- Mostrar/ocultar features según el plan del usuario
- Mostrar badge del plan en el Dashboard

---

## 📁 Archivos Modificados

### 1. [`frontend/src/stores/authStore.js`](frontend/src/stores/authStore.js)

**Cambios**:

1. Agregados nuevos estados:
```javascript
membership: null,
plan: null,
```

2. Actualizado `login()`, `register()`, y `checkAuth()` para incluir membership y plan:
```javascript
set({ 
    user: data.user, 
    membership: data.user.membership, 
    plan: data.user.membership?.plan,
    token: data.token 
});
```

3. Agregado helper `hasFeature()`:
```javascript
hasFeature: (feature) => {
    const { plan } = useAuthStore.getState();
    if (!plan) return false;
    try {
        const features = JSON.parse(plan.features || '[]');
        return features.includes('*') || features.includes(feature);
    } catch {
        return false;
    }
}
```

---

### 2. [`frontend/src/pages/Dashboard.jsx`](frontend/src/pages/Dashboard.jsx)

**Cambios**:

1. Importación actualizada para incluir `plan` y `hasFeature`:
```javascript
import { useAuthStore } from '../stores/authStore';
// ...
const { user, plan, hasFeature } = useAuthStore();
import { Crown } from 'lucide-react';
```

2. Badge del plan agregado encima de los proyectos:
```jsx
{plan && (
    <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-white/40">Plan:</span>
        <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-full font-semibold">
            {plan.name}
        </span>
        <span className="text-white/30">
            • {plan.maxProjects} proyectos • {plan.maxAIAnalysis} análisis AI/mes
        </span>
    </div>
)}
```

3. Botón ZentrixOs ahora es condicional:
```jsx
{hasFeature && hasFeature('zentrix_os') ? (
    <button onClick={() => navigate('/strategy')} ...>
        <Brain /> ZentrixOs
    </button>
) : (
    <button onClick={() => alert('¡Upgrade tu plan...')} ...>
        <Crown /> Upgrade
    </button>
)}
```

---

## 🧪 Cómo Probar

### 1. Verificar que el login retorne membership
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staticlaunch.com","password":"admin123"}'
```

Debería retornar `membership` con `plan`.

### 2. Verificar UI
1. Hacer login en el frontend
2. Verificar que muestre el badge del plan
3. Si el plan no tiene `zentrix_os`, debería mostrar "Upgrade" en vez de "ZentrixOs"

---

## ⚠️ Notas Importantes

1. **El backend debe estar corriendo** con la migración de Prisma aplicada (Fase 1).

2. **El plan por defecto** se crea automáticamente si no existe (nombre: "Starter", features: `["projects","basic_analytics"]`).

3. **Features disponibles** en el sistema:
   - `projects` - Acceso a crear proyectos
   - `zentrix_os` - Acceso a ZentrixOs
   - `basic_analytics` - Analytics básicos
   - `advanced_analytics` - Analytics avanzados
   - `custom_domain` - Dominio personalizado
   - `white_label` - Sin branding
   - `api_access` - Acceso a API

---

## 🔄 Siguiente Fase

**Fase 3: Testing y Validación**

- Test E2E del flujo completo
- Verificar mensajes de error correctos
- Verificar que las restricciones funcionen correctamente

---

## 📞 Soporte

Si algo no funciona, verificar:
1. Que la Fase 1 esté completa (migración aplicada)
2. Que el backend retorne membership en el login
3. Que `hasFeature()` esté correctamente implementado
