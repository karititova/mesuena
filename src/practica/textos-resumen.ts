// Textos del comentario del resumen de la tanda. Editables: cambia aquí las frases sin tocar las reglas.
// Tono adulto y concreto, sin exclamaciones.

export const TEXTOS_RESUMEN = {
  /** Par de figuras confundidas. `puesta` es lo que puso el alumno; `esperada`, lo que iba. */
  confusion: (puesta: { nombre: string; silaba: string }, esperada: { nombre: string; silaba: string }, pista: string) =>
    `Confundes ${esperada.nombre.toLowerCase()} («${esperada.silaba}») con ${puesta.nombre.toLowerCase()} («${puesta.silaba}»)${pista ? `: ${pista}` : "."}`,

  /** Pistas para pares conocidos (clave: ids ordenados alfabéticamente y unidos por «|»). */
  pistas: {
    "corchea_dos_semis|dos_semis_corchea": "la parte partida va al final en «TI TI-RI» y al principio en «TI-RI TI».",
    "corchea_negra|negra_corchea": "fíjate en qué va primero, la nota larga o la corta.",
    "cuatro_semis|dos_corcheas": "cuenta los golpes: dos en «TI TI», cuatro en «TI-RI TI-RI».",
  } as Record<string, string>,

  primerPulso: "Los fallos se concentran en el primer pulso del compás: escucha bien cómo arranca cada compás.",
  ultimoPulso: "Los fallos se concentran en el último pulso del compás: no aflojes la atención al final.",

  equivalencia:
    "Algunos pulsos sonaban igual pero estaban escritos de otra forma: una blanca y una negra con silencio suenan igual al oído. Se distinguen por la cápsula: la nota larga la estira, el silencio queda vacío.",

  todoBien: "Toda la tanda bien, sin fallos de pulso.",
  sugerenciaTempo: "Prueba a subir el tempo.",
  sugerenciaNivel: "Prueba el nivel 2.",
  sugerenciaFin: "Prueba con dos compases o con otro compás.",
  generico: "Repasa los pulsos marcados en terracota y vuelve a escuchar antes de comprobar.",
};
