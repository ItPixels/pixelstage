import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardNavLinks } from "@/components/DashboardNavLinks";
import { DashboardMobileHeader } from "@/components/DashboardMobileHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="flex w-full flex-col gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-white transition hover:text-emerald-300"
          >
            PixelStage
          </Link>
          <DashboardNavLinks />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <DashboardMobileHeader />
        <main className="flex-1 px-4 py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
