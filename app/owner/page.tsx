import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Package, DollarSign, Users, TrendingUp, Store,
  ArrowRight, AlertCircle, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ShopOpenToggle } from "@/components/owner/ShopOpenToggle";
import { redirect } from "next/navigation";

export default async function OwnerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get ALL shops for this owner (approved + disabled)
  const { data: allShops } = await supabase
    .from("shops")
    .select("*, location:locations(name)")
    .eq("owner_id", user.id)
    .in("status", ["approved", "disabled", "pending"])
    .order("created_at", { ascending: true });

  const shops = allShops ?? [];

  // No shops yet — show registration prompt
  if (shops.length === 0) {
    const { data: shopRequest } = await supabase
      .from("shop_requests")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center page-enter">
        <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {shopRequest ? "Shop Request Pending" : "Register Your Shop"}
        </h1>
        {shopRequest ? (
          <>
            <p className="text-slate-500 mb-2">
              Your shop request for <strong className="text-slate-900">{shopRequest.shop_name}</strong> is under review.
            </p>
            <Badge variant="warning">PENDING APPROVAL</Badge>
            <p className="text-slate-400 text-sm mt-4">
              An admin will review your request soon. You&apos;ll receive a notification once approved.
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-500 mb-6">
              Submit your shop details to get approved on the platform and start receiving digital print orders.
            </p>
            <Button asChild>
              <Link href="/owner/shop">
                Submit Shop Request <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  const shopIds = shops.map((s) => s.id);
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's orders and pending orders across ALL shops
  const [{ data: todayOrders }, { data: pendingOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, shop:shops(name)")
      .in("shop_id", shopIds)
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, student:profiles(full_name, email), shop:shops(name)")
      .in("shop_id", shopIds)
      .eq("status", "waiting_for_acceptance")
      .order("created_at", { ascending: true })
      .limit(10),
  ]);

  const totalRevenue = todayOrders
    ?.filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + o.total_amount, 0) ?? 0;
  const totalCompleted = todayOrders?.filter((o) => o.status === "picked_up").length ?? 0;
  const totalQueue = shops.reduce((s, sh) => s + sh.current_queue, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Owner Dashboard</h1>
        <p className="text-slate-500 text-sm">
          Managing <span className="text-slate-900 font-semibold">{shops.length}</span> {shops.length === 1 ? "shop" : "shops"}
        </p>
      </div>

      {/* Per-shop open/close toggles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop) => (
          <Card key={shop.id} className={shop.status === "disabled" ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-slate-900 font-semibold text-sm truncate">{shop.name}</p>
                  <p className="text-slate-400 text-xs truncate">{shop.location?.name}</p>
                </div>
                <Badge variant={shop.status === "approved" ? "success" : "destructive"} className="text-[10px] flex-shrink-0">
                  {shop.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Queue: {shop.current_queue}</span>
                <span>₹{shop.price_bw}/pg B&W</span>
              </div>
              {shop.status === "approved" && (
                <ShopOpenToggle shopId={shop.id} isOpen={shop.is_open} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders (All Shops)", value: todayOrders?.length ?? 0, icon: Package, color: "text-blue-400" },
          { label: "Today's Revenue", value: `₹${totalRevenue}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Pending Acceptance", value: pendingOrders?.length ?? 0, icon: Clock, color: "text-amber-400" },
          { label: "Total Queue", value: totalQueue, icon: Users, color: "text-purple-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-slate-900 font-bold text-2xl">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending orders across all shops */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Awaiting Acceptance
            </h2>
            <Link href="/owner/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              All orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!pendingOrders || pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No pending orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="token-display font-bold text-blue-400">{order.token}</span>
                          <OrderStatusBadge status={order.status} />
                          {/* Show which shop */}
                          {shops.length > 1 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {order.shop?.name}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-900 text-sm font-medium">{order.document_name}</p>
                        <p className="text-slate-500 text-xs">
                          {order.student?.full_name} · {order.document_pages * order.copies} pages
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <p className="text-slate-900 font-semibold text-sm">₹{order.total_amount}</p>
                        <Button size="sm" variant="success" asChild>
                          <Link href="/owner/orders">Manage</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                Today Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total orders</span>
                <span className="text-slate-900">{todayOrders?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="text-emerald-400">{totalCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Revenue</span>
                <span className="text-slate-900 font-semibold">₹{totalRevenue}</span>
              </div>
              <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" asChild>
                <Link href="/owner/analytics">View Analytics →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-500" />
                My Shops ({shops.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[120px]">{shop.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{shop.current_queue} in queue</span>
                    <div className={`w-2 h-2 rounded-full ${shop.is_open ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                <Link href="/owner/shop">Manage Shops</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



