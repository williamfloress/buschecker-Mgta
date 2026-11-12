import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Bus,
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

// Rutas ilustrativas del mapa de la portada (coordenadas del viewBox 400×260)
const ROUTE_EAST = "M235,185 C250,150 270,120 300,105 S350,110 352,150";
const ROUTE_WEST = "M90,170 C110,150 150,150 170,160 S215,165 235,185";

function HeroMap() {
  const reduced = usePrefersReducedMotion();

  const bus = (path: string, dur: string, color: string, staticAt: [number, number]) =>
    reduced ? (
      <g transform={`translate(${staticAt[0]} ${staticAt[1]})`}>
        <circle r="8" fill={color} stroke="hsl(var(--card))" strokeWidth="3" />
      </g>
    ) : (
      <g>
        <circle r="14" fill={color} opacity="0.18">
          <animate attributeName="r" values="9;16;9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="8" fill={color} stroke="hsl(var(--card))" strokeWidth="3" />
        <animateMotion
          dur={dur}
          repeatCount="indefinite"
          path={path}
          keyPoints="0;1;0"
          keyTimes="0;0.5;1"
          calcMode="linear"
        />
      </g>
    );

  const stop = (x: number, y: number) => (
    <circle cx={x} cy={y} r="5" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
  );

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <svg
        viewBox="0 0 400 260"
        className="w-full h-auto block"
        role="img"
        aria-label="Ilustración: dos rutas sobre Isla de Margarita con autobuses en movimiento"
      >
        <rect width="400" height="260" fill="hsl(var(--primary) / 0.07)" />
        {/* Macanao (oeste) y la isla oriental, unidas por La Restinga */}
        <path
          d="M55,165 C62,132 108,118 140,134 C162,146 162,178 140,192 C108,210 64,200 55,165 Z"
          fill="hsl(var(--muted))"
        />
        <path
          d="M196,152 C206,88 262,56 314,68 C364,80 390,124 372,168 C356,208 300,220 254,208 C222,200 200,182 196,152 Z"
          fill="hsl(var(--muted))"
        />
        <path d="M150,166 C168,170 182,172 200,166" stroke="hsl(var(--muted))" strokeWidth="7" fill="none" strokeLinecap="round" />

        <path d={ROUTE_WEST} fill="none" stroke="hsl(var(--chart-2))" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" />
        <path d={ROUTE_EAST} fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" />

        {stop(90, 170)}
        {stop(170, 160)}
        {stop(235, 185)}
        {stop(300, 105)}
        {stop(352, 150)}

        {bus(ROUTE_EAST, "9s", "hsl(var(--primary))", [300, 105])}
        {bus(ROUTE_WEST, "12s", "hsl(var(--chart-2))", [170, 160])}
      </svg>

      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-card/90 backdrop-blur px-3 py-1 text-xs font-medium border border-border">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        En vivo
      </div>
      <div className="absolute right-3 bottom-3 rounded-lg bg-card/90 backdrop-blur px-3 py-2 text-xs border border-border shadow-sm">
        <div className="font-semibold">RA-1 · Ruta Norte</div>
        <div className="text-muted-foreground">Unidad en ruta</div>
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
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="BusChecker Margarita, inicio">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="h-5 w-5" />
            </span>
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
        <section className="container mx-auto grid items-center gap-10 px-4 py-14 md:py-20 lg:grid-cols-2">
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
          <div className="container mx-auto px-4 py-16">
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
          <div className="container mx-auto px-4 py-16">
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
          <div className="container mx-auto px-4 py-16">
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
        <section className="container mx-auto px-4 py-16">
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
        <section className="container mx-auto px-4 pb-16">
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
        <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>BusChecker Margarita · Mapa © colaboradores de OpenStreetMap</span>
          <span>Proyecto demostrativo: las unidades que ves en el mapa son simuladas.</span>
        </div>
      </footer>
    </div>
  );
}
