'use client';

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import type { Investment, Property, Transaction, WithdrawalRequest } from '@/lib/types';
import { useApp } from '@/context/AppContext';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        try {
          error.info = res.json();
        } catch (e) {
          // ignore
        }
        error.status = res.status;
        throw error;
    }
    return res.json();
});

export function usePortfolio() {
  const { user } = useApp();

  const { data, error, isLoading, mutate } = useSWR(user ? `/api/data?userId=${user.id}` : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    refreshInterval: 5000, // Re-fetch data every 5 seconds to keep it fresh
  });

  const refreshData = useCallback(() => {
    if (user) {
        mutate();
    }
  }, [user, mutate]);

  const availableBalance = useMemo(() => {
    if (!data) return 0;
    const pendingWithdrawals = (data.withdrawalRequests || []).filter((wr: WithdrawalRequest) => wr.status === 'pending');
    const pendingAmount = pendingWithdrawals.reduce((sum: number, wr: WithdrawalRequest) => sum + wr.amount, 0);
    return (data.balance || 0) - pendingAmount;
  }, [data]);


  return {
    balance: data?.balance ?? 0,
    availableBalance: availableBalance,
    properties: (data?.properties as Property[]) ?? [],
    transactions: (data?.transactions as Transaction[]) ?? [],
    investments: (data?.investments as Investment[]) ?? [],
    withdrawalRequests: (data?.withdrawalRequests as WithdrawalRequest[]) ?? [],
    isLoading: isLoading,
    error: error,
    refreshData,
  };
}
