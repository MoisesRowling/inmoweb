'use client';

import { usePortfolio } from '@/hooks/usePortfolio';
import { Skeleton } from '../ui/skeleton';

export function UserBalance() {
  const { availableBalance, isLoading } = usePortfolio();

  if (isLoading) {
    return <Skeleton className="h-6 w-28" />;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Saldo:</span>
      <span className="font-semibold">
        {availableBalance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
      </span>
    </div>
  );
}
