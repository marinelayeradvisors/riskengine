export type AssetTicker = 
  | 'SPY' | 'QQQ' | 'IWM' | 'DIA' 
  | 'GLD' | 'TLT' 
  | 'EFA' | 'FEZ' | 'XLF' | 'XLE';

export type CreditRating = 'AAA' | 'AA+' | 'AA' | 'AA-' | 'A+' | 'A' | 'A-' | 'BBB+' | 'BBB';

export interface NoteStructure {
  id: string;
  issuer?: string;
  creditRating: CreditRating;
  name?: string;
  maturityMonths: number;
  callFeature: 'Autocallable' | 'Non-Callable';
  noCallPeriod?: number;
  protectionType: 'Soft Barrier' | 'Hard Buffer';
  protectionLevel: number; // e.g. 75 (25% protection)
  coupon: number; // Annual %
  assets: AssetTicker[];
}

export interface RiskAnalysisResult {
  score: number; // 0-100
  probabilities: { ticker: string; probBreach: number }[];
  correlationPenalty: number;
  details: string; 
}
