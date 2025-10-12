'use client';
import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, Activity, Building2, CalendarDays } from "lucide-react";
import { ActiveInvestments } from "@/components/dashboard/ActiveInvestments";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/PropertyCard";

export default function DashboardPage() {
  const { user, balance, properties, firstInvestmentDate, setModals } = useApp();
  const [daysSinceInvestment, setDaysSinceInvestment] = useState(0);

  const totalInvested = properties.reduce((sum, prop) => sum + prop.initialInvestment, 0);
  const gananciaDiaria = properties.reduce((sum, prop) => sum + (prop.initialInvestment * prop.dailyReturn), 0);
  const totalProperties = properties.filter(prop => prop.ownedShares > 0).length;
  

  useEffect(() => {
    const getDaysSinceInvestment = () => {
      // Ensure this only runs on the client and firstInvestmentDate is valid
      if (!firstInvestmentDate || typeof window === 'undefined') {
        return 0;
      }
      
      const start = new Date(firstInvestmentDate);
      
      // If the date is invalid (e.g., from an empty or cleared localStorage), return 0
      if (isNaN(start.getTime())) {
        return 0;
      }
  
      const now = new Date();
      // Reset time to start of day for accurate day counting
      now.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      
      const diffTime = now.getTime() - start.getTime();
      // Use Math.floor to count full days passed
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 ? diffDays : 0;
    };
    
    setDaysSinceInvestment(getDaysSinceInvestment());
  }, [firstInvestmentDate]);
  
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
            <p className="text-sm font-mono font-semibold text-primary">{user.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            description={`+${gananciaDiaria.toLocaleString('es-MX', {style:'currency', currency: 'MXN'})} / día`}
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
           <StatCard
            title="Días de Inversión"
            value={daysSinceInvestment}
            description={"Retiros habilitados"}
            icon={CalendarDays}
            color="orange"
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
             <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground font-headline">Invierte en Propiedades</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map(p => <PropertyCard key={p.id} property={p} isGuest={false} />)}
                </div>
             </div>
          </div>
          <div className="lg:col-span-1">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
