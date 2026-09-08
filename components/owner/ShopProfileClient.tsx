"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateShopProfile } from "@/actions/shops";
import { ShopOpenToggle } from "@/components/owner/ShopOpenToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  address: string;
  description?: string;
  phone?: string;
  price_bw: number;
  price_color: number;
  is_open: boolean;
  status: string;
  rating: number;
  total_reviews: number;
  current_queue: number;
  avg_completion_minutes: number;
  location?: { name: string };
}

export function ShopProfileClient({ shop }: { shop: Shop }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateShopProfile(shop.id, formData);
    if (result.error) toast.error(result.error);
    else { toast.success("Shop profile updated"); setEditing(false); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Status and toggle */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">{shop.name}</h2>
              <Badge variant={shop.status === "approved" ? "success" : "warning"}>
                {shop.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{shop.address}</span>
              {shop.location && <span>· {shop.location.name}</span>}
            </div>
          </div>
          <ShopOpenToggle shopId={shop.id} isOpen={shop.is_open} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rating", value: shop.rating > 0 ? `${shop.rating.toFixed(1)} ★` : "—", note: `${shop.total_reviews} reviews` },
          { label: "Queue", value: shop.current_queue, note: "current orders" },
          { label: "B&W Price", value: `₹${shop.price_bw}`, note: "per page" },
          { label: "Color Price", value: `₹${shop.price_color}`, note: "per page" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-zinc-400 text-xs mb-1">{s.label}</p>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Shop Details</CardTitle>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Shop Name</Label>
                <Input name="name" defaultValue={shop.name} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Address</Label>
                <Input name="address" defaultValue={shop.address} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input name="phone" type="tel" defaultValue={shop.phone ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">B&W Price (₹)</Label>
                  <Input name="price_bw" type="number" min={0.5} step={0.5} defaultValue={shop.price_bw} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Color Price (₹)</Label>
                  <Input name="price_color" type="number" min={1} step={0.5} defaultValue={shop.price_color} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Description</Label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={shop.description ?? ""}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              {shop.description && (
                <p className="text-zinc-300">{shop.description}</p>
              )}
              {shop.phone && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-4 h-4" />
                  {shop.phone}
                </div>
              )}
              {shop.rating > 0 && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Star className="w-4 h-4 text-amber-400" />
                  {shop.rating.toFixed(1)} / 5.0 ({shop.total_reviews} reviews)
                </div>
              )}
              <p className="text-zinc-500 text-xs">Avg completion: {shop.avg_completion_minutes} minutes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
