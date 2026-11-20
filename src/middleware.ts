import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects the admin page with a simple username/password prompt.
 * Username: admin. Password: the ADMIN_PASSWORD setting.
 * For a public launch, replace this with proper sign-in.
 */
export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD ?? "change-me";
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [user, pass] = atob(encoded).split(":");
    if (user === "admin" && pass === expected) return NextResponse.next();
  }
  return new NextResponse("Sign in required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Muhurat admin"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
