"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, startOfDay } from "date-fns";
import { TrendingUp, Package, DollarSign, Printer } from "lucide-react";

interface Order {
  status: string;
  total_amount: number;
  payment_status: string;
  print_type: string;
  created_at: string;
  document_pages: number;
  copies: number;
}

interface OwnerAnalyticsClientProps {
  orders: Order[];
  shopName: string;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export function OwnerAnalyticsClient({ orders, shopName }: OwnerAnalyticsClientProps) {
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "picked_up");
    const revenue = completed.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0);
    const totalPages = completed.reduce((s, o) => s + o.document_pages * o.copies, 0);
    return { total: orders.length, completed: completed.length, revenue, totalPages };
  }, [orders]);

  // Daily revenue for last 7 days
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MMM d"), day: startOfDay(d).toISOString() };
    });

    return days.map(({ date, day }) => {
      const dayOrders = orders.filter(
        (o) => o.status === "picked_up" && o.created_at.startsWith(day.slice(0, 10))
      );
      return {
        date,
        orders: dayOrders.length,
        revenue: dayOrders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0),
      };
    });
  }, [orders]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [orders]);

  // Print type split
  const printTypeData = useMemo(() => {
    const bw = orders.filter((o) => o.print_type === "bw").length;
    const color = orders.filter((o) => o.print_type === "color").length;
    return [
      { name: "Black & White", value: bw },
      { name: "Color", value: color },
    ].filter((d) => d.value > 0);
  }, [orders]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{shopName} — Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your shop&apos;s performance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: Package, color: "text-blue-400" },
          { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Total Revenue", value: `₹${stats.revenue}`, icon: DollarSign, color: "text-amber-400" },
          { label: "Pages Printed", value: stats.totalPages, icon: Printer, color: "text-purple-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs">{s.label}</span>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-slate-900 font-bold text-2xl">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orders & Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
              <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Print type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Print Type Split</CardTitle>
          </CardHeader>
          <CardContent>
            {printTypeData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={printTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {printTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#f59e0b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-6 mt-3">
              {printTypeData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-slate-500">
                  <div className={`w-3 h-3 rounded-full`} style={{ background: i === 0 ? "#3b82f6" : "#f59e0b" }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


