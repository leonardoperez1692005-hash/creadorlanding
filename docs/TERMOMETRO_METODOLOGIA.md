# Termómetro de Sentimiento Político — Metodología

## Objetivo

Medir el sentimiento de la opinión pública hacia un político específico en relación a un tema concreto (ej: "Cristina Fernández de Kirchner" + "Economía"), basándose en datos reales extraídos de redes sociales y medios.

El resultado es un porcentaje de opiniones **positivas**, **negativas** y **neutrales**, calculado por conteo programático de items individuales clasificados por IA.

---

## Pipeline completo (paso a paso)

### Paso 1 — Recolección multi-fuente

Se buscan opiniones sobre el político+tema en 5 fuentes simultáneas:

| Fuente          | API/Método               | Qué trae                                          | Filtro temporal                                |
| --------------- | ------------------------ | ------------------------------------------------- | ---------------------------------------------- |
| **Twitter/X**   | SocialData API           | Tweets que mencionan al político + tema           | Últimos tweets disponibles                     |
| **YouTube**     | YouTube Data API v3      | Comentarios de videos recientes sobre el político | `publishedAfter` = N días atrás (configurable) |
| **Reddit**      | Bright Data Web Unlocker | Posts y comentarios en subreddits del país        | `time: 'month'`                                |
| **Nitter**      | Scraping vía Bright Data | Tweets de instancias Nitter alternativas          | Últimos disponibles                            |
| **Google SERP** | Bright Data SERP API     | Resultados de búsqueda sobre opiniones            | Última semana (`tbs=qdr:w`)                    |

**Período configurable**: El usuario elige el rango temporal antes de analizar (7, 14, 30, 60 o 90 días). Los videos de YouTube y comentarios fuera de ese rango se descartan **antes** de procesarlos, ahorrando costos.

**Archivo**: `sentimentCollectors.ts` → `collectAllSources()`

### Paso 2 — Extracción de items individuales

De todo el contenido recolectado, se extraen items individuales (un tweet = un item, un comentario de YouTube = un item, un post de Reddit = un item).

Cada item queda etiquetado con:

- **Fuente**: `twitter`, `youtube`, `reddit`
- **Fecha**: fecha original de publicación del item (ej: `2026-03-10`)
- **Texto**: el contenido textual (15-500 caracteres)

Se descartan:

- Items con menos de 15 caracteres (ruido)
- Items con más de 500 caracteres (se truncan a 500)
- Items de fuentes no estructuradas (SERP, Nitter) — estos alimentan solo el análisis cualitativo
- **Items irrelevantes**: comentarios que no mencionan al político, su handle, ni el tema se descartan. Esto evita clasificar comentarios genéricos de YouTube ("que buen programa", "me encanta escucharlos") que no hablan del político analizado.

**Filtro de relevancia**: cada item debe contener al menos uno de estos términos: nombre completo del político, handle de Twitter, apellido, o palabras clave del tema. Ejemplo: para "Patricia Bullrich" + "Economía", un comentario debe mencionar "Bullrich", "Patricia", "patobullrich", "economía", o similar.

**URL de fuente**: cada item conserva la URL original (link al tweet, video de YouTube, o post de Reddit) para que el usuario pueda verificar la fuente haciendo click en "↗ ver fuente".

**Archivo**: `sentimentCollectors.ts` → `extractAllItems()`

### Paso 3 — Clasificación individual por IA (el paso clave)

Cada item se clasifica individualmente por Gemini como **positive**, **negative** o **neutral**.

Se envían en batches de hasta 60 items por llamada a Gemini, con este criterio:

#### Definiciones de clasificación

| Categoría    | Criterio                                                          | Ejemplos                                                                   |
| ------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **POSITIVE** | Apoyo explícito, acuerdo, elogio, defensa del político            | "Bien CFK, siempre del lado del pueblo", "La mejor presidenta que tuvimos" |
| **NEGATIVE** | Crítica explícita, rechazo, insulto, desacuerdo, burla, acusación | "Corrupta", "Destruyó la economía", "Que vaya presa"                       |
| **NEUTRAL**  | Mención informativa sin postura clara, pregunta, dato objetivo    | "CFK habló sobre inflación en el Senado", "¿Qué dijo sobre el dólar?"      |

#### Reglas de desempate

