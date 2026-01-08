import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { supabase } from "@/lib/supabase";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await req.text();

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  const wh = new Webhook(webhookSecret!);

  let evt: {
    type: string;
    data: {
      id: string;
      email_addresses: Array<{ email_address: string }>;
      image_url: string;
    };
  };

  try {
    evt = wh.verify(payload, svixHeaders) as typeof evt;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 },
    );
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "Email not found in webhook data" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("users").insert({
      id,
      email,
      avatar_url: image_url || null,
    });

    if (error) {
      console.error("Error inserting user into Supabase:", error);
      return NextResponse.json(
        { error: "Error inserting user data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

