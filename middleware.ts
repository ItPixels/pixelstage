import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Landing page и webhooks должны быть публичными
  if (isPublicRoute(req)) {
    return;
  }

  // Защищаем dashboard маршруты
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|ico|png|jpg|jpeg|gif|svg|ttf|woff|woff2)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

