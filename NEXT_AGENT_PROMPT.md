# Prompt para el próximo agente — BrandVortix Pol

## Contexto

Estás en `BrandVortix-sdk/` (worktree git, rama `feature/vercel-ai-sdk`), puerto dev 3001.

## LEER PRIMERO

- `memory/brandvortix-pol-session-2026-03-16b.md` — estado completo de esta sesión
- `memory/feedback_actions_file.md` — REGLA CRÍTICA sobre qué archivo editar

## Problema a resolver: Termómetro de Sentimiento solo usa Twitter

### Situación actual

El **Intel Report** (pestaña DASHBOARD) ya funciona con 952 fuentes multi-source (SocialData + Reddit + YouTube + SERP). Pero el **Termómetro de Sentimiento** (pestaña TERMÓMETRO) solo muestra comentarios de Twitter/X.

### Causa raíz

`sentimentAnalyzer.ts` tiene cambios para buscar en Reddit (con subreddits argentinos) y YouTube (5 videos, queries enriquecidas), PERO **Turbopack NO recompila este archivo**. Los cambios están en el código fuente pero no se ejecutan en runtime.

Esto se confirmó con markers visibles:

- `actions/sentiment.ts` (server action) SÍ se recompila — markers `[v2]` aparecen en la UI
- `sentimentAnalyzer.ts` (módulo importado) NO se recompila — diagnósticos nunca aparecen

### Solución recomendada

**Opción A (más segura):** Mover la lógica de multi-source DIRECTAMENTE a `actions/sentiment.ts`. Así todo queda en un archivo que sabemos que se ejecuta. Pasos:

1. Copiar las funciones de recolección de `sentimentAnalyzer.ts` a `actions/sentiment.ts`:
    - `fetchTweetsFromSocialData` (ya funciona, busca con SocialData API)
    - `fetchRedditMentions` (nueva versión con subreddits argentinos + fetch directo)
    - `fetchYouTubeComments` (nueva versión con 5 videos + queries enriquecidas)
    - `fetchMentionsFromNitter` (sin cambios)
    - `fetchMentionsFromSerp` (sin cambios)
    - `classifySentiment` (el prompt de Gemini)
2. Orquestar las llamadas en paralelo con `Promise.all` dentro de `analyzeSentimentAction`
3. Eliminar el import de `analyzePoliticianSentiment`
4. Verificar con marker visible que los counts de cada fuente sean > 0

**Opción B (limpia pero arriesgada):** Renombrar `sentimentAnalyzer.ts` → `sentimentAnalyzerV2.ts`, cambiar el import en `actions/sentiment.ts`. Turbopack puede que recompile un archivo nuevo.

### APIs confirmadas funcionando (testeadas directamente)

```
SocialData: @PatoBullrich Economía → 20 tweets ✅
Reddit:     r/argentina "Patricia Bullrich" → 4 posts ✅
YouTube:    "Patricia Bullrich Economía" → 25 videos ✅
```

### Markers temporales que hay que limpiar

- `actions/sentiment.ts`: error messages con `[v2]` prefix
- `components/SentimentThermometer.tsx`: botón dice "Actualizar [v2]"
- `actions/intel.ts`: código de debug `_debugLog` y markers `[v2:sd=...]` en estimatedCost — **LIMPIAR**

### Validación

Cuando funcione, el card de "Economía" en el Termómetro debe mostrar:

- Sample comments con iconos de Reddit (💬) y YouTube (▶) además de Twitter (𝕏)
- El sourceMeta badge debe mostrar counts > 0 para reddit y youtube
- Mínimo esperado: ~50+ fuentes totales por análisis de sentimiento

### Después del fix del Termómetro

1. Reorganizar el dashboard como "Centro de Comando" (el usuario lo pidió)
2. Hacer que la información no sea "anecdótica" sino accionable
3. Limpiar todos los markers temporales
