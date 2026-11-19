import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSupabaseSession(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && request.nextUrl.pathname.startsWith("/dev/rls-check")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isProtected = request.nextUrl.pathname.startsWith("/home") || request.nextUrl.pathname.startsWith("/onboarding");
  const isAuthPage = ["/auth/login", "/auth/signup"].includes(request.nextUrl.pathname);
  if (!user && isProtected) return NextResponse.redirect(new URL("/auth/login", request.url));
  if (user && isAuthPage) return NextResponse.redirect(new URL("/onboarding", request.url));
  return response;
}
