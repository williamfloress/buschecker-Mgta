import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
  Navigation,
  UserRound,
  Wrench,
  ArrowRight,
  Map as MapIcon,
  Database,
  Lock,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import BrandMark from "@/components/BrandMark";
import { lineaService } from "@/lib/services";

type Linea = { id_linea: string; nombre: string; color: string | null };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** "RA-1 Ruta Norte - Playas (Playa El Agua)" → { code: "RA-1", name: "Ruta Norte - Playas", detail: "Playa El Agua" } */
function splitLineName(nombre: string) {
  const [code, ...rest] = nombre.split(" ");
  const restText = rest.join(" ");
  const match = restText.match(/^(.*?)\s*\((.*)\)\s*$/);
  return match
    ? { code, name: match[1], detail: match[2] }
    : { code, name: restText, detail: "" };
}

/** Ancho máximo y márgenes laterales comunes a todas las secciones de la portada. */
const WRAP = "mx-auto w-full max-w-6xl px-5 sm:px-8";

// Ilustración del hero (viewBox 400×300): la ruta RA-1 de Porlamar a Playa El Agua,
// con "tu parada" en el C.C. Sambil. El autobús se acerca y la tarjeta cuenta los minutos.
const P_START: [number, number] = [62, 252];
const P_STOP: [number, number] = [196, 166];
const P_END: [number, number] = [338, 62];
const LEG_1 = `M${P_START} C110,246 150,200 ${P_STOP}`;
const ROUTE = `${LEG_1} S292,104 ${P_END}`;

// Tiempos del ciclo (ms) y minutos de ETA al salir de Porlamar
const T_TO_STOP = 7000;
const T_DWELL = 2200;
const T_TO_END = 4500;
const T_PAUSE = 1300;
const CYCLE = T_TO_STOP + T_DWELL + T_TO_END + T_PAUSE;
const ETA_START_MIN = 6;

