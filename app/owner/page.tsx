import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Store,
  ArrowRight,
  AlertCircle,
  Clock,
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

  // Get owner's first shop (any status)
  const { data: allShops } = await supabase
    .from("shops")
    .select("*, location:locations(name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const shop = allShops?.[0] ?? null;

  // Get shop request if no shop yet
  const { data: shopRequest } = !shop
    ? await supabase
        .from("shop_requests")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center page-enter">
        <Store className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-3">
          {shopRequest ? "Shop Request Pending" : "Register Your Shop"}
        </h1>
        {shopRequest ? (
          <>
            <p className="text-zinc-400 mb-2">
              Your shop request for <strong className="text-white">{shopRequest.shop_name}</strong> is under review.
            </p>
            <Badge variant="warning">PENDING APPROVAL</Badge>
            <p className="text-zinc-500 text-sm mt-4">
              An admin will review your request soon. You&apos;ll receive a notification once approved.
            </p>
          </>
        ) : (
          <>
            <p className="text-zinc-400 mb-6">
              Submit your shop details to get approved on the platform and start receiving digital print orders.
            </p>
            <Button asChild>
              <Link href="/owner/shop">
                Submit Shop Request
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  // Orders for today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("shop_id", shop.id)
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false });

  // Pending orders needing attention
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("*, student:profiles(full_name, email)")
    .eq("shop_id", shop.id)
    .eq("status", "waiting_for_acceptance")
    .order("created_at", { ascending: true })
    .limit(5);

  const todayRevenue = todayOrders
    ?.filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + o.total_amount, 0) ?? 0;

  const todayCompleted = todayOrders?.filter((o) => o.status === "picked_up").length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-6">
      {/* Shop header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{shop.name}</h1>
            <Badge variant={shop.status === "approved" ? "success" : "warning"}>
              {shop.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-zinc-400 text-sm">{shop.address} · {shop.location?.name}</p>
        </div>

        <ShopOpenToggle shopId={shop.id} isOpen={shop.is_open} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: todayOrders?.length ?? 0, icon: Package, color: "text-blue-400" },
          { label: "Today's Revenue", value: `₹${todayRevenue}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Pending Acceptance", value: pendingOrders?.length ?? 0, icon: Clock, color: "text-amber-400" },
          { label: "Current Queue", value: shop.current_queue, icon: Users, color: "text-purple-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-xs">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-white font-bold text-2xl">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
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
                <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No pending orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="token-display font-bold text-blue-400">{order.token}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-white text-sm font-medium">{order.document_name}</p>
                        <p className="text-zinc-400 text-xs">
                          {order.student?.full_name} · {order.document_pages * order.copies} pages
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-white font-semibold text-sm text-right">₹{order.total_amount}</p>
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

        {/* Shop Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-zinc-400" />
                Shop Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Rating</span>
                <span className="text-white font-medium">
                  {shop.rating > 0 ? `${shop.rating.toFixed(1)} ★` : "No ratings yet"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">B&W Price</span>
                <span className="text-white font-medium">₹{shop.price_bw}/page</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Color Price</span>
                <span className="text-white font-medium">₹{shop.price_color}/page</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Avg Completion</span>
                <span className="text-white font-medium">{shop.avg_completion_minutes} min</span>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                <Link href="/owner/shop">Edit Shop</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                Today Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total orders</span>
                <span className="text-white">{todayOrders?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Completed</span>
                <span className="text-emerald-400">{todayCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Revenue</span>
                <span className="text-white font-semibold">₹{todayRevenue}</span>
              </div>
              <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" asChild>
                <Link href="/owner/analytics">View Analytics →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
