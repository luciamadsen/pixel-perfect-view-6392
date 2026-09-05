import { supabase } from "@/integrations/supabase/client";

const PALABRAS = [
  "LUNA",
  "PINO",
  "SOL",
  "MAR",
  "RIO",
  "NUBE",
  "CIELO",
  "ROCA",
  "FLOR",
  "VIENTO",
  "LAGO",
  "TIGRE",
  "CEDRO",
  "AGUA",
  "FARO",
  "OLIVO",
];

export type ReservaFila = {
  id: string;
  departamento: string;
  espacio: string;
  fecha: string;
  hora_inicio: number;
  hora_fin: number;
  codigo_cancelacion: string;
};

export type ResultadoCrear =
  | { ok: true; reserva: ReservaFila }
  | { ok: false; motivo: "ocupado" | "invalido" };

const CAMPOS = "id, departamento, espacio, fecha, hora_inicio, hora_fin, codigo_cancelacion";

const normalizar = (v: string) => v.replace(/\s+/g, "").toUpperCase();

const nuevoCodigo = () =>
  `${PALABRAS[Math.floor(Math.random() * PALABRAS.length)]}${String(
    Math.floor(Math.random() * 900) + 100,
  )}`;

export async function crearReserva(input: {
  departamento: string;
  espacio: "SUM" | "Parrilla" | "Lavadero";
  fecha: string;
  horaInicio: number;
  horaFin: number;
}): Promise<ResultadoCrear> {
  const departamento = normalizar(input.departamento);
  if (!/^\d{1,3}[A-Z]$/.test(departamento)) return { ok: false, motivo: "invalido" };
  if (input.horaFin <= input.horaInicio) return { ok: false, motivo: "invalido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) return { ok: false, motivo: "invalido" };

  for (let intento = 0; intento < 8; intento++) {
    const { data: fila, error } = await supabase
      .from("reservas")
      .insert({
        departamento,
        espacio: input.espacio,
        fecha: input.fecha,
        hora_inicio: input.horaInicio,
        hora_fin: input.horaFin,
        codigo_cancelacion: nuevoCodigo(),
      })
      .select(CAMPOS)
      .single();

    if (!error && fila) return { ok: true, reserva: fila as ReservaFila };
    if (error?.code === "23505") continue; // código repetido: probar otro
    if (error?.code === "23P01") return { ok: false, motivo: "ocupado" };
    return { ok: false, motivo: "invalido" };
  }
  return { ok: false, motivo: "invalido" };
}

export async function buscarReserva(input: { departamento: string; codigo: string }) {
  const { data: fila } = await supabase
    .from("reservas")
    .select(CAMPOS)
    .eq("codigo_cancelacion", normalizar(input.codigo))
    .eq("departamento", normalizar(input.departamento))
    .eq("estado", "Confirmada")
    .maybeSingle();

  return fila ? { ok: true as const, reserva: fila as ReservaFila } : { ok: false as const };
}

export async function cancelarReserva(input: { departamento: string; codigo: string }) {
  const { data: fila } = await supabase
    .from("reservas")
    .update({ estado: "Cancelada", fecha_cancelacion: new Date().toISOString() })
    .eq("codigo_cancelacion", normalizar(input.codigo))
    .eq("departamento", normalizar(input.departamento))
    .eq("estado", "Confirmada")
    .select("id")
    .maybeSingle();

  return { ok: Boolean(fila) };
}
