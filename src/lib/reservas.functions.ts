import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const reservaSchema = z.object({
  departamento: z
    .string()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .refine((v) => /^\d{1,3}[A-Z]$/.test(v), "departamento invalido"),
  espacio: z.enum(["SUM", "Parrilla", "Lavadero"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.number().int().min(8).max(23),
  horaFin: z.number().int().min(9).max(24),
});

const cancelSchema = z.object({
  departamento: z
    .string()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase()),
  codigo: z.string().transform((v) => v.replace(/\s+/g, "").toUpperCase()),
});

type ReservaFila = {
  id: string;
  departamento: string;
  espacio: string;
  fecha: string;
  hora_inicio: number;
  hora_fin: number;
  codigo_cancelacion: string;
};

type Resultado =
  | { ok: true; reserva: ReservaFila }
  | { ok: false; motivo: "ocupado" | "invalido" };

export const crearReserva = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reservaSchema.parse(data))
  .handler(async ({ data }): Promise<Resultado> => {
    if (data.horaFin <= data.horaInicio) return { ok: false, motivo: "invalido" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (let intento = 0; intento < 8; intento++) {
      const codigo = `${PALABRAS[Math.floor(Math.random() * PALABRAS.length)]}${String(
        Math.floor(Math.random() * 900) + 100,
      )}`;

      const { data: fila, error } = await supabaseAdmin
        .from("reservas")
        .insert({
          departamento: data.departamento,
          espacio: data.espacio,
          fecha: data.fecha,
          hora_inicio: data.horaInicio,
          hora_fin: data.horaFin,
          codigo_cancelacion: codigo,
        })
        .select("id, departamento, espacio, fecha, hora_inicio, hora_fin, codigo_cancelacion")
        .single();

      if (!error && fila) return { ok: true, reserva: fila };
      if (error?.code === "23505") continue; // código repetido: probar otro
      if (error?.code === "23P01") return { ok: false, motivo: "ocupado" };
      return { ok: false, motivo: "invalido" };
    }
    return { ok: false, motivo: "invalido" };
  });

export const buscarReserva = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cancelSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: fila } = await supabaseAdmin
      .from("reservas")
      .select("id, departamento, espacio, fecha, hora_inicio, hora_fin, codigo_cancelacion")
      .eq("codigo_cancelacion", data.codigo)
      .eq("departamento", data.departamento)
      .eq("estado", "Confirmada")
      .maybeSingle();

    return fila ? { ok: true as const, reserva: fila } : { ok: false as const };
  });

export const cancelarReserva = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cancelSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: fila } = await supabaseAdmin
      .from("reservas")
      .update({ estado: "Cancelada", fecha_cancelacion: new Date().toISOString() })
      .eq("codigo_cancelacion", data.codigo)
      .eq("departamento", data.departamento)
      .eq("estado", "Confirmada")
      .select("id")
      .maybeSingle();

    return { ok: Boolean(fila) };
  });
