ALTER TABLE public.sesiones ADD COLUMN ronda integer NOT NULL DEFAULT 1, ADD COLUMN inicio_ronda integer NOT NULL DEFAULT 0, ADD COLUMN preguntas_ronda integer NOT NULL DEFAULT 5, ADD COLUMN uso_demo boolean NOT NULL DEFAULT false;
UPDATE public.sesiones SET preguntas_ronda = num_preguntas, uso_demo = EXISTS (SELECT 1 FROM public.participantes p WHERE p.sesion_id = sesiones.id AND p.demo);
ALTER TABLE public.preguntas ADD COLUMN ronda integer NOT NULL DEFAULT 1, ADD COLUMN configuracion jsonb;
UPDATE public.preguntas p SET configuracion = jsonb_build_object('nivel', s.nivel, 'compas', s.compas, 'figuras', s.figuras, 'ejercicio', s.ejercicio, 'ppm', s.ppm, 'numCompases', s.num_compases) FROM public.sesiones s WHERE s.id = p.sesion_id;
CREATE OR REPLACE FUNCTION public.borrar_clases(_id uuid DEFAULT NULL, _solo_demo boolean DEFAULT false) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ids uuid[]; n integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
 SELECT array_agg(id) INTO ids FROM public.sesiones WHERE profesora_id = auth.uid() AND ((_solo_demo AND uso_demo) OR (NOT _solo_demo AND id = _id));
 IF ids IS NULL THEN RETURN 0; END IF;
 DELETE FROM public.explicaciones WHERE sesion_id = ANY(ids);
 DELETE FROM public.respuestas WHERE sesion_id = ANY(ids);
 DELETE FROM public.participantes WHERE sesion_id = ANY(ids);
 DELETE FROM public.preguntas WHERE sesion_id = ANY(ids);
 DELETE FROM public.salas WHERE sesion_id = ANY(ids);
 DELETE FROM public.sesiones WHERE id = ANY(ids);
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.borrar_clases(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.borrar_clases(uuid, boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.anadir_ronda(_id uuid, _cfg jsonb, _preguntas jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.sesiones; cantidad integer;
BEGIN
 SELECT * INTO s FROM public.sesiones WHERE id = _id AND profesora_id = auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Clase no encontrada'; END IF;
 IF s.estado <> 'revelada' OR s.pregunta_actual + 1 <> s.num_preguntas THEN RAISE EXCEPTION 'La ronda no ha terminado'; END IF;
 cantidad = jsonb_array_length(_preguntas);
 IF cantidad < 3 OR cantidad > 10 THEN RAISE EXCEPTION 'Número de preguntas no válido'; END IF;
 INSERT INTO public.preguntas(sesion_id, orden, ronda, configuracion, ritmo, opciones, correcta, suena, error_pulso)
 SELECT s.id, s.num_preguntas + (e.ordinality::integer - 1), s.ronda + 1, _cfg, ARRAY(SELECT jsonb_array_elements_text(e.value->'ritmo')), NULLIF(e.value->'opciones', 'null'::jsonb), (e.value->>'correcta')::integer, CASE WHEN e.value->'suena' <> 'null'::jsonb THEN ARRAY(SELECT jsonb_array_elements_text(e.value->'suena')) ELSE NULL END, (e.value->>'error_pulso')::integer FROM jsonb_array_elements(_preguntas) WITH ORDINALITY e;
 UPDATE public.sesiones SET ronda = s.ronda + 1, inicio_ronda = s.num_preguntas, preguntas_ronda = cantidad, pregunta_actual = s.num_preguntas, num_preguntas = s.num_preguntas + cantidad, estado = 'pregunta', nivel = (_cfg->>'nivel')::integer, compas = _cfg->>'compas', figuras = ARRAY(SELECT jsonb_array_elements_text(_cfg->'figuras')), ejercicio = _cfg->>'ejercicio', ppm = (_cfg->>'ppm')::integer, num_compases = (_cfg->>'numCompases')::integer WHERE id = s.id;
END $$;
REVOKE ALL ON FUNCTION public.anadir_ronda(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anadir_ronda(uuid, jsonb, jsonb) TO authenticated;