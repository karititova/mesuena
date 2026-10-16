# Revisión de diseño y uso de la práctica

Sin cambiar el motor de ejercicios ni los tipos de ejercicio.

## 1. Paleta nueva (toda la app)
- Primario petróleo #1F5E6B / claro #DDEBEC: botones principales, enlaces, selección, pulso en curso.
- Acento mostaza #E3A93B / clara #F7E7C3: píldoras, barras de progreso, halo de Baldo.
- Acierto verde #3A8F5C / #DCEEDF solo para resultados correctos; error terracota #C8553D / #F7DED6.
- Se quita el halo de las cabeceras (crema liso). Halo de Baldo en mostaza muy diluida.
- Se actualiza la memoria del proyecto con la paleta nueva.

## 2. Sonido y reproducción
- Ritmo: se recupera exactamente la altura y el timbre del primer laboratorio (consultando el historial), con mismo timbre, sin deslizamiento y acento solo por volumen.
- Tempos: Lento 50, Medio 60, Rápido 70.
- Contador «1 · 2 · 3 · 4» solo durante el compás de entrada; luego solo marcadores.
- «Pulso» pasa a «Clic»: botón pequeño con contorno e icono de metrónomo; tachado cuando está apagado.

## 3. Dictado en una sola pantalla
Un solo bloque con separadores finos: marcadores del ritmo → «Escuchar» + «Clic» → tu respuesta (máx. 110 px, notas más pequeñas) → paleta de botones de 48 px, 3–4 por fila → Deshacer · Borrar · Oír mi respuesta · Comprobar. Sin desplazamiento en 390×844 con un compás.

## 4. ¿Cuál suena?
Tarjetas «Opción 1/2/3» con botón que solo suena; tocar la tarjeta la marca (borde petróleo + casilla); «Comprobar» activo con una marcada; después correcta en verde y elegida fallida en terracota.

## 5. Encuentra el error
Sin puntos: cada pulso de la partitura es una zona táctil (alto del pentagrama × ancho del pulso) que se resalta en petróleo claro. «Comprobar» y colores de resultado. Lo que suena usa solo las figuras marcadas.

## 6. Sílabas
Tamaño calculado al ancho bajo cada figura (14 → 9 px); si no cabe, se parte por guiones. Nunca se pisan.

## 7. Ajustes a mano
Botón pequeño «Ajustes» junto a la píldora de la tanda; hoja inferior con tempo, compases y nivel; aplica desde el siguiente ejercicio.

## 8. Valores y textos
- Compases por defecto: 2.
- Baldo neutro en la tarjeta de Nivel 2.
- «Con el código de tu profesora».

## 9. Comentario del resumen
Dos o tres frases por reglas bajo el número: pares de figuras confundidas (con sílabas), fallos concentrados en una posición, equivalencias «suena igual», o frase breve + sugerencia si todo bien. Textos en un archivo editable aparte.

## Detalles técnicos
- Tokens en `src/styles.css` (`--primary`, nuevos `--acento`, `--acento-claro`, `--primario-claro`, `--acierto`); verde de botones pasa a petróleo; `.cabecera-halo` eliminado.
- `src/audio/motor.ts`: restaurar parámetros originales del MembraneSynth; `TEMPOS` en `src/musica/compases.ts`.
- `Contador`/`BotonPulso` en `Reproduccion.tsx`; Partitura acepta modo compacto y zonas táctiles por pulso (coordenadas de VexFlow).
- `src/practica/comentario.ts` (reglas, puras) + `src/practica/textos-resumen.ts` (frases editables); ajustes vía parámetros de URL.
- Tests: tempos 50/60/70, compases por defecto 2, reglas del comentario, figuras del «error» limitadas a las marcadas.
