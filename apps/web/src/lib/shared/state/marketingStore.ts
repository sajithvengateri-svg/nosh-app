import { create } from 'zustand';

interface MarketingState {
  activeTab: string;
  selectedCampaignId: string | null;
  calendarMonth: Date;
  statusFilter: string | null;
  channelFilter: string | null;
  setActiveTab: (tab: string) => void;
  setSelectedCampaignId: (id: string | null) => void;
  setCalendarMonth: (date: Date) => void;
  setStatusFilter: (status: string | null) => void;
  setChannelFilter: (channel: string | null) => void;
}

export const useMarketingStore = create<MarketingState>((set) => ({
  activeTab: 'dashboard',
  selectedCampaignId: null,
  calendarMonth: new Date(),
  statusFilter: null,
  channelFilter: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setCalendarMonth: (date) => set({ calendarMonth: date }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setChannelFilter: (channel) => set({ channelFilter: channel }),
}));
