"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Printer,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Home,
  MapPin,
  Package,
  Store,
  LayoutDashboard,
  History,
  Wrench,
  BarChart2,
  Users,
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
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/locations", label: "Locations", icon: MapPin },
  { href: "/student/shops", label: "Shops", icon: Store },
  { href: "/student/orders", label: "Orders", icon: Package },
  { href: "/student/history", label: "History", icon: History },
  { href: "/student/tools", label: "Tools", icon: Wrench },
];

const ownerLinks = [
  { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owner/orders", label: "Orders", icon: Package },
  { href: "/owner/shop", label: "My Shop", icon: Store },
  { href: "/owner/analytics", label: "Analytics", icon: BarChart2 },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/shops", label: "Shops", icon: Store },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

export function DashboardNav({ profile, unreadCount = 0 }: DashboardNavProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const links =
    profile.role === "admin"
      ? adminLinks
      : profile.role === "owner"
      ? ownerLinks
      : studentLinks;

  const roleLabel =
    profile.role === "admin"
      ? "Admin"
      : profile.role === "owner"
      ? "Shop Owner"
      : "Student";

  const roleColor =
    profile.role === "admin"
      ? "text-purple-400"
      : profile.role === "owner"
      ? "text-amber-400"
      : "text-blue-400";

  return (
    <>
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors">
              <Printer className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-base">
              PrintQueue <span className="text-lime-400">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href={profile.role === "student" ? "/student" : profile.role === "owner" ? "/owner" : "/admin"}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-white leading-tight">
                    {profile.full_name.split(" ")[0]}
                  </p>
                  <p className={cn("text-[10px] leading-tight", roleColor)}>{roleLabel}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-sm font-medium text-white">{profile.full_name}</p>
                    <p className="text-xs text-zinc-400 truncate">{profile.email}</p>
                  </div>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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

      {/* Mobile bottom nav (student only) */}
      {profile.role === "student" && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex">
          {studentLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors",
                  isActive ? "text-blue-400" : "text-zinc-500"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
