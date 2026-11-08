create policy "own docs read" on storage.objects for select to authenticated using (bucket_id='documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "own docs insert" on storage.objects for insert to authenticated with check (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own docs delete" on storage.objects for delete to authenticated using (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
alter table public.profiles add column verification_doc text, add column verification_status text not null default 'none', add column bio text;
alter table public.projects add column files text[] not null default '{}';
create or replace function public.protect_verified() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    new.verified := old.verified;
    if new.verification_status not in ('none','pending') then new.verification_status := old.verification_status; end if;
  end if;
  return new;
end $$;