import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/navbar/DashboardNav";
import { getNotifications } from "@/actions/notifications";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    redirect(profile?.role === "student" ? "/student" : "/login");
  }

  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardNav profile={profile} unreadCount={unreadCount} />
      <main className="pt-16">{children}</main>
    </div>
  );
}
