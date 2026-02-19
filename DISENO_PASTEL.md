# StaticLaunch - Actualización de Diseño Pastel

> Fecha: 2026-02-19
> Revisado por: Code Agent

## Resumen

Se actualizó el sistema de diseño del template VSL para seguir la marca: **minimalista, moderna y colores pastel**.

---

## Cambios Realizados

### 1. Paleta de Colores Pastel

**Light Mode:**
| Variable | Color | Descripción |
|----------|-------|-------------|
| `--color-bg` | `#FAFAFA` | Fondo principal |
| `--color-bg-alt` | `#F5F5F5` | Fondo secundario |
| `--color-bg-card` | `#FFFFFF` | Fondo de cards |
| `--color-text` | `#2D3436` | Texto principal |
| `--color-text-muted` | `#636E72` | Texto secundario |
| `--color-primary` | `#B8B5FF` | Lavanda pastel |
| `--color-secondary` | `#FFB6C1` | Rosa pastel |
| `--color-accent` | `#98D8C8` | Menta pastel |

**Dark Mode:**
| Variable | Color | Descripción |
|----------|-------|-------------|
| `--color-bg` | `#1A1A2E` | Fondo principal |
| `--color-bg-alt` | `#16213E` | Fondo secundario |
| `--color-bg-card` | `#0F3460` | Fondo de cards |
| `--color-text` | `#EAEAEA` | Texto principal |
| `--color-text-muted` | `#A0A0A0` | Texto secundario |
| `--color-primary` | `#B8B5FF` | Lavanda pastel |
| `--color-secondary` | `#FFB6C1` | Rosa pastel |
| `--color-accent` | `#98D8C8` | Menta pastel |

### 2. Gradientes

```css
--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
--gradient-soft: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-alt) 100%);
```

### 3. Tipografía

- **Headings:** Montserrat (sans-serif limpio)
- **Body:** Inter (sans-serif legible)

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `backend/templates/vsl.ejs` | Paleta de colores pastel en CSS |
| `backend/src/generator.js` | Colores pastel por defecto en getPageColors() |

---

## Validación

Para verificar los cambios:

```bash
# Iniciar backend
cd creador-landing/backend
npm run dev

# Acceder a preview
# http://localhost:3001/api/export/{projectId}/view
```

---

## Notas

- Los colores se pueden sobrescribir desde el wizard usando `brand.colors`
- El template mantiene la compatibilidad con secciones dinámicas
- Los cambios aplican solo al template VSL (los otros templates necesitan actualización similar)
