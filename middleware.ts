import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|ico|png|jpg|jpeg|gif|svg|ttf|woff|woff2)).*)",
    "/(api|trpc)(.*)",
  ],
};
