'use client';
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { Property, Investment } from "@/lib/types";

interface DisplayInvestment extends Investment {
    name: string;
    location: string;
    dailyReturn: number;
}

export function ActiveInvestments() {
  const { properties, investments } = useApp();
  
  const activeInvestments: DisplayInvestment[] = investments.map(investment => {
    const property = properties.find(p => p.id === investment.propertyId);
    return {
        ...investment,
        name: property?.name ?? 'Propiedad Desconocida',
        location: property?.location ?? '',
        dailyReturn: property?.dailyReturn ?? 0
    };
  }).sort((a,b) => (b.currentValue ?? b.investedAmount) - (a.currentValue ?? a.investedAmount));


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
                    {(investment.currentValue ?? investment.investedAmount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </p>
                  <p className="text-xs text-green-600">
                    +{(investment.investedAmount * (investment.dailyReturn || 0)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}/día
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
