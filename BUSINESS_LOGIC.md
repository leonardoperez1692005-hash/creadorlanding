# BUSINESS_LOGIC.md - StaticLaunch (Landing Page Generator)

> Generado por SaaS Factory | Fecha: 2026-02-18

## 1. Problema de Negocio

**Dolor:** Los "Lanzadores" (marketers digitales) necesitan landing pages que sean:
1.  **Extremadamente rápidas** (Core Web Vitals verdes).
2.  **Seguras** (no hackeables como WordPress).
3.  **Fáciles de editar** (sin depender de desarrolladores).
4.  **Baratas de hostear** (sin servidores dedicados caros).

Actualmente, usan ClickFunnels (lento, caro), WordPress + Elementor (lento, inseguro), o código a medida (caro, lento de iterar).

## 2. Solución: StaticLaunch

**Propuesta de valor:** Un SaaS que permite diseñar landing pages de alta conversión mediante un "Wizard" simple, generando HTML estático puro que se "instala" en el WordPress del cliente mediante un plugin conector.

**Flujo principal (Happy Path):**
1.  **Builder (SaaS)**: El usuario entra al Wizard, elige tipo de landing (VSL, Webinar, Long Letter).
2.  **Diseño**: Personaliza textos, colores y sube su logo. El sistema genera una identidad visual automática.
3.  **Generación**: El sistema compila un `index.html` estático ultra-liviano.
4.  **Despliegue**: El usuario instala el plugin "StaticLaunch Connector" en su WordPress.
5.  **Conexión**: Ingresa su License Key e ID de proyecto.
6.  **Publicación**: El plugin descarga el HTML y lo sirve bajo una URL amigable (ej: `misite.com/oferta`) sin pasar por la base de datos de WP.

## 3. Usuario Objetivo

**Perfil:** Infoproductores, Coaches y Agencias de Marketing.
**Necesidad:** Lanzar campañas de tráfico frío donde cada milisegundo de carga cuenta.

## 4. Arquitectura del Sistema

El sistema se compone de 3 partes móviles:

*   **Backend (The Factory)**: Node.js + Fastify + Prisma. Gestiona usuarios, proyectos y compilación EJS.
*   **Frontend (The Builder)**: React + Vite. Wizard interactivo para construcción de landings.
*   **Connector (The Bridge)**: Plugin de WordPress. Importa y sirve el HTML estático.

### Esquema de Datos (Prisma)

```prisma
model Project {
  id            Int    @id @default(autoincrement())
  slug          String @unique
  structureType String @default("vsl") // 'vsl', 'webinar', 'long_letter'
  visualModel   String @default("dark") // 'dark', 'light'
  contentData   String @default("{}")  // JSON con secciones y textos
  userId        Int
  user          User   @relation(fields: [userId], references: [id])
}

model BrandIdentity {
  userId       Int    @unique
  logoPath     String
  designTokens String @default("{}") // Paleta de colores y tipografías
}
```

## 5. Tipos de Landing (Blueprints)

1.  **VSL (Video Sales Letter)**: Video central + Carta de ventas directa.
2.  **Webinar / Masterclass**: Registro a evento, bio del speaker, puntos de aprendizaje.
3.  **Long Letter**: Storytelling profundo, testimonios, urgencia.

## 6. Sistema de Diseño (BrandGen)

*   **Estética**: "Pastel Modern" por defecto. Dark mode: fondo `#1A1A2E` con acentos lavanda/rosa/menta pastel. Light mode: fondo `#FAFAFA` con los mismos acentos.
*   **Automatización**: Extrae paleta de colores del logo del usuario. Los colores pastel son el fallback si el usuario no personaliza.
*   **Fuentes**: Montserrat (headings) + Inter (body). Cargadas via Google Fonts en el template.
*   **Gradientes**: `--gradient-primary` (lavanda → rosa) y `--gradient-soft` (bg → bg-alt) disponibles como tokens CSS.

## 7. Integraciones Técnicas

*   **WordPress**: Plugin propio que usa `template_redirect` para servir estáticos.
*   **Lead Gen**: Formulario nativo que guarda en SQLite y exporta a CSV.
*   **Tracking**: Inyección automática de Pixel de Facebook y Google Analytics.
