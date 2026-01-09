import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n";

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Define public routes for Clerk (with locale prefix)
const isPublicRoute = createRouteMatcher([
  "/(en|ar)", // Home page
  "/(en|ar)/sign-in(.*)",
  "/(en|ar)/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Combined middleware: next-intl first, then Clerk
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle locale routing with next-intl first
  const response = intlMiddleware(req);

  // Check if route is public
  if (isPublicRoute(req)) {
    return response || NextResponse.next();
  }

  // For protected routes (like /dashboard), check authentication
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    // Redirect to sign-in with locale
    const locale = req.nextUrl.pathname.split("/")[1] || defaultLocale;
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return response || NextResponse.next();
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
