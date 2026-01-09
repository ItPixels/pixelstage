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

// Define public routes (accessible without authentication)
// These routes work with or without locale prefix
const isPublicRoute = createRouteMatcher([
  // Home page (with or without locale)
  "/",
  "/(en|ar)",
  // Sign-in pages
  "/sign-in(.*)",
  "/(en|ar)/sign-in(.*)",
  // Sign-up pages
  "/sign-up(.*)",
  "/(en|ar)/sign-up(.*)",
  // Webhooks (must be public for external services)
  "/api/webhooks(.*)",
]);

// Define protected routes (require authentication)
// These routes will redirect to sign-in if user is not authenticated
const isProtectedRoute = createRouteMatcher([
  // Dashboard routes
  "/dashboard(.*)",
  "/(en|ar)/dashboard(.*)",
  // API generate routes
  "/api/generate(.*)",
]);

// Combined middleware: next-intl first, then Clerk
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle locale routing with next-intl first
  const response = intlMiddleware(req);

  // Check if route is public - allow access without authentication
  if (isPublicRoute(req)) {
    return response || NextResponse.next();
  }

  // Check if route is protected
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();

    // If user is not authenticated, redirect to sign-in
    if (!userId) {
      // Extract locale from pathname or use default
      const pathname = req.nextUrl.pathname;
      const localeMatch = pathname.match(/^\/(en|ar)/);
      const locale = localeMatch ? localeMatch[1] : defaultLocale;

      // Redirect to sign-in with return URL
      // Clerk will automatically redirect back after sign-in
      return redirectToSignIn({
        returnBackUrl: req.url,
      });
    }
  }

  // Allow access for authenticated users or non-protected routes
  return response || NextResponse.next();
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // - … static files
    "/((?!_next|_vercel|.*\\..*).*)",
    // Match API routes (but exclude static files)
    "/(api|trpc)(.*)",
  ],
};
