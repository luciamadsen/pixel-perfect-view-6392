import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { buscarReserva, cancelarReserva } from "@/lib/reservas.functions";
import { fechaLarga, hh } from "@/lib/reservas";

export const Route = createFileRoute("/cancelar")({
  head: () => ({
    meta: [
      { title: "Cancelar una reserva · Reservas del Edificio" },
      {
        name: "description",
        content:
          "Cancelá tu reserva del SUM, la Parrilla o el Lavadero con el número de departamento y el código de cancelación.",
      },
      { property: "og:title", content: "Cancelar una reserva" },
      {
        property: "og:description",
        content: "Ingresá tu departamento y el código de cancelación para liberar el horario.",
      },
    ],
  }),
  component: CancelarPagina,
});

type Encontrada = {
  departamento: string;
  espacio: string;
  fecha: string;
  hora_inicio: number;
  hora_fin: number;
  codigo_cancelacion: string;
};

function CancelarPagina() {
  const router = useRouter();
  const buscar = useServerFn(buscarReserva);
  const cancelar = useServerFn(cancelarReserva);

  const [departamento, setDepartamento] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Encontrada | null>(null);
  const [cancelada, setCancelada] = useState(false);
  const [cargando, setCargando] = useState(false);

  const normalizar = (v: string) => v.replace(/\s+/g, "").toUpperCase();

  async function onBuscar() {
    setCargando(true);
    setError(null);
    try {
      const res = await buscar({ data: { departamento, codigo } });
      if (res.ok) setReserva(res.reserva);
      else setError("No encontramos una reserva con esos datos");
    } finally {
      setCargando(false);
    }
  }

  async function onCancelar() {
    setCargando(true);
    try {
      const res = await cancelar({ data: { departamento, codigo } });
      if (res.ok) {
        setCancelada(true);
        router.invalidate();
      } else {
        setError("No encontramos una reserva con esos datos");
        setReserva(null);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-8 pb-16">
      <Link to="/" className="tap inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft className="size-4" /> Volver
      </Link>

      {cancelada && reserva ? (
        <section className="animate-in fade-in duration-300">
          <span className="mt-6 flex size-12 items-center justify-center rounded-full bg-libre text-libre-foreground">
            <Check className="size-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Reserva cancelada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El horario quedó disponible para el resto del edificio.
          </p>
          <Link
            to="/"
            className="tap mt-6 flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground"
          >
            Volver al inicio
          </Link>
        </section>
      ) : reserva ? (
        <section className="animate-in fade-in duration-300">
          <h1 className="mt-6 text-2xl font-bold tracking-tight">¿Cancelar esta reserva?</h1>
          <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5">
            <Dato titulo="Departamento" valor={reserva.departamento} />
            <Dato titulo="Espacio" valor={reserva.espacio} />
            <Dato titulo="Fecha" valor={fechaLarga(reserva.fecha)} />
            <Dato titulo="Horario" valor={`${hh(reserva.hora_inicio)} a ${hh(reserva.hora_fin)}`} />
          </dl>
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="tap mt-5 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-40"
          >
            Confirmar cancelación
          </button>
          <button
            type="button"
            onClick={() => setReserva(null)}
            className="tap mt-2 w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold text-secondary-foreground"
          >
            Volver
          </button>
        </section>
      ) : (
        <section className="animate-in fade-in duration-300">
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Cancelar una reserva</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresá tu departamento y el código que recibiste al reservar.
          </p>

          <label className="mt-6 block text-sm font-semibold">Departamento</label>
          <input
            value={departamento}
            onChange={(e) => {
              setDepartamento(normalizar(e.target.value));
              setError(null);
            }}
            placeholder="5A"
            maxLength={4}
            autoCapitalize="characters"
            className="mt-2 w-full rounded-2xl border border-input bg-card px-5 py-4 text-xl font-semibold tracking-wide outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
          />

          <label className="mt-4 block text-sm font-semibold">Código de cancelación</label>
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(normalizar(e.target.value));
              setError(null);
            }}
            placeholder="LUNA482"
            maxLength={12}
            autoCapitalize="characters"
            className="mt-2 w-full rounded-2xl border border-input bg-card px-5 py-4 text-xl font-semibold tracking-wide outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
          />

          {error && (
            <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onBuscar}
            disabled={!departamento || !codigo || cargando}
            className="tap mt-6 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-40"
          >
            Buscar reserva
          </button>
        </section>
      )}
    </main>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <dt className="text-sm text-muted-foreground">{titulo}</dt>
      <dd className="text-sm font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
