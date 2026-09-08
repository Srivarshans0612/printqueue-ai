import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OwnerOrdersClient } from "@/components/owner/OwnerOrdersClient";

export default async function OwnerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get ALL shops for this owner (any status)
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .in("status", ["approved", "disabled", "pending"])
    .order("created_at", { ascending: true });

  if (!shops || shops.length === 0) redirect("/owner");

  const shopIds = shops.map((s) => s.id);

  // Fetch orders across ALL shops
  const { data: orders } = await supabase
    .from("orders")
    .select("*, student:profiles(id, full_name, email), payment:payments(*), shop:shops(id, name)")
    .in("shop_id", shopIds)
    .order("created_at", { ascending: false });

  // Use first shop id for realtime (we'll handle multi-shop in client)
  return (
    <OwnerOrdersClient
      orders={orders ?? []}
      shopId={shopIds[0]}
      shopIds={shopIds}
      shops={shops}
    />
  );
}
