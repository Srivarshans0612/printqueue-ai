"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Package,
  User,
  FileText,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDistanceToNow } from "date-fns";

type Order = {
  id: string;
  token: string;
  status: string;
  document_name: string;
  document_pages: number;
  copies: number;
  print_type: string;
  priority: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  pickup_otp?: string;
  created_at: string;
  notes?: string;
  shop_id: string;
  student?: { full_name: string; email: string };
  shop?: { id: string; name: string };
};

interface OwnerOrdersClientProps {
  orders: Order[];
  shopId: string;
  shopIds?: string[];
  shops?: { id: string; name: string }[];
}

type FilterTab = "all" | "pending" | "active" | "completed";

export function OwnerOrdersClient({ orders: initialOrders, shopId, shopIds, shops }: OwnerOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [filterShopId, setFilterShopId] = useState<string>("all");
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [etaOrderId, setEtaOrderId] = useState<string | null>(null);
  const [eta, setEta] = useState("");
  const hasMultipleShops = (shops?.length ?? 0) > 1;

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`shop_orders:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
            toast("New order received!", { icon: "🔔" });
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new as Order } : o)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const filteredOrders = orders.filter((o) => {
    const shopMatch = filterShopId === "all" || o.shop_id === filterShopId;
    if (!shopMatch) return false;
    if (filter === "pending") return o.status === "waiting_for_acceptance";
    if (filter === "active") return ["accepted", "preparing", "ready"].includes(o.status);
    if (filter === "completed") return ["picked_up", "rejected", "cancelled"].includes(o.status);
    return true;
  });

  const handleAccept = async (orderId: string) => {
    const { updateOrderStatus } = await import("@/actions/orders");
    const result = await updateOrderStatus(orderId, "accepted");
    if (result.error) toast.error(result.error);
    else toast.success("Order accepted!");
  };

  const handleReject = async (orderId: string) => {
    const { updateOrderStatus } = await import("@/actions/orders");
    const result = await updateOrderStatus(orderId, "rejected");
    if (result.error) toast.error(result.error);
    else toast("Order rejected", { icon: "❌" });
  };

  const handlePreparing = async (orderId: string) => {
    const { updateOrderStatus } = await import("@/actions/orders");
    const result = await updateOrderStatus(orderId, "preparing", eta || undefined);
    if (result.error) toast.error(result.error);
    else { toast.success("Status updated to Preparing"); setEtaOrderId(null); setEta(""); }
  };

  const handleReady = async (orderId: string) => {
    const { updateOrderStatus } = await import("@/actions/orders");
    const result = await updateOrderStatus(orderId, "ready");
    if (result.error) toast.error(result.error);
    else toast.success("Order marked as Ready! Student notified. 🎉");
  };

  const handleVerifyOTP = async () => {
    if (!verifyOrderId || !otp) return;
    const { verifyOTP } = await import("@/actions/orders");
    const result = await verifyOTP(verifyOrderId, otp);
    if (result.error) toast.error(result.error);
    else {
      toast.success("OTP verified! Order picked up ✓");
      setVerifyOrderId(null);
      setOtp("");
    }
  };

  const pendingCount = orders.filter((o) => o.status === "waiting_for_acceptance").length;
  const activeCount = orders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-zinc-400 text-sm mt-1">Accept, track and complete orders in real-time</p>
      </div>

      {/* Shop filter — only show if multiple shops */}
      {hasMultipleShops && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterShopId("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterShopId === "all" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
          >
            All Shops
          </button>
          {shops?.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterShopId(s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterShopId === s.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: "pending" as FilterTab, label: "Pending", count: pendingCount },
          { key: "active" as FilterTab, label: "Active", count: activeCount },
          { key: "completed" as FilterTab, label: "Completed", count: 0 },
          { key: "all" as FilterTab, label: "All Orders", count: orders.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0 ${
                filter === tab.key ? "bg-blue-500" : "bg-zinc-700"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OTP Verify Modal */}
      {verifyOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="glass-card p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Verify Pickup OTP
            </h3>
            <p className="text-zinc-400 text-sm mb-4">Ask the student for their 6-digit OTP</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl font-bold tracking-widest token-display h-14 rounded-xl border border-zinc-600 bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={() => { setVerifyOrderId(null); setOtp(""); }} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleVerifyOTP} className="flex-1" disabled={otp.length !== 6}>Verify</Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">No orders here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`${
                order.status === "waiting_for_acceptance"
                  ? "border-amber-500/30"
                  : order.status === "ready"
                  ? "border-emerald-600/30"
                  : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="token-display font-bold text-blue-400 text-lg">{order.token}</span>
                      <OrderStatusBadge status={order.status} />
                      {order.priority === "express" && (
                        <Badge variant="warning" className="text-[10px]">Express</Badge>
                      )}
                      {hasMultipleShops && order.shop && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                          {order.shop.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <User className="w-3 h-3" />
                      <span>{order.student?.full_name ?? "Unknown"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">₹{order.total_amount}</p>
                    <p className="text-zinc-500 text-xs">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <p className="text-zinc-500 mb-0.5">Document</p>
                    <p className="text-white font-medium truncate">{order.document_name}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <p className="text-zinc-500 mb-0.5">Pages × Copies</p>
                    <p className="text-white font-medium">{order.document_pages} × {order.copies}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <p className="text-zinc-500 mb-0.5">Print Type</p>
                    <p className="text-white font-medium">{order.print_type === "bw" ? "B&W" : "Color"}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <p className="text-zinc-500 mb-0.5">Payment</p>
                    <p className={`font-medium ${order.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                      {order.payment_status.toUpperCase()}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start gap-2 bg-zinc-800 rounded-lg p-2 mb-4 text-xs">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <p className="text-zinc-300">{order.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {order.status === "waiting_for_acceptance" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleAccept(order.id)}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(order.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <>
                      {etaOrderId === order.id ? (
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                            className="h-8 rounded-lg border border-zinc-600 bg-zinc-800 px-2 text-white text-xs"
                          />
                          <Button size="sm" onClick={() => handlePreparing(order.id)}>
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Start Printing
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setEtaOrderId(order.id)}>
                          <Printer className="w-3.5 h-3.5 mr-1.5" />
                          Start Preparing
                        </Button>
                      )}
                    </>
                  )}
                  {order.status === "preparing" && (
                    <Button size="sm" variant="success" onClick={() => handleReady(order.id)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button size="sm" onClick={() => { setVerifyOrderId(order.id); setOtp(""); }}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                      Verify OTP & Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
