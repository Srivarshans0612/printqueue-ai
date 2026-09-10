/**
 * Admin Analytics — Phase 17
 * Uses SQL aggregations instead of full table scan.
 * Only fetches the last 14 days of detailed data for charts.
 * Summary stats computed server-side.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export default async function AdminAnalyticsPage() {
  const adminClient = await createAdminClient();

  // 14-day window for charts
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: summaryData },
    { data: recentOrders },
    { data: shops },
  ] = await Promise.all([
    // Aggregate stats — server-side COUNT/SUM
    adminClient.rpc("get_analytics_summary"),
    // Only last 14 days for charts — minimal columns
    adminClient
      .from("orders")
      .select("status, total_amount, payment_status, created_at, shop_id, print_type")
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    // Approved shops for labelling
    adminClient
      .from("shops")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Comprehensive platform metrics and insights
        </p>
      </div>
      <AdminAnalyticsClient
        summary={summaryData ?? null}
        orders={recentOrders ?? []}
        shops={shops ?? []}
      />
    </div>
  );
}
