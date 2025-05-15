import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function uploadArticleImage(articleId: string, file: File): Promise<string> {
  const filePath = `${articleId}/${file.name}`;
  const { error } = await supabase.storage.from("images").upload(filePath, file, {
    upsert: true,
  });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
