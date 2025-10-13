'use client';
import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, Activity, Building2 } from "lucide-react";
import { ActiveInvestments } from "@/components/dashboard/ActiveInvestments";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PortfolioSuggestion } from "@/components/ai/PortfolioSuggestion";

export default function DashboardPage() {
  const { user, balance, properties, investments, setModals } = useApp();
  
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalProperties = [...new Set(investments.map(inv => inv.propertyId))].length;

  const dailyGain = investments.reduce((sum, inv) => {
    const property = properties.find(p => p.id === inv.propertyId);
    if (!property) return sum;
    return sum + (inv.investedAmount * property.dailyReturn);
  }, 0);

  if (!user) {
    return null; // AppShell handles redirection
  }
  
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
             {totalInvested === 0 ? (
              <div className="bg-card rounded-xl p-12 text-center shadow-sm border">
                <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2 font-headline">Comienza a Invertir</h4>
                <p className="text-muted-foreground mb-6">Deposita fondos para acceder a propiedades exclusivas.</p>
                <Button onClick={() => setModals(prev => ({...prev, deposit: true}))}>
                  Realizar Primer Depósito
                </Button>
              </div>
            ) : (
                <ActiveInvestments />
            )}
             <PortfolioSuggestion />
          </div>
          <div className="lg:col-span-1">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
