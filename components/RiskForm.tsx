"use client"

import React, { useState } from 'react';
import { AssetTicker, CreditRating, NoteStructure } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RiskFormProps {
  onSubmit: (data: NoteStructure) => void;
  isLoading: boolean;
}

const ASSETS: AssetTicker[] = ['SPY', 'QQQ', 'IWM', 'DIA', 'GLD', 'TLT', 'EFA', 'FEZ', 'XLF', 'XLE'];
const RATINGS: CreditRating[] = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'];

export function RiskForm({ onSubmit, isLoading }: RiskFormProps) {
  const [formData, setFormData] = useState<Partial<NoteStructure>>({
    issuer: 'Example Bank',
    creditRating: 'A',
    name: 'Structured Note 1',
    maturityMonths: 12,
    callFeature: 'Autocallable',
    protectionType: 'Soft Barrier',
    protectionLevel: 75,
    coupon: 8.5,
    assets: ['SPY', 'QQQ']
  });

  const handleAssetToggle = (asset: AssetTicker) => {
    setFormData(prev => {
      const currentAssets = prev.assets || [];
      if (currentAssets.includes(asset)) {
        return { ...prev, assets: currentAssets.filter(a => a !== asset) };
      } else {
        // Max 3 selection limit
        if (currentAssets.length >= 3) return prev;
        return { ...prev, assets: [...currentAssets, asset] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.assets?.length) return;
    
    onSubmit(formData as NoteStructure);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Note Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditRating">Credit Rating</Label>
              <select 
                id="creditRating"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.creditRating}
                onChange={(e) => setFormData({...formData, creditRating: e.target.value as CreditRating})}
              >
                {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maturity">Maturity (Months)</Label>
              <Input 
                id="maturity" 
                type="number"
                value={formData.maturityMonths} 
                onChange={(e) => setFormData({...formData, maturityMonths: parseInt(e.target.value)})} 
                min={1}
                required
              />
            </div>
            
            <div className="space-y-2">
               <Label htmlFor="callFeature">Call Feature</Label>
               <select 
                 id="callFeature"
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                 value={formData.callFeature}
                 onChange={(e) => setFormData({...formData, callFeature: e.target.value as any})}
               >
                 <option value="Autocallable">Autocallable</option>
                 <option value="Non-Callable">Non-Callable</option>
               </select>
            </div>

            {formData.callFeature === 'Autocallable' && (
               <div className="space-y-2">
                 <Label htmlFor="noCallPeriod">No Call Period (Months)</Label>
                 <Input 
                   id="noCallPeriod"
                   type="number"
                   value={formData.noCallPeriod || 0} 
                   onChange={(e) => setFormData({...formData, noCallPeriod: parseInt(e.target.value)})}
                   min={0}
                 />
               </div>
             )}

             <div className="space-y-2">
               <Label htmlFor="protectionType">Protection Type</Label>
               <select 
                 id="protectionType"
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                 value={formData.protectionType}
                 onChange={(e) => setFormData({...formData, protectionType: e.target.value as any})}
               >
                 <option value="Soft Barrier">Soft Barrier</option>
                 <option value="Hard Buffer">Hard Buffer</option>
               </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="protectionLevel">Protection Level (%)</Label>
               <Input 
                id="protectionLevel" 
                type="number"
                value={formData.protectionLevel} 
                onChange={(e) => setFormData({...formData, protectionLevel: parseFloat(e.target.value)})} 
                placeholder="e.g. 75"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon">Annual Coupon (%)</Label>
               <Input 
                id="coupon" 
                type="number"
                value={formData.coupon} 
                onChange={(e) => setFormData({...formData, coupon: parseFloat(e.target.value)})} 
                placeholder="e.g. 8.5"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Underlying Assets (Select at least one)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {ASSETS.map(ticker => {
                const isSelected = formData.assets?.includes(ticker);
                return (
                  <div
                    key={ticker}
                    onClick={() => handleAssetToggle(ticker)}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer text-center select-none",
                      isSelected
                        ? "bg-black text-white border-black hover:bg-gray-800" // Explicit active state
                        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-100" // Explicit inactive state
                    )}
                  >
                    {ticker}
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Calculating Risk..." : "Calculate Risk Score"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

