import { createClient } from "@supabase/supabase-js";

// As credenciais do Supabase devem ser configuradas como variáveis de ambiente
// No Lovable: Settings > Integrations > Supabase
// Local: criar .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ────────────────────────────────────────────────

export interface DynamicAttribute {
  id: string;
  name: string; // e.g. "Ouro", "Criatividade"
  type: "currency" | "stat" | "pool";
  value: number;
  max_value?: number;
  icon: string;
  color: string;
}

export interface DynamicSkill {
  id: string;
  name: string; // e.g. "Programação"
  level: number;
  xp: number;
  xp_next_level: number;
  icon: string;
  color: string;
  linked_attributes: string[]; // IDs of attributes that this skill might affect
}

export interface GameMechanics {
  attributes: DynamicAttribute[];
  skills: DynamicSkill[];
}

export interface Profile {
  id: string;
  name: string;
  class: string;
  subclass: string;
  level: number;
  xp: number;
  xp_next_level: number;
  gold: number;
  streak_count: number;
  streak_best: number;
  season: string;
  season_day: number;
  // Deprecated fixed attributes:
  attr_energia: number;
  attr_foco: number;
  attr_forca: number;
  attr_prosperidade: number;
  attr_clareza: number;
  attr_momentum: number;
  attr_pareto: number;
  genius_zone_minutes: number;
  genius_zone_target: number;
  // Dynamic Engine:
  game_mechanics?: GameMechanics | null;
}

export interface Quest {
  id: string;
  title: string;
  block: string;
  pareto_layer: string;
  is_completed: boolean;
  xp_reward: number;
  gem_reward: number;
  quest_date: string;
  completed_at: string | null;
}

export interface Boss {
  id: string;
  name: string;
  description: string;
  total_hp: number;
  current_hp: number;
  priority: string;
  monthly_cost: number;
  status: string;
  strategy: string;
}

export interface LootItem {
  id: string;
  item_name: string;
  category: string;
  tier: number;
  cost_gold: number;
  required_level: number;
  is_unlocked: boolean;
  is_redeemed: boolean;
  unlock_requirement: string;
  estimated_cost_brl: number;
}

// ─── Helpers ──────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .limit(1)
    .single();
  if (error) {
    console.error("Erro ao buscar profile:", error);
    return null;
  }
  return data;
}

export async function getTodayQuests(): Promise<Quest[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("quests_daily")
    .select("*")
    .eq("quest_date", today)
    .order("created_at");
  if (error) {
    console.error("Erro ao buscar quests:", error);
    return [];
  }
  return data || [];
}

export async function completeQuest(questId: string): Promise<void> {
  const { error } = await supabase
    .from("quests_daily")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", questId);
  if (error) console.error("Erro ao completar quest:", error);
}

export async function getBosses(): Promise<Boss[]> {
  const { data, error } = await supabase
    .from("bosses_finance")
    .select("*")
    .neq("status", "defeated")
    .order("priority");
  if (error) {
    console.error("Erro ao buscar bosses:", error);
    return [];
  }
  return data || [];
}

export async function getLootItems(): Promise<LootItem[]> {
  const { data, error } = await supabase
    .from("loot_shop")
    .select("*")
    .order("tier");
  if (error) {
    console.error("Erro ao buscar loot:", error);
    return [];
  }
  return data || [];
}