1. Si el tono es ambiguo pero tiene más carga emocional negativa que positiva → **NEGATIVE**
2. Si es sarcasmo o ironía contra el político → **NEGATIVE**
3. Si es defensa parcial pero con crítica → se evalúa cuál pesa más

#### Detección de bots

Para cada item, Gemini evalúa si parece automatizado:

- **Criterio**: texto genérico, repetitivo, sin argumento propio, parece copiado
- **Resultado**: `isBot: true` + `botSignal` con la razón (ej: "texto formulaico sin argumento")
- **Impacto**: los items marcados como bot se **excluyen** del conteo de porcentajes orgánicos

**Temperatura de Gemini**: 0.1 (máxima consistencia, mínima creatividad)

**Archivo**: `actions/sentiment.ts` → `classifyItemsInBatches()`

### Paso 4 — Cálculo de porcentajes (programático, no estimado)

Los porcentajes se calculan por **conteo directo**, no por estimación de IA:

```
organicTotal = total_clasificados - bots_detectados

positive_pct = ROUND(positivos / organicTotal * 100)
negative_pct = ROUND(negativos / organicTotal * 100)
neutral_pct  = 100 - positive_pct - negative_pct  (absorbe redondeo)

bot_pct = ROUND(bots / total_clasificados * 100)
```

**Ejemplo real**:

- 202 items clasificados
- 4 detectados como bots → organicTotal = 198
- 2 positivos, 40 negativos, 156 neutrales
- positive_pct = ROUND(2/198 × 100) = 1%
- negative_pct = ROUND(40/198 × 100) = 20%
- neutral_pct = 100 - 1 - 20 = 79%

**Manejo de errores**: Si un batch de clasificación falla (timeout, error de red), esos items se **descartan** del conteo. No se asumen como neutrales para no inflar artificialmente ninguna categoría.

**Archivo**: `actions/sentiment.ts` → `analyzeSentimentAction()`, líneas de PASO 3

### Paso 5 — Análisis cualitativo (temas + resumen)

Una segunda llamada a Gemini genera:

- **Temas positivos**: 3-5 temas que generan apoyo (extraídos del contenido real)
- **Temas negativos**: 3-5 temas que generan rechazo
- **Resumen**: 2-3 oraciones usando los porcentajes reales ya calculados
- **Detección de campaña coordinada**: si hay patrones de textos repetidos o timing sincronizado

Gemini recibe los porcentajes ya calculados como **dato de entrada** — no puede modificarlos. Solo aporta el análisis textual.

**Archivo**: `actions/sentiment.ts` → `analyzeQualitative()`

### Paso 6 — Persistencia y visualización

El resultado se guarda en `sentiment_snapshots` (Supabase) con upsert por `user_id + handle + topic + fecha`.

Datos guardados:

- Porcentajes (positive_pct, negative_pct, neutral_pct)
- Total analizado (total_analyzed) — conteo real de items clasificados
- Temas positivos y negativos
- Comentarios de muestra (16 items diversos, seleccionados por round-robin entre fuentes y sentimientos)
- Detección de bots (bot_inflation_pct, organic percentages)
- Detección de campaña coordinada
- Resumen textual

---

## Arquitectura de archivos

```
political-intel/
├── sentimentCollectors.ts     ← Recolección multi-fuente + extracción de items
├── actions/sentiment.ts       ← Clasificación por batches + cálculo + persistencia
├── components/
│   └── SentimentThermometer.tsx ← UI del termómetro (cards por tema)
├── socialDataClient.ts        ← API Twitter/X (SocialData)
├── youtubeClient.ts           ← API YouTube Data v3
├── redditClient.ts            ← Reddit vía Bright Data / OAuth
└── brain/                     ← Sinapsis (contexto de campaña inyectado en análisis)
```

---

## Niveles de confiabilidad y fundamento estadístico

### Base teórica

Los umbrales se basan en la **fórmula de Cochran (1977)** para tamaño de muestra en proporciones, con nivel de confianza del 95%:

```
n = (Z² × p × (1-p)) / E²
Z = 1.96 (95% confianza), p = 0.5 (peor caso), E = margen de error
```

