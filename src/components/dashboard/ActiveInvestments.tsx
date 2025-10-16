'use client';
import { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { Property, Investment } from "@/lib/types";

interface DisplayInvestment extends Investment {
    name: string;
    location: string;
    dailyReturn: number;
    currentValue: number; // Ensure currentValue is always a number
}

const calculateCurrentValue = (investment: Investment, property: Property | undefined): number => {
    if (!property || property.dailyReturn <= 0) {
      return investment.investedAmount;
    }
    const investmentDate = new Date(investment.investmentDate);
    const now = new Date();
    const secondsElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / 1000);

    if (secondsElapsed > 0) {
      const gainPerSecond = (investment.investedAmount * property.dailyReturn) / 86400;
      const totalGains = gainPerSecond * secondsElapsed;
      return investment.investedAmount + totalGains;
    }
    return investment.investedAmount;
};

export function ActiveInvestments() {
  const { properties, investments: rawInvestments } = usePortfolio();
  const [displayInvestments, setDisplayInvestments] = useState<DisplayInvestment[]>([]);

  // Memoize the initial mapping of raw investments to include property data.
  const investmentsWithProps = useMemo(() => {
    return (rawInvestments || [])
      .map(investment => {
        const property = properties.find(p => p.id === investment.propertyId);
        return {
          ...investment,
          name: property?.name ?? 'Propiedad Desconocida',
          location: property?.location ?? '',
          dailyReturn: property?.dailyReturn ?? 0,
          currentValue: calculateCurrentValue(investment, property)
        };
      })
      .sort((a,b) => b.currentValue - a.currentValue);
  }, [rawInvestments, properties]);


  useEffect(() => {
    // Set initial state
    setDisplayInvestments(investmentsWithProps);

    // Set up an interval to update the current value every second
    const interval = setInterval(() => {
      setDisplayInvestments(prevInvestments =>
        prevInvestments.map(inv => {
          const property = properties.find(p => p.id === inv.propertyId);
          return {
            ...inv,
            currentValue: calculateCurrentValue(inv, property),
          };
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(interval); // Clean up on component unmount
  }, [investmentsWithProps, properties]);

  const activeInvestments = displayInvestments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inversiones Activas</CardTitle>
        <CardDescription>{activeInvestments.length} {activeInvestments.length === 1 ? 'propiedad' : 'propiedades'} en tu portafolio</CardDescription>
      </CardHeader>
      <CardContent>
        {activeInvestments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No tienes inversiones activas aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeInvestments.map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                <div>
                  <h4 className="font-bold text-foreground">{investment.name}</h4>
                  <p className="text-sm text-muted-foreground">{investment.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary tabular-nums">
                    {(investment.currentValue).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </p>
                  <p className="text-xs text-green-600">
                    +{(investment.investedAmount * (investment.dailyReturn || 0)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}/día
                    <span className="font-bold"> ({(investment.dailyReturn * 100).toFixed(2)}%)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
