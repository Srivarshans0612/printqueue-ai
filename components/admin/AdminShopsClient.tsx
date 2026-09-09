"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { approveShopRequest, rejectShopRequest, disableShop, enableShop } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, X, Ban, Store, ShieldCheck } from "lucide-react";
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

export function AdminShopsClient({
  requests: initialRequests,
  shops: initialShops,
}: AdminShopsClientProps) {
  const [requests, setRequests] = useState<ShopRequest[]>(initialRequests);
  const [shops, setShops]       = useState<Shop[]>(initialShops);
  const [tab, setTab]           = useState<"requests" | "shops">("requests");
  const [loading, setLoading]   = useState<string | null>(null);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  /* ── Request actions ────────────────────────────────── */
  const handleApprove = async (id: string) => {
    setLoading(id);
    const result = await approveShopRequest(id);
    setLoading(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Shop approved!");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    const result = await rejectShopRequest(id, "Does not meet platform requirements.");
    setLoading(null);
    if (result.error) toast.error(result.error);
    else {
      toast("Request rejected");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
    }
  };

  /* ── Shop actions ───────────────────────────────────── */
  const handleDisable = async (id: string) => {
    setLoading(id);
    const result = await disableShop(id);
    setLoading(null);
    if (result.error) toast.error(result.error);
    else {
      toast("Shop disabled");
      setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: "disabled", is_open: false } : s));
    }
  };

  // Task 7 ── Enable shop
  const handleEnable = async (id: string) => {
    setLoading(id);
    const result = await enableShop(id);
    setLoading(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Shop re-enabled! Owner notified.");
      setShops((prev) => prev.map((s) => s.id === id ? { ...s, status: "approved" } : s));
    }
  };

  const tabBtn = (active: boolean, label: React.ReactNode) => (
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
        : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
    }`
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("requests")} className={tabBtn(tab === "requests", null)}>
          Shop Requests
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => setTab("shops")} className={tabBtn(tab === "shops", null)}>
          All Shops ({shops.length})
        </button>
      </div>

      {/* ── Requests tab ── */}
      {tab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No shop requests</p>
            </div>
          ) : requests.map((req) => (
            <Card key={req.id} className={req.status === "pending" ? "border-amber-300 bg-amber-50/40" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-slate-900 font-semibold">{req.shop_name}</h3>
                      <Badge variant={
                        req.status === "pending"  ? "warning"     :
                        req.status === "approved" ? "success"     : "destructive"
                      }>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-xs">{req.address}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {req.location?.name} · {req.owner?.full_name}
                      <span className="text-slate-300"> · {req.owner?.email}</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      B&W: ₹{req.price_bw}/pg · Color: ₹{req.price_color}/pg
                      <span className="ml-2 text-slate-300">
                        · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </span>
                    </p>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm" variant="success"
                        disabled={loading === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {loading === req.id ? "…" : "Approve"}
                      </Button>
                      <Button
                        size="sm" variant="destructive"
                        disabled={loading === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                        {loading === req.id ? "…" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Shops tab ── */}
      {tab === "shops" && (
        <div className="space-y-4">
          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap text-xs">
            {["All", "Approved", "Disabled", "Pending"].map((f) => {
              const count =
                f === "All"      ? shops.length :
                f === "Approved" ? shops.filter((s) => s.status === "approved").length :
                f === "Disabled" ? shops.filter((s) => s.status === "disabled").length :
                                   shops.filter((s) => s.status === "pending").length;
              return (
                <span key={f} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {f}: <strong>{count}</strong>
                </span>
              );
            })}
          </div>

          {shops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No shops yet</p>
            </div>
          ) : shops.map((shop) => (
            <Card
              key={shop.id}
              className={shop.status === "disabled" ? "opacity-75 border-slate-200" : ""}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-slate-900 font-semibold">{shop.name}</h3>
                      <Badge variant={
                        shop.status === "approved" ? "success"     :
                        shop.status === "disabled" ? "destructive" : "warning"
                      }>
                        {shop.status.toUpperCase()}
                      </Badge>
                      <Badge variant={shop.is_open ? "success" : "secondary"}>
                        {shop.is_open ? "OPEN" : "CLOSED"}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-xs">{shop.address} · {shop.location?.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Owner: {shop.owner?.full_name}
                      <span className="text-slate-300"> · {shop.owner?.email}</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Rating: {shop.rating.toFixed(1)} ★ · Queue: {shop.current_queue}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {/* Task 7 ── Enable button for disabled shops */}
                    {shop.status === "disabled" && (
                      <Button
                        size="sm"
                        variant="success"
                        disabled={loading === shop.id}
                        onClick={() => handleEnable(shop.id)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {loading === shop.id ? "…" : "Enable"}
                      </Button>
                    )}

                    {/* Disable button for approved shops */}
                    {shop.status === "approved" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading === shop.id}
                        onClick={() => handleDisable(shop.id)}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {loading === shop.id ? "…" : "Disable"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
