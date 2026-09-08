-- PrintQueue AI — Row Level Security Policies
-- Run AFTER 001_initial_schema.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_presets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: Check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Service role can insert profiles
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- LOCATIONS
-- ============================================================
-- Anyone authenticated can read active locations
CREATE POLICY "locations_select_active" ON public.locations
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

-- Only admins can manage locations
CREATE POLICY "locations_admin_all" ON public.locations
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SHOPS
-- ============================================================
-- Students can read approved shops
CREATE POLICY "shops_select_approved" ON public.shops
  FOR SELECT USING (status = 'approved' OR public.is_admin());

-- Owners can read their own shop (any status)
CREATE POLICY "shops_select_own" ON public.shops
  FOR SELECT USING (owner_id = auth.uid());

-- Owners can update their own shop
CREATE POLICY "shops_update_own" ON public.shops
  FOR UPDATE USING (owner_id = auth.uid());

-- Admins can manage all shops
CREATE POLICY "shops_admin_all" ON public.shops
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SHOP REQUESTS
-- ============================================================
-- Owners can insert and read their own requests
CREATE POLICY "shop_requests_select_own" ON public.shop_requests
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "shop_requests_insert_own" ON public.shop_requests
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Admins can manage all
CREATE POLICY "shop_requests_admin_all" ON public.shop_requests
  FOR ALL USING (public.is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
-- Students can read their own orders
CREATE POLICY "orders_select_student" ON public.orders
  FOR SELECT USING (student_id = auth.uid());

-- Students can create orders
CREATE POLICY "orders_insert_student" ON public.orders
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can cancel their own pending orders
CREATE POLICY "orders_update_student" ON public.orders
  FOR UPDATE USING (student_id = auth.uid() AND status = 'waiting_for_acceptance');

-- Shop owners can read and update orders for their shop
CREATE POLICY "orders_select_shop_owner" ON public.orders
  FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "orders_update_shop_owner" ON public.orders
  FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

-- Admins can do everything
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (public.is_admin());

-- ============================================================
-- PAYMENTS
-- ============================================================
-- Students can read payments for their orders
CREATE POLICY "payments_select_student" ON public.payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE student_id = auth.uid())
  );

-- Shop owners can read payments for their shop orders
CREATE POLICY "payments_select_owner" ON public.payments
  FOR SELECT USING (
    order_id IN (SELECT o.id FROM public.orders o JOIN public.shops s ON o.shop_id = s.id WHERE s.owner_id = auth.uid())
  );

-- Admins
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
-- Users can read their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update (mark read) their own
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Service role inserts (via server actions)
CREATE POLICY "notifications_insert_service" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);  -- Service role bypasses RLS

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "reviews_insert_student" ON public.reviews
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- ============================================================
-- PRINT PRESETS
-- ============================================================
CREATE POLICY "presets_own" ON public.print_presets
  FOR ALL USING (student_id = auth.uid());
