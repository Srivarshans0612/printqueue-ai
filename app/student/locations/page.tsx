import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Store, ArrowRight, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function LocationsPage() {
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("*, shops(count)")
    .eq("is_active", true)
    .order("name");

  // Get shop count per location
  const { data: shopCounts } = await supabase
    .from("shops")
    .select("location_id")
    .eq("status", "approved");

  const countMap: Record<string, number> = {};
  shopCounts?.forEach((s) => {
    countMap[s.location_id] = (countMap[s.location_id] ?? 0) + 1;
  });

  // Open shop count per location
  const { data: openShops } = await supabase
    .from("shops")
    .select("location_id")
    .eq("status", "approved")
    .eq("is_open", true);

  const openMap: Record<string, number> = {};
  openShops?.forEach((s) => {
    openMap[s.location_id] = (openMap[s.location_id] ?? 0) + 1;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Campus Locations</h1>
        <p className="text-slate-500 text-sm">
          Select a campus location to view available printing shops.
        </p>
      </div>

      {!locations || locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No locations available yet.</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {locations.map((location) => {
            const shopCount = countMap[location.id] ?? 0;
            const openCount = openMap[location.id] ?? 0;

            return (
              <Link
                key={location.id}
                href={`/student/shops?location=${location.id}`}
              >
                <Card className="hover:border-blue-600/50 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                        <MapPin className="w-6 h-6 text-blue-400" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors mt-1" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">{location.name}</h2>
                    {location.description && (
                      <p className="text-slate-500 text-sm mb-4">{location.description}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Store className="w-3.5 h-3.5" />
                        <span>{shopCount} {shopCount === 1 ? "shop" : "shops"}</span>
                      </div>
                      {openCount > 0 ? (
                        <Badge variant="success" className="text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                          {openCount} Open
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">All Closed</Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-4 group-hover:bg-blue-500"
                      tabIndex={-1}
                    >
                      Browse Shops
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


