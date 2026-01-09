import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем вебхуки без ограничений
  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  // Все остальные маршруты пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
