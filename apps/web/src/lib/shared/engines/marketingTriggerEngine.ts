import type { CampaignSuggestion } from '../types/marketing.types';

interface GuestRecord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  total_visits: number | null;
  last_visit_date: string | null;
  date_of_birth: string | null;
  vip_tier: string | null;
}

export function evaluateLapsedGuests(guests: GuestRecord[]): CampaignSuggestion | null {
  if (guests.length === 0) return null;
  return {
    type: 'WIN_BACK',
    trigger_type: 'AUTO_LAPSED',
    name: `Win Back ${guests.length} Lapsed Regulars`,
    subject: 'We miss you! Your table is waiting',
    body: `Hey {{first_name}}, it's been a while since your last visit. We'd love to welcome you back — here's 15% off your next booking.`,
    channel: 'EMAIL',
    segment: { type: 'LAPSED', count: guests.length },
    reason: `${guests.length} regular guests haven't visited in 4+ weeks`,
  };
}

export function evaluateBirthdays(guests: GuestRecord[]): CampaignSuggestion | null {
  if (guests.length === 0) return null;
  return {
    type: 'BIRTHDAY',
    trigger_type: 'AUTO_BIRTHDAY',
    name: `Birthday Celebrations (${guests.length} guests)`,
    subject: 'Happy Birthday {{first_name}}! 🎂',
    body: `Happy birthday, {{first_name}}! Celebrate with us — enjoy a complimentary dessert when you book your birthday dinner.`,
    channel: 'EMAIL',
    segment: { type: 'BIRTHDAY_SOON', count: guests.length },
    reason: `${guests.length} guests have birthdays in the next 30 days`,
  };
}

export function evaluateLowDemand(dates: Array<{ date: string; predicted_covers: number; capacity: number }>): CampaignSuggestion | null {
  const lowDays = dates.filter(d => d.capacity > 0 && (d.predicted_covers / d.capacity) < 0.5);
  if (lowDays.length === 0) return null;
  const dayStr = lowDays.map(d => new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })).join(', ');
  return {
    type: 'DEMAND_FILL',
    trigger_type: 'AUTO_LOW_DEMAND',
    name: `Fill Quiet Nights: ${dayStr}`,
    subject: 'Tables free tonight — your favourite spot is waiting',
    body: `We have tables available {{day}}. Perfect for that catch-up you've been meaning to have. Book now →`,
    channel: 'MULTI',
    segment: { type: 'REGULARS_AND_LAPSED' },
    reason: `${lowDays.length} upcoming dates below 50% capacity`,
  };
}

export function generateAllSuggestions(
  lapsedGuests: GuestRecord[],
  birthdayGuests: GuestRecord[],
  lowDemandDates: Array<{ date: string; predicted_covers: number; capacity: number }> = [],
): CampaignSuggestion[] {
  const suggestions: CampaignSuggestion[] = [];
  const lapsed = evaluateLapsedGuests(lapsedGuests);
  if (lapsed) suggestions.push(lapsed);
  const bday = evaluateBirthdays(birthdayGuests);
  if (bday) suggestions.push(bday);
  const demand = evaluateLowDemand(lowDemandDates);
  if (demand) suggestions.push(demand);
  return suggestions;
}
