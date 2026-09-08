-- PrintQueue AI — Seed Data
-- Run this AFTER creating an admin user through the app UI,
-- then update the admin_user_id below.

-- ============================================================
-- LOCATIONS (Demo campus locations)
-- ============================================================
INSERT INTO public.locations (name, description, is_active) VALUES
  ('Echanari', 'Echanari campus area with multiple printing shops near the main gate', TRUE),
  ('Rathinam', 'Rathinam Technical Campus, Eachanari Road', TRUE),
  ('Karpagam', 'Karpagam University campus and surrounding area', TRUE),
  ('Kings', 'Kings Engineering College campus', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DEMO USERS
-- Create these accounts through the registration page:
--
-- Admin:
--   Email: admin@printqueue.ai
--   Password: Admin@1234
--   Role: student (then manually update role to 'admin' in profiles table)
--
-- Owner 1:
--   Email: owner1@printqueue.ai
--   Password: Owner@1234
--   Role: Shop Owner
--
-- Owner 2:
--   Email: owner2@printqueue.ai
--   Password: Owner@1234
--   Role: Shop Owner
--
-- Student 1:
--   Email: student1@printqueue.ai
--   Password: Student@1234
--   Role: Student
--
-- After creating accounts, run the following to update admin role:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@printqueue.ai';
-- ============================================================

-- ============================================================
-- NOTE ON SHOPS:
-- Shops are created through the admin approval flow.
-- After owner accounts are created and a shop request is submitted,
-- approve the request via the admin dashboard at /admin/shops
-- ============================================================

-- ============================================================
-- STORAGE BUCKET
-- Create a bucket named "documents" in Supabase Storage:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket named "documents"
-- 3. Set it to PRIVATE (not public)
-- 4. Add the following storage policy:
--
-- Policy name: "Users can upload their documents"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: (auth.uid()::text) = (storage.foldername(name))[1]
--
-- Policy name: "Users can read their own documents"
-- Allowed operation: SELECT
-- Target roles: authenticated
-- Policy definition: (auth.uid()::text) = (storage.foldername(name))[1]
-- ============================================================

-- ============================================================
-- ENABLE REALTIME FOR TABLES
-- Run in Supabase SQL editor:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
