'use client';
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Property, Investment } from "@/lib/types";

export function ActiveInvestments() {
  const { properties, investments } = useApp();
  
  const [displayInvestments, setDisplayInvestments] = useState<any[]>([]);

  useEffect(() => {
    const investmentMap = investments.reduce((acc, inv) => {
        if (!acc[inv.propertyId]) {
            acc[inv.propertyId] = 0;
        }
        acc[inv.propertyId] += inv.investedAmount;
        return acc;
    }, {} as Record<string, number>);

    const activeProps = properties
        .filter(p => investmentMap[p.id])
        .map(p => ({
            ...p,
            initialInvestment: investmentMap[p.id],
            invested: investmentMap[p.id] // Start with the initial investment
        }));

    setDisplayInvestments(activeProps);

  }, [properties, investments]);

  useEffect(() => {
    if (displayInvestments.length === 0) return;

    const interval = setInterval(() => {
        setDisplayInvestments(prev => 
            prev.map(prop => {
                const gainPerSecond = (prop.initialInvestment * prop.dailyReturn) / (24 * 60 * 60);
                return { ...prop, invested: prop.invested + gainPerSecond };
            })
        );
    }, 1000);

    return () => clearInterval(interval);
  }, [displayInvestments]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Inversiones Activas</CardTitle>
        <CardDescription>{displayInvestments.length} {displayInvestments.length === 1 ? 'propiedad' : 'propiedades'} en tu portafolio</CardDescription>
      </CardHeader>
      <CardContent>
        {displayInvestments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No tienes inversiones activas aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayInvestments.map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                <div>
                  <h4 className="font-bold text-foreground">{property.name}</h4>
                  <p className="text-sm text-muted-foreground">{property.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary tabular-nums">
                    {(property.invested || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </p>
                  <p className="text-xs text-green-600">
                    +{(property.initialInvestment * property.dailyReturn).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}/día
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
