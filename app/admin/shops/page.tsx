import { createAdminClient } from "@/lib/supabase/server";
import { AdminShopsClient } from "@/components/admin/AdminShopsClient";

export default async function AdminShopsPage() {
  const adminClient = await createAdminClient();

  const [{ data: requests }, { data: shops }] = await Promise.all([
    adminClient
      .from("shop_requests")
      .select("*, owner:profiles(full_name, email), location:locations(name)")
      .order("created_at", { ascending: false }),
    adminClient
      .from("shops")
      .select("*, owner:profiles(full_name, email), location:locations(name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Shops & Requests</h1>
      <AdminShopsClient requests={requests ?? []} shops={shops ?? []} />
    </div>
  );
}

