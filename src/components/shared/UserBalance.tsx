'use client';

import { useApp } from '@/context/AppContext';

export function UserBalance() {
  const { balance } = useApp();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Saldo:</span>
      <span className="font-semibold">
        {balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
      </span>
    </div>
  );
}
