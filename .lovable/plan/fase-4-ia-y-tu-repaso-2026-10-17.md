# Fase 4: IA y «Tu repaso»

Regla de oro: el motor decide qué está bien y qué figuras repasar; la IA solo redacta. Si la IA falla o tarda más de 8 s, la pantalla sale igual, sin la frase y sin mostrar ningún error.

## 1. Explicaciones guardadas
- Cada texto de la IA se guarda la primera vez que se genera y después se reutiliza: nunca se pide dos veces lo mismo.
- Uso A (explicar un error): dos frases, con sílabas y tono adulto, en 220 caracteres como máximo. Sirve para la pregunta fallada y para la frase de conjunto de cada alumno.
- Uso B (resumen de la clase): tres puntos sobre qué domina el grupo, dónde falla y qué repasar, en 450 caracteres como máximo.
- Antes de mostrarlo se revisa el texto: se quitan las exclamaciones y se corta al límite. Si nombra una figura que no existe en la app, se descarta.

## 2. Alumno: «Tu repaso» (/repaso/CODIGO)
- Sustituye a «Pronto». El botón «Tu repaso» de la pantalla final de la clase lleva aquí.
- Arriba: Baldo de 96 px, «N de M preguntas bien» y una frase de la IA sobre sus fallos.
- Lista de preguntas con punto verde o terracota. Al tocar una se abren su respuesta y la solución alineadas, con «Oír la solución». En las falladas, debajo va la explicación de su fallo principal, que se genera al abrirla y se guarda.
- «Practicar lo que fallé»: una tanda de 5 del mismo tipo de ejercicio que la clase, con las figuras falladas como obligatorias (las elige el motor). Al terminar sale el resumen habitual.
- Sin respuestas en esa sesión: un mensaje claro y un enlace a Practicar.

## 3. Profesora
- Bloque «Resumen de la clase» en la pantalla «Terminada» de la sala y en la ficha de cada clase de «Mis clases». Se genera una vez al terminar la sesión y se guarda.
- «Preparar la próxima clase»: abre «Nueva clase» con el compás, el nivel y las figuras que propone el motor según los fallos.

## 4. «Describe la clase» en Nueva clase
- Campo opcional de texto. La IA lo convierte en compás, nivel, figuras, tipo, número de preguntas y tempo, y el formulario se rellena para que la profesora lo revise.
- Si algún valor no es válido en la app, el formulario no cambia y aparece «No lo he entendido; elige las opciones a mano».

## 5. Prompts
- Los tres prompts del sistema quedan en `src/ia/prompts.ts`, en español y editables, con una línea que explica qué recibe y qué devuelve cada uno.

Al terminar, publico la app.

## Detalles técnicos
- Tabla `explicaciones` (clave única tipo+sesión+participante+pregunta, texto, creada) con RLS. La escriben y leen solo las funciones de servidor: los alumnos pasan por la comprobación de código y dispositivo, y la profesora por `es_mi_sesion`.
- Lovable AI Gateway con el modelo por defecto `openai/gpt-6-astra`, esfuerzo `low` y respuesta en streaming por `/v1/responses`. Se corta a los 8 s con AbortController y entonces devuelve `null`. Como la petición es tuya, esta parte se aparta de la norma general de no poner límites de tiempo. La configuración de clase sale con un esquema estricto en JSON y se valida con zod contra `src/musica` y los tempos.
- Módulos puros en `src/ia/` (entradas, saneado y validación, con pruebas) y funciones en `src/ia/*.functions.ts`. El motor decide qué figuras repasar en `src/clase/repaso.ts`, con pruebas.
- La tanda de «Practicar lo que fallé» reutiliza los parámetros de búsqueda de /practicar/tanda, con `obligatorias` añadido al generador.
- Se actualiza la memoria (antes decía «Sin IA») y se añade a AGENTS.md la regla de la IA y la caché.
