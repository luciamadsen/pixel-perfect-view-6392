import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Check, CheckCircle2, Clock, Copy, Hash, Loader2 } from "lucide-react";

import { SelectorEspacio } from "@/components/SelectorEspacio";
import { Calendario } from "@/components/Calendario";
import { AgendaHoraria } from "@/components/AgendaHoraria";
import { crearReserva } from "@/lib/reservas.functions";
import {
  fechaLarga,
  hh,
  hoyClave,
  reservasMesQuery,
  validarDepartamento,
  type Espacio,
  type Reserva,
} from "@/lib/reservas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reservas del Edificio · SUM, Parrilla y Lavadero" },
      {
        name: "description",
        content:
          "Consultá la disponibilidad y reservá el SUM, la Parrilla o el Lavadero del edificio desde el celular en pocos pasos.",
      },
      { property: "og:title", content: "Reservas del Edificio" },
      {
        property: "og:description",
        content: "Reservá el SUM, la Parrilla o el Lavadero del edificio desde tu celular.",
      },
    ],
  }),
  component: Index,
});

type Paso = "espacio" | "agenda" | "departamento" | "resumen" | "confirmado";

type Confirmada = {
  departamento: string;
  espacio: string;
  fecha: string;
  hora_inicio: number;
  hora_fin: number;
  codigo_cancelacion: string;
};

