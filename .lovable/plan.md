# Fase 3: clase en directo

Reutiliza el motor, la partitura, el sonido, la paleta y los componentes de la práctica sin reescribirlos. Sin IA. Sin rankings.

## 1. Activar Lovable Cloud
Base de datos, tiempo real y cuentas. No hace falta que confirmes nada más.

## 2. Cuentas
- Profesora: email y contraseña, sin registro público ni verificación por email.
- Cuenta de prueba jurado@mesuena.app / MeSuena2026! creada y lista para entrar.
- Alumnos sin cuenta: código de sala + apodo + el identificador de dispositivo que ya usa la práctica.

## 3. Datos
Sesiones, preguntas, participantes y respuestas, con los campos del documento. Las respuestas no se borran nunca.
- La profesora solo ve y edita sus sesiones.
- Un alumno solo lee la sesión y la pregunta actual de su sala, se apunta él mismo y envía una respuesta por pregunta. Nadie lee las respuestas de otros alumnos; solo le llegan los porcentajes ya calculados.

## 4. Profesora (/profe)
1. Entrar con email y contraseña.
2. «Mis clases»: «Nueva clase» y lista de clases anteriores (fecha, compás, nivel, nº de alumnos, aciertos medios).
3. Crear clase: nivel → compás → figuras → ejercicio, más preguntas (5 por defecto, de 3 a 10) y tempo. El motor genera las preguntas al crear. «Abrir sala».
4. Sala en pantalla ancha: código de 4 letras enorme (mínimo 120 px), QR del enlace, apodos que entran en directo, «Empezar», «Modo demo», Baldo pequeño en espera en una esquina.
5. Pregunta: «Pregunta 2 de 5», partitura solo en ¿Cuál suena? y Encuentra el error, «Reproducir aquí», contador «11 de 15 han respondido» en directo, «Revelar».
6. Revelada: partitura correcta grande, mapa por pulsos con el porcentaje de fallo (verde 0-20 % → terracota más del 60 %), y las dos respuestas equivocadas más repetidas dibujadas con su número de alumnos. «Siguiente» o «Terminar».
7. Terminada: aciertos medios, pregunta más fallada, par de figuras más confundido (mismas reglas del comentario de la práctica) y apodos con sus aciertos, sin ordenar por puntuación. «Cerrar».
8. Modo demo: 14 alumnos con apodos inventados que responden a los pocos segundos, con fallos creíbles concentrados en un pulso.

## 5. Alumno (/unirse y /unirse/CODIGO)
1. Código (si no viene en el enlace) y apodo, que se recuerda en el dispositivo. Mensaje claro si el código no existe o la clase terminó.
2. Espera: «Esperando a que empiece», Baldo dormido, lista de apodos.
3. Pregunta: la misma pantalla de ejercicio de la práctica. Suena solo al tocar «Escuchar», repetible. «Enviar» una vez; después «Enviado, espera a la profesora».
4. Revelada: resultado pulso a pulso, Baldo acierto/fallo, «Ver solución», «Lo puso bien el 40 % de la clase».
5. Terminada: aciertos totales y «Tu repaso» → pantalla «Pronto».
- El móvil cambia solo cuando la profesora avanza. Al volver con el mismo código recupera su sitio y sus respuestas.
- Nunca suena nada automáticamente al cambiar de pregunta.

## 6. Portada
«Entrar a una clase» lleva a /unirse. Enlace discreto al pie: «Soy la profesora» → /profe. /clase deja de usarse y redirige a /unirse.

## Detalles técnicos
- Tablas `sesiones`, `preguntas`, `participantes`, `respuestas` con grants + RLS; profesora con `auth.uid() = profesora_id`. Índice único (participante, pregunta) en respuestas.
- Los alumnos anónimos no tienen sesión, así que sus lecturas y escrituras pasan por funciones de servidor que comprueban código + id de dispositivo y usan el cliente privilegiado; las tablas no dan acceso directo a `anon` salvo una vista pública mínima del estado de la sala.
- Tiempo real: canal por sesión (cambios en `sesiones`, `participantes` y conteo de respuestas). El alumno, al recibir un cambio de estado, vuelve a pedir la pregunta actual al servidor; nunca recibe respuestas de otros, solo agregados.
- Corrección en servidor con `corregirDictado/Cual/Error` de `src/practica/ejercicios.ts`; agregados (mapa por pulsos, respuestas más repetidas, resumen) como módulo puro nuevo en `src/clase/` con tests.
- Modo demo: alumnos simulados con respuestas programadas desde la sala de la profesora (función de servidor), marcados como demo.
- Registro público desactivado; cuenta de prueba creada con el cliente de administración.
- QR con una librería ligera generada en el navegador.
- Rutas protegidas bajo `_authenticated/profe/...`; `/profe` muestra el acceso.
