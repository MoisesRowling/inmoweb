'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T extends DocumentData>(ref: DocumentReference<T> | null) {
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
    
    // The ref object identity can change on re-renders.
    // To prevent re-running the effect, we use the path string as a dependency.
    const unsubscribe = onSnapshot(
      ref!,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        // Create and emit a contextual error for permission issues
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: ref!.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error(`Error in useDoc for path: ${docPath}`, err);
        }
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docPath]);

  // Manual mutate function to allow for optimistic updates or refreshes
  const mutate = () => {
    if (!ref) return;
    setIsLoading(true);
    ref.firestore.app.INTERNAL.getToken().then(() => {
       onSnapshot(ref, (doc) => {
         if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() } as T);
          } else {
            setData(null);
          }
          setIsLoading(false);
       });
    });
  }

  return { data, isLoading, error, mutate };
}
