import { ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS, MESES, claveFecha, hoyClave, type Reserva } from "@/lib/reservas";

type Props = {
  anio: number;
  mes: number;
  reservas: Reserva[];
  fechaSeleccionada: string | null;
  onCambiarMes: (delta: number) => void;
  onSeleccionarFecha: (clave: string) => void;
};

function nivel(cantidad: number) {
  if (cantidad === 0) return "libre";
  if (cantidad <= 2) return "parcial";
  return "lleno";
}

export function Calendario({
  anio,
  mes,
  reservas,
  fechaSeleccionada,
  onCambiarMes,
  onSeleccionarFecha,
}: Props) {
  const hoy = hoyClave();
  const primero = new Date(anio, mes, 1);
  const offset = (primero.getDay() + 6) % 7; // lunes primero
  const dias = new Date(anio, mes + 1, 0).getDate();

  const conteo = new Map<string, number>();
  for (const r of reservas) conteo.set(r.fecha, (conteo.get(r.fecha) ?? 0) + 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => onCambiarMes(-1)}
          className="tap flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors active:bg-accent"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-base font-semibold tracking-tight capitalize">
          {MESES[mes]} {anio}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => onCambiarMes(1)}
          className="tap flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors active:bg-accent"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DIAS.map((d, i) => (
          <span key={i} className="py-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: dias }, (_, i) => i + 1).map((dia) => {
          const clave = claveFecha(new Date(anio, mes, dia));
          const pasada = clave < hoy;
          const seleccionada = clave === fechaSeleccionada;
          const n = nivel(conteo.get(clave) ?? 0);

          const estilos = pasada
            ? "bg-secondary/60 text-muted-foreground/50"
            : n === "libre"
              ? "bg-libre text-libre-foreground"
              : n === "parcial"
                ? "bg-parcial text-parcial-foreground"
                : "bg-lleno text-lleno-foreground";

          return (
            <button
              key={dia}
              type="button"
              disabled={pasada}
              onClick={() => onSeleccionarFecha(clave)}
              className={`tap flex aspect-square items-center justify-center rounded-xl text-base font-semibold transition-all duration-150 active:scale-95 disabled:cursor-default disabled:active:scale-100 ${estilos} ${
                seleccionada ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
              }`}
            >
              {dia}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <Leyenda clase="bg-libre" texto="Disponible" />
        <Leyenda clase="bg-parcial" texto="Con algunas reservas" />
        <Leyenda clase="bg-lleno" texto="Alta ocupación" />
        <Leyenda clase="bg-secondary" texto="No disponible" />
      </div>
    </div>
  );
}

function Leyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`size-3 rounded-full ${clase}`} />
      {texto}
    </span>
  );
}