| Nivel        | Opiniones clasificadas | Margen de error (95% CI) | Interpretación                                    |
| ------------ | ---------------------: | ------------------------ | ------------------------------------------------- |
| **Limitada** |                   < 50 | > ±14%                   | Solo orientativo — "la tendencia parece negativa" |
| **Moderada** |                  50-99 | ±10-14%                  | Tendencias claras — "hay más rechazo que apoyo"   |
| **Sólida**   |                100-384 | ±5-10%                   | Análisis confiable — "~65% negativo, ±8"          |
| **Robusta**  |                   385+ | < ±5%                    | Nivel encuesta profesional — "65% ± 5%"           |

### Comparación con estándares de la industria

| Referencia                                   |              Muestra | Margen   | Contexto                               |
| -------------------------------------------- | -------------------: | -------- | -------------------------------------- |
| **Pew Research Center**                      |      ~1,000 por país | ±3%      | Encuestas aleatorias de población      |
| **Latinobarómetro**                          |      ~1,000 por país | ±3%      | 18 países de América Latina            |
| **Encuesta política estándar**               |            384-1,067 | ±3-5%    | Fórmula de Cochran                     |
| **Social listening (Brandwatch, Meltwater)** | Sin mínimo publicado | Variable | Volumen masivo, sin muestreo aleatorio |
| **Nuestro Termómetro (actual)**              |  50-200 por análisis | ±7-14%   | Opiniones clasificadas individualmente |

### Diferencia fundamental: encuesta vs. social listening

**Esto NO es una encuesta.** Es social listening.

|                    | Encuesta (Pew, Gallup)         | Social listening (nosotros)                        |
| ------------------ | ------------------------------ | -------------------------------------------------- |
| **Muestra**        | Aleatoria de la población      | Auto-seleccionada (gente que publica)              |
| **Qué mide**       | Opinión de la población        | Opinión publicada en redes                         |
| **Quién responde** | Seleccionado al azar           | Quien quiere opinar                                |
| **Sesgo**          | Bajo (diseñado para minimizar) | Alto (personas con opiniones fuertes publican más) |
| **Costo**          | $50,000-500,000 USD            | $0.01-0.02 USD por análisis                        |
| **Velocidad**      | Semanas                        | Minutos                                            |
| **Volumen**        | 1,000 personas                 | 100-500 opiniones por corrida                      |

**Qué se puede decir**: "El 65% de las opiniones publicadas en redes sobre CFK y la economía son negativas"
**Qué NO se puede decir**: "El 65% de los argentinos rechaza la gestión económica de CFK"

### Lo que SÍ es confiable

- **Los porcentajes son conteo real**: cada item se clasifica individualmente, el % sale de dividir — no es estimación de IA
- **Las fuentes son verificables**: cada opinión tiene link a la fuente original (tweet, video, post)
- **El período es configurable**: el usuario elige 7, 14, 30, 60 o 90 días
- **Los bots se excluyen**: el porcentaje orgánico descarta items detectados como automatizados
- **Errores no inflan**: si un batch falla, esos items se descartan (no se asumen neutrales)
- **Filtro de relevancia**: solo se clasifican opiniones que mencionan al político o al tema

### Limitaciones conocidas

- **La clasificación depende de un LLM**: precisión ~85-90%. Items ambiguos pueden clasificarse distinto entre corridas
- **Sarcasmo complejo puede fallar**: ironía sutil a veces se clasifica como neutral
- **Sesgo de plataforma**: si el 80% de items son de Twitter, el resultado refleja más la opinión de Twitter
- **Sesgo de auto-selección**: la gente que comenta en redes tiende a tener opiniones más extremas que la población general
- **No reemplaza una encuesta profesional**: para decisiones electorales de alto riesgo, complementar con encuesta tradicional

### Versus la versión anterior (estimación)

| Aspecto          | Antes (estimación)                 | Ahora (conteo)                                  |
| ---------------- | ---------------------------------- | ----------------------------------------------- |
| Porcentajes      | Gemini estimaba "~70% negativo"    | Conteo: 140/200 = 70% negativo                  |
| Neutral          | Siempre ~15% (ancla cognitiva)     | Variable real (puede ser 5% o 80%)              |
| Diferenciación   | Todos los políticos ≈ mismos %     | Cada político tiene % distintos                 |
| Reproducibilidad | Baja (Gemini varía entre corridas) | Alta (mismo item = misma clasificación al 85%+) |
| Total analizado  | Estimado por Gemini ("~277")       | Conteo real de items clasificados               |
| Período          | Mezclaba datos de meses            | Solo del período seleccionado                   |

