-- ============================================
-- 0002 · Perfiles y roles (corrige C1 y C3 de la auditoría)
-- ============================================

-- C1: el rol NUNCA viene del cliente; todo registro nuevo es 'pasajero'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles_usuario (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    'pasajero'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers de rol (security definer para evitar recursión de RLS sobre perfiles_usuario)
create or replace function public.current_rol()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles_usuario where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_rol() = 'admin', false);
$$;

revoke execute on function public.current_rol() from public, anon;
revoke execute on function public.is_admin()    from public, anon;
grant  execute on function public.current_rol() to authenticated;
grant  execute on function public.is_admin()    to authenticated;

-- C3: un usuario solo puede editar su nombre (no su rol)
revoke update on public.perfiles_usuario from anon, authenticated;
grant  update (nombre, updated_at) on public.perfiles_usuario to authenticated;

-- Cambio de rol: solo un admin, vía RPC
create or replace function public.set_user_role(target_user uuid, new_rol text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
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

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant  execute on function public.set_user_role(uuid, text) to authenticated;
