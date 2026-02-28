// TODO: Implement Sales types
export interface SalesData {
  date: Date;
  revenue: number;
  covers: number;
  avgSpend: number;
}

export interface DailyRevenue {
  date: Date;
  food: number;
  beverage: number;
  other: number;
  total: number;
}

export interface PeriodSummary {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalCovers: number;
  avgDailyRevenue: number;
  avgSpendPerCover: number;
}
