import { createAdminClient } from "@/lib/supabase/server";
import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export default async function AdminAnalyticsPage() {
  const adminClient = await createAdminClient();

  const [{ data: orders }, { data: shops }] = await Promise.all([
    adminClient
      .from("orders")
      .select("status, total_amount, payment_status, created_at, shop_id, print_type, document_pages, copies")
      .order("created_at", { ascending: true }),
    adminClient.from("shops").select("id, name").eq("status", "approved"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Comprehensive platform metrics and insights</p>
      </div>
      <AdminAnalyticsClient orders={orders ?? []} shops={shops ?? []} />
    </div>
  );
}

