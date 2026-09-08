import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      shop:shops(id, name, address, phone, location:locations(name)),
      payment:payments(*)
    `)
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (!order) notFound();

  return <OrderDetailClient order={order} role="student" />;
}
