'use client';

import { usePortfolio } from '@/hooks/usePortfolio';

export function UserBalance() {
  const { balance } = usePortfolio();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Saldo:</span>
      <span className="font-semibold">
        {balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
      </span>
    </div>
  );
}
