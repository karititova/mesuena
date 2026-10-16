# «Me suena» — Fase 1: motor rítmico, diseño base y /laboratorio

Sin Cloud, usuarios, base de datos ni IA. Interfaz en español de España.

## Diseño base
- Tokens en `src/styles.css` (oklch equivalentes): fondo #F6F1E7, tarjeta #FFFDF8, tinta #1F1D1A, secundario #6B5F52, verde #2F7D4A / #DCEEDF, marrón #7A5230 / #EADFCF, error #C8553D / #F7DED6.
- Fraunces (titulares, números) + Inter (interfaz) vía `<link>` en el root.
- Tarjetas radio 16 px, sombra mínima; botones 12 px; botones de paleta min 64 px.
- `<Baldo estado>`: marcador circular + halo radial difuminado según estado (transición 300 ms); preparado para PNG con `mix-blend-mode: multiply`.
- `/` pasa a una portada sencilla con enlace a /laboratorio.

## Modelo musical (`src/musica/`)
- `figuras.ts`: las 15 figuras exactas del brief (id, nombre, tipo, nivel, pulsos, duraciones con silencios, sílaba).
- `compases.ts`: 2/4, 3/4, 4/4 (pulso 4 u.) y 6/8, 9/8, 12/8 (pulso 6 u.).
- `generador.ts` — `generarRitmo(compas, nivel, n)`: solo figuras que caben; favorece las nuevas del nivel; máx. 2 repeticiones seguidas; nivel 1 máx. 1 silencio por compás; nunca compás entero de silencio; primer pulso nunca silencio.
- `comprobador.ts` — expansión a pulsos (ataque/continuación) y `comprobar(respuesta, correcta)` pulso a pulso con lo esperado vs. lo puesto.
- Tests (vitest) para encaje, reglas del generador (muchas iteraciones) y comprobador.

## Partitura (VexFlow 4.2)
- Pentagrama de una línea, clave de percusión, indicación de compás.
- `Beam.generateBeams` con grupos `Fraction(1,4)` (simple) / `Fraction(3,8)` (compuesto).
- Puntillos y silencios correctos; respuesta incompleta con `Voice.Mode.SOFT`.
- Fila de puntos de pulso alineados y sílabas debajo (interruptor mostrar/ocultar); coloreado verde/terracota tras comprobar.
- Ancho adaptativo: cabe en 390 px hasta 2 compases de 4/4 o 12/8. Carga solo en el navegador.
- Mini partituras para los botones de la paleta.

## Sonido (Tone.js)
- Todo con `Tone.Transport` + `Tone.Part`; nada de setTimeout.
- Ritmo: MembraneSynth agudo, decay muy corto (solo ataques). Metrónomo más grave, primer pulso acentuado, suave bajo el ritmo.
- Compás de entrada: 2 compases si hay 2 pulsos, 1 si hay 3–4.
- Tempos 60 / 70 / 80 (pulso = negra o negra con puntillo).
- Primer «Reproducir» llama a `Tone.start()`; `navigator.audioSession.type = "playback"` si existe; si no, aviso único «Si no oyes nada, quita el modo silencio del móvil».
- «Parar» detiene y limpia el Transport.

## Página /laboratorio
1. Selectores: compás, nivel, nº de compases, tempo.
2. «Generar ritmo» → partitura + Reproducir/Parar.
3. Paleta de figuras (mini partitura + sílaba), desactivadas si no caben; partitura de respuesta en vivo; Deshacer / Borrar.
4. «Comprobar»: colores por pulso, resultado pulso a pulso, Baldo acierto/fallo.
5. «Oír mi respuesta».

## Detalles técnicos
- `bun add vexflow@4.2 tone`; import dinámico en cliente (SSR seguro).
- Archivos: `src/musica/*`, `src/audio/motor.ts`, `src/components/{Partitura,MiniFigura,Baldo,Paleta}.tsx`, `src/routes/laboratorio.tsx`, head() propio en cada ruta.
- Registrar decisiones en `AGENTS.md` y la paleta/tipografías en memoria.
