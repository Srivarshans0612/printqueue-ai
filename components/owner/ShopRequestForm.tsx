"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { submitShopRequest } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Clock, Plus } from "lucide-react";

interface ShopRequestFormProps {
  locations: { id: string; name: string }[];
  existingRequest?: {
    shop_name: string;
    status: string;
    created_at: string;
  } | null;
}

export function ShopRequestForm({ locations, existingRequest }: ShopRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await submitShopRequest(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Shop request submitted! Pending admin approval.");
      setShowForm(false);
    }
    setLoading(false);
  };

  // Show pending notice + option to submit another
  if (existingRequest && existingRequest.status === "pending" && !showForm) {
    return (
      <div className="space-y-4">
        <Card className="border-amber-500/30">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold text-lg mb-2">Request Under Review</h2>
            <p className="text-zinc-400 text-sm mb-3">
              Your shop request for{" "}
              <strong className="text-white">{existingRequest.shop_name}</strong> is
              pending admin approval.
            </p>
            <Badge variant="warning">PENDING</Badge>
            <p className="text-zinc-500 text-xs mt-4">
              You&apos;ll receive a notification once reviewed.
            </p>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Another Shop Request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
          className="text-zinc-400"
        >
          ← Back
        </Button>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-5 h-5 text-amber-400" />
            <p className="text-zinc-400 text-sm">
              Fill in your shop details. An admin will review and approve your
              request.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Shop Name</Label>
              <Input
                name="shop_name"
                placeholder="e.g. Quick Print Center"
                required
                minLength={2}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Campus Location</Label>
              <select
                name="location_id"
                required
                className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select location...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1.5 block">Address</Label>
              <Input
                name="address"
                placeholder="Shop address within campus"
                required
                minLength={5}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Phone (optional)</Label>
              <Input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">B&W Price per page (₹)</Label>
                <Input
                  name="price_bw"
                  type="number"
                  min={0.5}
                  step={0.5}
                  defaultValue={1.5}
                  required
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Color Price per page (₹)</Label>
                <Input
                  name="price_color"
                  type="number"
                  min={1}
                  step={0.5}
                  defaultValue={5}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Description (optional)</Label>
              <textarea
                name="description"
                rows={3}
                placeholder="Tell students about your shop..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Submitting..." : "Submit Shop Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
