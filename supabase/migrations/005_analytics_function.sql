-- Phase 17: Server-side analytics aggregation function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_orders',     (SELECT COUNT(*)           FROM public.orders),
    'completed_orders', (SELECT COUNT(*)           FROM public.orders WHERE status = 'picked_up'),
    'rejected_orders',  (SELECT COUNT(*)           FROM public.orders WHERE status = 'rejected'),
    'cancelled_orders', (SELECT COUNT(*)           FROM public.orders WHERE status = 'cancelled'),
    'active_orders',    (SELECT COUNT(*)           FROM public.orders WHERE status IN ('waiting_for_acceptance','accepted','preparing','ready')),
    'total_revenue',    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'picked_up' AND payment_status = 'paid'),
    'total_pages',      (SELECT COALESCE(SUM(document_pages * copies), 0) FROM public.orders WHERE status = 'picked_up'),
    'total_students',   (SELECT COUNT(*) FROM public.profiles WHERE role = 'student'),
    'total_owners',     (SELECT COUNT(*) FROM public.profiles WHERE role = 'owner'),
    'approved_shops',   (SELECT COUNT(*) FROM public.shops WHERE status = 'approved'),
    'pending_shops',    (SELECT COUNT(*) FROM public.shop_requests WHERE status = 'pending')
  );
$$;

-- Grant execution to authenticated users (admin check is in the calling layer)
GRANT EXECUTE ON FUNCTION public.get_analytics_summary() TO authenticated;
