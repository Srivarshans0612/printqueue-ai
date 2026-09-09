"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CheckCircle, Clock, Store, FileText, Phone,
  ArrowLeft, RefreshCw, Eye, EyeOff, AlertCircle, Leaf, XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { format } from "date-fns";

type Order = {
  id: string;
  token: string;
  status: string;
  document_name: string;
  document_pages: number;
  copies: number;
  print_type: "bw" | "color";
  priority: "normal" | "express";
  total_amount: number;
  payment_method: string;
  payment_status: string;
  pickup_otp?: string;
  otp_verified: boolean;
  estimated_ready_at?: string;
  deadline?: string;
  notes?: string;
  eco_score?: number;
  created_at: string;
  shop?: {
    id: string; name: string; address: string;
    phone?: string; location?: { name: string };
  };
  payment?: { status: string; transaction_id?: string } | null;
};

interface OrderDetailClientProps {
  order: Order;
  role: "student" | "owner" | "admin";
}

const statusSteps = [
  { key: "waiting_for_acceptance", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Printing" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "picked_up", label: "Picked Up" },
];
const statusOrder = ["waiting_for_acceptance", "accepted", "preparing", "ready", "picked_up"];

function getStepState(stepKey: string, currentStatus: string): "done" | "active" | "pending" {
  if (currentStatus === "rejected" || currentStatus === "cancelled") return "pending";
  const current = statusOrder.indexOf(currentStatus);
  const step = statusOrder.indexOf(stepKey);
  if (step < current) return "done";
  if (step === current) return "active";
  return "pending";
}

export function OrderDetailClient({ order: initialOrder, role }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [showOTP, setShowOTP] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Real-time subscription ──────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-detail:${order.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${order.id}`,
      }, (payload) => {
        const updated = payload.new as Partial<Order>;
        setOrder((prev) => ({ ...prev, ...updated }));

        const msgs: Record<string, () => void> = {
          accepted: () => toast.success("✅ Your order has been accepted!"),
          preparing: () => toast("🖨 Your document is being printed now."),
          ready: () => toast.success("🎉 Your order is ready for pickup!"),
          picked_up: () => toast.success("✓ Order complete. Thank you!"),
          rejected: () => toast.error("Order was rejected by the shop."),
          cancelled: () => toast("Order cancelled."),
        };
        if (updated.status && msgs[updated.status]) msgs[updated.status]();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order.id]);

  // ── Cancel order ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { cancelOrder } = await import("@/actions/orders");
      const result = await cancelOrder(order.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Optimistic update — no need to refresh
        setOrder((prev) => ({ ...prev, status: "cancelled" }));
        toast.success("Order cancelled successfully.");
        setShowCancelConfirm(false);
      }
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order.status === "waiting_for_acceptance" && role === "student";
  const isTerminal = ["picked_up", "rejected", "cancelled"].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-slate-900 font-semibold text-lg">Cancel Order?</h3>
            </div>
            <p className="text-slate-500 text-sm mb-5">
              Your order <strong className="text-slate-800">{order.token}</strong> will be cancelled. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                Keep Order
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <Link
        href={role === "student" ? "/student/orders" : "/owner/orders"}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="token-display text-3xl font-bold text-blue-600">{order.token}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-slate-500 text-sm">
            Placed {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {canCancel && (
          <Button variant="destructive" size="sm" onClick={() => setShowCancelConfirm(true)}>
            Cancel Order
          </Button>
        )}
      </div>

      {/* Status banners */}
      {order.status === "ready" && role === "student" && order.pickup_otp && !order.otp_verified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 ai-glow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Ready for Pickup!</span>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Visit <strong>{order.shop?.name}</strong> and show this OTP to collect your documents.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-xl border border-emerald-200 px-5 py-4 text-center shadow-sm">
              {showOTP ? (
                <p className="token-display text-3xl font-bold text-slate-900 tracking-widest">{order.pickup_otp}</p>
              ) : (
                <p className="token-display text-3xl font-bold text-slate-300 tracking-widest">••••••</p>
              )}
            </div>
            <button
              onClick={() => setShowOTP(!showOTP)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:text-slate-900 text-sm transition-colors bg-white"
            >
              {showOTP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOTP ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-3">⚠ Keep this OTP private. Share only at the shop counter.</p>
        </div>
      )}

      {order.status === "picked_up" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-slate-900 font-semibold text-lg">Order Complete!</p>
          <p className="text-slate-500 text-sm mt-1">Thank you for using PrintQueue AI.</p>
          {role === "student" && (
            <Button size="sm" className="mt-4" asChild>
              <Link href="/student/order/new">
                <RefreshCw className="w-4 h-4 mr-2" /> Place New Order
              </Link>
            </Button>
          )}
        </div>
      )}

      {order.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-slate-900 font-semibold">Order Rejected</p>
          <p className="text-slate-500 text-sm mt-1">The shop was unable to accept this order.</p>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-center">
          <XCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-700 font-semibold">Order Cancelled</p>
          <p className="text-slate-400 text-sm mt-1">This order has been cancelled.</p>
        </div>
      )}

      {/* Live status indicator for active orders */}
      {!isTerminal && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />
          <p className="text-blue-600 text-xs font-medium">Live tracking active — updates appear automatically</p>
        </div>
      )}

      {/* Status Timeline */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-500 uppercase tracking-wider">Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {statusSteps.map((step, index) => {
            const state = getStepState(step.key, order.status);
            const isLast = index === statusSteps.length - 1;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    state === "done" ? "bg-emerald-500" :
                    state === "active" ? "bg-blue-600 ring-4 ring-blue-100" :
                    "bg-slate-200 border border-slate-300"
                  }`}>
                    {state === "done" && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    {state === "active" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 mt-1 ${state === "done" ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                </div>
                <div className="pb-4 pt-0.5">
                  <p className={`text-sm font-medium ${
                    state === "done" ? "text-emerald-600" :
                    state === "active" ? "text-slate-900" : "text-slate-400"
                  }`}>
                    {step.label}
                  </p>
                  {state === "active" && step.key === "preparing" && order.estimated_ready_at && (
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Est. ready: {format(new Date(order.estimated_ready_at), "h:mm a")}
                    </p>
                  )}
                  {state === "active" && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-medium mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
                      Current status
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Order Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-slate-900 text-sm font-semibold truncate">{order.document_name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {[
                ["Pages", order.document_pages],
                ["Copies", order.copies],
                ["Print Type", order.print_type === "bw" ? "Black & White" : "Color"],
                ["Priority", order.priority.charAt(0).toUpperCase() + order.priority.slice(1)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-slate-400">{label}</p>
                  <p className="text-slate-800 font-medium">{value as string}</p>
                </div>
              ))}
            </div>
            {order.notes && <p className="text-slate-500 text-xs bg-slate-50 rounded-lg p-2">📝 {order.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-3.5 h-3.5" /> Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <p className="text-slate-900 font-semibold">{order.shop?.name}</p>
            <p className="text-slate-500 text-xs">{order.shop?.address}</p>
            {order.shop?.location && <p className="text-slate-400 text-xs">{order.shop.location.name}</p>}
            {order.shop?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3" /> {order.shop.phone}
              </div>
            )}
            {order.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 mt-1">
                <Clock className="w-3 h-3" />
                Deadline: {format(new Date(order.deadline), "h:mm a, MMM d")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Payment</p>
              <p className="text-slate-700 font-medium capitalize">{order.payment_method.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right">
              <Badge variant={order.payment_status === "paid" ? "success" : "warning"} className="mb-1 block">
                {order.payment_status.toUpperCase()}
              </Badge>
              <p className="text-slate-900 font-bold text-xl">₹{order.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eco Score */}
      {order.eco_score && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-medium">Eco Score: {order.eco_score}/100</p>
                <p className="text-slate-400 text-xs">Digital ordering reduces unnecessary trips.</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="4" fill="none"
                    strokeDasharray={`${(order.eco_score / 100) * 125.6} 125.6`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                  {order.eco_score}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

