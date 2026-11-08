create policy "admin read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy "profiles readable" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "company profiles public to users" on public.profiles for select to authenticated using (public.has_role(id,'company'));