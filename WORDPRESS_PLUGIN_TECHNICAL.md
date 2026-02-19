# StaticLaunch Connector - Documentación Técnica

**Versión:** 1.1.0  
**Fecha:** 2026-02-19  
**Estado:** Listo para Producción ✅

---

## 1. Resumen Ejecutivo

Este documento describe los cambios implementados para mejorar el sistema de sincronización entre WordPress y StaticLaunch, permitiendo la inyección de landing pages estáticas con controles de seguridad mejorados y gestión de usuarios.

### Objetivos Alcanzados
- ✅ Inyección de landings en sitios WordPress
- ✅ Solo las landings del usuario autenticado son accesibles
- ✅ Suspensión de usuarios por falta de pago
- ✅ Seguridad mejorada con validación de dominio

---

## 2. Arquitectura del Sistema

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   WordPress     │ ───► │  StaticLaunch    │ ───► │  Base de Datos  │
│  (Plugin v1.1)  │      │    Backend       │      │   (Prisma)      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                        │                         │
   - HTML Cache             - License API              - Users
   - Sync UI                - Projects API             - Projects
   - Security Headers       - Admin API                 - Licenses
```

---

## 3. Cambios en Base de Datos

### 3.1 Schema Prisma

**Archivo:** `backend/prisma/schema.prisma`

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String    @default("")
  role      String    @default("user")      // 'user' | 'admin' | 'superadmin'
  status    String    @default("active")    // 'active' | 'suspended' | 'cancelled'
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  projects  Project[]
  brandIdentity BrandIdentity?
}
```

### 3.2 Roles de Usuario

| Rol | Descripción | Acceso Admin | Puede Suspender | Puede Ser Suspendido |
|-----|-------------|--------------|-----------------|----------------------|
| `superadmin` | Dueño del sistema | ✅ Total | ✅ Todos | ❌ Nunca |
| `admin` | Administrador | ✅ Básico | ❌ Solo usuarios | ❌ Nunca |
| `user` | Cliente normal | ❌ | ❌ | ✅ Sí |

### 3.3 Estados de Usuario

| Estado | Descripción | Acceso a Landing |
|--------|-------------|------------------|
| `active` | Usuario activo y al día | ✅ Permitido |
| `suspended` | Suspendido por no pagar | ❌ Bloqueado |
| `cancelled` | Cancelado permanentemente | ❌ Bloqueado |

---

## 4. Cambios en Backend

### 4.1 Rutas de Licencia

**Archivo:** `backend/src/routes/license.js`

#### Verificación de Licencia

```javascript
// Validaciones implementadas:
1. License key existe
2. License status = 'active'
3. License tiene usuario asignado (userId no es null)
4. Usuario status = 'active'
5. License no ha expirado
6. Dominio coincide (si está configurado)
```

#### Obtención de Proyectos

```javascript
// Seguridad en /api/license/projects
- Verifica license activa
- Verifica usuario activo  
- Retorna solo proyectos del usuario asociado a la license
```

#### Obtención de HTML

```javascript
// Seguridad en /api/license/project/:slug
- Valida license y usuario
- Verifica que el proyecto pertenezca al usuario
- Solo retorna proyectos con HTML compilado
```

### 4.2 Rutas de Administración

**Archivo:** `backend/src/routes/admin.js`

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/admin/users` | Listar todos los usuarios | admin+ |
| POST | `/admin/users` | Crear usuario | superadmin |
| PUT | `/admin/users/:id/suspend` | Suspender usuario | admin+ |
| PUT | `/admin/users/:id/reactivate` | Reactivar usuario | admin+ |
| PUT | `/admin/users/:id/cancel` | Cancelar usuario | admin+ |
| PUT | `/admin/users/:id/role` | Cambiar rol | superadmin |

#### Ejemplo de Suspensión

```bash
# Suspender usuario por falta de pago
curl -X PUT https://api.staticlaunch.com/admin/users/5/suspend \
  -H "Authorization: Bearer <admin_token>"
