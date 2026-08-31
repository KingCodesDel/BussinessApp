-- ============================================================================
-- Migration 003 — storage policies for the product-images bucket
-- Run this in the Supabase SQL editor if your project already existed before
-- this file was added. Safe to run once; re-running will error on duplicate
-- policy names (harmless — it means they're already in place).
--
-- Why this matters: Supabase Storage has RLS enabled by default with ZERO
-- policies, so uploads are silently denied until these exist — even if the
-- bucket itself is marked "Public" (that only affects reads, not uploads).
-- If product images have never successfully uploaded from /admin/products/new,
-- this is almost certainly why.
-- ============================================================================

create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_business_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select id::text from businesses where owner_id = auth.uid()
    union
    select business_id::text from business_members where user_id = auth.uid()
  )
);

create policy "product_images_business_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select id::text from businesses where owner_id = auth.uid()
    union
    select business_id::text from business_members where user_id = auth.uid()
  )
);
