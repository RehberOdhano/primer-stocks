import { createClient } from "@/lib/supabase/server";

export interface Term {
  key: string;
  title: string;
  explainer: string;
}

/** Keyed by `key` so callers can do `terms.get("pe_ratio")` at render time. */
export async function getTermsByKey(): Promise<Map<string, Term>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("terms").select("key, title, explainer");

  if (error) throw new Error(error.message);

  return new Map((data ?? []).map((term) => [term.key, term]));
}
