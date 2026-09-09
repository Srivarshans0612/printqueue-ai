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
import { Star, MapPin, Phone, Clock, Edit3, X } from "lucide-react";

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
    else { toast.success("Shop profile updated ✓"); setEditing(false); }
    setLoading(false);
  };

  const isApproved = shop.status === "approved";
  const isDisabled = shop.status === "disabled";

  return (
    <div className="space-y-5">
      {/* Disabled notice — admin only action */}
      {isDisabled && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-red-700 font-semibold text-sm">Shop Disabled by Admin</p>
            <p className="text-red-500 text-xs mt-0.5">
              Your shop has been disabled. Please contact the platform admin to re-enable it.
            </p>
          </div>
        </div>
      )}

      {/* Header card — status + open/close toggle */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{shop.name}</h2>
                <Badge variant={
                  isApproved ? "success" :
                  isDisabled ? "destructive" : "warning"
                }>
                  {shop.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{shop.address}</span>
                {shop.location && <><span className="text-slate-300">·</span><span>{shop.location.name}</span></>}
              </div>
            </div>
            {/* Open/close toggle — only shown when approved */}
            {isApproved && <ShopOpenToggle shopId={shop.id} isOpen={shop.is_open} />}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rating",      value: shop.rating > 0 ? `${shop.rating.toFixed(1)} ★` : "—",   sub: `${shop.total_reviews} reviews` },
          { label: "Queue",       value: shop.current_queue,                                        sub: "current orders" },
          { label: "B&W Price",   value: `₹${shop.price_bw}`,                                      sub: "per page" },
          { label: "Color Price", value: `₹${shop.price_color}`,                                   sub: "per page" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className="text-slate-900 font-bold text-xl">{s.value}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shop details / edit */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-900">Shop Details</CardTitle>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />Edit
              </Button>
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
                <Label className="mb-1.5 block">Phone (optional)</Label>
                <Input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" defaultValue={shop.phone ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">B&W Price (₹/page)</Label>
                  <Input name="price_bw" type="number" min={0.5} step={0.5} defaultValue={shop.price_bw} required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Color Price (₹/page)</Label>
                  <Input name="price_color" type="number" min={1} step={0.5} defaultValue={shop.price_color} required />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Description (optional)</Label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={shop.description ?? ""}
                  placeholder="Tell students about your shop..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              {shop.description && (
                <p className="text-slate-600 leading-relaxed">{shop.description}</p>
              )}
              {shop.phone && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-4 h-4" />{shop.phone}
                </div>
              )}
              {shop.rating > 0 && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {shop.rating.toFixed(1)} / 5.0 ({shop.total_reviews} reviews)
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                Average completion time: {shop.avg_completion_minutes} minutes
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note — no disable button here. Only admins can disable shops. */}
    </div>
  );
}
