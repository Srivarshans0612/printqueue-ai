import { createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { format } from "date-fns";
import { Package } from "lucide-react";

export default async function AdminOrdersPage() {
  const adminClient = await createAdminClient();

  const { data: orders } = await adminClient
    .from("orders")
    .select("*, shop:shops(name), student:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">All Orders</h1>
        <p className="text-slate-500 text-sm mt-1">{orders?.length ?? 0} total orders on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Token", "Student", "Shop", "Pages", "Amount", "Status", "Payment", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id} className="border-b border-slate-200/50 hover:bg-zinc-900/50">
                    <td className="px-4 py-3 token-display font-bold text-blue-400">{order.token}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 text-xs font-medium">{order.student?.full_name}</p>
                      <p className="text-slate-400 text-[10px]">{order.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{order.shop?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{order.document_pages * order.copies}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium text-xs">₹{order.total_amount}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <Badge variant={order.payment_status === "paid" ? "success" : "warning"} className="text-[10px]">
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {format(new Date(order.created_at), "MMM d, h:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!orders || orders.length === 0) && (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-500">No orders yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



