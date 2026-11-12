-- ============================================
-- 0004 · Archivo histórico con muestreo y retención (corrige A2)
-- Antes: 1 fila por cada UPDATE (~28.800/día/unidad a 3 s).
-- Ahora: como máximo 1 fila cada 30 s por unidad + retención de 7 días.
-- ============================================

create or replace function public.archive_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
      from public.posicion_historica h
     where h.id_unidad = new.id_unidad
       and h.timestamp > new.timestamp - interval '30 seconds'
  ) then
    insert into public.posicion_historica (id_unidad, timestamp, latitud, longitud, velocidad, status)
    values (new.id_unidad, new.timestamp, new.latitud, new.longitud, new.velocidad, new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.archive_position() from public, anon, authenticated;

create trigger archive_position_after_write
  after insert or update on public.posicion_actual
  for each row execute function public.archive_position();

-- Retención: borrar histórico de más de 7 días, cada día a las 04:00 UTC
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-posicion-historica',
  '0 4 * * *',
  $$delete from public.posicion_historica where timestamp < now() - interval '7 days'$$
);
