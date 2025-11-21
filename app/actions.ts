'use server'

import yahooFinance from 'yahoo-finance2';
import { mean, sampleCorrelation, standardDeviation } from 'simple-statistics';
import { NoteStructure, RiskAnalysisResult } from '@/types';
import { calculateFinalRiskScore, calculateProbabilityOfBreach } from '@/utils/riskEngine';

export async function calculateRiskAction(data: NoteStructure): Promise<RiskAnalysisResult> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1); // 1 year history

    // Fetch historical data for all assets
    // Note: using period1 as number/string often more reliable in some yahoo-finance2 versions, 
    // but dates are usually fine. However, let's ensure we're getting data.
    // We suppress the log if a ticker fails to give us a cleaner error.
    
    const historyPromises = data.assets.map(async (ticker) => {
      try {
        // Ensure dates are valid objects for yahoo-finance2 types or strict mode
        const result = await yahooFinance.historical(ticker, {
          period1: startDate.toISOString().split('T')[0], // Send YYYY-MM-DD string
          period2: endDate.toISOString().split('T')[0],
          interval: '1d'
        });
        if (!result || result.length === 0) {
          console.warn(`No data returned for ${ticker}`);
          throw new Error(`No data for ${ticker}`);
        }
        return { ticker, data: result };
      } catch (e) {
         console.warn(`Yahoo Finance fetch failed for ${ticker}:`, e);
         throw e;
      }
    });

    const histories = await Promise.all(historyPromises);

    // Process data: Calculate Returns
    const assetReturns: Record<string, number[]> = {};
    const currentPrices: Record<string, number> = {};

    histories.forEach(({ ticker, data }) => {
      if (!data || data.length < 2) throw new Error(`Insufficient data for ${ticker}`);
      
      // Sort by date ascending just in case
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const closes = data.map(d => d.close);
      currentPrices[ticker] = closes[closes.length - 1];

      // Daily log returns
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        returns.push(Math.log(closes[i] / closes[i - 1]));
      }
      assetReturns[ticker] = returns;
    });

    // Calculate Volatility (Annualized) & Probabilities
    const probabilities = data.assets.map(ticker => {
      const returns = assetReturns[ticker];
      const dailyVol = standardDeviation(returns);
      const annualVol = dailyVol * Math.sqrt(252);
      
      const currentPrice = currentPrices[ticker];
      // Protection Level is % of initial, assume initial is current for new notes or handle relative
      // Prompt says "Protection Level: number // e.g. 75 (25% protection)"
      // Usually this is relative to Strike Price. Assuming Strike = Current Price for this modeling tool unless specified.
      // If it's a new note, Strike is usually "now".
      const barrierPrice = currentPrice * (data.protectionLevel / 100);

      const yearsToMaturity = data.maturityMonths / 12;

      const prob = calculateProbabilityOfBreach(currentPrice, barrierPrice, annualVol, yearsToMaturity);
      
      return {
        ticker,
        probBreach: prob * 100, // Convert to %
        volatility: annualVol
      };
    });

    // Calculate Correlations
    // We need aligned dates for correlation, but assuming yahoo returns roughly same trading days.
    // We'll truncate to min length to be safe.
    const minLength = Math.min(...Object.values(assetReturns).map(r => r.length));
    
    const correlations: number[] = [];
    const tickers = data.assets;

    if (tickers.length > 1) {
      for (let i = 0; i < tickers.length; i++) {
        for (let j = i + 1; j < tickers.length; j++) {
          const returns1 = assetReturns[tickers[i]].slice(-minLength);
          const returns2 = assetReturns[tickers[j]].slice(-minLength);
          const corr = sampleCorrelation(returns1, returns2);
          correlations.push(corr);
        }
      }
    } else {
      correlations.push(1.0); // Single asset is 100% correlated with itself (or effectively no worst-of penalty logic needed beyond 1)
    }

    // Calculate Final Score
    const assetProbs = probabilities.map(p => p.probBreach / 100); // Back to 0-1 for internal logic if needed, but logic takes 0-1 or %?
    // riskEngine logic: let maxProb = Math.max(...params.assetProbs); let marketRiskRaw = (maxProb * 100) ...
    // So assetProbs passed to it should be 0-1, because it multiplies by 100 inside.
    
    const score = calculateFinalRiskScore({
      creditRating: data.creditRating,
      yearsToMaturity: data.maturityMonths / 12,
      protectionType: data.protectionType,
      assetProbs: assetProbs,
      correlations: correlations,
      noCallPeriod: data.noCallPeriod
    });

    // Prepare result
    // Calculate penalty factor for display
    // logic: return 1 + (1 - avgCorr) * 0.5;
    const avgCorr = correlations.length > 0 ? mean(correlations) : 1;
    const penalty = 1 + (1 - avgCorr) * 0.5;

    return {
      score,
      probabilities: probabilities.map(p => ({ ticker: p.ticker, probBreach: p.probBreach })),
      correlationPenalty: penalty,
      details: `Based on ${data.assets.join(', ')} with ${data.protectionType} at ${data.protectionLevel}%`
    };

  } catch (error) {
    console.error("Error calculating risk:", error);
    throw new Error("Failed to calculate risk score. Please check ticker symbols and try again.");
  }
}

