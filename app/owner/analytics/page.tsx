import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OwnerAnalyticsClient } from "@/components/owner/OwnerAnalyticsClient";

export default async function OwnerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!shop) redirect("/owner");

  const { data: orders } = await supabase
    .from("orders")
    .select("status, total_amount, payment_status, print_type, created_at, document_pages, copies")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: true });

  return <OwnerAnalyticsClient orders={orders ?? []} shopName={shop.name} />;
}
