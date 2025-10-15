'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { useSWRConfig } from 'swr';


export function useDoc<T extends DocumentData>(ref: DocumentReference<T> | null) {
  const { mutate } = useSWRConfig();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docPath = ref?.path;

  useEffect(() => {
    if (!docPath) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(
      // The ref object identity can change on re-renders, so we can't use it in the dependency array.
      // We can use the path string instead.
      ref!,
      (doc) => {
        if (doc.exists()) {
          const docData = { uid: doc.id, ...doc.data() } as T;
          setData(docData);
          mutate(docPath, docData, false); // Update SWR cache
        } else {
          setData(null);
          mutate(docPath, null, false);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error(`Error in useDoc for path: ${docPath}`, err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docPath, mutate, ref]);

  return { data, isLoading, error, mutate: (newData: any) => mutate(docPath, newData, false) };
}
