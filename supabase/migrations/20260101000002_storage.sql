-- ============================================================
-- Storage para comprobantes.
--
-- Bucket privado. Los archivos se guardan bajo <user_id>/<uuid>.<ext>,
-- y las políticas usan el primer segmento del path como dueño.
-- La descarga siempre va por URL firmada.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

create policy "comprobantes_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comprobantes_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comprobantes_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comprobantes_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
