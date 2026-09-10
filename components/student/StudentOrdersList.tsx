"use client";

/**
 * StudentOrdersList — Phase 8, 15, 24
 *
 * Subscribes to the student's own orders via Supabase Realtime.
 * Each order card shows live status via OrderStatusAnimation.
 * Cleans up on unmount. No polling.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Package, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusAnimation } from "@/components/orders/OrderStatusAnimation";
import { formatDistanceToNow } from "date-fns";

type OrderRow = {
  id: string; token: string; status: string;
  document_name: string; document_pages: number; copies: number;
  total_amount: number; created_at: string; shop_id: string;
  shop?: { id?: string; name: string; location?: { name: string } } | null;
};

interface Props {
  initialOrders: OrderRow[];
  studentId: string;
}

export function StudentOrdersList({ initialOrders, studentId }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const supabase = createClient();

    const channel = supabase
      .channel(`student-orders:${studentId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `student_id=eq.${studentId}`,
      }, (payload) => {
        if (!isMounted.current) return;
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as OrderRow, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id
                ? { ...o, status: (payload.new as OrderRow).status }
                : o
            )
          );
        }
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const active = orders.filter((o) => !["picked_up", "rejected", "cancelled"].includes(o.status));
  const past   = orders.filter((o) =>  ["picked_up", "rejected", "cancelled"].includes(o.status));

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200">
        <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
        <h2 className="text-slate-800 font-extrabold text-lg mb-2">No orders yet</h2>
        <p className="text-slate-400 text-sm mb-6 font-medium">
          Place your first print order and track it in real-time.
        </p>
        <Link href="/student/order/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
          Place First Order
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Active · {active.length}
          </p>
          <div className="space-y-3">
            {active.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} isActive />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Past Orders · {past.length}
          </p>
          <div className="space-y-3">
            {past.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, index, isActive }: { order: OrderRow; index: number; isActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
    >
      <Link href={`/student/orders/${order.id}`}>
        <Card className={`cursor-pointer hover:shadow-md transition-all border-2 ${
          isActive
            ? order.status === "ready"
              ? "border-emerald-300 bg-emerald-50/40"
              : order.status === "preparing"
              ? "border-violet-200 bg-violet-50/30"
              : "border-blue-200 hover:border-blue-400"
            : "border-slate-200 opacity-80"
        }`}>
          <CardContent className="p-4">
            {/* Live status strip */}
            <div className="mb-3 pb-3 border-b border-slate-100">
              <OrderStatusAnimation
                status={order.status}
                role="student"
                token={order.token}
                showTimeline={false}
                compact={true}
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-bold truncate">{order.document_name}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {order.shop?.name ?? "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <p className="text-slate-900 font-black text-base">₹{order.total_amount}</p>
                <p className="text-slate-400 text-xs font-medium">
                  {order.document_pages * order.copies} pages
                </p>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
