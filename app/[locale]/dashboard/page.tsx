import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  // Server-side auth check (additional to middleware)
  const { userId } = await auth();

  if (!userId) {
    redirect("/en/sign-in");
  }

  return <DashboardClient />;
}
