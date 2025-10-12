'use client';
import { useState } from 'react';
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowDown, ArrowUp, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

export function TransactionHistory() {
  const { transactions } = useApp();
  const [showAll, setShowAll] = useState(false);

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  const iconMap = {
    deposit: <ArrowUp className="w-4 h-4 text-green-500" />,
    withdraw: <ArrowDown className="w-4 h-4 text-red-500" />,
    investment: <ShoppingCart className="w-4 h-4 text-primary" />,
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Transacciones</CardTitle>
            <CardDescription>Tu historial de movimientos</CardDescription>
        </div>
        {transactions.length > 5 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Ver menos' : 'Ver todo'}
            </Button>
        )}
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin transacciones recientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTransactions.map((trans) => (
              <div key={trans.id} className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full flex items-center justify-center bg-secondary">
                     {iconMap[trans.type]}
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-foreground">{trans.description}</p>
                     <p className="text-xs text-muted-foreground">{trans.timestamp}</p>
                   </div>
                </div>
                <div className={cn("text-right font-bold text-sm", {
                    'text-green-600': trans.type === 'deposit',
                    'text-red-600': trans.type === 'withdraw',
                    'text-foreground': trans.type === 'investment',
                })}>
                  {trans.type === 'withdraw' || trans.type === 'investment' ? '-' : '+'}
                  {trans.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
