"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Printer, Bell, LogOut, User, ChevronDown,
  Home, MapPin, Package, Store, LayoutDashboard,
  History, Wrench, BarChart2, Users,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Profile } from "@/types";
import { logout } from "@/actions/auth";

interface DashboardNavProps {
  profile: Profile;
  unreadCount?: number;
}

const studentLinks = [
  { href: "/student",           label: "Dashboard", icon: Home         },
  { href: "/student/locations", label: "Locations", icon: MapPin       },
  { href: "/student/shops",     label: "Shops",     icon: Store        },
  { href: "/student/orders",    label: "Orders",    icon: Package      },
  { href: "/student/history",   label: "History",   icon: History      },
  { href: "/student/tools",     label: "Tools",     icon: Wrench       },
];

const ownerLinks = [
  { href: "/owner",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/owner/orders",     label: "Orders",    icon: Package         },
  { href: "/owner/shop",       label: "My Shop",   icon: Store           },
  { href: "/owner/analytics",  label: "Analytics", icon: BarChart2       },
];

const adminLinks = [
  { href: "/admin",             label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users",       label: "Users",     icon: Users           },
  { href: "/admin/shops",       label: "Shops",     icon: Store           },
  { href: "/admin/orders",      label: "Orders",    icon: Package         },
  { href: "/admin/locations",   label: "Locations", icon: MapPin          },
  { href: "/admin/analytics",   label: "Analytics", icon: BarChart2       },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "text-purple-700 bg-purple-100",
  owner: "text-amber-700 bg-amber-100",
  student: "text-blue-700 bg-blue-100",
};

export function DashboardNav({ profile, unreadCount = 0 }: DashboardNavProps) {
  const pathname     = usePathname();
  const [open, setOpen] = useState(false);

  const links =
    profile.role === "admin"  ? adminLinks  :
    profile.role === "owner"  ? ownerLinks  : studentLinks;

  const roleLabel =
    profile.role === "admin"  ? "Admin"      :
    profile.role === "owner"  ? "Shop Owner" : "Student";

  return (
    <>
      {/* ── Top bar ─────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="flex h-full items-center justify-between px-4 max-w-7xl mx-auto gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow group-hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg leading-none">
              PrintQueue <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                    active
                      ? "bg-blue-600 text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bell */}
            <Link
              href={profile.role === "student" ? "/student" : profile.role === "owner" ? "/owner" : "/admin"}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-slate-200 hover:border-blue-300 bg-white transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {profile.full_name.split(" ")[0]}
                  </p>
                  <p className={cn("text-[10px] font-semibold px-1 rounded", ROLE_COLORS[profile.role])}>
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-slate-200 bg-white shadow-xl py-1 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900">{profile.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  </div>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav (students only) ───────── */}
      {profile.role === "student" && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-slate-200 flex shadow-lg">
          {studentLinks.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] font-bold transition-colors",
                  active ? "text-blue-600" : "text-slate-500"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-blue-600" : "text-slate-400")} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

