import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, Clock, CheckCircle, ArrowRight, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

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
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your print orders</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/student/order/new">
            <Package className="w-4 h-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Active · {activeOrders.length}
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Past Orders · {pastOrders.length}
          </h2>
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {(!orders || orders.length === 0) && (
        <div className="text-center py-20">
          <Package className="w-14 h-14 text-slate-500 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-2">No orders yet</h2>
          <p className="text-slate-500 text-sm mb-6">
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

function OrderCard({ order }: { order: Record<string, unknown> }) {
  const o = order as {
    id: string; token: string; document_name: string; status: string;
    total_amount: number; document_pages: number; copies: number; created_at: string;
    shop?: { name: string; location?: { name: string } };
  };

  return (
    <Link href={`/student/orders/${o.id}`}>
      <Card className="hover:border-blue-600/40 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="token-display text-base font-bold text-blue-400">{o.token}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="text-white text-sm font-medium truncate">{o.document_name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {o.shop?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
              <p className="text-white font-bold">₹{o.total_amount as number}</p>
              <p className="text-slate-400 text-xs">
                {(o.document_pages as number) * (o.copies as number)} pages
              </p>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {o.status === "ready" && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">Ready for pickup!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


