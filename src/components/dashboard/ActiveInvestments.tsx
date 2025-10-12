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
    // Initialize display state when properties change from context
    setDisplayInvestments(properties.filter(p => p.invested > 0));
  }, [properties]);
  
  useEffect(() => {
    const activeProps = properties.filter(p => p.invested > 0);
    if (activeProps.length === 0) return;

    // This interval is for visual animation only. It doesn't affect the actual context state.
    const visualInterval = setInterval(() => {
      setDisplayInvestments(prevDisplay => {
        return prevDisplay.map(prop => {
          // Calculate gain based on the *initial* investment, not the dynamic `invested` value.
          const gainPerSecond = (prop.initialInvestment * prop.dailyReturn) / (24 * 60 * 60);
          return { ...prop, invested: prop.invested + gainPerSecond };
        });
      });
    }, 1000);
    
    // This interval updates the "real" invested amount in the AppContext less frequently.
    const stateUpdateInterval = setInterval(() => {
        setProperties(currentProperties => 
            currentProperties.map(prop => {
                if (prop.invested > 0 && prop.initialInvestment > 0) {
                    // Calculate gain based on the *initial* investment.
                    const gainPerTenSeconds = (prop.initialInvestment * prop.dailyReturn) / (24 * 60 * 6);
                    return {...prop, invested: prop.invested + gainPerTenSeconds}
                }
                return prop;
            })
        )
    }, 10000);

    return () => {
      clearInterval(visualInterval);
      clearInterval(stateUpdateInterval);
    }
    // We depend on the number of invested properties and their initial investment values.
  }, [properties.filter(p => p.invested > 0).map(p => p.id).join(','), setProperties]);


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
