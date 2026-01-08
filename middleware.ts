import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Указываем, какие маршруты нужно защищать (dashboard и всё что внутри)
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth().protect();
  }
});

export const config = {
  matcher: [
    // Исключаем статические файлы и системные пути Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Всегда запускаем middleware для API маршрутов
    '/(api|trpc)(.*)',
  ],
};