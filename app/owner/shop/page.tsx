import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShopProfileClient } from "@/components/owner/ShopProfileClient";
import { ShopRequestForm } from "@/components/owner/ShopRequestForm";

export default async function OwnerShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("*, location:locations(name)")
    .eq("owner_id", user.id)
    .single();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (!shop) {
    const { data: existingRequest } = await supabase
      .from("shop_requests")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
        <h1 className="text-2xl font-bold text-white mb-6">Register Your Shop</h1>
        <ShopRequestForm
          locations={locations ?? []}
          existingRequest={existingRequest}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-2xl font-bold text-white mb-6">Shop Profile</h1>
      <ShopProfileClient shop={shop} />
    </div>
  );
}
