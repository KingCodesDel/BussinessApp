-- ============================================================================
-- Migration 002 — seller location + WhatsApp contact
-- Run this in the Supabase SQL editor if you already ran schema.sql before
-- this change. Safe to run more than once (IF NOT EXISTS guards).
-- If you're setting up a brand-new project, schema.sql already includes
-- these columns — you don't need to run this file separately.
-- ============================================================================

alter table businesses add column if not exists address text;
alter table businesses add column if not exists city text;
alter table businesses add column if not exists country text;
alter table businesses add column if not exists whatsapp_number text;

comment on column businesses.whatsapp_number is
  'E.164 format, digits only after the leading +, e.g. +15551234567. Used to build wa.me links.';
