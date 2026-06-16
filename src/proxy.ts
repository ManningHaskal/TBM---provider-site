import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/signup"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function missingSupabaseEnvResponse(): NextResponse {
  return new NextResponse(
    "Server configuration error: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.",
    { status: 503 },
  );
}

export async function proxy(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    return missingSupabaseEnvResponse();
  }

  try {
    const { supabaseResponse, user } = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
      if (user && pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/home";
        return NextResponse.redirect(url);
      }

      return supabaseResponse;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Proxy session update failed:", error);

    if (isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
