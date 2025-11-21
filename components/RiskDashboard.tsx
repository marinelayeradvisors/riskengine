"use client"

import React from 'react';
import { RiskAnalysisResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface RiskDashboardProps {
  result: RiskAnalysisResult | null;
}

const SCORE_COLORS = [
  { max: 20, color: '#22c55e' }, // Low Risk
  { max: 40, color: '#84cc16' }, 
  { max: 60, color: '#eab308' }, 
  { max: 80, color: '#f97316' }, 
  { max: 100, color: '#ef4444' }, // High Risk
];

const getScoreColor = (score: number) => {
  const found = SCORE_COLORS.find(c => score <= c.max);
  return found ? found.color : '#ef4444';
};

export function RiskDashboard({ result }: RiskDashboardProps) {
  if (!result) return null;

  const gaugeData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score }
  ];

  const scoreColor = getScoreColor(result.score);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Score Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Risk Score</CardTitle>
            <CardDescription>0 (Safe) - 100 (High Risk)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-0">
            <div className="relative w-48 h-24 mt-4">
               {/* Semi-circle gauge simulation */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={scoreColor} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 w-full text-center">
                <span className="text-4xl font-bold" style={{ color: scoreColor }}>{result.score}</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {result.details}
            </p>
          </CardContent>
        </Card>

        {/* Metrics Card */}
        <Card className="md:col-span-2">
           <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
            <CardDescription>Key drivers of the calculated risk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Correlation Penalty</span>
                <span className="text-sm font-medium">x{result.correlationPenalty.toFixed(2)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(result.correlationPenalty - 1) * 100}%` }} // Visual approximation
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Higher penalty indicates assets are less correlated, increasing "Worst-Of" risk.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Probabilities Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Probability of Breach by Asset</CardTitle>
          <CardDescription>Likelihood of each asset falling below the protection barrier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.probabilities}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ticker" />
                <YAxis unit="%" />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Prob. Breach']}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="probBreach" radius={[4, 4, 0, 0]}>
                   {result.probabilities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.probBreach > 50 ? '#ef4444' : '#3b82f6'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

