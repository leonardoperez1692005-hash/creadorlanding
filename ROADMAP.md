# BrandVortix Pol — Roadmap

> Última actualización: 2026-03-16
> Rama: `feature/vercel-ai-sdk` (worktree `BrandVortix-sdk/`)

---

## Fase actual: MVP Demo

El sistema ya tiene inteligencia política funcional con Cerebro, Termómetro multi-source, Agente Estratégico, y Dashboard. El foco ahora es **solidificar lo que hay** antes de agregar features nuevos.

---

## P0 — Crítico para producción

### Optimizar modelo de clasificación de sentimiento

**Estado**: Pendiente
**Prioridad**: Alta para producción (en testing no bloquea)
**Qué**: Reemplazar Gemini Flash por GPT-4o-mini para la clasificación por batches (`classifyItemsInBatches`). Gemini sigue para análisis cualitativo (temas, resumen, insights).
**Por qué**: GPT-4o-mini es más barato, más preciso en sarcasmo/ironía en español, y la API key ya está configurada.
**Archivos**: `actions/sentiment.ts` → `classifyItemsInBatches()`
**Esfuerzo**: ~1 hora

### Reddit OAuth credentials

**Estado**: Pendiente (Fase 4 de refactoring)
**Prioridad**: Media
**Qué**: Configurar `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` para que Reddit devuelva resultados. Actualmente devuelve 0 (direct fetch bloqueado).
**Por qué**: Agrega una fuente más de opinión pública. Twitter + YouTube ya dan 200-500 fuentes, pero Reddit aporta discusiones más largas y argumentadas.
**Archivos**: `redditClient.ts`, `.env.local`
**Esfuerzo**: ~30 min (solo config de credentials)

### Verificar env vars en Vercel

**Estado**: Pendiente
**Qué**: Confirmar que TODAS las env vars del `.env.local` estén en Vercel:

- `SOCIALDATA_API_KEY`
- `YOUTUBE_API_KEY`
- `BRIGHTDATA_API_KEY` + `BRIGHTDATA_ZONE`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- Supabase keys
  **Por qué**: Un deploy a producción sin esto falla silenciosamente.
  **Esfuerzo**: ~15 min

### Deploy inicial a Vercel

**Estado**: Pendiente
**Qué**: Primer deploy de la rama `feature/vercel-ai-sdk` a un subdominio de preview.
**Por qué**: Validar que todo funciona en serverless (timeouts, cold starts, env vars).
**Esfuerzo**: ~1-2 horas (troubleshooting incluido)

---

## P1 — Completar features existentes

### Fase 2 completa — Conectar features al Brain

**Estado**: ~60% → pendiente ~40%
**Qué**: Conectar `analyzer.ts`, `thematicAnalyzer.ts`, `actions/sentiment.ts` al Brain via sinapsis.
**Por qué**: El análisis temático y el termómetro trabajan sin contexto de campaña. Con el Brain, el contraste rival-vs-candidato mejora.
**Archivos**: `actions/thematic.ts`, `actions/intel.ts` (parcial), `analyzer.ts`
**Esfuerzo**: ~3-4 horas

### Fase 3 completa — Razonamiento cross-feature

**Estado**: ~80% → pendiente ~20%
**Qué**: El agente debe cruzar datos entre sentimiento + temas + rivales. Ejemplo: "El sentimiento sobre Economía cayó 15% esta semana para CFK, pero subió para Bullrich — ¿qué pasó?"
**Por qué**: Es el diferencial del producto. Sin esto es un dashboard más.
**Esfuerzo**: ~4-6 horas

### Fase 4 — Command Center alertas

**Estado**: ~70% → pendiente ~30%
**Qué**: Sistema de alertas automáticas:

- Sentimiento cayó más de X% en una semana
- Rival cambió bio/foto (ya detectado, falta notificación)
- Tema trending que no está siendo monitoreado
  **Por qué**: El centro de comando sin alertas es un dashboard pasivo.
  **Esfuerzo**: ~4-6 horas

### Fase 5 — Wizard Templates Políticos auto-populados

**Estado**: ~30% → pendiente ~70%
**Qué**: Los templates `political_campaign` y `political_issue` se auto-populan con datos del Brain (nombre candidato, colores, propuestas, foto).
**Por qué**: Reduce el tiempo de creación de landing de campaña de 20 min a 2 min.
**Esfuerzo**: ~3-4 horas

---

## P2 — Mejoras de calidad

### Tests del sistema de sentimiento

**Estado**: Pendiente
**Qué**: Tests unitarios para:

- `extractAllItems()` — filtro de relevancia, parseo de URLs y fechas
- `preSelectSamples()` — distribución proporcional
- `classifyItemsInBatches()` — conteo programático
- Cálculo de porcentajes con bots excluidos
  **Por qué**: Es la feature más compleja y la más propensa a regresiones.
  **Esfuerzo**: ~3-4 horas

### Mejorar precisión del Termómetro

**Estado**: Pendiente
**Qué**:

- Evaluar GPT-4o-mini vs Gemini Flash en clasificación (A/B test con mismos items)
- Ajustar prompt de clasificación según resultados
- Mejorar detección de sarcasmo en español argentino
  **Por qué**: La precisión de ~85-90% puede subir a ~92-95% con el modelo correcto y prompt refinado.
  **Esfuerzo**: ~2-3 horas

### Colores de campaña

