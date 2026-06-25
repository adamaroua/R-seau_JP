"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-key";

let browserClient: SupabaseClient<Database> | undefined;

function readPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, key } = readPublicSupabaseConfig();

  // During static prerender the build may run without public env vars.
  // Use placeholders on the server only; real auth always happens in the browser.
  if (typeof window === "undefined") {
    browserClient = createBrowserClient<Database>(
      url ?? PLACEHOLDER_URL,
      key ?? PLACEHOLDER_KEY
    );
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabasePublishableKey());
  return browserClient;
}
