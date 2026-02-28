import { supabase } from '@/lib/shared/supabaseClient';
import type { Campaign, CampaignRecipient, Communication } from '../types/marketing.types';

// ==================== CAMPAIGNS ====================

export async function fetchCampaigns(orgId: string) {
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function fetchCampaign(id: string) {
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function createCampaign(campaign: Partial<Campaign> & { org_id: string; name: string }) {
  const { segment, ...rest } = campaign;
  const payload = { ...rest, segment: segment ? JSON.parse(JSON.stringify(segment)) : {} } as any;
  const { data, error } = await supabase
    .from('growth_campaigns')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  const { segment, ...rest } = updates;
  const payload = segment ? { ...rest, segment: JSON.parse(JSON.stringify(segment)) } : rest;
  const { data, error } = await supabase
    .from('growth_campaigns')
    .update(payload as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase
    .from('growth_campaigns')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== RECIPIENTS ====================

export async function fetchCampaignRecipients(campaignId: string) {
  const { data, error } = await supabase
    .from('growth_campaign_recipients')
    .select('*, res_guests(first_name, last_name, email, phone, vip_tier)')
    .eq('campaign_id', campaignId);
  if (error) throw error;
  return data;
}

export async function addCampaignRecipients(recipients: Array<{ campaign_id: string; guest_id: string }>) {
  const { data, error } = await supabase
    .from('growth_campaign_recipients')
    .insert(recipients)
    .select();
  if (error) throw error;
  return data;
}

// ==================== COMMUNICATIONS ====================

export async function fetchCommunications(orgId: string, limit = 50) {
  const { data, error } = await supabase
    .from('growth_communications')
    .select('*, res_guests(first_name, last_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ==================== CROSS-MODULE QUERIES ====================

export async function fetchLapsedGuests(orgId: string) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data, error } = await supabase
    .from('res_guests')
    .select('*')
    .eq('org_id', orgId)
    .gte('total_visits', 4)
    .lt('last_visit_date', fourWeeksAgo.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function fetchBirthdayGuests(orgId: string) {
  // Get guests with birthdays in the next 30 days
  const { data, error } = await supabase
    .from('res_guests')
    .select('*')
    .eq('org_id', orgId)
    .not('date_of_birth', 'is', null);
  if (error) throw error;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  return (data ?? []).filter((g) => {
    if (!g.date_of_birth) return false;
    const dob = new Date(g.date_of_birth);
    const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    if (thisYearBday < now) thisYearBday.setFullYear(thisYearBday.getFullYear() + 1);
    return thisYearBday <= thirtyDaysFromNow;
  });
}

export async function fetchGuestSegmentCounts(orgId: string) {
  const { data, error } = await supabase
    .from('res_guests')
    .select('vip_tier, total_visits, last_visit_date, date_of_birth, total_spend, avg_spend_per_visit')
    .eq('org_id', orgId);
  if (error) throw error;

  const guests = data ?? [];
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const counts: Record<string, number> = {
    NEW: 0, RETURNING: 0, REGULAR: 0, VIP: 0, CHAMPION: 0,
    LAPSED: 0, AT_RISK: 0, BIRTHDAY_SOON: 0, HIGH_BEV: 0, HIGH_FOOD: 0,
  };

  for (const g of guests) {
    const visits = g.total_visits ?? 0;
    const tier = g.vip_tier ?? 'NEW';

    if (visits <= 1) counts.NEW++;
    else if (visits <= 3) counts.RETURNING++;
    else counts.REGULAR++;

    if (tier === 'VIP') counts.VIP++;
    if (tier === 'CHAMPION') counts.CHAMPION++;

    if (visits >= 4 && g.last_visit_date && new Date(g.last_visit_date) < fourWeeksAgo) {
      counts.LAPSED++;
    }

    if (g.date_of_birth) {
      const dob = new Date(g.date_of_birth);
      const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (thisYearBday < now) thisYearBday.setFullYear(thisYearBday.getFullYear() + 1);
      if (thisYearBday <= thirtyDaysFromNow) counts.BIRTHDAY_SOON++;
    }
  }

  return counts;
}
