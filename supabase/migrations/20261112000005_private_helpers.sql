-- ============================================
-- 0005 · Sacar los helpers de RLS de la API pública (Security Advisor, lint 0029)
-- current_rol / is_admin / is_driver_of son SECURITY DEFINER y estaban en `public`,
-- así que cualquiera con sesión podía llamarlos vía /rest/v1/rpc/*.
-- Se mueven a `private` (schema no expuesto por la Data API). Las políticas RLS
-- referencian las funciones por OID, así que siguen funcionando sin recrearlas.
--
-- set_user_role se queda en `public` A PROPÓSITO: es un RPC pensado para la app
-- y valida internamente que quien llama sea admin. Su aviso es esperado.
-- ============================================

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.current_rol()        set schema private;
alter function public.is_admin()           set schema private;
alter function public.is_driver_of(uuid)   set schema private;

-- Los cuerpos con search_path = '' llamaban a public.current_rol() / public.is_admin():
-- hay que reescribirlos con el nuevo schema.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_rol() = 'admin', false);
$$;

create or replace function public.set_user_role(target_user uuid, new_rol text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo un admin puede cambiar roles' using errcode = '42501';
  end if;
  if new_rol not in ('conductor', 'pasajero', 'admin') then
    raise exception 'Rol inválido: %', new_rol;
  end if;
  update public.perfiles_usuario
     set rol = new_rol, updated_at = now()
   where id = target_user;
end;
$$;
