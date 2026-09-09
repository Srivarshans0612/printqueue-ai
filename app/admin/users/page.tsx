import { createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Store, Shield } from "lucide-react";
import { format } from "date-fns";

export default async function AdminUsersPage() {
  const adminClient = await createAdminClient();

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const students = profiles?.filter((p) => p.role === "student") ?? [];
  const owners = profiles?.filter((p) => p.role === "owner") ?? [];
  const admins = profiles?.filter((p) => p.role === "admin") ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">All registered platform users</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Students", count: students.length, icon: GraduationCap, color: "text-blue-400" },
          { label: "Shop Owners", count: owners.length, icon: Store, color: "text-amber-400" },
          { label: "Admins", count: admins.length, icon: Shield, color: "text-purple-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-slate-900 font-bold text-xl">{s.count}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles?.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-200/50 hover:bg-zinc-900/50">
                    <td className="px-5 py-3 text-slate-900 font-medium">{profile.full_name}</td>
                    <td className="px-5 py-3 text-slate-500">{profile.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={
                        profile.role === "admin" ? "purple" :
                        profile.role === "owner" ? "warning" : "blue"
                      } className="text-[10px]">
                        {profile.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {format(new Date(profile.created_at), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!profiles || profiles.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-500">No users yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



