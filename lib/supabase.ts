import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Получить Supabase admin клиент (server-only, использует SERVICE_ROLE_KEY)
 * @returns Supabase клиент с admin правами
 * @throws Error если отсутствуют необходимые env переменные
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Получить публичный Supabase клиент (использует ANON_KEY)
 * @returns Supabase клиент с публичными правами
 * @throws Error если отсутствуют необходимые env переменные
 */
export const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Получить баланс пользователя по Clerk ID
 * @param clerkId - ID пользователя из Clerk
 * @returns Баланс пользователя или null, если пользователь не найден
 */
export const getUserBalance = async (
  clerkId: string,
): Promise<number | null> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("users")
    .select("balance")
    .eq("id", clerkId)
    .single();

  if (error) {
    console.error("Error fetching user balance:", error);
    return null;
  }

  return data?.balance ?? 0;
};

/**
 * Уменьшить баланс пользователя
 * @param clerkId - ID пользователя из Clerk
 * @param amount - Количество кредитов для списания (по умолчанию 1)
 * @returns Новый баланс или null в случае ошибки
 */
export const decreaseUserBalance = async (
  clerkId: string,
  amount: number = 1,
): Promise<number | null> => {
  const supabase = getSupabaseAdmin();

  // Сначала получаем текущий баланс
  const currentBalance = await getUserBalance(clerkId);

  if (currentBalance === null) {
    console.error("User not found or error fetching balance");
    return null;
  }

  if (currentBalance < amount) {
    console.error("Insufficient balance");
    return null;
  }

  const newBalance = currentBalance - amount;

  const { data, error } = await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", clerkId)
    .select("balance")
    .single();

  if (error) {
    console.error("Error decreasing user balance:", error);
    return null;
  }

  return data?.balance ?? null;
};

/**
 * Увеличить баланс пользователя
 * @param clerkId - ID пользователя из Clerk
 * @param amount - Количество кредитов для начисления
 * @returns Новый баланс или null в случае ошибки
 */
export const increaseUserBalance = async (
  clerkId: string,
  amount: number,
): Promise<number | null> => {
  const supabase = getSupabaseAdmin();

  // Сначала получаем текущий баланс
  const currentBalance = await getUserBalance(clerkId);

  if (currentBalance === null) {
    console.error("User not found or error fetching balance");
    return null;
  }

  const newBalance = currentBalance + amount;

  const { data, error } = await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", clerkId)
    .select("balance")
    .single();

  if (error) {
    console.error("Error increasing user balance:", error);
    return null;
  }

  return data?.balance ?? null;
};
