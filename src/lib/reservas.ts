import { supabase } from "@/integrations/supabase/client";

export const ESPACIOS = ["SUM", "Parrilla", "Lavadero"] as const;
export type Espacio = (typeof ESPACIOS)[number];

/** Bloques horarios: cada bloque empieza en esa hora y dura una hora. */
export const HORAS = Array.from({ length: 16 }, (_, i) => i + 8); // 8..23

export type Reserva = {
  id: string;
  departamento: string;
  espacio: string;
  fecha: string;
  hora_inicio: number;
  hora_fin: number;
  codigo_cancelacion: string;
  estado: string;
};

export const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

export const claveFecha = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hoyClave = () => claveFecha(new Date());

export const fechaLarga = (clave: string) => {
  const [, m, d] = clave.split("-");
  return `${Number(d)} de ${MESES[Number(m) - 1]}`;
};

export const validarDepartamento = (valor: string) => {
  const limpio = valor.replace(/\s+/g, "").toUpperCase();
  return /^\d{1,3}[A-Z]$/.test(limpio) ? limpio : null;
};

export async function fetchReservasMes(espacio: Espacio, anio: number, mes: number) {
  const desde = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  const finMes = new Date(anio, mes + 1, 0);
  const hasta = claveFecha(finMes);

  const { data, error } = await supabase
    .from("reservas")
    .select("id, departamento, espacio, fecha, hora_inicio, hora_fin, codigo_cancelacion, estado")
    .eq("espacio", espacio)
    .eq("estado", "Confirmada")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("hora_inicio", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Reserva[];
}

export const reservasMesQuery = (espacio: Espacio, anio: number, mes: number) => ({
  queryKey: ["reservas", espacio, anio, mes],
  queryFn: () => fetchReservasMes(espacio, anio, mes),
});
