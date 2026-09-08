import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OwnerOrdersClient } from "@/components/owner/OwnerOrdersClient";

export default async function OwnerOrdersPage() {
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
    .select("*, student:profiles(id, full_name, email), payment:payments(*)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  return <OwnerOrdersClient orders={orders ?? []} shopId={shop.id} />;
}