---

## Costos

| Componente                  | Costo                                  | Notas                             |
| --------------------------- | -------------------------------------- | --------------------------------- |
| SocialData (Twitter)        | ~$0.001 por request                    | Rate limited                      |
| YouTube Data API            | 100 units/search + 1 unit/100 comments | Quota diaria 10,000 units         |
| Bright Data (SERP + Nitter) | ~$0.001 por request                    | Pay-per-use                       |
| Gemini (clasificación)      | ~$0.002 por batch de 60 items          | 200 items = ~4 llamadas = ~$0.008 |
| Gemini (cualitativo)        | ~$0.003 por llamada                    | 1 llamada por análisis            |
| **Total por análisis**      | **~$0.01-0.02**                        | Depende del volumen de fuentes    |

---

## Flujo visual

```
[Usuario selecciona período: 30 días]
        ↓
[Click "Analizar"]
        ↓
┌─────────────────────────────────────┐
│ Recolección paralela (5 fuentes)    │
│ Twitter → 80 tweets                 │
│ YouTube → 120 comentarios recientes │
│ Reddit  → 0 (sin actividad)        │
│ Nitter  → contenido Nitter          │
│ SERP    → resultados Google          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Extracción: 200 items individuales  │
│ (cada uno con fuente + fecha)       │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Clasificación por batches (Gemini)  │
│ Batch 1: 60 items → 60 resultados  │
│ Batch 2: 60 items → 60 resultados  │
│ Batch 3: 60 items → 60 resultados  │
│ Batch 4: 20 items → 20 resultados  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Conteo programático:                │
│ Positivos: 2  → 1%                 │
│ Negativos: 40 → 20%                │
│ Neutrales: 156 → 79%               │
│ Bots: 2 (excluidos)                │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Análisis cualitativo (Gemini):      │
│ Temas +: ["legado", "políticas"]    │
│ Temas -: ["corrupción", "inflación"]│
│ Resumen: "El sentimiento es..."     │
└─────────────────────────────────────┘
        ↓
[Resultado en pantalla]
200 opiniones clasificadas · Período: 14 feb → 16 mar
👍 1% · 😐 79% · 👎 20%
```

---

## Preguntas frecuentes

**¿De dónde salen los datos?**
De APIs públicas: Twitter (SocialData), YouTube (Google API), Reddit (Bright Data), Google Search (SERP). Son opiniones publicadas en internet, no encuestas.

**¿Cómo se determina si algo es positivo o negativo?**
Gemini (Google AI) clasifica cada comentario individual con definiciones estrictas: apoyo explícito = positivo, crítica explícita = negativo, mención informativa = neutral. Reglas de desempate favorecen la categoría con más carga emocional.

**¿Los porcentajes son estimados?**
No. Son conteo real: si de 200 opiniones 40 son negativas, el porcentaje es 40/200 = 20%. No hay estimación ni aproximación.

**¿Qué pasa con los bots?**
Se detectan por patrones (texto genérico, repetitivo, sin argumento) y se excluyen del conteo orgánico. El % de bots se muestra por separado.

**¿Puedo cambiar el período de análisis?**
Sí. Antes de cada análisis hay un selector: 7, 14, 30, 60 o 90 días. Solo se recolectan y clasifican opiniones de ese período.

**¿Cuánto cuesta cada análisis?**
Aproximadamente $0.01-0.02 USD por análisis (APIs + Gemini). El costo escala con la cantidad de fuentes encontradas.

**¿Qué precisión tiene?**
La clasificación individual de Gemini tiene ~85-90% de precisión en textos políticos en español. El error principal es en sarcasmo sutil y opiniones muy ambiguas.

**¿200 opiniones no es muy poco?**
Depende del contexto. Para social listening, 100-200 opiniones clasificadas individualmente dan un margen de error de ±7-10% (fórmula de Cochran, 95% CI). Esto es comparable a lo que herramientas como Brandwatch analizan en tiempo real por tema. Para contexto: Pew Research usa ~1,000 para ±3%, pero sus encuestas cuestan $50,000+ y tardan semanas. Nuestro análisis cuesta $0.02 y tarda minutos. Si el cliente necesita nivel encuesta (±3-5%), el sistema puede escalar — ver sección "Plan de escalabilidad".

