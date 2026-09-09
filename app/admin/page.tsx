import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  Store,
  Package,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  const adminClient = await createAdminClient();

  const [
    { count: students },
    { count: owners },
    { count: pendingShops },
    { count: approvedShops },
    { count: activeOrders },
    { count: completedOrders },
    { count: locations },
    { data: revenueData },
    { data: pendingRequests },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "owner"),
    adminClient.from("shop_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("shops").select("*", { count: "exact", head: true }).eq("status", "approved"),
    adminClient.from("orders").select("*", { count: "exact", head: true }).in("status", ["waiting_for_acceptance", "accepted", "preparing"]),
    adminClient.from("orders").select("*", { count: "exact", head: true }).eq("status", "picked_up"),
    adminClient.from("locations").select("*", { count: "exact", head: true }).eq("is_active", true),
    adminClient.from("orders").select("total_amount").eq("payment_status", "paid"),
    adminClient.from("shop_requests").select("*, owner:profiles(full_name, email), location:locations(name)").eq("status", "pending").limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((s, o) => s + (o.total_amount ?? 0), 0) ?? 0;

  const stats = [
    { label: "Students", value: students ?? 0, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "Shop Owners", value: owners ?? 0, icon: Store, color: "text-amber-400", href: "/admin/users" },
    { label: "Approved Shops", value: approvedShops ?? 0, icon: CheckCircle, color: "text-emerald-400", href: "/admin/shops" },
    { label: "Pending Requests", value: pendingShops ?? 0, icon: Clock, color: "text-red-400", href: "/admin/shops" },
    { label: "Active Orders", value: activeOrders ?? 0, icon: Package, color: "text-purple-400", href: "/admin/orders" },
    { label: "Completed Orders", value: completedOrders ?? 0, icon: TrendingUp, color: "text-slate-500", href: "/admin/orders" },
    { label: "Total Revenue", value: `₹${totalRevenue}`, icon: TrendingUp, color: "text-emerald-400", href: "/admin/analytics" },
    { label: "Active Locations", value: locations ?? 0, icon: MapPin, color: "text-blue-400", href: "/admin/locations" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-slate-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs">{s.label}</span>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-white font-bold text-2xl">{s.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pending shop requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Pending Shop Requests
          </h2>
          <Link href="/admin/shops" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!pendingRequests || pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No pending requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{req.shop_name}</h3>
                        <Badge variant="warning">PENDING</Badge>
                      </div>
                      <p className="text-slate-500 text-xs">
                        {req.owner?.full_name} · {req.location?.name}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/admin/shops">Review</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", label: "Manage Users", icon: Users, desc: "View all students and owners" },
          { href: "/admin/locations", label: "Manage Locations", icon: MapPin, desc: "Add or disable campus locations" },
          { href: "/admin/analytics", label: "View Analytics", icon: TrendingUp, desc: "Platform-wide charts and metrics" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-blue-600/40 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <Icon className="w-6 h-6 text-blue-400 mb-3" />
                  <h3 className="text-white font-semibold text-sm mb-1">{link.label}</h3>
                  <p className="text-slate-500 text-xs">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


