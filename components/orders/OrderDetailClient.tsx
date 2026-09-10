"use client";

/**
 * OrderDetailClient — Phases 6, 8, 11, 12
 *
 * Single Supabase Realtime channel per order.
 * On UPDATE: re-fetches full row (to include pickup_otp — not in CDC payload).
 * Cleans up channel on unmount / order.id change.
 * Connection indicator: live / reconnecting / syncing.
 * Optimistic cancel with revert on failure.
 * Respects prefers-reduced-motion via OrderStatusAnimation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Eye, EyeOff, FileText,
  Leaf, Phone, RefreshCw, Store, XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cancelOrder } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusAnimation } from "@/components/orders/OrderStatusAnimation";
import { format } from "date-fns";

/* ── Types ───────────────────────────────────────────────────────────────────── */
type Order = {
  id: string; token: string; status: string;
  document_name: string; document_pages: number; copies: number;
  print_type: "bw" | "color"; priority: "normal" | "express";
  total_amount: number; payment_method: string; payment_status: string;
  pickup_otp?: string; otp_verified: boolean;
  estimated_ready_at?: string; deadline?: string;
  notes?: string; eco_score?: number; created_at: string;
  shop?: { id: string; name: string; address: string; phone?: string; location?: { name: string } };
  payment?: { status: string; transaction_id?: string } | null;
};

type ConnectionStatus = "live" | "reconnecting" | "syncing";

/* ── Toast messages per status ───────────────────────────────────────────────── */
const STATUS_TOASTS: Record<string, { fn: (m: string) => void; m: string }> = {
  accepted:  { fn: toast.success, m: "✅ Order accepted by the shop!" },
  preparing: { fn: toast,        m: "🖨 Printing started…"            },
  ready:     { fn: toast.success, m: "🎉 Your order is ready for pickup!" },
  picked_up: { fn: toast.success, m: "🏆 Order complete. Thank you!"  },
  rejected:  { fn: toast.error,   m: "✕ Order was rejected."          },
  cancelled: { fn: toast,         m: "✕ Order cancelled."             },
};

/* ── Component ────────────────────────────────────────────────────────────────── */
interface Props { order: Order; role: "student" | "owner" | "admin" }