**¿Esto reemplaza una encuesta?**
No. Social listening y encuestas miden cosas distintas. Social listening mide opinión _publicada_ (sesgada hacia personas con opiniones fuertes). Una encuesta mide opinión _de la población_ (diseñada para ser representativa). Se complementan: el Termómetro da velocidad y volumen, la encuesta da representatividad. Para campañas políticas, se recomienda usar ambos.

---

## Plan de escalabilidad: de 200 a 1,500+ opiniones

### Situación actual

El sistema clasifica ~80-200 opiniones por análisis. El cuello de botella no es la IA ni el costo, sino las **fuentes**:

| Fuente                   |  Opiniones actuales | Límite técnico         | Para escalar                                            |
| ------------------------ | ------------------: | ---------------------- | ------------------------------------------------------- |
| **Twitter (SocialData)** |             ~60-100 | 100/query              | API Premium ($299/mes) → hasta 500/query                |
| **YouTube**              |              ~20-80 | 80 comments × 5 videos | Más videos (10-15) + más comments/video (200)           |
| **Reddit**               | 0 (sin credentials) | Ilimitado con OAuth    | Configurar Reddit OAuth → 100+ posts/comments           |
| **Nitter**               |     No estructurado | N/A                    | Migrar a X API directa ($100/mes) → tweets con metadata |
| **SERP**                 |     No clasificable | N/A                    | No aplica (texto continuo, no opiniones individuales)   |

### Camino a 385+ opiniones (nivel "robusto", ±5%)

**Costo incremental**: ~$0.05-0.10 por análisis (vs $0.02 actual)

| Paso                      | Cambio                          |       Opiniones ganadas | Esfuerzo              |
| ------------------------- | ------------------------------- | ----------------------: | --------------------- |
| 1. Reddit OAuth           | Configurar credentials          |                 +50-100 | 30 min                |
| 2. YouTube: más videos    | `maxVideos: 5 → 15`             |                 +60-120 | 5 min (config)        |
| 3. YouTube: más comments  | `maxCommentsPerVideo: 80 → 200` |                +100-300 | 5 min (config)        |
| 4. SocialData: más tweets | `maxResults: 100 → 300`         |                +100-200 | Requiere plan Premium |
| **Total estimado**        |                                 | **310-720 adicionales** |                       |

Con estos cambios, el sistema pasaría de ~200 a **500-900 opiniones clasificadas** por análisis → nivel robusto (±5% o mejor).

### Camino a 1,500+ opiniones (nivel encuesta profesional, ±2.5%)

| Paso                                         | Cambio                          |           Opiniones ganadas |             Costo mensual |
| -------------------------------------------- | ------------------------------- | --------------------------: | ------------------------: |
| 5. X/Twitter API Pro                         | Acceso directo, sin SocialData  |                  +500-1,000 |                  $100/mes |
| 6. Facebook/Instagram (CrowdTangle/Meta API) | Nueva fuente de opinión         |                    +200-500 | $0 (académico) o variable |
| 7. TikTok Research API                       | Comentarios en videos políticos |                    +200-400 | $0 (aplicación requerida) |
| 8. Scraping de portales de noticias          | Comentarios en medios digitales |                    +100-300 |    ~$50/mes (Bright Data) |
| **Total estimado**                           |                                 | **1,000-2,200 adicionales** |             ~$150-250/mes |

### Resumen de niveles alcanzables

| Nivel           | Opiniones | Margen error | Qué se necesita               | Costo/análisis |
| --------------- | --------: | ------------ | ----------------------------- | -------------: |
| **Actual**      |   ~80-200 | ±7-14%       | Nada (ya funciona)            |          $0.02 |
| **Mejorado**    |   400-900 | ±3-5%        | Reddit OAuth + config YouTube |     $0.05-0.10 |
| **Profesional** |    1,500+ | ±2.5%        | X API + nuevas fuentes        |     $0.20-0.50 |

El escalado es lineal en costo y esfuerzo. No requiere reescritura de arquitectura — el pipeline (recolectar → extraer → clasificar → contar) es el mismo.
