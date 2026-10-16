// Catálogo editable de figuras. 1 semicorchea = 1 unidad.
// Pulso simple = negra (4 u.) · Pulso compuesto = negra con puntillo (6 u.).

export type TipoCompas = "simple" | "compuesto";
export type Nivel = 1 | 2;

export interface Duracion {
  unidades: number;
  silencio?: boolean;
}

export interface Figura {
  id: string;
  nombre: string;
  tipo: TipoCompas;
  nivel: Nivel;
  pulsos: number;
  duraciones: Duracion[];
  silaba: string;
}

const n = (...u: number[]): Duracion[] => u.map((unidades) => ({ unidades }));
const s = (unidades: number): Duracion[] => [{ unidades, silencio: true }];

export const FIGURAS: Figura[] = [
  // ---- Compás simple ----
  { id: "negra", nombre: "Negra", tipo: "simple", nivel: 1, pulsos: 1, duraciones: n(4), silaba: "TA" },
  { id: "blanca", nombre: "Blanca", tipo: "simple", nivel: 1, pulsos: 2, duraciones: n(8), silaba: "TA-A" },
  { id: "blanca_puntillo", nombre: "Blanca con puntillo", tipo: "simple", nivel: 1, pulsos: 3, duraciones: n(12), silaba: "TA-A-A" },
  { id: "redonda", nombre: "Redonda", tipo: "simple", nivel: 1, pulsos: 4, duraciones: n(16), silaba: "TA-A-A-A" },
  { id: "silencio_negra", nombre: "Silencio de negra", tipo: "simple", nivel: 1, pulsos: 1, duraciones: s(4), silaba: "(silencio)" },
  { id: "dos_corcheas", nombre: "Dos corcheas", tipo: "simple", nivel: 1, pulsos: 1, duraciones: n(2, 2), silaba: "TI TI" },
  { id: "cuatro_semis", nombre: "Cuatro semicorcheas", tipo: "simple", nivel: 2, pulsos: 1, duraciones: n(1, 1, 1, 1), silaba: "TI-RI TI-RI" },
  { id: "corchea_dos_semis", nombre: "Corchea y dos semicorcheas", tipo: "simple", nivel: 2, pulsos: 1, duraciones: n(2, 1, 1), silaba: "TI TI-RI" },
  { id: "dos_semis_corchea", nombre: "Dos semicorcheas y corchea", tipo: "simple", nivel: 2, pulsos: 1, duraciones: n(1, 1, 2), silaba: "TI-RI TI" },
  // ---- Compás compuesto ----
  { id: "negra_puntillo", nombre: "Negra con puntillo", tipo: "compuesto", nivel: 1, pulsos: 1, duraciones: n(6), silaba: "TA" },
  { id: "blanca_puntillo_c", nombre: "Blanca con puntillo", tipo: "compuesto", nivel: 1, pulsos: 2, duraciones: n(12), silaba: "TA-A" },
  { id: "silencio_negra_puntillo", nombre: "Silencio de negra con puntillo", tipo: "compuesto", nivel: 1, pulsos: 1, duraciones: s(6), silaba: "(silencio)" },
  { id: "tres_corcheas", nombre: "Tres corcheas", tipo: "compuesto", nivel: 1, pulsos: 1, duraciones: n(2, 2, 2), silaba: "PLÁ-TA-NO" },
  { id: "negra_corchea", nombre: "Negra y corchea", tipo: "compuesto", nivel: 2, pulsos: 1, duraciones: n(4, 2), silaba: "TA TI" },
  { id: "corchea_negra", nombre: "Corchea y negra", tipo: "compuesto", nivel: 2, pulsos: 1, duraciones: n(2, 4), silaba: "TI TA" },
];

const POR_ID = new Map(FIGURAS.map((f) => [f.id, f]));

export function figura(id: string): Figura {
  const f = POR_ID.get(id);
  if (!f) throw new Error(`Figura desconocida: ${id}`);
  return f;
}

export const esSilencio = (f: Figura) => f.duraciones.every((d) => d.silencio);

/** Figuras disponibles para un tipo de compás y nivel (el nivel 2 incluye el 1). */
export function figurasDisponibles(tipo: TipoCompas, nivel: Nivel): Figura[] {
  return FIGURAS.filter((f) => f.tipo === tipo && f.nivel <= nivel);
}