function Index() {
  const hoy = new Date();
  const [paso, setPaso] = useState<Paso>("espacio");
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [fecha, setFecha] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [departamento, setDepartamento] = useState("");
  const [errorDepto, setErrorDepto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const agendaRef = useRef<HTMLDivElement>(null);
  const enviar = useServerFn(crearReserva);

  const { data: reservas = [], refetch } = useQuery({
    ...reservasMesQuery(espacio ?? "SUM", anio, mes),
    enabled: espacio !== null,
  });

  const delDia: Reserva[] = useMemo(
    () => (fecha ? reservas.filter((r) => r.fecha === fecha) : []),
    [reservas, fecha],
  );

  const inicio = seleccion.length ? Math.min(...seleccion) : null;
  const fin = seleccion.length ? Math.max(...seleccion) + 1 : null;

  useEffect(() => {
    if (paso === "agenda" && fecha && agendaRef.current) {
      agendaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [fecha, paso]);

  function elegirEspacio(e: Espacio) {
    setEspacio(e);
    setFecha(null);
    setSeleccion([]);
    setPaso("agenda");
  }

  function cambiarMes(delta: number) {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
    setFecha(null);
    setSeleccion([]);
  }

  function tocarHora(hora: number) {
    setAviso(null);
    setSeleccion((actual) => {
      if (!actual.length) return [hora];
      const min = Math.min(...actual);
      const max = Math.max(...actual);
      if (hora === min && hora === max) return [];
      if (hora === min) return actual.filter((h) => h !== hora);
      if (hora === max) return actual.filter((h) => h !== hora);
      if (hora === min - 1 || hora === max + 1) return [...actual, hora].sort((a, b) => a - b);
      if (hora > min && hora < max) return [hora];
      return [hora];
    });
  }

  function irADepartamento() {
    if (!seleccion.length) {
      setAviso("Elegí un horario continuo que esté disponible");
      return;
    }
    setPaso("departamento");
  }

  function irAResumen() {
    const limpio = validarDepartamento(departamento);
    if (!limpio) {
      setErrorDepto(true);
      return;
    }
    setDepartamento(limpio);
    setErrorDepto(false);
    setPaso("resumen");
  }

  async function confirmar() {
    if (!espacio || !fecha || inicio === null || fin === null) return;
    setGuardando(true);
    try {
      const res = await enviar({
        data: { departamento, espacio, fecha, horaInicio: inicio, horaFin: fin },
      });
      if (res.ok) {
        setConfirmada(res.reserva);
        setSeleccion([]);
        setPaso("confirmado");
        refetch();
      } else if (res.motivo === "ocupado") {
        setAviso("El horario acaba de ser reservado. Elegí otra franja disponible");
        setSeleccion([]);
        setPaso("agenda");
        refetch();
      } else {
        setAviso("No pudimos guardar la reserva. Revisá los datos e intentá de nuevo");
        setPaso("agenda");
      }
    } finally {
      setGuardando(false);
    }
  }

  function otraReserva() {
    setConfirmada(null);
    setEspacio(null);
    setFecha(null);
    setSeleccion([]);
    setDepartamento("");
    setPaso("espacio");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-8 pb-32">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="size-5" strokeWidth={2} />
          <span className="text-xs font-semibold tracking-[0.14em] uppercase">Reservas</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Reservas del Edificio</h1>
      </header>

      {paso === "espacio" && (
        <section className="animate-in fade-in duration-300">
          <p className="mb-4 text-sm text-muted-foreground">
            Elegí el espacio que querés reservar.
          </p>
          <SelectorEspacio seleccionado={espacio} onSeleccionar={elegirEspacio} />
          <Link
            to="/cancelar"
            className="tap mt-6 flex w-full items-center justify-center rounded-2xl border border-border bg-card py-4 text-sm font-semibold text-secondary-foreground transition-colors active:bg-secondary"
          >
            Cancelar una reserva
          </Link>
        </section>
      )}

      {paso === "agenda" && espacio && (
        <section className="animate-in fade-in duration-300">
          <Chip
            espacio={espacio}
            fecha={fecha}
            onCambiar={() => {
              setPaso("espacio");
              setEspacio(null);
              setFecha(null);
              setSeleccion([]);
            }}
          />

          <div className="mt-4">
            <Calendario
              anio={anio}
              mes={mes}
              reservas={reservas}
              fechaSeleccionada={fecha}
              onCambiarMes={cambiarMes}
              onSeleccionarFecha={(clave) => {
                setFecha(clave);
                setSeleccion([]);
                setAviso(null);
              }}
            />
          </div>

          {aviso && !fecha && <Aviso texto={aviso} />}

          {fecha && (
            <div ref={agendaRef} className="mt-6 scroll-mt-4">
              <h2 className="mb-3 text-base font-semibold tracking-tight">
                Horarios del {fechaLarga(fecha)} · {espacio}
              </h2>
              <AgendaHoraria reservas={delDia} seleccion={seleccion} onTocarHora={tocarHora} />
              {aviso && <Aviso texto={aviso} />}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <span className="text-sm font-medium">
                  {inicio !== null && fin !== null ? (
                    <>
                      Horario seleccionado:{" "}
                      <span className="font-semibold tabular-nums">
                        {hh(inicio)} a {hh(fin)}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Ningún horario seleccionado</span>
                  )}
                </span>
                {seleccion.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSeleccion([])}
                    className="tap text-sm font-semibold text-primary"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
          )}

          {fecha && (
            <BarraInferior>
              <BotonPrincipal onClick={irADepartamento} disabled={!seleccion.length}>
                Continuar
              </BotonPrincipal>
            </BarraInferior>
          )}
        </section>
      )}

      {paso === "departamento" && (
        <section className="animate-in fade-in duration-300">
          <Volver onClick={() => setPaso("agenda")} />
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Número y letra del departamento
          </h2>
          <input
            value={departamento}
            onChange={(e) => {
              setDepartamento(e.target.value.replace(/\s+/g, "").toUpperCase());
              setErrorDepto(false);
            }}
            inputMode="text"
            autoCapitalize="characters"
            placeholder="5A"
            maxLength={4}
            className="mt-3 w-full rounded-2xl border border-input bg-card px-5 py-4 text-2xl font-semibold tracking-wide outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <p className={`mt-2 text-sm ${errorDepto ? "text-destructive" : "text-muted-foreground"}`}>
            {errorDepto ? "Ingresá un departamento válido. Por ejemplo: 5A" : "Por ejemplo: 5A"}
          </p>

          <BarraInferior>
            <BotonPrincipal onClick={irAResumen} disabled={!departamento}>
              Continuar
            </BotonPrincipal>
          </BarraInferior>
        </section>
      )}

      {paso === "resumen" && espacio && fecha && inicio !== null && fin !== null && (
        <section className="animate-in fade-in duration-300">
          <Volver onClick={() => setPaso("departamento")} />
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Revisá tu reserva</h2>
          <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card px-5">
            <Dato titulo="Departamento" valor={departamento} />
            <Dato titulo="Espacio" valor={espacio} />
            <Dato titulo="Fecha" valor={fechaLarga(fecha)} />
            <Dato titulo="Hora de inicio" valor={hh(inicio)} />
            <Dato titulo="Hora de finalización" valor={hh(fin)} />
            <Dato titulo="Duración" valor={`${fin - inicio} ${fin - inicio === 1 ? "hora" : "horas"}`} />
          </dl>

          <BarraInferior>
            <BotonPrincipal onClick={confirmar} disabled={guardando}>
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" /> Confirmando
                </span>
              ) : (
                "Confirmar reserva"
              )}
            </BotonPrincipal>
            <button
              type="button"
              onClick={() => setPaso("agenda")}
              className="tap w-full py-3 text-sm font-semibold text-secondary-foreground"
            >
              Volver y modificar
            </button>
          </BarraInferior>
        </section>
      )}

      {paso === "confirmado" && confirmada && (
        <section className="animate-in fade-in duration-300">
          <span className="flex size-12 items-center justify-center rounded-full bg-libre text-libre-foreground">
            <Check className="size-6" strokeWidth={2.5} />
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">¡Reserva confirmada!</h2>

          <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5">
            <Dato titulo="Departamento" valor={confirmada.departamento} />
            <Dato titulo="Espacio" valor={confirmada.espacio} />
            <Dato titulo="Fecha" valor={fechaLarga(confirmada.fecha)} />
            <Dato
              titulo="Horario"
              valor={`${hh(confirmada.hora_inicio)} a ${hh(confirmada.hora_fin)}`}
            />
          </dl>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Código de cancelación
            </p>
            <p className="mt-2 text-3xl font-bold tracking-wider">{confirmada.codigo_cancelacion}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(confirmada.codigo_cancelacion);
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 2000);
              }}
              className="tap mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              <Copy className="size-4" /> {copiado ? "Copiado" : "Copiar código"}
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              Guardá este código. Lo vas a necesitar para cancelar la reserva.
            </p>
          </div>

          <p className="mt-4 rounded-2xl bg-secondary px-5 py-4 text-sm text-secondary-foreground">
            Luego de usarlo, se ruega mantener el orden y la limpieza del mismo. Muchas gracias.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <BotonPrincipal onClick={() => setPaso("agenda")}>Volver al calendario</BotonPrincipal>
            <button
              type="button"
              onClick={otraReserva}
              className="tap w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold text-secondary-foreground"
            >
              Realizar otra reserva
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Chip({
  espacio,
  fecha,
  onCambiar,
}: {
  espacio: string;
  fecha: string | null;
  onCambiar: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
      <span className="text-sm font-semibold">
        {espacio}
        {fecha && fecha >= hoyClave() ? (
          <span className="font-normal text-muted-foreground"> · {fechaLarga(fecha)}</span>
        ) : null}
      </span>
      <button type="button" onClick={onCambiar} className="tap text-sm font-semibold text-primary">
        Cambiar espacio
      </button>
    </div>
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

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">
      {texto}
    </p>
  );
}

function BarraInferior({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-5 pt-3 pb-5 backdrop-blur">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

function BotonPrincipal({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tap w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all duration-150 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

function Volver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
    >
      <ArrowLeft className="size-4" /> Volver
    </button>
  );
}
