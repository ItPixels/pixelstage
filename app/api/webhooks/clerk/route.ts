import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET environment variable" },
      { status: 500 },
    );
  }

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

  const wh = new Webhook(webhookSecret);

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

    const supabase = getSupabaseAdmin();

    // Anti-multi-account protection: Check if email already exists
    const { data: existingUserByEmail, error: emailCheckError } = await supabase
      .from("users")
      .select("id, email, balance")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError);
      return NextResponse.json(
        { error: "Error checking user data" },
        { status: 500 },
      );
    }

    // If email exists with different Clerk ID, this is likely a multi-account attempt
    if (existingUserByEmail && existingUserByEmail.id !== id) {
      console.warn(
        `[Anti-fraud] Email ${email} already registered with different Clerk ID: ${existingUserByEmail.id} (new: ${id})`,
      );
      // Don't create duplicate account, but return success to avoid webhook retries
      return NextResponse.json(
        {
          received: true,
          warning: "Email already registered",
        },
        { status: 200 },
      );
    }

    // Check if user with this Clerk ID already exists (idempotency)
    const { data: existingUserById, error: idCheckError } = await supabase
      .from("users")
      .select("id, email, balance, avatar_url")
      .eq("id", id)
      .maybeSingle();

    if (idCheckError) {
      console.error("Error checking existing user ID:", idCheckError);
      return NextResponse.json(
        { error: "Error checking user data" },
        { status: 500 },
      );
    }

    // If user already exists, don't give credits again (idempotency)
    if (existingUserById) {
      console.log(
        `[Idempotency] User ${id} already exists with balance ${existingUserById.balance}. Skipping credit grant.`,
      );
      // Update avatar if provided and different
      if (image_url && existingUserById.avatar_url !== image_url) {
        await supabase
          .from("users")
          .update({ avatar_url: image_url })
          .eq("id", id);
      }
      return NextResponse.json(
        {
          received: true,
          message: "User already exists, credits not granted",
        },
        { status: 200 },
      );
    }

    // User doesn't exist - create new user with 3 free credits
    // Use insert (not upsert) to ensure balance is only set on creation
    // If there's a race condition and user exists, the unique constraint will prevent duplicate
    const { error: insertError } = await supabase.from("users").insert({
      id,
      email: email.toLowerCase(), // Normalize email to lowercase
      avatar_url: image_url || null,
      balance: 3, // Give 3 free credits ONLY to truly new users
    });

    if (insertError) {
      // Check if it's a unique constraint violation (user already exists)
      if (insertError.code === "23505") {
        console.log(
          `[Idempotency] User ${id} was created concurrently. Skipping credit grant.`,
        );
        return NextResponse.json(
          {
            received: true,
            message: "User created concurrently, credits not granted",
          },
          { status: 200 },
        );
      }

      console.error("Error inserting user into Supabase:", insertError);
      return NextResponse.json(
        { error: "Error inserting user data" },
        { status: 500 },
      );
    }

    console.log(
      `[User Created] New user ${id} (${email}) registered with 3 free credits`,
    );

    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

