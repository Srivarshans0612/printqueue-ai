import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect auth-required routes
  const protectedPaths = ["/student", "/owner", "/admin"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch profile for role-based access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const path = request.nextUrl.pathname;

    if (path.startsWith("/student") && role !== "student" && role !== "admin") {
      return NextResponse.redirect(new URL(`/${role ?? "login"}`, request.url));
    }
    if (path.startsWith("/owner") && role !== "owner" && role !== "admin") {
      return NextResponse.redirect(new URL(`/${role ?? "login"}`, request.url));
    }
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(`/${role ?? "login"}`, request.url));
    }

    // Redirect logged-in users away from login/register
    if (path === "/login" || path === "/register") {
      const dest = role === "admin" ? "/admin" : role === "owner" ? "/owner" : "/student";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return supabaseResponse;
}
