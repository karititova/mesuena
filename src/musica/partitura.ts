// Dibujo de partituras rítmicas con VexFlow 4.2. Solo navegador (importar dinámicamente).
import { BarlineType, Beam, Dot, Formatter, Fraction, GhostNote, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { StemmableNote } from "vexflow";
import { repartirEnCompases, type Compas } from "./compases";
import { figura } from "./figuras";

export type EstadoPulso = "ok" | "fallo" | null;

export interface OpcionesPartitura {
  compas: Compas;
  ids: string[];
  numCompases: number;
  silabas: boolean;
  estados?: EstadoPulso[] | undefined;
  /** Dibuja cada compás en su propia fila (móvil vertical). */
  filas?: boolean;
  /** Índice global del punto de pulso encendido (reproducción). */
  pulsoActivo?: number | null;
  colores: { tinta: string; secundario: string; ok: string; fallo: string; vacio: string };
}

const DUR_SIMPLE: Record<number, string> = { 16: "w", 12: "hd", 8: "h", 4: "q", 2: "8", 1: "16" };
const DUR_COMP: Record<number, string> = { 12: "hd", 6: "qd", 4: "q", 2: "8", 1: "16" };

function notasDeFigura(id: string, c: Compas, color?: string): StaveNote[] {
  const tabla = c.tipo === "simple" ? DUR_SIMPLE : DUR_COMP;
  return figura(id).duraciones.map((d) => {
    const dur = tabla[d.unidades]!;
    const nota = new StaveNote({
      keys: ["b/4"],
      duration: dur + (d.silencio ? "r" : ""),
      stem_direction: 1,
      clef: "percussion",
    });
    if (dur.endsWith("d")) Dot.buildAndAttach([nota], { all: true });
    if (color) nota.setStyle({ fillStyle: color, strokeStyle: color });
    return nota;
  });
}

function crearSvg(div: HTMLDivElement, w: number, h: number) {
  div.innerHTML = "";
  const renderer = new Renderer(div, Renderer.Backends.SVG);
  renderer.resize(w, h);
  const ctx = renderer.getContext();
  const svg = div.querySelector("svg")!;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  return ctx;
}

const soloLineaCentral = (s: Stave) =>
  s.setConfigForLines([0, 1, 2, 3, 4].map((i) => ({ visible: i === 2 })));

const ANCHO_LETRA = 0.7;
let lienzo: CanvasRenderingContext2D | null | undefined;
function medir(t: string, tam: number): number {
  if (lienzo === undefined) lienzo = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  if (!lienzo) return t.length * tam * ANCHO_LETRA;
  lienzo.font = `600 ${tam}px Inter, sans-serif`;
  return lienzo.measureText(t).width + 2;
}

/** Ajusta una sílaba al ancho disponible: baja hasta 11 px y, si no cabe, la parte en dos líneas. */
export function ajustarSilaba(texto: string, ancho: number): { tam: number; lineas: string[] } {
  const cabeEn = (t: string, tam: number) => medir(t, tam) <= ancho;
  for (let tam = 14; tam >= 11; tam--) if (cabeEn(texto, tam)) return { tam, lineas: [texto] };
  const seps = [...texto].map((ch, i) => (ch === "-" || ch === " " ? i : -1)).filter((i) => i > 0);
  if (seps.length) {
    const mitad = texto.length / 2;
    const corte = seps.reduce((a, b) => (Math.abs(b - mitad) < Math.abs(a - mitad) ? b : a));
    const l1 = texto.slice(0, corte + (texto[corte] === "-" ? 1 : 0)).trim();
    const l2 = texto.slice(corte + 1).trim();
    const largo = Math.max(l1.length, l2.length);
    let tam = 14;
    while (tam > 11 && Math.max(medir(l1, tam), medir(l2, tam)) > ancho) tam--;
    void largo;
    return { tam, lineas: [l1, l2] };
  }
  return { tam: 11, lineas: [texto] };
}

export function dibujarPartitura(div: HTMLDivElement, o: OpcionesPartitura) {
  const { compas: c } = o;
  const cabecera = 70;
  const filas = !!o.filas && o.numCompases > 1;
  const anchoPulso = filas ? 75 : o.numCompases > 1 ? 66 : 80;
  const anchoCompas = c.pulsos * anchoPulso;
  const W = filas ? cabecera + anchoCompas + 12 : cabecera + anchoCompas * o.numCompases + 12;
  const altoFila = o.silabas ? 160 : 128;
  const H = filas ? altoFila * o.numCompases : altoFila;
  const ctx = crearSvg(div, W, H);
  ctx.setFont("Inter", 12);

  const compases = repartirEnCompases(o.ids, c);
  let pulsoGlobal = 0;
  let x = 6;

  for (let m = 0; m < o.numCompases; m++) {
    const y0 = filas ? m * altoFila : 0;
    if (filas) x = 6;
    const ancho = filas ? W - 12 : m === 0 ? cabecera + anchoCompas : anchoCompas;
    const stave = new Stave(x, 10 + y0, ancho);
    soloLineaCentral(stave);
    if (m === 0) stave.addClef("percussion").addTimeSignature(`${c.num}/${c.den}`);
    else if (filas) stave.addClef("percussion");
    if (m === o.numCompases - 1) stave.setEndBarType(BarlineType.END);
    stave.setContext(ctx).draw();

    const ids = compases[m] ?? [];
    const tickables: StemmableNote[] = [];
    const inicios: { nota: StemmableNote; pulsos: number; silaba: string; pulso0: number }[] = [];
    const beamables: StaveNote[] = [];
    let usados = 0;
    for (const id of ids) {
      const f = figura(id);
      const estado = o.estados?.[pulsoGlobal + usados];
      const color = estado === "ok" ? o.colores.ok : estado === "fallo" ? o.colores.fallo : o.colores.tinta;
      const notas = notasDeFigura(id, c, color);
      inicios.push({ nota: notas[0]!, pulsos: f.pulsos, silaba: f.silaba, pulso0: usados });
      tickables.push(...notas);
      beamables.push(...notas);
      usados += f.pulsos;
    }
    for (let p = usados; p < c.pulsos; p++) {
      const g = new GhostNote({ duration: c.tipo === "simple" ? "q" : "qd" });
      inicios.push({ nota: g, pulsos: 1, silaba: "", pulso0: p });
      tickables.push(g);
    }

    const voice = new Voice({ num_beats: c.num, beat_value: c.den }).setMode(Voice.Mode.SOFT);
    voice.addTickables(tickables);
    const beams = Beam.generateBeams(beamables, {
      groups: [c.tipo === "simple" ? new Fraction(1, 4) : new Fraction(3, 8)],
      stem_direction: 1,
    });
    const anchoNotas = stave.getNoteEndX() - stave.getNoteStartX() - 10;
    new Formatter().joinVoices([voice]).format([voice], anchoNotas);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());

    const finX = stave.getNoteEndX() - 4;
    const yPunto = 108 + y0;
    inicios.forEach((ini, k) => {
      const x0 = ini.nota.getAbsoluteX() + 6;
      const x1 = k + 1 < inicios.length ? inicios[k + 1]!.nota.getAbsoluteX() + 6 : finX;
      for (let i = 0; i < ini.pulsos; i++) {
        const px = x0 + ((x1 - x0) * i) / ini.pulsos;
        const idx = pulsoGlobal + ini.pulso0 + i;
        const est = o.estados?.[idx];
        const activo = o.pulsoActivo === idx;
        const vacio = ini.silaba === "";
        ctx.save();
        const col = activo
          ? o.colores.tinta
          : est === "ok" ? o.colores.ok : est === "fallo" ? o.colores.fallo : vacio ? o.colores.vacio : o.colores.secundario;
        ctx.setFillStyle(col);
        ctx.setStrokeStyle(col);
        ctx.beginPath();
        ctx.arc(px, yPunto, activo ? 8 : est ? 6 : 4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
      }
      if (o.silabas && ini.silaba) {
        const texto = ini.silaba === "(silencio)" ? "—" : ini.silaba;
        const { tam, lineas } = ajustarSilaba(texto, Math.max(20, x1 - x0 - 6));
        ctx.save();
        ctx.setFillStyle(o.colores.secundario);
        ctx.setFont("Inter", tam, 600);
        lineas.forEach((l, j) => ctx.fillText(l, x0 - 4, 134 + y0 + j * (tam + 2)));
        ctx.restore();
      }
    });

    pulsoGlobal += c.pulsos;
    x += ancho;
  }
}

/** Mini partitura de una figura para los botones de la paleta. */
export function dibujarMiniFigura(div: HTMLDivElement, id: string, c: Compas, color: string) {
  const W = 110;
  const H = 88;
  const ctx = crearSvg(div, W, H);
  const stave = new Stave(0, 0, W);
  soloLineaCentral(stave);
  stave.setBegBarType(BarlineType.NONE).setEndBarType(BarlineType.NONE);
  const notas = notasDeFigura(id, c, color);
  stave.setNoteStartX(notas.length === 1 ? 46 : 20);
  stave.setContext(ctx).draw();
  const voice = new Voice({ num_beats: c.num, beat_value: c.den }).setMode(Voice.Mode.SOFT);
  voice.addTickables(notas);
  const beams = Beam.generateBeams(notas, {
    groups: [c.tipo === "simple" ? new Fraction(1, 4) : new Fraction(3, 8)],
    stem_direction: 1,
  });
  new Formatter().joinVoices([voice]).format([voice], notas.length === 1 ? 20 : 66);
  voice.draw(ctx, stave);
  beams.forEach((b) => b.setContext(ctx).draw());
}
