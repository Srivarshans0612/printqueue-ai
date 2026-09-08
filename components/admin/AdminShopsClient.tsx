"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { approveShopRequest, rejectShopRequest, disableShop } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, X, Ban, Store } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ShopRequest = {
  id: string;
  shop_name: string;
  address: string;
  price_bw: number;
  price_color: number;
  status: string;
  created_at: string;
  owner?: { full_name: string; email: string };
  location?: { name: string };
};

type Shop = {
  id: string;
  name: string;
  address: string;
  status: string;
  is_open: boolean;
  rating: number;
  current_queue: number;
  created_at: string;
  owner?: { full_name: string; email: string };
  location?: { name: string };
};

interface AdminShopsClientProps {
  requests: ShopRequest[];
  shops: Shop[];
}

export function AdminShopsClient({ requests: initialRequests, shops: initialShops }: AdminShopsClientProps) {
  const [requests, setRequests] = useState<ShopRequest[]>(initialRequests);
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [tab, setTab] = useState<"requests" | "shops">("requests");

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleApprove = async (id: string) => {
    const result = await approveShopRequest(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Shop approved!");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
    }
  };

  const handleReject = async (id: string) => {
    const result = await rejectShopRequest(id, "Does not meet requirements.");
    if (result.error) toast.error(result.error);
    else {
      toast("Request rejected");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
    }
  };

  const handleDisable = async (id: string) => {
    const result = await disableShop(id);
    if (result.error) toast.error(result.error);
    else {
      toast("Shop disabled");
      setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: "disabled" } : s));
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "requests" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("shops")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "shops" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Active Shops ({shops.filter((s) => s.status === "approved").length})
        </button>
      </div>

      {tab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No shop requests</p>
            </div>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className={req.status === "pending" ? "border-amber-500/30" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{req.shop_name}</h3>
                        <Badge variant={
                          req.status === "pending" ? "warning" :
                          req.status === "approved" ? "success" : "destructive"
                        }>
                          {req.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-xs mb-0.5">{req.address}</p>
                      <p className="text-zinc-500 text-xs">
                        {req.location?.name} · {req.owner?.full_name} ({req.owner?.email})
                      </p>
                      <p className="text-zinc-600 text-xs mt-1">
                        B&W: ₹{req.price_bw}/pg · Color: ₹{req.price_color}/pg
                      </p>
                      <p className="text-zinc-600 text-xs">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleApprove(req.id)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                          <X className="w-3.5 h-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "shops" && (
        <div className="space-y-4">
          {shops.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No shops yet</p>
            </div>
          ) : (
            shops.map((shop) => (
              <Card key={shop.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{shop.name}</h3>
                        <Badge variant={shop.status === "approved" ? "success" : "destructive"}>
                          {shop.status.toUpperCase()}
                        </Badge>
                        <Badge variant={shop.is_open ? "success" : "secondary"}>
                          {shop.is_open ? "OPEN" : "CLOSED"}
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-xs">{shop.address} · {shop.location?.name}</p>
                      <p className="text-zinc-500 text-xs">Owner: {shop.owner?.full_name}</p>
                      <p className="text-zinc-600 text-xs mt-1">
                        Rating: {shop.rating.toFixed(1)} · Queue: {shop.current_queue}
                      </p>
                    </div>

                    {shop.status === "approved" && (
                      <Button size="sm" variant="destructive" onClick={() => handleDisable(shop.id)}>
                        <Ban className="w-3.5 h-3.5 mr-1" />Disable
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
