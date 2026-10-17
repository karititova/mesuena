CREATE TABLE public.explicaciones (
  clave text PRIMARY KEY,
  sesion_id uuid NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  texto text NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.explicaciones TO authenticated;
GRANT ALL ON public.explicaciones TO service_role;
ALTER TABLE public.explicaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profesora ve explicaciones de sus sesiones" ON public.explicaciones FOR SELECT TO authenticated USING (public.es_mi_sesion(sesion_id));