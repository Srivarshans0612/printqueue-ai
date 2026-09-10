"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subDays, format } from "date-fns";
import { Package, DollarSign, TrendingUp, Users } from "lucide-react";

// Summary from server-side SQL aggregation (Phase 17)
type AnalyticsSummary = {
  total_orders: number;
  completed_orders: number;
  rejected_orders: number;
  cancelled_orders: number;
  active_orders: number;
  total_revenue: number;
  total_pages: number;
  total_students: number;
  total_owners: number;
  approved_shops: number;
  pending_shops: number;
} | null;

// Only last 14 days of orders for charts
type Order = {
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  shop_id: string;
  print_type: string;
};

type Shop = { id: string; name: string };

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: 11,
  },
  labelStyle: { color: "#0f172a" },
};

export function AdminAnalyticsClient({
  summary,
  orders,
  shops,
}: {
  summary: AnalyticsSummary;
  orders: Order[];
  shops: Shop[];
}) {
  // Use server-side aggregation if available; fall back to client-side
  const stats = useMemo(() => {
    if (summary) {
      return {
        total:      summary.total_orders,
        completed:  summary.completed_orders,
        rejected:   summary.rejected_orders,
        revenue:    Number(summary.total_revenue),
        totalPages: Number(summary.total_pages),
      };
    }
    const completed = orders.filter((o) => o.status === "picked_up");
    return {
      total:      orders.length,
      completed:  completed.length,
      rejected:   orders.filter((o) => o.status === "rejected").length,
      revenue:    completed.filter((o) => o.payment_status === "paid")
                           .reduce((s, o) => s + o.total_amount, 0),
      totalPages: 0,
    };
  }, [summary, orders]);

  // Daily trend — only 14 days of data fetched
  const dailyData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      const day = format(d, "yyyy-MM-dd");
      const day_orders = orders.filter((o) => o.created_at.startsWith(day));
      return {
        date:      format(d, "MMM d"),
        orders:    day_orders.length,
        revenue:   day_orders
                     .filter((o) => o.payment_status === "paid")
                     .reduce((s, o) => s + o.total_amount, 0),
        completed: day_orders.filter((o) => o.status === "picked_up").length,
      };
    });
  }, [orders]);

  // Per-shop aggregation
  const shopData = useMemo(() => {
    return shops
      .map((shop) => {
        const so = orders.filter((o) => o.shop_id === shop.id);
        return {
          name:    shop.name.length > 12 ? shop.name.slice(0, 12) + "..." : shop.name,
          orders:  so.length,
          revenue: so.filter((o) => o.payment_status === "paid")
                     .reduce((s, o) => s + o.total_amount, 0),
        };
      })
      .filter((s) => s.orders > 0)
      .sort((a, b) => b.orders - a.orders);
  }, [orders, shops]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name:  name.replace(/_/g, " "),
      value,
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Summary stats — from server-side SQL (Phase 17) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",  value: stats.total,                          icon: Package,    color: "text-blue-500"    },
          { label: "Completed",     value: stats.completed,                      icon: TrendingUp, color: "text-emerald-500" },
          { label: "Total Revenue", value: "Rs." + stats.revenue.toLocaleString("en-IN"), icon: DollarSign, color: "text-amber-500" },
          { label: "Pages Printed", value: stats.totalPages.toLocaleString(),    icon: Users,      color: "text-violet-500"  },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs font-semibold">{s.label}</span>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-slate-900 font-black text-2xl">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-900">Orders and Revenue — Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date"  stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis               stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip {...CHART_TOOLTIP} />
              <Line type="monotone" dataKey="orders"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Orders"  />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Orders by shop */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">Orders by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            {shopData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={shopData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <XAxis type="number"   stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} width={80} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by shop */}
      {shopData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">Revenue by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shopData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis              stroke="#94a3b8" tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
