import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────

export interface RpgAttribute {
  id: string;
  name: string;
  type: "stat" | "currency" | "pool";
  value: number;
  max_value?: number | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at?: string;
}

export interface RpgSkill {
  id: string;
  name: string;
  description?: string;
  zone: "genius" | "excellence" | "impact";
  level: number;
  max_level: number;
  xp: number;
  xp_next_level: number;
  icon: string;
  emoji: string;
  color: string;
  requires_skill_id?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface RpgDailyQuest {
  id: string;
  title: string;
  description?: string;
  time_zone: "raid" | "arena" | "santuario" | "ritual";
  xp_reward: number;
  gem_reward: number;
  is_active: boolean;
  created_at?: string;
}

export interface RpgQuestline {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "paused";
  progress: number;
  total_steps: number;
  reward_xp: number;
  icon: string;
  color: string;
  created_at?: string;
}

export interface RpgBoss {
  id: string;
  name: string;
  description?: string;
  total_hp: number;
  current_hp: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "active" | "defeated" | "paused";
  strategy?: string;
  monthly_cost: number;
  created_at?: string;
}

export interface RpgSeasonPass {
  id: string;
  season_name: string;
  level: number;
  max_level: number;
  current_xp: number;
  started_at: string;
  ends_at?: string | null;
  is_active: boolean;
}

export interface RpgSeasonReward {
  id: string;
  season_id: string;
  required_level: number;
  reward_type: string;
  reward_name: string;
  reward_value?: string;
  is_premium: boolean;
}

// ─── Attributes ────────────────────────────────────────────

export async function getAttributes(): Promise<RpgAttribute[]> {
  const { data, error } = await supabase
    .from("rpg_attributes")
    .select("*")
    .order("sort_order");
  if (error) { console.error("getAttributes:", error); return []; }
  return data || [];
}

export async function createAttribute(attr: Omit<RpgAttribute, "id" | "created_at">): Promise<RpgAttribute | null> {
  const { data, error } = await supabase
    .from("rpg_attributes")
    .insert(attr)
    .select()
    .single();
  if (error) { console.error("createAttribute:", error); return null; }
  return data;
}

export async function updateAttribute(id: string, attr: Partial<RpgAttribute>): Promise<void> {
  const { error } = await supabase.from("rpg_attributes").update(attr).eq("id", id);
  if (error) console.error("updateAttribute:", error);
}

export async function deleteAttribute(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_attributes").delete().eq("id", id);
  if (error) console.error("deleteAttribute:", error);
}

// ─── Skills ────────────────────────────────────────────────

export async function getSkills(): Promise<RpgSkill[]> {
  const { data, error } = await supabase
    .from("rpg_skills")
    .select("*")
    .order("sort_order");
  if (error) { console.error("getSkills:", error); return []; }
  return data || [];
}

export async function createSkill(skill: Omit<RpgSkill, "id" | "created_at">): Promise<RpgSkill | null> {
  const { data, error } = await supabase.from("rpg_skills").insert(skill).select().single();
  if (error) { console.error("createSkill:", error); return null; }
  return data;
}

export async function updateSkill(id: string, skill: Partial<RpgSkill>): Promise<void> {
  const { error } = await supabase.from("rpg_skills").update(skill).eq("id", id);
  if (error) console.error("updateSkill:", error);
}

export async function deleteSkill(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_skills").delete().eq("id", id);
  if (error) console.error("deleteSkill:", error);
}

// ─── Daily Quests ──────────────────────────────────────────

export async function getDailyQuests(): Promise<RpgDailyQuest[]> {
  const { data, error } = await supabase
    .from("rpg_daily_quests")
    .select("*")
    .order("time_zone")
    .order("created_at");
  if (error) { console.error("getDailyQuests:", error); return []; }
  return data || [];
}

export async function createDailyQuest(q: Omit<RpgDailyQuest, "id" | "created_at">): Promise<RpgDailyQuest | null> {
  const { data, error } = await supabase.from("rpg_daily_quests").insert(q).select().single();
  if (error) { console.error("createDailyQuest:", error); return null; }
  return data;
}

export async function updateDailyQuest(id: string, q: Partial<RpgDailyQuest>): Promise<void> {
  const { error } = await supabase.from("rpg_daily_quests").update(q).eq("id", id);
  if (error) console.error("updateDailyQuest:", error);
}

export async function deleteDailyQuest(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_daily_quests").delete().eq("id", id);
  if (error) console.error("deleteDailyQuest:", error);
}

// ─── Questlines ────────────────────────────────────────────

export async function getQuestlines(): Promise<RpgQuestline[]> {
  const { data, error } = await supabase.from("rpg_questlines").select("*").order("created_at");
  if (error) { console.error("getQuestlines:", error); return []; }
  return data || [];
}

export async function createQuestline(q: Omit<RpgQuestline, "id" | "created_at">): Promise<RpgQuestline | null> {
  const { data, error } = await supabase.from("rpg_questlines").insert(q).select().single();
  if (error) { console.error("createQuestline:", error); return null; }
  return data;
}

export async function updateQuestline(id: string, q: Partial<RpgQuestline>): Promise<void> {
  const { error } = await supabase.from("rpg_questlines").update(q).eq("id", id);
  if (error) console.error("updateQuestline:", error);
}

export async function deleteQuestline(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_questlines").delete().eq("id", id);
  if (error) console.error("deleteQuestline:", error);
}

// ─── Bosses ────────────────────────────────────────────────

export async function getBosses(): Promise<RpgBoss[]> {
  const { data, error } = await supabase.from("rpg_bosses").select("*").order("priority").order("created_at");
  if (error) { console.error("getBosses:", error); return []; }
  return data || [];
}

export async function createBoss(b: Omit<RpgBoss, "id" | "created_at">): Promise<RpgBoss | null> {
  const { data, error } = await supabase.from("rpg_bosses").insert(b).select().single();
  if (error) { console.error("createBoss:", error); return null; }
  return data;
}

export async function updateBoss(id: string, b: Partial<RpgBoss>): Promise<void> {
  const { error } = await supabase.from("rpg_bosses").update(b).eq("id", id);
  if (error) console.error("updateBoss:", error);
}

export async function deleteBoss(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_bosses").delete().eq("id", id);
  if (error) console.error("deleteBoss:", error);
}

// ─── Season Pass ───────────────────────────────────────────

export async function getActiveSeason(): Promise<RpgSeasonPass | null> {
  const { data, error } = await supabase
    .from("rpg_season_pass")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();
  if (error) { console.error("getActiveSeason:", error); return null; }
  return data;
}

export async function updateSeason(id: string, s: Partial<RpgSeasonPass>): Promise<void> {
  const { error } = await supabase.from("rpg_season_pass").update(s).eq("id", id);
  if (error) console.error("updateSeason:", error);
}

export async function createSeason(s: Omit<RpgSeasonPass, "id">): Promise<RpgSeasonPass | null> {
  const { data, error } = await supabase.from("rpg_season_pass").insert(s).select().single();
  if (error) { console.error("createSeason:", error); return null; }
  return data;
}

export async function getSeasonRewards(seasonId: string): Promise<RpgSeasonReward[]> {
  const { data, error } = await supabase
    .from("rpg_season_rewards")
    .select("*")
    .eq("season_id", seasonId)
    .order("required_level");
  if (error) { console.error("getSeasonRewards:", error); return []; }
  return data || [];
}

export async function createSeasonReward(r: Omit<RpgSeasonReward, "id">): Promise<RpgSeasonReward | null> {
  const { data, error } = await supabase.from("rpg_season_rewards").insert(r).select().single();
  if (error) { console.error("createSeasonReward:", error); return null; }
  return data;
}

export async function deleteSeasonReward(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_season_rewards").delete().eq("id", id);
  if (error) console.error("deleteSeasonReward:", error);
}

// ─── Loot Items ────────────────────────────────────────────────

export interface RpgLootItem {
  id: string;
  name: string;
  description?: string;
  currency: "REAL" | "GEMS" | "SEEDS" | "XP";
  cost: number;
  requirement?: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  category: "work" | "castle" | "personal" | "dopamine" | "utility";
  icon: string;
  unlocked: boolean;
  sort_order: number;
  created_at?: string;
}

export async function getLootItems(): Promise<RpgLootItem[]> {
  const { data, error } = await supabase
    .from("rpg_loot_items")
    .select("*")
    .order("sort_order");
  if (error) { console.error("getLootItems:", error); return []; }
  return data || [];
}

export async function updateLootItem(id: string, item: Partial<RpgLootItem>): Promise<void> {
  const { error } = await supabase.from("rpg_loot_items").update(item).eq("id", id);
  if (error) console.error("updateLootItem:", error);
}

export async function createLootItem(item: Omit<RpgLootItem, "id" | "created_at">): Promise<RpgLootItem | null> {
  const { data, error } = await supabase.from("rpg_loot_items").insert(item).select().single();
  if (error) { console.error("createLootItem:", error); return null; }
  return data;
}

export async function deleteLootItem(id: string): Promise<void> {
  const { error } = await supabase.from("rpg_loot_items").delete().eq("id", id);
  if (error) console.error("deleteLootItem:", error);
}
