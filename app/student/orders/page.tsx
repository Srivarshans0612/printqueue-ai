import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, ArrowRight, Store, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { OrderStatusAnimation } from "@/components/orders/OrderStatusAnimation";

export default async function StudentOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, shop:shops(id, name, address, location:locations(name)), payment:payments(*)")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false });

  const activeOrders = orders?.filter(
    (o) => !["picked_up", "rejected", "cancelled"].includes(o.status)
  ) ?? [];
  const pastOrders = orders?.filter(
    (o) => ["picked_up", "rejected", "cancelled"].includes(o.status)
  ) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track and manage your print orders</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/student/order/new">
            <Package className="w-4 h-4 mr-2" /> New Order
          </Link>
        </Button>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Active · {activeOrders.length}
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} isActive />
            ))}
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Past Orders · {pastOrders.length}
          </h2>
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} isActive={false} />
            ))}
          </div>
        </div>
      )}

      {(!orders || orders.length === 0) && (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200">
          <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-slate-800 font-extrabold text-lg mb-2">No orders yet</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">
            Place your first print order and track it in real-time.
          </p>
          <Button asChild>
            <Link href="/student/order/new">Place Your First Order</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

type OrderRow = {
  id: string; token: string; document_name: string;
  status: string; total_amount: number;
  document_pages: number; copies: number; created_at: string;
  shop?: { name: string; location?: { name: string } };
};

function OrderCard({ order, isActive }: { order: OrderRow; isActive: boolean }) {
  return (
    <Link href={`/student/orders/${order.id}`}>
      <Card className={`hover:shadow-md transition-all cursor-pointer border-2 ${
        isActive
          ? order.status === "ready"
            ? "border-emerald-300 bg-emerald-50/40"
            : order.status === "preparing"
            ? "border-violet-200 bg-violet-50/30"
            : "border-blue-200 hover:border-blue-400"
          : "border-slate-200 opacity-80"
      }`}>
        <CardContent className="p-4">
          {/* Status animation strip */}
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
                  {order.shop?.name}
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
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
