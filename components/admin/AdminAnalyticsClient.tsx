"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subDays, format } from "date-fns";
import { Package, DollarSign, TrendingUp, Users } from "lucide-react";

type Order = {
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  shop_id: string;
  print_type: string;
  document_pages: number;
  copies: number;
};

type Shop = { id: string; name: string };

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function AdminAnalyticsClient({ orders, shops }: { orders: Order[]; shops: Shop[] }) {
  // Summary stats
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "picked_up");
    const revenue = completed.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0);
    const totalPages = completed.reduce((s, o) => s + o.document_pages * o.copies, 0);
    return {
      total: orders.length,
      completed: completed.length,
      rejected: orders.filter((o) => o.status === "rejected").length,
      revenue,
      totalPages,
    };
  }, [orders]);

  // Daily orders - last 14 days
  const dailyData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dayStr = format(d, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) => o.created_at.startsWith(dayStr));
      return {
        date: format(d, "MMM d"),
        orders: dayOrders.length,
        revenue: dayOrders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0),
        completed: dayOrders.filter((o) => o.status === "picked_up").length,
      };
    });
  }, [orders]);

  // Orders by shop
  const shopData = useMemo(() => {
    return shops.map((shop) => {
      const shopOrders = orders.filter((o) => o.shop_id === shop.id);
      return {
        name: shop.name.length > 12 ? shop.name.slice(0, 12) + "…" : shop.name,
        orders: shopOrders.length,
        revenue: shopOrders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0),
      };
    }).filter((s) => s.orders > 0).sort((a, b) => b.orders - a.orders);
  }, [orders, shops]);

  // Status pie
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: Package, color: "text-blue-400" },
          { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Total Revenue", value: `₹${stats.revenue}`, icon: DollarSign, color: "text-amber-400" },
          { label: "Pages Processed", value: stats.totalPages.toLocaleString(), icon: Users, color: "text-purple-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs">{s.label}</span>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-white font-bold text-2xl">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daily Orders & Revenue (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 11 }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Orders" />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Orders by shop */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            {shopData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={shopData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
                  <YAxis type="category" dataKey="name" stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 11 }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
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
            <CardTitle className="text-sm">Revenue by Shop (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shopData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 11 }}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

