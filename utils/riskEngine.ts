import { mean } from 'simple-statistics';

// --- 1. PROBABILITY MATH (Black-Scholes Logic) ---

export function calculateProbabilityOfBreach(
  currentPrice: number,
  barrierLevel: number, 
  volatility: number,   
  yearsToMaturity: number
): number {
  if (yearsToMaturity <= 0) return 0;

  const r = 0.045; // Risk free rate assumption
  const numerator = Math.log(currentPrice / barrierLevel) + (r - 0.5 * Math.pow(volatility, 2)) * yearsToMaturity;
  const denominator = volatility * Math.sqrt(yearsToMaturity);
  const d2 = numerator / denominator;

  return normalCDF(-d2);
}

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228040 * Math.exp(-x * x / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  return x > 0 ? 1 - p : p;
}

// --- 2. MULTI-ASSET CORRELATION LOGIC ---

export function calculateWorstOfMultiplier(correlations: number[]): number {
  if (correlations.length === 0) return 1.0; 

  const avgCorr = mean(correlations);

  // Lower correlation = Higher Risk (assets move independently)
  return 1 + (1 - avgCorr) * 0.5;
}

// --- 3. MASTER SCORING FUNCTION ---

interface ScoringParams {
  creditRating: string;
  yearsToMaturity: number;
  protectionType: 'Hard Buffer' | 'Soft Barrier';
  assetProbs: number[]; 
  correlations: number[];
  noCallPeriod?: number; 
}

export function calculateFinalRiskScore(params: ScoringParams): number {
  // A. Market Risk (90%)
  let maxProb = Math.max(...params.assetProbs);

  const corrMultiplier = calculateWorstOfMultiplier(params.correlations);

  let marketRiskRaw = (maxProb * 100) * corrMultiplier;

  // Autocall risk adjustment:
  // If there is a No Call Period, the investor is "locked in" for that time.
  // A shorter non-call period (e.g. 3 months) is generally SAFER for principal protection 
  // because it increases the chances of being called away early if the market rallies, 
  // avoiding long-term exposure to a potential downturn.
  // Long no-call periods (e.g. 12+ months) force you to hold the risk longer.
  
  if (params.noCallPeriod !== undefined) {
    // Heuristic: 
    // - If No Call < 6 months: Slight risk reduction (0.95x) - better chance of early exit.
    // - If No Call > 12 months: Slight risk increase (1.05x) - stuck in the trade longer.
    if (params.noCallPeriod < 6) {
      marketRiskRaw *= 0.95;
    } else if (params.noCallPeriod >= 12) {
      marketRiskRaw *= 1.05;
    }
  }
  
  if (params.protectionType === 'Hard Buffer') {
    marketRiskRaw = marketRiskRaw * 0.7; 
  }

  const marketRiskScore = Math.min(marketRiskRaw, 100);

  // B. Credit Risk (10%)
  const creditMap: Record<string, number> = {
    'AAA': 0, 'AA+': 10, 'AA': 20, 'AA-': 30,
    'A+': 40, 'A': 50, 'A-': 60,
    'BBB+': 70, 'BBB': 80, 'BBB-': 90,
    'BB': 100
  };

  const creditRiskScore = creditMap[params.creditRating] || 50;

  return Math.round((marketRiskScore * 0.90) + (creditRiskScore * 0.10));
}

