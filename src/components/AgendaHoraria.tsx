import { hh, type Reserva } from "@/lib/reservas";

type Props = {
  reservas: Reserva[];
  seleccion: number[];
  onTocarHora: (hora: number) => void;
};

/** Agrupa horas ocupadas en franjas continuas por reserva. */
export function AgendaHoraria({ reservas, seleccion, onTocarHora }: Props) {
  const ocupadoPor = new Map<number, Reserva>();
  for (const r of reservas) {
    for (let h = r.hora_inicio; h < r.hora_fin; h++) ocupadoPor.set(h, r);
  }

  const filas: Array<
    { tipo: "libre"; hora: number } | { tipo: "ocupado"; reserva: Reserva; desde: number; hasta: number }
  > = [];

  const primera = 8;
  const ultima = 23;
  let hora = primera;
  while (hora <= ultima) {
    const reserva = ocupadoPor.get(hora);
    if (!reserva) {
      filas.push({ tipo: "libre", hora });
      hora++;
      continue;
    }
    let fin = hora;
    while (fin <= ultima && ocupadoPor.get(fin)?.id === reserva.id) fin++;
    filas.push({ tipo: "ocupado", reserva, desde: hora, hasta: fin });
    hora = fin;
  }

  return (
    <div className="flex flex-col gap-2">
      {filas.map((fila) =>
        fila.tipo === "ocupado" ? (
          <div
            key={`o${fila.desde}`}
            className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-4 text-muted-foreground"
          >
            <span className="text-base font-semibold tabular-nums">
              {hh(fila.desde)} – {hh(fila.hasta)}
            </span>
            <span className="text-sm font-medium">Reservado · {fila.reserva.departamento}</span>
          </div>
        ) : (
          <button
            key={`l${fila.hora}`}
            type="button"
            onClick={() => onTocarHora(fila.hora)}
            aria-pressed={seleccion.includes(fila.hora)}
            className={`tap flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all duration-150 active:scale-[0.99] ${
              seleccion.includes(fila.hora)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-base font-semibold tabular-nums">
              {hh(fila.hora)} – {hh(fila.hora + 1)}
            </span>
            <span className="text-sm font-medium opacity-80">
              {seleccion.includes(fila.hora) ? "Elegido" : "Disponible"}
            </span>
          </button>
        ),
      )}
    </div>
  );
}
