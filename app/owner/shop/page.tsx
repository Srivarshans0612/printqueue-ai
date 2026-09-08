import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShopProfileClient } from "@/components/owner/ShopProfileClient";
import { ShopRequestForm } from "@/components/owner/ShopRequestForm";

export default async function OwnerShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get ALL approved shops for this owner
  const { data: shops } = await supabase
    .from("shops")
    .select("*, location:locations(name)")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Get latest pending request
  const { data: existingRequest } = await supabase
    .from("shop_requests")
    .select("shop_name, status, created_at")
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter space-y-8">
      {/* Show all approved shops */}
      {shops && shops.length > 0 && (
        <div className="space-y-6">
          {shops.map((shop) => (
            <div key={shop.id}>
              <h1 className="text-2xl font-bold text-white mb-4">
                {shops.length > 1 ? `Shop: ${shop.name}` : "Shop Profile"}
              </h1>
              <ShopProfileClient shop={shop} />
            </div>
          ))}
        </div>
      )}

      {/* Always show option to register another shop */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          {shops && shops.length > 0
            ? "Register Another Shop"
            : "Register Your Shop"}
        </h2>
        <ShopRequestForm
          locations={locations ?? []}
          existingRequest={existingRequest}
        />
      </div>
    </div>
  );
}