type Phase = { kind: "approaching"; minutes: number } | { kind: "atStop" } | { kind: "passed" };

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function HeroMap() {
  const reduced = usePrefersReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const leg1Ref = useRef<SVGPathElement>(null);
  const busRef = useRef<SVGGElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "approaching", minutes: 3 });
  const [progress, setProgress] = useState(0.55);

  useEffect(() => {
    const route = routeRef.current;
    const leg1 = leg1Ref.current;
    const busEl = busRef.current;
    if (!route || !leg1 || !busEl) return;

    const total = route.getTotalLength();
    const toStop = leg1.getTotalLength();
    const place = (len: number) => {
      const p = route.getPointAtLength(len);
      busEl.setAttribute("transform", `translate(${p.x} ${p.y})`);
    };

    if (reduced) {
      place(toStop * 0.55);
      setPhase({ kind: "approaching", minutes: 3 });
      setProgress(0.55);
      return;
    }

    let raf = 0;
    let lastKey = "";
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) % CYCLE;
      let len: number;
      let next: Phase;
      let prog: number;

      if (t < T_TO_STOP) {
        const f = easeInOut(t / T_TO_STOP);
        len = f * toStop;
        prog = f;
        next = { kind: "approaching", minutes: Math.max(1, Math.ceil((1 - f) * ETA_START_MIN)) };
      } else if (t < T_TO_STOP + T_DWELL) {
        len = toStop;
        prog = 1;
        next = { kind: "atStop" };
      } else if (t < T_TO_STOP + T_DWELL + T_TO_END) {
        const f = easeInOut((t - T_TO_STOP - T_DWELL) / T_TO_END);
        len = toStop + f * (total - toStop);
        prog = 1;
        next = { kind: "passed" };
      } else {
        len = total;
        prog = 1;
        next = { kind: "passed" };
      }

      place(len);
      busEl.style.opacity = t > CYCLE - 400 ? String((CYCLE - t) / 400) : "1";
      const key = next.kind === "approaching" ? `a${next.minutes}` : next.kind;
      if (key !== lastKey) {
        lastKey = key;
        setPhase(next);
      }
      setProgress((p) => (Math.abs(p - prog) > 0.01 ? prog : p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const label = (x: number, y: number, text: string, anchor: "start" | "end" = "start", bold = false) => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize="11"
      fontWeight={bold ? 700 : 500}
      fill="hsl(var(--foreground))"
      stroke="hsl(var(--background))"
      strokeWidth="3"
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {text}
    </text>
  );

  const stopDot = ([x, y]: [number, number]) => (
    <circle cx={x} cy={y} r="5.5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="3" />
  );

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto block"
        role="img"
        aria-label="Ejemplo: un autobús de la ruta RA-1 se acerca a tu parada en el C.C. Sambil y la app indica en cuántos minutos llega"
      >
        {/* mar y tierra */}
        <rect width="400" height="300" fill="hsl(var(--map-sea))" />
        <path
          d="M18,300 L18,196 C40,150 70,128 108,118 C150,106 172,64 214,40 C262,12 330,10 372,30 C400,44 400,80 400,80 L400,300 Z"
          fill="hsl(var(--map-land))"
          stroke="hsl(var(--map-coast))"
          strokeWidth="2"
        />
        {/* calles de fondo */}
        <g stroke="hsl(var(--background))" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round">
          <path d="M40,230 L380,214" />
          <path d="M90,150 L392,150" />
          <path d="M160,92 L380,96" />
          <path d="M120,290 L150,120" />
          <path d="M250,290 L262,40" />
          <path d="M330,290 L350,36" />
        </g>

        {/* ruta RA-1 */}
        <path d={ROUTE} fill="none" stroke="hsl(var(--card))" strokeWidth="11" strokeLinecap="round" />
        <path ref={routeRef} d={ROUTE} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round" />
        <path ref={leg1Ref} d={LEG_1} fill="none" stroke="none" />

        {stopDot(P_START)}
        {stopDot(P_END)}
        {label(P_START[0] + 10, P_START[1] + 20, "Terminal Porlamar")}
        {label(P_END[0] - 12, P_END[1] - 12, "Playa El Agua", "end")}

        {/* tu parada */}
        <circle cx={P_STOP[0]} cy={P_STOP[1]} r="16" fill="hsl(var(--primary) / 0.15)" />
        <circle cx={P_STOP[0]} cy={P_STOP[1]} r="7" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="3" />
        {label(P_STOP[0] - 16, P_STOP[1] - 16, "Tu parada · C.C. Sambil", "end", true)}

        {/* autobús */}
        <g ref={busRef} transform={`translate(${P_START})`}>
          <rect x="-15" y="-11" width="30" height="22" rx="7" fill="hsl(var(--foreground))" />
          <text y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="hsl(var(--background))">
            RA-1
          </text>
        </g>
      </svg>

      <div className="absolute left-3 top-3 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur">
        Ejemplo · Ruta RA-1
      </div>

      <div
        className="m-3 mt-0 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur sm:absolute sm:bottom-3 sm:right-3 sm:m-0 sm:w-56"
        aria-live="off"
      >
        <div className="text-xs text-muted-foreground">Tu parada · C.C. Sambil</div>
        <div className="mt-0.5 text-lg font-bold leading-tight">
          {phase.kind === "approaching" && <>RA-1 llega en {phase.minutes} min</>}
          {phase.kind === "atStop" && <span className="text-primary">RA-1 está en tu parada</span>}
          {phase.kind === "passed" && <span className="text-muted-foreground">Ya pasó · próxima en 12 min</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: Smartphone,
    title: "La unidad comparte su posición",
    text: "El conductor activa su unidad desde la app y su ubicación se envía cada pocos segundos mientras está en ruta.",
  },
  {
    icon: ShieldCheck,
    title: "La plataforma la valida",
    text: "Solo el conductor asignado a esa unidad puede moverla, y solo con coordenadas dentro de la isla. Todo lo demás se rechaza.",
  },
  {
    icon: MapIcon,
    title: "Tú la ves en el mapa",
    text: "El mapa se actualiza solo. Mira qué autobús viene, busca las paradas cercanas a ti y guarda tus favoritas.",
  },
];

const roles = [
  {
    icon: UserRound,
    title: "Pasajero",
    tag: "Sin registro",
    items: [
      "Autobuses activos en el mapa, en tiempo real",
      "Paradas cercanas a tu ubicación",
      "Paradas favoritas (con una cuenta gratuita)",
    ],
  },
  {
    icon: Navigation,
    title: "Conductor",
    tag: "Asignado por un admin",
    items: [
      "Activar o pausar su unidad",
      "Compartir su ubicación mientras maneja",
      "Indicar la ruta que está cubriendo",
    ],
  },
  {
    icon: Wrench,
    title: "Administrador",
    tag: "Asignado por un admin",
    items: [
      "Crear, editar y eliminar paradas",
      "Ubicar cada parada con coordenadas exactas",
      "Dar el rol de conductor: nadie puede asignárselo a sí mismo",
    ],
  },
];

const tech = [
  { icon: MapIcon, title: "OpenStreetMap + Leaflet", text: "Mapa abierto, sin claves de pago." },
  { icon: Database, title: "Supabase (Postgres)", text: "Base de datos, autenticación y API." },
  { icon: Lock, title: "Seguridad por fila (RLS)", text: "Cada tabla define quién puede leer y escribir." },
  { icon: Radio, title: "React + Vite", text: "Interfaz rápida que funciona en el teléfono." },
];

function RoutesList() {
  const { data, isLoading, isError } = useQuery<Linea[]>({
    queryKey: ["landing-lineas"],
    queryFn: lineaService.getAll,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="h-[76px] rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </ul>
    );
  }

  if (isError || !data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudieron cargar las rutas en este momento. Puedes verlas directamente en el mapa.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((linea) => {
        const { code, name, detail } = splitLineName(linea.nombre);
        return (
          <li key={linea.id_linea} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span
              className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold text-white"
              style={{ backgroundColor: linea.color || "hsl(var(--primary))" }}
            >
              {code}
            </span>
            <div className="min-w-0">
              <div className="font-medium leading-tight">{name}</div>
              {detail && <div className="text-sm text-muted-foreground truncate">{detail}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className={`${WRAP} flex items-center justify-between gap-4 py-3`}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="BusChecker Margarita, inicio">
            <BrandMark className="h-9 w-9" />
            <span className="font-bold leading-none">
              BusChecker <span className="font-normal text-muted-foreground">Margarita</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground">Cómo funciona</a>
            <a href="#perfiles" className="hover:text-foreground">Perfiles</a>
            <a href="#rutas" className="hover:text-foreground">Rutas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/app">Abrir el mapa</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className={`${WRAP} grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2`}>
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Isla de Margarita · tiempo real
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">
              ¿Dónde viene mi autobús?
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              BusChecker muestra en un mapa la posición de las unidades de cada ruta mientras circulan.
              Revisa cuál está más cerca de tu parada antes de salir de casa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/app">
                  Abrir el mapa <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#como-funciona">Cómo funciona</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Para ver el mapa no necesitas registrarte. La cuenta solo hace falta para guardar paradas favoritas.
            </p>
          </div>
          <HeroMap />
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-20 border-t border-border bg-card/40">
          <div className={`${WRAP} py-20`}>
            <h2 className="text-3xl font-bold tracking-tight">Cómo funciona</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Tres pasos, desde el autobús hasta tu teléfono.
            </p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">Paso {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Perfiles */}
        <section id="perfiles" className="scroll-mt-20">
          <div className={`${WRAP} py-20`}>
            <h2 className="text-3xl font-bold tracking-tight">Un mismo mapa, tres perfiles</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Cada perfil ve y puede hacer cosas distintas. Toda cuenta nueva empieza como pasajero.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {roles.map((role) => (
                <article key={role.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <role.icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {role.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{role.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {role.items.map((item) => (
                      <li key={item} className="flex gap-2 text-muted-foreground">
                        <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Rutas */}
        <section id="rutas" className="scroll-mt-20 border-t border-border bg-card/40">
          <div className={`${WRAP} py-20`}>
            <h2 className="text-3xl font-bold tracking-tight">Rutas de la red</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Las rutas que cubre BusChecker hoy, de Porlamar a las playas y a La Restinga.
            </p>
            <div className="mt-8">
              <RoutesList />
            </div>
          </div>
        </section>

        {/* Tecnología */}
        <section className={`${WRAP} py-20`}>
          <h2 className="text-3xl font-bold tracking-tight">Bajo el capó</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Construido con herramientas abiertas y una base de datos que valida cada escritura.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tech.map((t) => (
              <div key={t.title} className="rounded-xl border border-border bg-card p-5">
                <t.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-semibold">{t.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className={`${WRAP} pb-20`}>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:px-10">
            <div>
              <h2 className="text-2xl font-bold">Mira dónde vienen los autobuses ahora</h2>
              <p className="mt-1 opacity-90">Abre el mapa desde tu teléfono o computadora.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/app">
                Abrir el mapa <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={`${WRAP} flex flex-col gap-2 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between`}>
          <span>BusChecker Margarita · Mapa © colaboradores de OpenStreetMap</span>
          <span>Proyecto demostrativo: las unidades que ves en el mapa son simuladas.</span>
        </div>
      </footer>
    </div>
  );
}
