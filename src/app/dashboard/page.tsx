'use client';
import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, Activity, Building2 } from "lucide-react";
import { ActiveInvestments } from "@/components/dashboard/ActiveInvestments";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PortfolioSuggestion } from "@/components/ai/PortfolioSuggestion";

export default function DashboardPage() {
  const { user, balance, properties, investments, setModals } = useApp();
  
  if (!user) {
    // AppShell handles the main loading state, so we just show a skeleton here 
    // for the brief moment before user data is available after auth is confirmed.
    return (
        <AppShell>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    </div>
                </div>
            </div>
      </AppShell>
    );
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalProperties = [...new Set(investments.map(inv => inv.propertyId))].length;

  const dailyGain = investments.reduce((sum, inv) => {
    const property = properties.find(p => p.id === inv.propertyId);
    if (!property) return sum;
    const dailyReturn = typeof property.dailyReturn === 'number' ? property.dailyReturn : 0;
    return sum + (inv.investedAmount * dailyReturn);
  }, 0);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-headline">Bienvenido, {user.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground mt-1">Aquí está el resumen de tu portafolio de inversiones.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ID de Usuario</p>
            <p className="text-sm font-mono font-semibold text-primary">{user.publicId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Saldo Total"
            value={balance}
            isCurrency
            description="Disponible para invertir"
            icon={DollarSign}
            color="primary"
          />
          <StatCard
            title="Total Invertido"
            value={totalInvested}
            isCurrency
            description={`+${dailyGain.toLocaleString('es-MX', {style:'currency', currency: 'MXN'})} / día`}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Propiedades"
            value={totalProperties}
            description="En tu portafolio"
            icon={Building2}
            color="accent"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveInvestments />
          </div>
          <div className="lg:col-span-1 row-start-1 lg:row-start-auto space-y-6">
            <TransactionHistory />
          </div>
        </div>

        <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground font-headline">Propiedades para Invertir</h2>
              <p className="text-muted-foreground mt-1">Explora oportunidades exclusivas para hacer crecer tu dinero.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
        </div>

      </div>
    </AppShell>
  );
}
