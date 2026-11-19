import { updateSupabaseSession } from "@/core/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/home/:path*", "/auth/:path*", "/dev/rls-check/:path*"],
};
