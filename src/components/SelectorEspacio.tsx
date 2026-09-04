import { Flame, Users, WashingMachine } from "lucide-react";
import { ESPACIOS, type Espacio } from "@/lib/reservas";

const ICONOS = {
  SUM: Users,
  Parrilla: Flame,
  Lavadero: WashingMachine,
} as const;

const DESCRIPCIONES = {
  SUM: "Salón de usos múltiples",
  Parrilla: "Parrilla y quincho",
  Lavadero: "Lavadero común",
} as const;

export function SelectorEspacio({
  seleccionado,
  onSeleccionar,
}: {
  seleccionado: Espacio | null;
  onSeleccionar: (espacio: Espacio) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {ESPACIOS.map((espacio) => {
        const Icono = ICONOS[espacio];
        const activo = seleccionado === espacio;
        return (
          <button
            key={espacio}
            type="button"
            onClick={() => onSeleccionar(espacio)}
            aria-pressed={activo}
            className={`tap flex w-full items-center gap-4 rounded-2xl border bg-card px-5 py-5 text-left transition-all duration-200 active:scale-[0.99] ${
              activo
                ? "border-primary bg-accent shadow-[0_1px_2px_oklch(0_0_0/0.04)]"
                : "border-border hover:border-primary/40"
            }`}
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                activo ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icono className="size-6" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold tracking-tight">{espacio}</span>
              <span className="block text-sm text-muted-foreground">{DESCRIPCIONES[espacio]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
