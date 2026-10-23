import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
    return response;
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, cacheHeaders) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          if (cacheHeaders)
            Object.entries(cacheHeaders).forEach(([name, value]) =>
              response.headers.set(name, value),
            );
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );
  const { data } = await client.auth.getClaims();
  // Signed-out visits to the workspace get a real redirect here. In the shared layout it would arrive
  // inside a streamed page, after a blank frame.
  const path = request.nextUrl.pathname;
  if (!data?.claims?.sub && (path === "/" || path.startsWith("/portfolio") || path.startsWith("/admin"))) {
    const signIn = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach(cookie => signIn.cookies.set(cookie));
    signIn.headers.set("Cache-Control", "private, no-store");
    return signIn;
  }
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