export function OrderDetailClient({ order: initialOrder, role }: Props) {
  const [order, setOrder]                   = useState<Order>(initialOrder);
  const [showOTP, setShowOTP]               = useState(false);
  const [cancelling, setCancelling]         = useState(false);
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [isNewStatus, setIsNewStatus]       = useState(false);
  const [conn, setConn]                     = useState<ConnectionStatus>("live");

  const prevStatus    = useRef(initialOrder.status);
  const animTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted     = useRef(true);

  // Fetch fresh order including pickup_otp (not in CDC payload)
  const fetchFresh = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, token, status, document_name, document_pages, copies,
        print_type, priority, total_amount, payment_method, payment_status,
        pickup_otp, otp_verified, estimated_ready_at, deadline,
        notes, eco_score, created_at,
        shop:shops(id, name, address, phone, location:locations(name)),
        payment:payments(status, transaction_id)
      `)
      .eq("id", order.id)
      .single();
    return data as Order | null;
  }, [order.id]);

  // ── Real-time subscription (Phase 6) ──────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    const supabase = createClient();
    setConn("live");

    const channel = supabase
      .channel(`order:${order.id}`, { config: { broadcast: { self: true } } })
      .on("postgres_changes", {
        event:  "UPDATE",
        schema: "public",
        table:  "orders",
        filter: `id=eq.${order.id}`,
      }, async () => {
        // Always fetch fresh to get pickup_otp and joined data
        if (!isMounted.current) return;
        setConn("syncing");
        const fresh = await fetchFresh(supabase);
        if (!isMounted.current) return;
        setConn("live");

        if (fresh) {
          const newStatus = fresh.status;
          if (newStatus !== prevStatus.current) {
            prevStatus.current = newStatus;
            setIsNewStatus(true);
            // Clear previous timer
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
            animTimerRef.current = setTimeout(() => {
              if (isMounted.current) setIsNewStatus(false);
            }, 4000);
            // Toast
            const t = STATUS_TOASTS[newStatus];
            if (t) (t.fn as (m: string, opts?: object) => void)(t.m, { duration: 5000 });
          }
          setOrder(fresh);
        }
      })
      .on("system", {}, (ev) => {
        if (!isMounted.current) return;
        if (ev.extension === "postgres_changes") {
          if (ev.status === "SUBSCRIBED") setConn("live");
          else if (ev.status === "CHANNEL_ERROR" || ev.status === "TIMED_OUT") {
            setConn("reconnecting");
          }
        }
      })
      .subscribe((status) => {
        if (!isMounted.current) return;
        if (status === "SUBSCRIBED") setConn("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConn("reconnecting");
        else if (status === "CLOSED") setConn("reconnecting");
      });

    return () => {
      isMounted.current = false;
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [order.id, fetchFresh]); // stable — order.id never changes during component life

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    const saved = order.status;
    setOrder((p) => ({ ...p, status: "cancelled" })); // optimistic
    setIsNewStatus(true);
    setConfirmCancel(false);

    const res = await cancelOrder(order.id);
    if (res.error) {
      toast.error(res.error);
      setOrder((p) => ({ ...p, status: saved })); // revert
    } else {
      toast.success("Order cancelled.");
    }
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => { if (isMounted.current) setIsNewStatus(false); }, 4000);
    setCancelling(false);
  };

  const canCancel  = order.status === "waiting_for_acceptance" && role === "student";
  const isTerminal = ["picked_up", "rejected", "cancelled"].includes(order.status);
  const backHref   = role === "student" ? "/student/orders" : "/owner/orders";

  /* ── Connection badge ─────────────────────────────────────────────────────── */
  const connBadge = {
    live:         { dot: "bg-emerald-500", label: "🟢 Live Updates",   cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    reconnecting: { dot: "bg-amber-500",   label: "🟠 Reconnecting…",  cls: "bg-amber-50  border-amber-200  text-amber-700"   },
    syncing:      { dot: "bg-blue-500",    label: "🔵 Syncing…",       cls: "bg-blue-50   border-blue-200   text-blue-700"    },
  }[conn];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-slate-900 font-bold text-lg">Cancel Order?</h3>
              </div>
              <p className="text-slate-500 text-sm mb-5">
                Order <span className="font-mono font-bold text-slate-800">{order.token}</span> will be cancelled. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmCancel(false)}>
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

      {/* Back link */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-semibold mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header row */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <span className="token-display text-3xl font-black text-blue-600">{order.token}</span>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Placed {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {canCancel && (
          <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)}>
            Cancel Order
          </Button>
        )}
      </div>

      {/* Connection indicator (Phase 11) */}
      {!isTerminal && (
        <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 mb-5 ${connBadge.cls}`}>
          <motion.div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${connBadge.dot}`}
            animate={conn === "live" ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-bold">{connBadge.label}</span>
        </div>
      )}

      {/* Status animation + timeline (Phase 12, 13) */}
      <motion.div
        key={order.status}
        initial={isNewStatus ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <OrderStatusAnimation
          status={order.status}
          role={role === "admin" ? "owner" : role}
          token={order.token}
          showTimeline={true}
        />
      </motion.div>

      {/* OTP — shown ONLY for ready orders (Phase 6) */}
      {role === "student" && order.status === "ready" && order.pickup_otp && !order.otp_verified && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 mb-5"
        >
          <p className="text-emerald-800 font-bold mb-1">Your Pickup OTP</p>
          <p className="text-slate-600 text-sm mb-4">
            Show this to <strong>{order.shop?.name}</strong> to collect your documents.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-xl border-2 border-emerald-200 py-4 text-center shadow-sm">
              {showOTP
                ? <p className="token-display text-3xl font-black text-slate-900 tracking-widest">{order.pickup_otp}</p>
                : <p className="token-display text-3xl font-black text-slate-300 tracking-widest">••••••</p>
              }
            </div>
            <button
              onClick={() => setShowOTP((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 text-sm font-semibold transition-all"
            >
              {showOTP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOTP ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-3 font-medium">⚠ Keep private — share only at the shop counter.</p>
        </motion.div>
      )}

      {/* Reorder CTA */}
      {role === "student" && order.status === "picked_up" && (
        <div className="text-center mb-5">
          <Button asChild>
            <Link href="/student/order/new">
              <RefreshCw className="w-4 h-4 mr-2" /> Place New Order
            </Link>
          </Button>
        </div>
      )}

      {/* Order detail cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <p className="text-slate-900 text-sm font-bold truncate">{order.document_name}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Pages", order.document_pages],
                ["Copies", order.copies],
                ["Print Type", order.print_type === "bw" ? "Black & White" : "Color"],
                ["Priority", order.priority[0].toUpperCase() + order.priority.slice(1)],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-slate-400 font-semibold">{k}</p>
                  <p className="text-slate-800 font-bold">{String(v)}</p>
                </div>
              ))}
            </div>
            {order.notes && (
              <p className="text-slate-500 text-xs bg-blue-50 border border-blue-100 rounded-lg p-2">
                📝 {order.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
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
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 font-semibold mt-1">
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
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Payment</p>
              <p className="text-slate-700 font-bold capitalize">{order.payment_method.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right">
              <Badge variant={order.payment_status === "paid" ? "success" : "warning"} className="mb-1 block text-center">
                {order.payment_status.toUpperCase()}
              </Badge>
              <p className="text-slate-900 font-black text-2xl">₹{order.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eco score */}
      {order.eco_score && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-bold">Eco Score: {order.eco_score}/100</p>
                <p className="text-slate-400 text-xs">Digital ordering reduces unnecessary trips.</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="-rotate-90 w-12 h-12">
                  <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <motion.circle
                    cx="24" cy="24" r="20" stroke="#16a34a" strokeWidth="4" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 125.6" }}
                    animate={{ strokeDasharray: `${(order.eco_score / 100) * 125.6} 125.6` }}
                    transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
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
