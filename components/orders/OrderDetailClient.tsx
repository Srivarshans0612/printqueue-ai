"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Store, FileText, Phone,
  ArrowLeft, RefreshCw, Eye, EyeOff, Leaf, XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusAnimation } from "@/components/orders/OrderStatusAnimation";
import { cancelOrder } from "@/actions/orders";
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

// Toast content for each status transition
const STATUS_TOASTS: Record<string, { emoji: string; msg: string }> = {
  accepted:    { emoji: "✅", msg: "Order accepted by shop!" },
  preparing:   { emoji: "🖨", msg: "Printing in progress…" },
  ready:       { emoji: "🎉", msg: "Order is ready for pickup!" },
  picked_up:   { emoji: "🏆", msg: "Order completed. Thank you!" },
  rejected:    { emoji: "❌", msg: "Order was rejected." },
  cancelled:   { emoji: "✕",  msg: "Order cancelled." },
};

export function OrderDetailClient({ order: initialOrder, role }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [showOTP, setShowOTP] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isNewStatus, setIsNewStatus] = useState(false);
  const prevStatus = useRef(initialOrder.status);

  // ── Real-time subscription ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-detail-v2:${order.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${order.id}`,
      }, async (payload) => {
        const updated = payload.new as Partial<Order>;
        // Always fetch the full order to get all fields including pickup_otp
        const { data: freshOrder } = await supabase
          .from("orders")
          .select("*, shop:shops(id, name, address, phone, location:locations(name)), payment:payments(*)")
          .eq("id", order.id)
          .single();

        if (freshOrder) {
          const newStatus = freshOrder.status;
          const didChange = newStatus !== prevStatus.current;
          if (didChange) {
            prevStatus.current = newStatus;
            setIsNewStatus(true);
            setTimeout(() => setIsNewStatus(false), 4000);
            // Toast notification
            const t = STATUS_TOASTS[newStatus];
            if (t) {
              if (newStatus === "ready" || newStatus === "picked_up") {
                toast.success(`${t.emoji} ${t.msg}`, { duration: 6000 });
              } else if (newStatus === "rejected") {
                toast.error(`${t.emoji} ${t.msg}`, { duration: 6000 });
              } else {
                toast(`${t.emoji} ${t.msg}`, { duration: 5000 });
              }
            }
          }
          setOrder(freshOrder as Order);
        } else if (updated.status && updated.status !== prevStatus.current) {
          // Fallback: use payload data
          prevStatus.current = updated.status;
          setIsNewStatus(true);
          setOrder((prev) => ({ ...prev, ...updated }));
          setTimeout(() => setIsNewStatus(false), 4000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order.id]);

  // ── Cancel order ──────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      // Optimistic update first
      setOrder((prev) => ({ ...prev, status: "cancelled" }));
      setIsNewStatus(true);
      setShowCancelConfirm(false);

      const result = await cancelOrder(order.id);
      if (result.error) {
        toast.error(result.error);
        // Revert on error
        setOrder((prev) => ({ ...prev, status: "waiting_for_acceptance" }));
      } else {
        toast.success("Order cancelled.");
      }
      setTimeout(() => setIsNewStatus(false), 4000);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order.status === "waiting_for_acceptance" && role === "student";
  const isTerminal = ["picked_up", "rejected", "cancelled"].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-slate-900 font-bold text-lg">Cancel Order?</h3>
              </div>
              <p className="text-slate-500 text-sm mb-5">
                Order <strong className="text-slate-800 font-mono">{order.token}</strong> will be cancelled. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                  Keep Order
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? "Cancelling…" : "Yes, Cancel"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <Link
        href={role === "student" ? "/student/orders" : "/owner/orders"}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="token-display text-3xl font-black text-blue-600">{order.token}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Placed {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {canCancel && (
          <Button variant="destructive" size="sm" onClick={() => setShowCancelConfirm(true)}>
            Cancel Order
          </Button>
        )}
      </div>

      {/* ── STATUS ANIMATION COMPONENT ─────────────────── */}
      <motion.div
        key={order.status}
        initial={isNewStatus ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <OrderStatusAnimation
          status={order.status}
          role={role === "admin" ? "owner" : role}
          token={order.token}
          showTimeline={true}
          isNewStatus={isNewStatus}
        />
      </motion.div>

      {/* Live indicator */}
      {!isTerminal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-6"
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-blue-500"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <p className="text-blue-700 text-xs font-bold">
            Live tracking active — updates appear instantly without refreshing
          </p>
        </motion.div>
      )}

      {/* OTP section */}
      {role === "student" && order.status === "ready" && order.pickup_otp && !order.otp_verified && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 mb-6"
        >
          <p className="text-emerald-800 font-bold text-sm mb-1">Your Pickup OTP</p>
          <p className="text-slate-600 text-sm mb-4">
            Visit <strong>{order.shop?.name}</strong> and share this OTP to collect your documents.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-xl border-2 border-emerald-200 px-5 py-4 text-center shadow-sm">
              {showOTP ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="token-display text-3xl font-black text-slate-900 tracking-widest"
                >
                  {order.pickup_otp}
                </motion.p>
              ) : (
                <p className="token-display text-3xl font-black text-slate-300 tracking-widest">••••••</p>
              )}
            </div>
            <button
              onClick={() => setShowOTP(!showOTP)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 text-sm font-semibold transition-all bg-white"
            >
              {showOTP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOTP ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-3 font-medium">⚠ Keep this OTP private. Share only at the shop counter.</p>
        </motion.div>
      )}

      {/* Reorder button for completed */}
      {role === "student" && order.status === "picked_up" && (
        <div className="text-center mb-6">
          <Button asChild>
            <Link href="/student/order/new">
              <RefreshCw className="w-4 h-4 mr-2" /> Place New Order
            </Link>
          </Button>
        </div>
      )}

      {/* Order Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-slate-900 text-sm font-bold truncate">{order.document_name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {[
                ["Pages", order.document_pages],
                ["Copies", order.copies],
                ["Print Type", order.print_type === "bw" ? "Black & White" : "Color"],
                ["Priority", order.priority.charAt(0).toUpperCase() + order.priority.slice(1)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-slate-400 font-medium">{label}</p>
                  <p className="text-slate-800 font-bold">{value as string}</p>
                </div>
              ))}
            </div>
            {order.notes && (
              <p className="text-slate-500 text-xs bg-blue-50 rounded-lg p-2 border border-blue-100">
                📝 {order.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Store className="w-3.5 h-3.5" /> Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <p className="text-slate-900 font-bold">{order.shop?.name}</p>
            <p className="text-slate-500 text-xs">{order.shop?.address}</p>
            {order.shop?.location && <p className="text-slate-400 text-xs">{order.shop.location.name}</p>}
            {order.shop?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Phone className="w-3 h-3" /> {order.shop.phone}
              </div>
            )}
            {order.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-1 font-semibold">
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
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">Payment</p>
              <p className="text-slate-700 font-bold capitalize">{order.payment_method.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right">
              <Badge
                variant={order.payment_status === "paid" ? "success" : "warning"}
                className="mb-1 block text-center"
              >
                {order.payment_status.toUpperCase()}
              </Badge>
              <p className="text-slate-900 font-black text-2xl">₹{order.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eco Score */}
      {order.eco_score && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-bold">Eco Score: {order.eco_score}/100</p>
                <p className="text-slate-400 text-xs">Digital ordering reduces unnecessary trips.</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <motion.circle
                    cx="24" cy="24" r="20" stroke="#16a34a" strokeWidth="4" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 125.6" }}
                    animate={{ strokeDasharray: `${(order.eco_score / 100) * 125.6} 125.6` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-700">
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
