"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Clock,
  Store,
  FileText,
  Phone,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Leaf,
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
    id: string;
    name: string;
    address: string;
    phone?: string;
    location?: { name: string };
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
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
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

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`order:${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Order>;
          setOrder((prev) => ({ ...prev, ...updated }));

          const statusMessages: Record<string, string> = {
            accepted: "Your order has been accepted!",
            preparing: "Your document is being printed.",
            ready: "Your order is ready for pickup! 🎉",
            picked_up: "Order completed. Thank you!",
            rejected: "Your order was rejected.",
          };

          const msg = statusMessages[updated.status ?? ""];
          if (msg) {
            if (updated.status === "ready") toast.success(msg);
            else if (updated.status === "rejected") toast.error(msg);
            else toast(msg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const handleCancel = async () => {
    const { cancelOrder } = await import("@/actions/orders");
    const result = await cancelOrder(order.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Order cancelled");
      router.refresh();
    }
  };

  const [showOTP, setShowOTP] = useState(false);
  const canCancel = order.status === "waiting_for_acceptance";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={role === "student" ? "/student/orders" : "/owner/orders"}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="token-display text-3xl font-bold text-blue-400">{order.token}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-zinc-400 text-sm">
            Placed {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {canCancel && role === "student" && (
          <Button variant="destructive" size="sm" onClick={handleCancel}>
            Cancel Order
          </Button>
        )}
      </div>

      {/* OTP (student only, when ready) */}
      {role === "student" && order.status === "ready" && order.pickup_otp && !order.otp_verified && (
        <div className="glass-card border-emerald-600/30 ai-glow p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Ready for Pickup!</span>
          </div>
          <p className="text-zinc-300 text-sm mb-4">
            Visit <strong>{order.shop?.name}</strong> and share this OTP with the shop owner to collect your documents.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-zinc-800 rounded-xl border border-zinc-700 px-5 py-4 text-center">
              {showOTP ? (
                <p className="token-display text-3xl font-bold text-white tracking-widest">
                  {order.pickup_otp}
                </p>
              ) : (
                <p className="token-display text-3xl font-bold text-zinc-600 tracking-widest">
                  ••••••
                </p>
              )}
            </div>
            <button
              onClick={() => setShowOTP(!showOTP)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              {showOTP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOTP ? "Hide" : "Show"} OTP
            </button>
          </div>
          <p className="text-zinc-500 text-xs mt-3">⚠ Keep this OTP private. Share it only at the shop.</p>
        </div>
      )}

      {/* Order picked up */}
      {order.status === "picked_up" && (
        <div className="glass-card border-emerald-600/20 p-5 mb-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-white font-semibold">Order Complete!</p>
          <p className="text-zinc-400 text-sm mt-1">Thank you for using PrintQueue AI.</p>
          {role === "student" && (
            <Button size="sm" className="mt-4" asChild>
              <Link href="/student/order/new">
                <RefreshCw className="w-4 h-4 mr-2" />
                Place New Order
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Rejected */}
      {order.status === "rejected" && (
        <div className="glass-card border-red-600/20 p-5 mb-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-white font-semibold">Order Rejected</p>
          <p className="text-zinc-400 text-sm mt-1">The shop was unable to accept this order.</p>
        </div>
      )}

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400 uppercase tracking-wider">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {statusSteps.map((step, index) => {
              const state = getStepState(step.key, order.status);
              const isLast = index === statusSteps.length - 1;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      state === "done"
                        ? "bg-emerald-600"
                        : state === "active"
                        ? "bg-blue-600 ring-2 ring-blue-600/30"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}>
                      {state === "done" && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      {state === "active" && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 ${
                        state === "done" ? "bg-emerald-600/50" : "bg-zinc-800"
                      }`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium leading-tight ${
                      state === "done" ? "text-emerald-400" :
                      state === "active" ? "text-white" : "text-zinc-600"
                    }`}>
                      {step.label}
                    </p>
                    {state === "active" && step.key === "preparing" && order.estimated_ready_at && (
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Estimated ready: {format(new Date(order.estimated_ready_at), "h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-white text-sm font-medium truncate">{order.document_name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span className="text-zinc-500">Pages</span>
                <p className="text-white font-medium">{order.document_pages}</p>
              </div>
              <div>
                <span className="text-zinc-500">Copies</span>
                <p className="text-white font-medium">{order.copies}</p>
              </div>
              <div>
                <span className="text-zinc-500">Print Type</span>
                <p className="text-white font-medium">{order.print_type === "bw" ? "Black & White" : "Color"}</p>
              </div>
              <div>
                <span className="text-zinc-500">Priority</span>
                <p className="text-white font-medium capitalize">{order.priority}</p>
              </div>
            </div>
            {order.notes && (
              <p className="text-zinc-400 text-xs mt-1">Note: {order.notes}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-3.5 h-3.5" />Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-white font-semibold">{order.shop?.name}</p>
            <p className="text-zinc-400 text-xs">{order.shop?.address}</p>
            {order.shop?.location && (
              <p className="text-zinc-500 text-xs">{order.shop.location.name}</p>
            )}
            {order.shop?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Phone className="w-3 h-3" />
                {order.shop.phone}
              </div>
            )}
            {order.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
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
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Payment</p>
              <p className="text-white font-medium capitalize">{order.payment_method.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right">
              <Badge variant={order.payment_status === "paid" ? "success" : "warning"} className="mb-1">
                {order.payment_status.toUpperCase()}
              </Badge>
              <p className="text-white font-bold text-lg">₹{order.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eco Score */}
      {order.eco_score && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Eco Score: {order.eco_score}/100</p>
                <p className="text-zinc-500 text-xs">Digital ordering helps reduce unnecessary trips and paper waste.</p>
              </div>
              <div className="w-12 h-12 relative">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle cx="24" cy="24" r="20" stroke="#27272a" strokeWidth="4" fill="none" />
                  <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="4" fill="none"
                    strokeDasharray={`${(order.eco_score / 100) * 125.6} 125.6`} />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