**Estado**: Pendiente
**Qué**: Los colores actuales son #FF00FF (magenta disco). Necesitan ser los del partido del candidato.
**Por qué**: Afecta credibilidad visual en demo.
**Esfuerzo**: ~10 min (SQL o UI)

### Image Style completo

**Estado**: Pendiente
**Qué**: `brand_image_styles` tiene solo `color_palette`. Faltan `style_keywords`, `mood_descriptors`, `avoid_keywords`.
**Por qué**: Image Studio genera imágenes genéricas sin esto.
**Esfuerzo**: ~15 min (SQL o UI)

---

## P3 — Features nuevos

### Escalar Termómetro a nivel robusto (385+ opiniones, ±5%)

**Estado**: Planificado
**Prioridad**: Alta si el cliente pide más volumen
**Qué**: Pasar de ~200 a 500-900 opiniones clasificadas por análisis.
**Cómo**:

1. Configurar Reddit OAuth (+50-100 opiniones) — 30 min
2. YouTube: subir `maxVideos` a 15 y `maxCommentsPerVideo` a 200 (+160-420) — 5 min config
3. SocialData Premium si se necesita más Twitter (+100-200) — $299/mes
   **Costo incremental**: ~$0.05-0.10 por análisis (vs $0.02 actual)
   **Documentación**: `docs/TERMOMETRO_METODOLOGIA.md` → "Plan de escalabilidad"
   **Esfuerzo**: ~1 hora para Reddit + config

### Escalar Termómetro a nivel profesional (1,500+, ±2.5%)

**Estado**: Idea
**Prioridad**: Solo si el cliente lo exige
**Qué**: Agregar X API directa ($100/mes), Facebook/Instagram, TikTok Research API, scraping de portales de noticias.
**Costo**: ~$150-250/mes en APIs
**Documentación**: `docs/TERMOMETRO_METODOLOGIA.md` → "Camino a 1,500+"

### Reportes temáticos con meta

**Estado**: Pendiente
**Qué**: Los reportes temáticos (`generateThematicReportAction`) no guardan `__meta` con conteo de fuentes. Solo los reportes de monitoreo lo hacen.
**Por qué**: Consistencia — el usuario ve fuentes en monitoring pero no en temáticos.
**Archivos**: `actions/thematic.ts`
**Esfuerzo**: ~1 hora

### Comparador de sentimiento temporal

**Estado**: Idea
**Qué**: Gráfico de líneas que muestra cómo evolucionó el sentimiento de un político en un tema a lo largo del tiempo (usando el historial de snapshots).
**Por qué**: "Antes de las elecciones PASO, Bullrich tenía 40% negativo. Después subió a 65%." Eso es accionable.
**Esfuerzo**: ~4-6 horas

### Chat agent — prompts demo

**Estado**: Pendiente (punto 4 del plan de demo)
**Qué**: Probar los 4 prompts demo del agente estratégico:

1. "¿Cuál es la vulnerabilidad más grande de CFK esta semana?"
2. "Generá un post para Twitter atacando la gestión económica de Di Tullio"
3. "Creá una landing de campaña sobre seguridad"
4. "¿Qué temas debería monitorear que no estoy monitoreando?"
   **Por qué**: Validar que el agente funciona end-to-end con tools reales.
   **Esfuerzo**: ~2-3 horas (debugging incluido)

### Export de Termómetro a PDF

**Estado**: Idea
**Qué**: Botón "Exportar informe" en el Termómetro que genera un PDF con:

- Porcentajes, temas, resumen
- Comentarios de muestra con links a fuentes
- Metodología resumida (extracto de TERMOMETRO_METODOLOGIA.md)
  **Por qué**: El cliente necesita un documento para presentar a su equipo.
  **Esfuerzo**: ~3-4 horas

---

## Deuda técnica

| Item                                     | Archivo                | Impacto               |
| ---------------------------------------- | ---------------------- | --------------------- |
| `supabase: any` en `detectChangesFromDb` | `actions/intel.ts:497` | Type safety           |
| Reddit OAuth no configurado              | `redditClient.ts`      | 0 fuentes Reddit      |
| `maxDuration` no configurado en actions  | `actions/*.ts`         | Timeout en Vercel Pro |
| Reportes temáticos sin `__meta`          | `actions/thematic.ts`  | Inconsistencia UI     |

---

## Decisiones de arquitectura tomadas

| Decisión                                                  | Razón                                                                      | Fecha      |
| --------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| Clasificación programática (conteo) vs estimación Gemini  | Números defendibles, diferenciados por político                            | 2026-03-16 |
| Filtro de relevancia en items                             | Evitar clasificar comentarios de YouTube sobre el programa, no el político | 2026-03-16 |
| URLs de fuente en cada comentario                         | Verificabilidad — el cliente puede hacer click y ver la fuente original    | 2026-03-16 |
| Período configurable (7-90 días)                          | No gastar en scraping de datos que se descartan                            | 2026-03-16 |
| Filtro temporal en YouTube API (`publishedAfter`)         | Eficiencia de costos — no scrappear videos de meses atrás                  | 2026-03-16 |
| `actions.ts` monolítico eliminado → directorio `actions/` | Mantenibilidad, imports claros                                             | 2026-03-16 |
| Meta embebida en content JSONB (`__meta`)                 | Persistencia de fuentes al recargar reportes del historial                 | 2026-03-16 |
| Batches fallidos se descartan (no se marcan neutral)      | Integridad de datos — no inflar neutral artificialmente                    | 2026-03-16 |
