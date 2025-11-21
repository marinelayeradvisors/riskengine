"use client"

import { useState } from 'react';
import { RiskForm } from '@/components/RiskForm';
import { RiskDashboard } from '@/components/RiskDashboard';
import { NoteStructure, RiskAnalysisResult } from '@/types';
import { calculateRiskAction } from '@/app/actions';

export default function Home() {
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: NoteStructure) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await calculateRiskAction(data);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("Failed to calculate risk. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Structured Note Risk Scorer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyze the risk of structured income notes based on real-time market volatility, correlation penalties, and issuer credit risk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <RiskForm onSubmit={handleSubmit} isLoading={isLoading} />
            {error && (
              <div className="mt-4 p-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-7">
            {result ? (
              <RiskDashboard result={result} />
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">No Analysis Generated</p>
                  <p className="text-sm">Configure the note parameters to see the risk breakdown.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
