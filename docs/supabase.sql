-- Courtside yedek kovası. Supabase panelinde SQL Editor'da bir kez çalıştırılır.
-- Kova özeldir; her kullanıcı yalnızca kendi kimliğiyle başlayan klasörü görür ve yazar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('yedek', 'yedek', false, 5242880, array['application/json', 'image/jpeg'])
on conflict (id) do nothing;

create policy "yedek okuma" on storage.objects for select to authenticated
  using (bucket_id = 'yedek' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "yedek ekleme" on storage.objects for insert to authenticated
  with check (bucket_id = 'yedek' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "yedek güncelleme" on storage.objects for update to authenticated
  using (bucket_id = 'yedek' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'yedek' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "yedek silme" on storage.objects for delete to authenticated
  using (bucket_id = 'yedek' and (storage.foldername(name))[1] = (select auth.uid())::text);
