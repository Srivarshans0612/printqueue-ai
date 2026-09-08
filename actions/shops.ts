"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const shopRequestSchema = z.object({
  location_id: z.string().uuid(),
  shop_name: z.string().min(2).max(100),
  address: z.string().min(5),
  description: z.string().optional(),
  price_bw: z.number().positive().max(50),
  price_color: z.number().positive().max(100),
  phone: z.string().optional(),
});

export async function submitShopRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") return { error: "Only shop owners can submit requests." };

  const raw = {
    location_id: formData.get("location_id") as string,
    shop_name: formData.get("shop_name") as string,
    address: formData.get("address") as string,
    description: formData.get("description") as string || undefined,
    price_bw: parseFloat(formData.get("price_bw") as string),
    price_color: parseFloat(formData.get("price_color") as string),
    phone: formData.get("phone") as string || undefined,
  };

  const parsed = shopRequestSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid shop data." };

  const adminClient = await createAdminClient();
  const { error } = await adminClient.from("shop_requests").insert({
    owner_id: user.id,
    ...parsed.data,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/owner");
  return { success: true };
}

export async function toggleShopOpen(shopId: string, isOpen: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();

  if (!shop || shop.owner_id !== user.id) return { error: "Unauthorized." };

  const adminClient = await createAdminClient();
  await adminClient.from("shops").update({ is_open: isOpen }).eq("id", shopId);

  revalidatePath("/owner/shop");
  revalidatePath("/student/shops");
  return { success: true };
}

export async function updateShopProfile(shopId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();

  if (!shop || shop.owner_id !== user.id) return { error: "Unauthorized." };

  const adminClient = await createAdminClient();
  await adminClient
    .from("shops")
    .update({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      price_bw: parseFloat(formData.get("price_bw") as string),
      price_color: parseFloat(formData.get("price_color") as string),
    })
    .eq("id", shopId);

  revalidatePath("/owner/shop");
  return { success: true };
}

export async function getShopsByLocation(locationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("*, location:locations(id, name)")
    .eq("location_id", locationId)
    .eq("status", "approved")
    .order("rating", { ascending: false });

  return data ?? [];
}

export async function getAllLocations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

// Admin actions
export async function approveShopRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized." };

  const adminClient = await createAdminClient();

  const { data: req } = await adminClient
    .from("shop_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) return { error: "Request not found." };

  // Create the shop
  await adminClient.from("shops").insert({
    owner_id: req.owner_id,
    location_id: req.location_id,
    name: req.shop_name,
    address: req.address,
    description: req.description,
    price_bw: req.price_bw,
    price_color: req.price_color,
    phone: req.phone,
    is_open: false,
    status: "approved",
    rating: 0,
    total_reviews: 0,
    current_queue: 0,
    avg_completion_minutes: 20,
    max_daily_orders: 100,
    priority_multiplier: 1.5,
  });

  // Update request status
  await adminClient
    .from("shop_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  // Notify owner
  await adminClient.from("notifications").insert({
    user_id: req.owner_id,
    title: "Shop Approved! 🎉",
    body: `Your shop "${req.shop_name}" has been approved. You can now start accepting orders.`,
    type: "shop_approved",
    is_read: false,
  });

  revalidatePath("/admin/shops");
  return { success: true };
}

export async function rejectShopRequest(requestId: string, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized." };

  const adminClient = await createAdminClient();

  const { data: req } = await adminClient
    .from("shop_requests")
    .select("owner_id, shop_name")
    .eq("id", requestId)
    .single();

  await adminClient
    .from("shop_requests")
    .update({ status: "rejected", admin_note: note })
    .eq("id", requestId);

  if (req) {
    await adminClient.from("notifications").insert({
      user_id: req.owner_id,
      title: "Shop Request Update",
      body: `Your shop request for "${req.shop_name}" was not approved. ${note ?? ""}`,
      type: "shop_rejected",
      is_read: false,
    });
  }

  revalidatePath("/admin/shops");
  return { success: true };
}

export async function disableShop(shopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized." };

  const adminClient = await createAdminClient();
  await adminClient.from("shops").update({ status: "disabled" }).eq("id", shopId);

  revalidatePath("/admin/shops");
  return { success: true };
}

export async function addLocation(name: string, description?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized." };

  const adminClient = await createAdminClient();
  const { error } = await adminClient.from("locations").insert({
    name: name.trim(),
    description: description?.trim(),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/locations");
  revalidatePath("/student/locations");
  return { success: true };
}

export async function toggleLocationActive(locationId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized." };

  const adminClient = await createAdminClient();
  await adminClient.from("locations").update({ is_active: isActive }).eq("id", locationId);

  revalidatePath("/admin/locations");
  revalidatePath("/student/locations");
  return { success: true };
}
