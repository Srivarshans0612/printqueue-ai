import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { History, RefreshCw, FileText, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { format } from "date-fns";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, shop:shops(name, location:locations(name)), payment:payments(*)")
    .eq("student_id", user!.id)
    .in("status", ["picked_up", "rejected", "cancelled"])
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-slate-500" />
          Order History
        </h1>
        <p className="text-slate-500 text-sm mt-1">All your completed, rejected and cancelled orders</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-14 h-14 text-slate-500 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-2">No order history</h2>
          <p className="text-slate-500 text-sm mb-6">Your completed orders will appear here.</p>
          <Button asChild>
            <Link href="/student/order/new">Place First Order</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="token-display text-base font-bold text-blue-400">{order.token}</span>
                      <OrderStatusBadge status={order.status} />
                      <Badge variant={order.payment_status === "paid" ? "success" : "outline"} className="text-[10px]">
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-white text-sm font-medium truncate">{order.document_name}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-slate-500 text-xs">{order.shop?.name} · {order.shop?.location?.name}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>{order.document_pages} pages</span>
                      <span>×{order.copies} copies</span>
                      <span>{order.print_type === "bw" ? "B&W" : "Color"}</span>
                      <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <p className="text-white font-bold text-lg">₹{order.total_amount}</p>

                    {order.status === "picked_up" && (
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/student/order/new?shop=${order.shop_id}`}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Reorder
                        </Link>
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


