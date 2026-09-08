import { createClient } from "@/lib/supabase/server";
import { ShopsClientPage } from "@/components/student/ShopsClientPage";

export default async function ShopsPage(props: {
  searchParams: Promise<{ location?: string; sort?: string }>;
}) {
  const { location: locationId, sort = "best" } = await props.searchParams;

  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  let query = supabase
    .from("shops")
    .select("*, location:locations(id, name)")
    .eq("status", "approved");

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data: shops } = await query.order("rating", { ascending: false });

  const selectedLocation = locations?.find((l) => l.id === locationId);

  return (
    <ShopsClientPage
      shops={shops ?? []}
      locations={locations ?? []}
      selectedLocationId={locationId}
      selectedLocationName={selectedLocation?.name}
      initialSort={sort}
    />
  );
}