```

---

## 5. Cambios en Plugin WordPress

### 5.1 Archivo del Plugin

**Archivo:** `wordpress-plugin/staticlaunch-connector.php`

### 5.2 Configuración del Plugin

El plugin ahora acepta los siguientes settings:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `api_url` | URL | URL del backend de StaticLaunch |
| `license_key` | String | Clave de licencia (formato SL-XXXX-XXXX) |
| `base_slug` | String | Slug base para landings (default: "landing") |
| `auto_sync` | Boolean | Habilitar sincronización automática diaria |

### 5.3 Funcionalidades Nuevas

#### Panel de Administración Mejorado
- Tabla visual de landings sincronizadas
- Información de última actualización
- Links directos a cada landing

#### Sincronización Segura
```
1. Verificar license antes de sincronizar
2. Validar dominio del sitio WordPress
3. Descargar solo proyectos del usuario
4. Almacenar en /wp-content/uploads/staticlaunch/
```

#### Headers de Seguridad
```php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: public, max-age=3600');
```

### 5.4 Uso del Plugin

#### Instalación
1. Subir plugin a `/wp-content/plugins/staticlaunch-connector/`
2. Activar en WordPress Admin
3. Ir a StaticLaunch > Configuración
4. Ingresar API URL y License Key
5. Guardar y verificar licencia
6. Sincronizar landing pages

#### URLs de Landings
```
Sitio: https://ejemplo.com
Landing: mi-proyecto-1
URL: https://ejemplo.com/landing/mi-proyecto-1
```

---

## 6. Flujo de Usuario

### 6.1 Creación de Cuenta y Plan

```
1. Usuario se registra en StaticLaunch
2. Admin crea license y associa al usuario
3. Usuario crea proyectos/landings
4. Usuario instala plugin en WordPress
5. Usuario configura y sincroniza
```

### 6.2 Suspensión por No Pago

```
1. Usuario no paga la suscripción
2. Admin ejecuta: PUT /admin/users/:id/suspend
3. Estado del usuario cambia a: 'suspended'
4. En próximo sync, WordPress recibe error
5. Usuario no puede acceder a landings
```

### 6.3 Reactivación

```
1. Usuario paga lo pendiente
2. Admin ejecuta: PUT /admin/users/:id/reactivate
3. Estado cambia a: 'active'
4. Usuario puede sincronizar y usar landings
```

---

## 7. API Reference

### 7.1 Endpoints Públicos (WordPress Plugin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/license/verify` | Verificar license |
| GET | `/api/license/projects` | Listar proyectos |
| GET | `/api/license/project/:slug` | Obtener HTML |

#### Headers Requeridos
```
Content-Type: application/json
X-License-Key: SL-XXXX-XXXX
X-Forwarded-Host: dominio-wordpress.com
```

### 7.2 Endpoints de Admin

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/admin/stats` | Estadísticas globales | admin+ |
| GET | `/admin/users` | Listar usuarios | admin+ |
| POST | `/admin/users` | Crear usuario | superadmin |
| PUT | `/admin/users/:id/suspend` | Suspender | admin+ |
| PUT | `/admin/users/:id/reactivate` | Reactivar | admin+ |
| PUT | `/admin/users/:id/cancel` | Cancelar | admin+ |
| PUT | `/admin/users/:id/role` | Cambiar rol | superadmin |
| GET | `/admin/licenses` | Listar licenses | admin+ |
| PUT | `/admin/licenses/:id/revoke` | Revocar license | admin+ |

---

## 8. Consideraciones de Seguridad

### 8.1 Validaciones Implementadas

- [x] License asignada a usuario existente
- [x] Usuario con status activo
- [x] License no expirada
- [x] Dominio autorizado coincide con request
- [x] Proyectos filtrados por userId

### 8.2 Recomendaciones Adicionales

1. **Rate Limiting**: Implementar en producción
2. **HTTPS**: Forzar en todas las comunicaciones
3. **Webhook Secrets**: Para notificaciones de pago
4. **Logs de Acceso**: Registrar sincronizaciones

---

## 9. Testing Checklist

- [ ] Verificar license válida retorna success
- [ ] Verificar license expirada retorna error
- [ ] Verificar usuario suspendido retorna error
- [ ] Verificar dominio no autorizado retorna error
- [ ] Verificar sync descarga solo proyectos del usuario
- [ ] Verificar WordPress sirve HTML correctamente
- [ ] Verificar suspension bloquea acceso
- [ ] Verificar reactivacion restaura acceso

---

## 10. Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | - | Versión inicial |
| 1.1.0 | 2026-02-19 | Agregado status de usuario, seguridad mejorada, UI mejorada |
| 1.2.0 | 2026-02-19 | Agregado rol superadmin, protección de admins, endpoints para gestión de roles |

---

## 11. Contacto y Soporte

Para dudas técnicas sobre esta implementación, consultar la documentación del equipo de desarrollo.

**Documento creado para validación del equipo**

---

## 12. Credenciales por Defecto (Desarrollo)

| Rol | Email | Password |
|-----|-------|----------|
| superadmin | admin@staticlaunch.com | admin123 |
| user | user@test.com | user123 |

**Nota:** Estas credenciales son para desarrollo. En producción, cambiar inmediatamente.
