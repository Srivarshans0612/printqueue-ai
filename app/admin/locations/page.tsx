import { createAdminClient } from "@/lib/supabase/server";
import { AdminLocationsClient } from "@/components/admin/AdminLocationsClient";

export default async function AdminLocationsPage() {
  const adminClient = await createAdminClient();

  const { data: locations } = await adminClient
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Campus Locations</h1>
      <AdminLocationsClient locations={locations ?? []} />
    </div>
  );
}


