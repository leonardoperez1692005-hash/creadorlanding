# Bucle Agéntico — Metodología de Investigación Política

## Concepto

El bucle agéntico es un flujo iterativo donde el agente estratega genera prompts de investigación que el usuario ejecuta en herramientas externas (Claude, Perplexity, ChatGPT), y los resultados se retroalimentan al sistema via la Base de Conocimiento Estratégico.

## Flujo

```
1. DEFINIR TEMA → El usuario plantea un tema al agente
2. GENERAR PROMPT → El agente usa `generateResearchPrompt` para crear un prompt estructurado
3. INVESTIGAR → El usuario copia el prompt y lo ejecuta en su herramienta de IA preferida
4. ALIMENTAR → El usuario pega los resultados de vuelta en el chat
5. GUARDAR → El agente usa `addStrategyKnowledge` para guardar los hallazgos en la base
6. ANALIZAR → El agente cruza los nuevos datos con el cerebro de campaña existente
7. RECOMENDAR → El agente propone acciones concretas basadas en la investigación
8. ITERAR → Volver al paso 2 si se necesita profundizar en algún ángulo
```

## Comandos del agente involucrados

| Tool                     | Rol en el bucle                       |
| ------------------------ | ------------------------------------- |
| `generateResearchPrompt` | Paso 2: genera el prompt estructurado |
| `addStrategyKnowledge`   | Paso 5: persiste hallazgos            |
| `queryStrategy`          | Paso 6: recupera conocimiento previo  |
| `getBrainSummary`        | Paso 6: contexto de campaña           |
| `generateAngles`         | Paso 7: genera ángulos de ataque      |
| `createLanding`          | Paso 7: materializa en landing        |
| `generateCalendar`       | Paso 7: genera calendario de acción   |

## Ejemplo de uso

```
Usuario: "Quiero investigar el tema narcotráfico en Rosario para atacar al rival"
Agente: [ejecuta generateResearchPrompt("narcotráfico en Rosario", objective="encontrar vulnerabilidades del rival", depth="deep")]
Agente: "Acá tenés un prompt de investigación. Copialo y ejecutalo en Perplexity o Claude para obtener datos frescos."
Usuario: [pega los resultados de la investigación]
Agente: [ejecuta addStrategyKnowledge para guardar] + [analiza cruzando con cerebro] + [recomienda acciones]
```

## Profundidades de investigación

- **quick**: 5 preguntas, investigación superficial. Para temas de coyuntura.
- **standard**: 10 preguntas, cobertura balanceada. Default para la mayoría de temas.
- **deep**: 15+ preguntas, análisis exhaustivo. Para temas que serán pilares de campaña.

## Principio clave

El agente NO tiene acceso a internet en tiempo real. El bucle agéntico resuelve esta limitación convirtiendo al usuario en el "brazo ejecutor" de la investigación, mientras el agente aporta el framework estratégico y la memoria institucional.
