'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { type Investment, type Property, type Transaction } from '@/lib/types';
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

const postAction = async (action: string, payload: any, userId: string) => {
    if (!userId) throw new Error("User not authenticated");
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, userId }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to perform action: ${action}`);
    }
    return result;
};


export function usePortfolio() {
  const { user } = useApp();

  const { data, error, isLoading, mutate } = useSWR(user ? `/api/data?userId=${user.id}` : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    onSuccess: (data) => {
        // After fetching data, check investments
        if(user) {
            postAction('check_investments', {}, user.id)
                .then(() => mutate());
        }
    }
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
