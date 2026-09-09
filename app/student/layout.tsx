import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/navbar/DashboardNav";
import { getNotifications } from "@/actions/notifications";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    redirect(profile?.role === "admin" ? "/admin" : "/owner");
  }

  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav profile={profile} unreadCount={unreadCount} />
      <main className="pt-16 pb-20 lg:pb-6">{children}</main>
    </div>
  );
}
