CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.reservas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento text NOT NULL,
  espacio text NOT NULL CHECK (espacio IN ('SUM','Parrilla','Lavadero')),
  fecha date NOT NULL,
  hora_inicio smallint NOT NULL CHECK (hora_inicio >= 8 AND hora_inicio <= 23),
  hora_fin smallint NOT NULL CHECK (hora_fin >= 9 AND hora_fin <= 24),
  codigo_cancelacion text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'Confirmada' CHECK (estado IN ('Confirmada','Cancelada','Finalizada')),
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_cancelacion timestamptz,
  CHECK (hora_fin > hora_inicio)
);

ALTER TABLE public.reservas
  ADD CONSTRAINT reservas_sin_superposicion
  EXCLUDE USING gist (
    espacio WITH =,
    fecha WITH =,
    int4range(hora_inicio::int, hora_fin::int) WITH &&
  ) WHERE (estado = 'Confirmada');

CREATE INDEX reservas_espacio_fecha_idx ON public.reservas (espacio, fecha) WHERE estado = 'Confirmada';

GRANT SELECT ON public.reservas TO anon, authenticated;
GRANT ALL ON public.reservas TO service_role;

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disponibilidad publica" ON public.reservas FOR SELECT TO anon, authenticated USING (true);