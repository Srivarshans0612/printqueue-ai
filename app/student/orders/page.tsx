/**
 * Student Orders Page — Phase 8, 15
 *
 * Server component fetches the list initially.
 * StudentOrdersClient wraps the list with a realtime subscription
 * so new orders and status changes appear without page refresh.
 */
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentOrdersList } from "@/components/student/StudentOrdersList";
import { redirect } from "next/navigation";

export default async function StudentOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch initial orders — select only needed columns (Phase 14)
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, token, status, document_name,
      document_pages, copies, total_amount, created_at, shop_id,
      shop:shops(id, name, location:locations(name))
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50); // pagination Phase 15

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Live tracking — updates instantly without refresh
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/student/order/new">
            <Package className="w-4 h-4 mr-2" /> New Order
          </Link>
        </Button>
      </div>

      <StudentOrdersList
    initialOrders={(orders ?? []) as unknown as Parameters<typeof StudentOrdersList>[0]["initialOrders"]}
    studentId={user.id}
  />
    </div>
  );
}
