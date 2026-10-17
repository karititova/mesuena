// Textos del comentario del resumen de la tanda. Editables: cambia aquí las frases sin tocar las reglas.
// Tono adulto y concreto, sin exclamaciones. Nombra siempre figuras, nunca números de pulso.

const VECES = ["", "una vez", "dos veces", "tres veces", "cuatro veces", "cinco veces", "seis veces", "siete veces", "ocho veces", "nueve veces", "diez veces"];
export const veces = (n: number) => VECES[n] ?? `${n} veces`;

type F = { nombre: string; silaba: string };

export const TEXTOS_RESUMEN = {
  /** Par de figuras confundidas. `esperada` es lo que iba; `puesta`, lo que puso el alumno. */
  confusion: (esperada: F, puesta: F, n: number, pista: string) =>
    `Has confundido ${esperada.nombre.toLowerCase()} (${esperada.silaba}) con ${puesta.nombre.toLowerCase()} (${puesta.silaba}) ${veces(n)}${pista ? `: ${pista}` : "."}`,

  /** Pistas para pares conocidos (clave: ids ordenados alfabéticamente y unidos por «|»). */
  pistas: {
    "corchea_dos_semis|dos_semis_corchea": "fíjate en dónde va la parte partida, al final o al principio.",
    "corchea_negra|negra_corchea": "fíjate en qué va primero, la nota larga o la corta.",
    "cuatro_semis|dos_corcheas": "cuenta los golpes: dos en TI TI, cuatro en TI-RI TI-RI.",
  } as Record<string, string>,

  /** Sin par claro y con figuras largas entre los fallos. */
  largas: "Los fallos están en las figuras largas: cuando una nota sigue sonando, el pulso siguiente queda sin ataque.",
  /** Sin par claro: nombra las figuras donde más se falla. */
  figuras: (nombres: string[]) => `Los fallos están en ${nombres.map((n) => n.toLowerCase()).join(" y ")}: escúchalas despacio antes de comprobar.`,

  equivalencia:
    "Algunas notas sonaban igual pero estaban escritas de otra forma: una blanca y una negra con silencio suenan igual al oído. Se distinguen por la cápsula: la nota larga la estira, el silencio queda vacío.",

  todoBien: "Todo correcto. Sube el tempo o prueba el nivel 2.",
  todoBienNivel2: "Todo correcto. Sube el tempo o prueba otro compás.",
};
