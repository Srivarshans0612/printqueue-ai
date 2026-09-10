"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateOrderAmount, processPayment } from "@/lib/payments";
import { z } from "zod";

const orderSchema = z.object({
  shop_id: z.string().uuid(),
  document_name: z.string().min(1),
  document_path: z.string().min(1),
  document_pages: z.number().int().positive(),
  copies: z.number().int().positive().max(50),
  print_type: z.enum(["bw", "color"]),
  priority: z.enum(["normal", "express"]),
  payment_method: z.enum(["pay_at_shop", "upi", "debit_card", "credit_card"]),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

function generateToken(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PQ${num}`;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateEcoScore(pages: number, copies: number): number {
  const total = pages * copies;
  if (total <= 10) return 95;
  if (total <= 25) return 85;
  if (total <= 50) return 70;
  if (total <= 100) return 55;
  return 40;
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Verify student role server-side
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") return { error: "Only students can place orders." };

  const raw = {
    shop_id: formData.get("shop_id") as string,
    document_name: formData.get("document_name") as string,
    document_path: formData.get("document_path") as string,
    document_pages: parseInt(formData.get("document_pages") as string),
    copies: parseInt(formData.get("copies") as string),
    print_type: formData.get("print_type") as string,
    priority: formData.get("priority") as string,
    payment_method: formData.get("payment_method") as string,
    deadline: formData.get("deadline") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid order data." };

  // Fetch shop to get current prices
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", parsed.data.shop_id)
    .eq("status", "approved")
    .eq("is_open", true)
    .single();

  if (!shop) return { error: "Shop is not available." };

  const total_amount = calculateOrderAmount(
    parsed.data.document_pages,
    parsed.data.copies,
    parsed.data.print_type,
    parsed.data.priority,
    shop.price_bw,
    shop.price_color,
    shop.priority_multiplier
  );

  const token = generateToken();
  const pickup_otp = generateOTP();
  const eco_score = calculateEcoScore(parsed.data.document_pages, parsed.data.copies);

  const adminClient = await createAdminClient();

  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      token,
      student_id: user.id,
      shop_id: parsed.data.shop_id,
      document_name: parsed.data.document_name,
      document_path: parsed.data.document_path,
      document_pages: parsed.data.document_pages,
      copies: parsed.data.copies,
      print_type: parsed.data.print_type,
      priority: parsed.data.priority,
      total_amount,
      status: "waiting_for_acceptance",
      payment_method: parsed.data.payment_method,
      payment_status: "pending",
      pickup_otp,
      otp_verified: false,
      deadline: parsed.data.deadline,
      notes: parsed.data.notes,
      eco_score,
    })
    .select()
    .single();

  if (orderError || !order) return { error: orderError?.message ?? "Failed to create order." };

  // Create payment record
  await adminClient.from("payments").insert({
    order_id: order.id,
    amount: total_amount,
    method: parsed.data.payment_method,
    status: "pending",
  });

  // Process online payment
  if (parsed.data.payment_method !== "pay_at_shop") {
    const paymentResult = await processPayment({
      order_id: order.id,
      amount: total_amount,
      method: parsed.data.payment_method,
    });

    if (paymentResult.success) {
      await adminClient
        .from("payments")
        .update({
          status: paymentResult.status,
          transaction_id: paymentResult.transaction_id,
          gateway_response: paymentResult.gateway_response,
        })
        .eq("order_id", order.id);

      if (paymentResult.status === "paid") {
        await adminClient
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", order.id);
      }
    }
  }

  // Increment shop queue
  await adminClient
    .from("shops")
    .update({ current_queue: shop.current_queue + 1 })
    .eq("id", shop.id);

  // Create notification for student
  await adminClient.from("notifications").insert({
    user_id: user.id,
    title: "Order Placed",
    body: `Your order ${token} has been sent to ${shop.name}. Waiting for acceptance.`,
    type: "order_placed",
    order_id: order.id,
    is_read: false,
  });

  // Notify shop owner
  await adminClient.from("notifications").insert({
    user_id: shop.owner_id,
    title: "New Order",
    body: `New order ${token} received. ${parsed.data.document_pages * parsed.data.copies} pages, ${parsed.data.print_type === "bw" ? "B&W" : "Color"}.`,
    type: "new_order",
    order_id: order.id,
    is_read: false,
  });

  revalidatePath("/student/orders");
  return { success: true, order_id: order.id, token };
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  estimatedReadyAt?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const adminClient = await createAdminClient();

  // If owner, verify the order belongs to their shop
  if (profile.role === "owner") {
    // Get the order first to know which shop it belongs to
    const { data: order } = await adminClient
      .from("orders")
      .select("shop_id, student_id")
      .eq("id", orderId)
      .single();

    if (!order) return { error: "Order not found." };

    // Verify that shop belongs to this owner
    const { data: shop } = await adminClient
      .from("shops")
      .select("id")
      .eq("id", order.shop_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!shop) return { error: "Unauthorized." };

    const update: Record<string, unknown> = { status };
    if (estimatedReadyAt) update.estimated_ready_at = estimatedReadyAt;

    await adminClient.from("orders").update(update).eq("id", orderId);

    // Notify student
    const statusMessages: Record<string, { title: string; body: string }> = {
      accepted: { title: "Order Accepted!", body: "Your order has been accepted and will be prepared soon." },
      preparing: { title: "Printing in Progress", body: "Your document is being printed now." },
      ready: { title: "Order Ready! 🎉", body: "Your order is ready for pickup. Head to the shop with your OTP." },
      rejected: { title: "Order Rejected", body: "Your order was rejected by the shop. Contact support if needed." },
    };

    const msg = statusMessages[status];
    if (msg) {
      await adminClient.from("notifications").insert({
        user_id: order.student_id,
        title: msg.title,
        body: msg.body,
        type: `order_${status}`,
        order_id: orderId,
        is_read: false,
      });
    }

    // Decrement queue on completion
    if (status === "ready" || status === "rejected" || status === "cancelled") {
      await adminClient.rpc("decrement_queue", { shop_id: order.shop_id });
    }
  } else {
    await adminClient.from("orders").update({ status }).eq("id", orderId);
  }

  // No revalidatePath — realtime handles live updates on both sides
  return { success: true };
}

export async function verifyOTP(orderId: string, otp: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Only shop owners can verify OTPs." };
  }

  const adminClient = await createAdminClient();

  const { data: order } = await adminClient
    .from("orders")
    .select("pickup_otp, otp_verified, status, student_id, shop_id")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };
  if (order.otp_verified) return { error: "OTP already used." };
  if (order.status !== "ready") return { error: "Order is not ready for pickup." };
  if (order.pickup_otp !== otp) return { error: "Incorrect OTP." };

  await adminClient
    .from("orders")
    .update({ status: "picked_up", otp_verified: true })
    .eq("id", orderId);

  // Handle payment for pay-at-shop
  await adminClient
    .from("payments")
    .update({ status: "paid" })
    .eq("order_id", orderId);

  await adminClient
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId);

  await adminClient.from("notifications").insert({
    user_id: order.student_id,
    title: "Order Picked Up ✓",
    body: "Your order has been picked up. Thank you for using PrintQueue AI!",
    type: "order_picked_up",
    order_id: orderId,
    is_read: false,
  });

  // No revalidatePath — realtime handles live updates on both sides
  return { success: true };
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const adminClient = await createAdminClient();

  const { data: order } = await adminClient
    .from("orders")
    .select("student_id, status, shop_id")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };
  if (order.student_id !== user.id) return { error: "Unauthorized." };
  if (!["waiting_for_acceptance"].includes(order.status)) {
    return { error: "Order cannot be cancelled at this stage." };
  }

  await adminClient
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  await adminClient.rpc("decrement_queue", { shop_id: order.shop_id });

  revalidatePath("/student/orders");
  return { success: true };
}

export async function getStudentOrders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, shop:shops(id, name, address, location:locations(name)), payment:payments(*)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getOwnerOrders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!shop) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, student:profiles(id, full_name, email), payment:payments(*)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
