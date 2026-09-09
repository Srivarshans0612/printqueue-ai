import { createClient } from "@/lib/supabase/server";
import { NewOrderClientPage } from "@/components/student/NewOrderClientPage";
import { redirect } from "next/navigation";

export default async function NewOrderPage(props: {
  searchParams: Promise<{ shop?: string; location?: string }>;
}) {
  const { shop: preSelectedShopId } = await props.searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all open approved shops
  const { data: shops } = await supabase
    .from("shops")
    .select("*, location:locations(id, name)")
    .eq("status", "approved")
    .eq("is_open", true)
    .order("rating", { ascending: false });

  // Fetch all active locations
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <NewOrderClientPage
      shops={shops ?? []}
      locations={locations ?? []}
      preSelectedShopId={preSelectedShopId}
      userId={user.id}
    />
  );
}

