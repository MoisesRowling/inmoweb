'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import type { Investment, Property, Transaction } from '@/lib/types';
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


  return {
    balance: data?.balance ?? 0,
    properties: data?.properties ?? [],
    transactions: data?.transactions ?? [],
    investments: data?.investments ?? [],
    isLoading: isLoading,
    error: error,
    refreshData,
  };
}
