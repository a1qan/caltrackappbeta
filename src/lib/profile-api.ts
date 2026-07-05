import { supabase } from "@/lib/supabase";
import type { Profile } from "./types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function upsertProfile(p: Partial<Profile> & { user_id: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(p, { onConflict: "user_id" })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Profile;
}
