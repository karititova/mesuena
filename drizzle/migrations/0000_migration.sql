CREATE TABLE public.sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  profesora_id uuid NOT NULL,
  nivel int NOT NULL,
  compas text NOT NULL,
  figuras text[] NOT NULL,
  ejercicio text NOT NULL,
  ppm int NOT NULL,
  num_compases int NOT NULL DEFAULT 2,
  num_preguntas int NOT NULL,
  estado text NOT NULL DEFAULT 'espera' CHECK (estado IN ('espera','pregunta','revelada','terminada')),
  pregunta_actual int NOT NULL DEFAULT 0,
  creada timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones TO authenticated;
GRANT ALL ON public.sesiones TO service_role;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profesora gestiona sus sesiones" ON public.sesiones FOR ALL TO authenticated
  USING (auth.uid() = profesora_id) WITH CHECK (auth.uid() = profesora_id);

CREATE OR REPLACE FUNCTION public.es_mi_sesion(_sesion uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.sesiones WHERE id = _sesion AND profesora_id = auth.uid())
$$;

CREATE TABLE public.preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  orden int NOT NULL,
  ritmo text[] NOT NULL,
  opciones jsonb,
  correcta int,
  suena text[],
  error_pulso int,
  UNIQUE (sesion_id, orden)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preguntas TO authenticated;
GRANT ALL ON public.preguntas TO service_role;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profesora gestiona sus preguntas" ON public.preguntas FOR ALL TO authenticated
  USING (public.es_mi_sesion(sesion_id)) WITH CHECK (public.es_mi_sesion(sesion_id));

CREATE TABLE public.participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  apodo text NOT NULL CHECK (char_length(apodo) BETWEEN 1 AND 24),
  dispositivo text NOT NULL,
  demo boolean NOT NULL DEFAULT false,
  creado timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sesion_id, dispositivo)
);
GRANT SELECT, INSERT ON public.participantes TO authenticated;
GRANT ALL ON public.participantes TO service_role;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profesora ve sus participantes" ON public.participantes FOR SELECT TO authenticated USING (public.es_mi_sesion(sesion_id));
CREATE POLICY "Profesora añade alumnos demo" ON public.participantes FOR INSERT TO authenticated WITH CHECK (demo AND public.es_mi_sesion(sesion_id));

CREATE TABLE public.respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  participante_id uuid NOT NULL REFERENCES public.participantes(id) ON DELETE CASCADE,
  pregunta_id uuid NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  entrada jsonb NOT NULL,
  respuesta text[] NOT NULL,
  aciertos boolean[] NOT NULL,
  equivalencias jsonb NOT NULL DEFAULT '[]',
  acierto boolean NOT NULL,
  tiempo_ms int,
  creada timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participante_id, pregunta_id)
);
GRANT SELECT, INSERT ON public.respuestas TO authenticated;
GRANT ALL ON public.respuestas TO service_role;
ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profesora ve las respuestas de sus sesiones" ON public.respuestas FOR SELECT TO authenticated USING (public.es_mi_sesion(sesion_id));
CREATE POLICY "Profesora inserta respuestas demo" ON public.respuestas FOR INSERT TO authenticated WITH CHECK (
  public.es_mi_sesion(sesion_id) AND EXISTS (SELECT 1 FROM public.participantes p WHERE p.id = participante_id AND p.demo)
);

-- Estado público de la sala (sin datos personales) para el tiempo real.
CREATE TABLE public.salas (
  sesion_id uuid PRIMARY KEY REFERENCES public.sesiones(id) ON DELETE CASCADE,
  estado text NOT NULL,
  pregunta_actual int NOT NULL,
  participantes int NOT NULL DEFAULT 0,
  respuestas int NOT NULL DEFAULT 0,
  actualizada timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salas TO anon, authenticated;
GRANT ALL ON public.salas TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Estado de sala visible" ON public.salas FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_sala_sesion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.salas (sesion_id, estado, pregunta_actual) VALUES (NEW.id, NEW.estado, NEW.pregunta_actual)
  ON CONFLICT (sesion_id) DO UPDATE SET estado = EXCLUDED.estado, pregunta_actual = EXCLUDED.pregunta_actual, actualizada = now();
  RETURN NEW;
END $$;
CREATE TRIGGER sesiones_sala AFTER INSERT OR UPDATE ON public.sesiones FOR EACH ROW EXECUTE FUNCTION public.sync_sala_sesion();

CREATE OR REPLACE FUNCTION public.sync_sala_conteos() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.salas SET
    participantes = (SELECT count(*) FROM public.participantes WHERE sesion_id = NEW.sesion_id),
    respuestas = (SELECT count(*) FROM public.respuestas WHERE sesion_id = NEW.sesion_id),
    actualizada = now()
  WHERE sesion_id = NEW.sesion_id;
  RETURN NEW;
END $$;
CREATE TRIGGER participantes_sala AFTER INSERT ON public.participantes FOR EACH ROW EXECUTE FUNCTION public.sync_sala_conteos();
CREATE TRIGGER respuestas_sala AFTER INSERT ON public.respuestas FOR EACH ROW EXECUTE FUNCTION public.sync_sala_conteos();

REVOKE EXECUTE ON FUNCTION public.sync_sala_sesion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_sala_conteos() FROM PUBLIC, anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.salas;