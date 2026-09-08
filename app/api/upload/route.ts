import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify student role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    return Response.json({ error: "Only students can upload documents" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return Response.json({ error: "File too large. Max 20MB." }, { status: 400 });
  }

  // Create unique filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, path });
}
