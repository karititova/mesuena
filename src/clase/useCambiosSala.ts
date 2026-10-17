import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Avisa cada vez que cambia el estado público de la sala (estado, pregunta, nº de alumnos o de respuestas). */
export function useCambiosSala(sesionId: string | undefined, alCambiar: () => void) {
  const ref = useRef(alCambiar);
  ref.current = alCambiar;
  useEffect(() => {
    if (!sesionId) return;
    const canal = supabase
      .channel(`sala-${sesionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "salas", filter: `sesion_id=eq.${sesionId}` }, () => ref.current())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [sesionId]);
}
