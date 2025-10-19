'use client';
import React from "react";
import { useApp } from "@/context/AppContext";
import { usePortfolio } from "@/hooks/usePortfolio";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, Activity, Building2, Copy, Users, Gift } from "lucide-react";
import { ActiveInvestments } from "@/components/dashboard/ActiveInvestments";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthLoading } = useApp();
  const { availableBalance, properties, investments, transactions, referredUsersCount, isLoading: isPortfolioLoading } = usePortfolio();
  const { toast } = useToast();

  const totalInvested = useMemo(() => {
    if (!investments || investments.length === 0) return 0;
    return investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  }, [investments]);
  
  const referralEarnings = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions
      .filter(t => t.type === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    const url = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(url);
    toast({
        title: '¡Enlace copiado!',
        description: 'Tu enlace de referido ha sido copiado al portapapeles.'
    });
  }
  
  if (isAuthLoading || !user || isPortfolioLoading) {
    return (
      <div className="space-y-8">
          <div className="flex justify-between items-center">
              <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-72" />
              </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-[125px] w-full rounded-xl" />
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
    );
  }

  const totalProperties = [...new Set(investments.map(inv => inv.propertyId))].length;

  const dailyGain = investments.reduce((sum, inv) => {
    const property = properties.find(p => p.id === inv.propertyId);
    if (!property) return sum;
    const dailyReturn = typeof property.dailyReturn === 'number' ? property.dailyReturn : 0;
    return sum + (inv.investedAmount * dailyReturn);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">Bienvenido, {(user.name || user.email).split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Aquí está el resumen de tu portafolio de inversiones.</p>
        </div>
        <Card className="p-3 bg-card/50 w-full sm:w-auto">
             <p className="text-xs text-muted-foreground">Tu Enlace de Referido</p>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-mono font-bold text-primary">{user.referralCode}</p>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4"/>
                </Button>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Disponible"
          value={availableBalance}
          isCurrency
          description="Listo para invertir o retirar"
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
        <StatCard
          title="Ganancias por Referidos"
          value={referralEarnings}
          isCurrency
          description={`${referredUsersCount} referidos directos`}
          icon={Gift}
          color="orange"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActiveInvestments />

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground font-headline">Propiedades para Invertir</h2>
                <p className="text-muted-foreground mt-1">Explora oportunidades exclusivas para hacer crecer tu dinero.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
          </div>

        </div>
        <div className="lg:col-span-1 row-start-1 lg:row-start-auto space-y-6">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
