-- ============================================
-- 0003 · RLS en todas las tablas (corrige C2 y A5) · Anexo A de la auditoría
-- ============================================

alter table public.perfiles_usuario   enable row level security;
alter table public.lineas             enable row level security;
alter table public.paradas            enable row level security;
alter table public.ruta_parada        enable row level security;
alter table public.unidades           enable row level security;
alter table public.posicion_actual    enable row level security;
alter table public.unidad_conductor   enable row level security;
alter table public.favoritos          enable row level security;
alter table public.posicion_historica enable row level security;

-- ¿El usuario actual es el conductor activo de esta unidad?
create or replace function public.is_driver_of(p_unidad uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.unidad_conductor uc
      join public.perfiles_usuario p on p.id = uc.id_usuario
     where uc.id_unidad = p_unidad
       and uc.id_usuario = (select auth.uid())
       and uc.is_active
       and p.rol = 'conductor'
  );
$$;
revoke execute on function public.is_driver_of(uuid) from public, anon;
grant  execute on function public.is_driver_of(uuid) to authenticated;

-- ---------- perfiles_usuario ----------
create policy "perfil: ver el propio o admin" on public.perfiles_usuario
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "perfil: editar el propio" on public.perfiles_usuario
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- catálogo: lineas, paradas, ruta_parada ----------
create policy "lineas: lectura pública" on public.lineas
  for select to anon, authenticated using (true);
create policy "lineas: admin inserta" on public.lineas
  for insert to authenticated with check ((select public.is_admin()));
create policy "lineas: admin actualiza" on public.lineas
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "lineas: admin borra" on public.lineas
  for delete to authenticated using ((select public.is_admin()));

create policy "paradas: lectura pública" on public.paradas
  for select to anon, authenticated using (true);
create policy "paradas: admin inserta" on public.paradas
  for insert to authenticated with check ((select public.is_admin()));
create policy "paradas: admin actualiza" on public.paradas
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "paradas: admin borra" on public.paradas
  for delete to authenticated using ((select public.is_admin()));

create policy "ruta_parada: lectura pública" on public.ruta_parada
  for select to anon, authenticated using (true);
create policy "ruta_parada: admin inserta" on public.ruta_parada
  for insert to authenticated with check ((select public.is_admin()));
create policy "ruta_parada: admin actualiza" on public.ruta_parada
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "ruta_parada: admin borra" on public.ruta_parada
  for delete to authenticated using ((select public.is_admin()));

-- ---------- unidades ----------
create policy "unidades: anon ve activas" on public.unidades
  for select to anon using (is_active);
create policy "unidades: autenticados ven todas" on public.unidades
  for select to authenticated using (true);
create policy "unidades: admin inserta" on public.unidades
  for insert to authenticated with check ((select public.is_admin()));
create policy "unidades: admin o su conductor actualiza" on public.unidades
  for update to authenticated
  using ((select public.is_admin()) or public.is_driver_of(id_unidad))
  with check ((select public.is_admin()) or public.is_driver_of(id_unidad));
create policy "unidades: admin borra" on public.unidades
  for delete to authenticated using ((select public.is_admin()));

-- ---------- posicion_actual ----------
create policy "posicion: lectura pública" on public.posicion_actual
  for select to anon, authenticated using (true);
create policy "posicion: admin o su conductor inserta" on public.posicion_actual
  for insert to authenticated
  with check ((select public.is_admin()) or public.is_driver_of(id_unidad));
create policy "posicion: admin o su conductor actualiza" on public.posicion_actual
  for update to authenticated
  using ((select public.is_admin()) or public.is_driver_of(id_unidad))
  with check ((select public.is_admin()) or public.is_driver_of(id_unidad));
create policy "posicion: admin borra" on public.posicion_actual
  for delete to authenticated using ((select public.is_admin()));

-- ---------- unidad_conductor ----------
create policy "asignación: conductor ve la suya, admin todas" on public.unidad_conductor
  for select to authenticated
  using (id_usuario = (select auth.uid()) or (select public.is_admin()));
create policy "asignación: admin inserta" on public.unidad_conductor
  for insert to authenticated with check ((select public.is_admin()));
create policy "asignación: admin actualiza" on public.unidad_conductor
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "asignación: admin borra" on public.unidad_conductor
  for delete to authenticated using ((select public.is_admin()));

-- ---------- favoritos ----------
create policy "favoritos: ver los propios o admin" on public.favoritos
  for select to authenticated
  using (id_usuario = (select auth.uid()) or (select public.is_admin()));
create policy "favoritos: crear los propios" on public.favoritos
  for insert to authenticated with check (id_usuario = (select auth.uid()));
create policy "favoritos: borrar los propios" on public.favoritos
  for delete to authenticated using (id_usuario = (select auth.uid()));

-- ---------- posicion_historica ----------
-- Solo lectura para admin; la inserción la hace el trigger (security definer)
create policy "histórico: solo admin lee" on public.posicion_historica
  for select to authenticated using ((select public.is_admin()));
