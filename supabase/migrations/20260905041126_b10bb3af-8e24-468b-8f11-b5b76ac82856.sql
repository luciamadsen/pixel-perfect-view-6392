CREATE POLICY "Crear reserva publica"
  ON public.reservas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    estado = 'Confirmada'
    AND departamento ~ '^[0-9]{1,3}[A-Z]$'
    AND espacio IN ('SUM', 'Parrilla', 'Lavadero')
    AND hora_inicio >= 8 AND hora_fin <= 24 AND hora_fin > hora_inicio
    AND fecha_cancelacion IS NULL
  );

CREATE POLICY "Cancelar reserva con codigo"
  ON public.reservas
  FOR UPDATE
  TO anon, authenticated
  USING (estado = 'Confirmada')
  WITH CHECK (estado = 'Cancelada');

GRANT SELECT, INSERT, UPDATE ON public.reservas TO anon, authenticated;
GRANT ALL ON public.reservas TO service_role;