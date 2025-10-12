'use client';
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Property } from "@/lib/types";

export function ActiveInvestments() {
  const { properties, setProperties } = useApp();
  const activeInvestments = properties.filter(p => p.invested > 0);
  
  const [displayInvestments, setDisplayInvestments] = useState(activeInvestments);

  useEffect(() => {
    setDisplayInvestments(activeInvestments);
  }, [properties]);
  
  useEffect(() => {
    if (activeInvestments.length === 0) return;

    const interval = setInterval(() => {
      // This is purely for visual effect on the frontend
      setDisplayInvestments(prevDisplay => {
        return prevDisplay.map(prop => {
          const gainPerSecond = (prop.invested * prop.dailyReturn) / (24 * 60 * 60);
          return { ...prop, invested: prop.invested + gainPerSecond };
        });
      });
      
      // This updates the actual state in context less frequently (e.g., every 10s)
      // In a real app, this logic would live on a server.
    }, 1000);
    
    // In a real application, you would not update the core state this frequently.
    // The "real" update could be done via a less frequent interval or server-side process.
    const stateUpdateInterval = setInterval(() => {
        setProperties(currentProperties => 
            currentProperties.map(prop => {
                if (prop.invested > 0) {
                    const gainPerTenSeconds = (prop.invested * prop.dailyReturn) / (24 * 60 * 6);
                    return {...prop, invested: prop.invested + gainPerTenSeconds}
                }
                return prop;
            })
        )
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(stateUpdateInterval);
    }
  }, [activeInvestments.length, setProperties]);


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
            {displayInvestments.map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                <div>
                  <h4 className="font-bold text-foreground">{property.name}</h4>
                  <p className="text-sm text-muted-foreground">{property.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary tabular-nums">
                    {property.invested.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </p>
                  <p className="text-xs text-green-600">
                    +{(property.invested * property.dailyReturn).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}/día
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
