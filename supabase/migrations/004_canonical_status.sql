-- Phase 5: Canonical Order Status Migration
-- Run this in Supabase SQL Editor BEFORE deploying the new code

-- 1. Widen the constraint to accept new canonical values
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'waiting_for_acceptance',
      'accepted',
      'preparing',
      'ready',
      'picked_up',
      'rejected',
      'cancelled'
    )
  );

-- 2. Migrate old values if any exist (idempotent)
-- 'preparing' was previously used — keep as-is
-- No data migration needed; the 7 values above are already correct

-- 3. Add missing index on created_at for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

-- 4. Add composite index for student active-order query
CREATE INDEX IF NOT EXISTS idx_orders_student_status
  ON public.orders (student_id, status);

-- 5. Add composite index for owner dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_shop_status
  ON public.orders (shop_id, status, created_at DESC);

-- 6. Add index for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status);

-- 7. Ensure REPLICA IDENTITY FULL for all realtime tables
ALTER TABLE public.orders        REPLICA IDENTITY FULL;
ALTER TABLE public.shops         REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 8. Ensure realtime publication includes all tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END;
$$;

-- 9. Verify
SELECT
  relname,
  CASE relreplident
    WHEN 'f' THEN 'FULL ✓'
    WHEN 'd' THEN 'DEFAULT — needs FULL'
    ELSE relreplident::text
  END AS replica_identity
FROM pg_class
WHERE relname IN ('orders', 'shops', 'notifications');
