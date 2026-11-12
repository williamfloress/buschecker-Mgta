-- ============================================
-- 0001 · Esquema base (sin DROP: migración incremental)
-- Mantiene los nombres de tablas/columnas que usa src/lib/services.js
-- ============================================

-- Bounding box de Isla de Margarita (incluye Coche y Cubagua)
-- lat 10.60 .. 11.25 · lng -64.50 .. -63.70

create table public.perfiles_usuario (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null,
  rol        text not null default 'pasajero' check (rol in ('conductor', 'pasajero', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lineas (
  id_linea   uuid primary key default gen_random_uuid(),
  nombre     varchar(255) not null,
  tarifa     numeric(10, 2) not null default 0.00 check (tarifa >= 0),
  color      varchar(7) default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create table public.paradas (
  id_parada  uuid primary key default gen_random_uuid(),
  nombre     varchar(255) not null,
  latitud    numeric(10, 8) not null check (latitud  between 10.60 and 11.25),
  longitud   numeric(11, 8) not null check (longitud between -64.50 and -63.70),
  direccion  text,
  created_at timestamptz not null default now()
);

create table public.ruta_parada (
  id_linea  uuid not null references public.lineas(id_linea) on delete cascade,
  id_parada uuid not null references public.paradas(id_parada) on delete cascade,
  orden     integer not null check (orden > 0),
  primary key (id_linea, id_parada, orden),
  constraint unique_orden_per_linea unique (id_linea, orden)
);

create table public.unidades (
  id_unidad  uuid primary key default gen_random_uuid(),
  id_linea   uuid not null references public.lineas(id_linea) on delete restrict,
  placa      varchar(20) not null unique,
  modelo     varchar(100),
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.posicion_actual (
  id_posicion uuid primary key default gen_random_uuid(),
  id_unidad   uuid not null references public.unidades(id_unidad) on delete cascade,
  timestamp   timestamptz not null default now(),
  latitud     numeric(10, 8) not null check (latitud  between 10.60 and 11.25),
  longitud    numeric(11, 8) not null check (longitud between -64.50 and -63.70),
  velocidad   numeric(5, 2) not null default 0.00 check (velocidad between 0 and 150),
  status      varchar(50) not null default 'en_ruta',
  constraint unique_unidad_posicion unique (id_unidad)
);

create table public.unidad_conductor (
  id_unidad          uuid primary key references public.unidades(id_unidad) on delete cascade,
  id_usuario         uuid not null references public.perfiles_usuario(id) on delete restrict,
  fecha_asignacion   timestamptz not null default now(),
  fecha_finalizacion timestamptz,
  is_active          boolean not null default true
);

-- id_referencia sigue siendo TEXT por compatibilidad con el frontend actual (M2 pendiente)
create table public.favoritos (
  id_favorito   uuid primary key default gen_random_uuid(),
  id_usuario    uuid not null references public.perfiles_usuario(id) on delete cascade,
  tipo_favorito varchar(50) not null check (tipo_favorito in ('parada', 'linea')),
  id_referencia text not null,
  created_at    timestamptz not null default now(),
  constraint unique_user_favorite unique (id_usuario, tipo_favorito, id_referencia)
);

create table public.posicion_historica (
  id_historico uuid primary key default gen_random_uuid(),
  id_unidad    uuid not null references public.unidades(id_unidad) on delete cascade,
  timestamp    timestamptz not null,
  latitud      numeric(10, 8) not null,
  longitud     numeric(11, 8) not null,
  velocidad    numeric(5, 2) default 0.00,
  status       varchar(50) default 'en_ruta'
);

create index idx_ruta_parada_parada        on public.ruta_parada(id_parada);
create index idx_unidades_linea            on public.unidades(id_linea);
create index idx_posicion_historica_unidad on public.posicion_historica(id_unidad, timestamp desc);
create index idx_favoritos_usuario         on public.favoritos(id_usuario);
create index idx_unidad_conductor_usuario  on public.unidad_conductor(id_usuario);
