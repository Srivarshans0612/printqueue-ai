import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  MapPin,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  Leaf,
  Bell,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { getNotifications } from "@/actions/notifications";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "blue" | "warning" | "destructive" | "secondary" | "outline"; label: string }> = {
    waiting_for_acceptance: { variant: "warning", label: "Waiting" },
    accepted: { variant: "blue", label: "Accepted" },
    preparing: { variant: "blue", label: "Preparing" },
    ready: { variant: "success", label: "Ready!" },
    picked_up: { variant: "secondary", label: "Picked Up" },
    rejected: { variant: "destructive", label: "Rejected" },
    cancelled: { variant: "outline", label: "Cancelled" },
  };
  const config = map[status] ?? { variant: "outline" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  // Recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, shop:shops(name, location:locations(name))")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Active orders
  const activeOrders = recentOrders?.filter(
    (o) => !["picked_up", "rejected", "cancelled"].includes(o.status)
  ) ?? [];

  // Notifications
  const notifications = await getNotifications();
  const unreadNotifications = notifications.filter((n) => !n.is_read).slice(0, 3);

  // Eco score average
  const ecoAvg = recentOrders && recentOrders.length > 0
    ? Math.round(recentOrders.reduce((s, o) => s + (o.eco_score ?? 70), 0) / recentOrders.length)
    : 70;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 page-enter">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ready to print smarter today?
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button size="lg" className="h-auto flex-col gap-2 py-5" asChild>
          <Link href="/student/order/new">
            <Package className="w-6 h-6" />
            <div className="text-center">
              <p className="font-semibold">New Order</p>
              <p className="text-xs opacity-80">Upload & print</p>
            </div>
          </Link>
        </Button>

        <Button size="lg" variant="secondary" className="h-auto flex-col gap-2 py-5" asChild>
          <Link href="/student/locations">
            <MapPin className="w-6 h-6" />
            <div className="text-center">
              <p className="font-semibold">Browse Locations</p>
              <p className="text-xs opacity-80">Find a campus shop</p>
            </div>
          </Link>
        </Button>

        <Button size="lg" variant="outline" className="h-auto flex-col gap-2 py-5" asChild>
          <Link href="/student/orders">
            <Clock className="w-6 h-6" />
            <div className="text-center">
              <p className="font-semibold">Track Orders</p>
              <p className="text-xs opacity-80">{activeOrders.length} active</p>
            </div>
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Orders</h2>
            <Link href="/student/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No active orders</p>
                <p className="text-slate-400 text-xs mt-1 mb-4">Place your first order to get started</p>
                <Button size="sm" asChild>
                  <Link href="/student/order/new">Place an Order</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <Link href={`/student/orders/${order.id}`} key={order.id}>
                  <Card className="hover:border-blue-600/40 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="token-display text-lg font-bold text-blue-400">
                              {order.token}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-white text-sm font-medium truncate">{order.document_name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {order.shop?.name} · {order.shop?.location?.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-semibold text-sm">₹{order.total_amount}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {order.document_pages * order.copies} pages
                          </p>
                        </div>
                      </div>
                      {order.status === "ready" && (
                        <div className="mt-3 flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <p className="text-emerald-400 text-xs font-medium">
                            Ready for pickup! Use your OTP to collect.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Eco Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Eco Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-emerald-400">{ecoAvg}</span>
                <span className="text-slate-500 text-sm mb-1">/100</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all"
                  style={{ width: `${ecoAvg}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Digital ordering helps reduce unnecessary trips and paper waste.
              </p>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge variant="blue" className="text-[10px] px-1.5 py-0 ml-auto">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadNotifications.length === 0 ? (
                <p className="text-slate-400 text-xs">No new notifications</p>
              ) : (
                unreadNotifications.map((notif) => (
                  <div key={notif.id} className="border-l-2 border-blue-600 pl-3">
                    <p className="text-white text-xs font-medium">{notif.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-slate-400 text-[10px] mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-500" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Orders</span>
                <span className="text-white text-sm font-semibold">{recentOrders?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Completed</span>
                <span className="text-white text-sm font-semibold">
                  {recentOrders?.filter((o) => o.status === "picked_up").length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Total Spent</span>
                <span className="text-white text-sm font-semibold">
                  ₹{recentOrders?.reduce((s, o) => s + o.total_amount, 0) ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


