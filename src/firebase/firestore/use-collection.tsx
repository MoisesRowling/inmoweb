'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type CollectionReference, type Query, type DocumentData } from 'firebase/firestore';

export function useCollection<T extends DocumentData>(ref: CollectionReference<T> | Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryKey = ref ? (ref as Query)._query ? JSON.stringify((ref as Query)._query) : (ref as CollectionReference).path : null;


  useEffect(() => {
    if (!ref) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error in useCollection:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Manual mutate function to allow for refreshes
  const mutate = () => {
    if (!ref) return;
     setIsLoading(true);
     onSnapshot(ref, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setIsLoading(false);
     });
  }

  return { data, isLoading, error, mutate };
}
