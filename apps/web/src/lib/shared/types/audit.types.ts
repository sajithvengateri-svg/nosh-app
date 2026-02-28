// TODO: Implement Audit types
export interface AuditScore {
  module: AuditModule;
  score: number;
  maxScore: number;
  percentage: number;
  risks: RiskItem[];
  recommendations: Recommendation[];
  calculatedAt: Date;
}

export type AuditModule = 'menu' | 'labour' | 'sales' | 'overhead' | 'hr' | 'marketing' | 'beverage';

export interface RiskItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}
