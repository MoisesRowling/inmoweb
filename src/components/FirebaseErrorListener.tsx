'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';

/**
 * A client component that listens for Firestore permission errors
 * and surfaces them in the Next.js dev overlay.
 */
export function FirebaseErrorListener() {
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Add user auth state to the error context
      const fullErrorContext = {
        auth: user
          ? {
              uid: user.uid,
              email: user.email,
              // Add other relevant user properties if needed
            }
          : null,
        ...error.context,
      };

      const errorMessage = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
        fullErrorContext,
        null,
        2
      )}`;

      // Throwing the error will display it in the Next.js dev overlay
      // which is ideal for development.
      if (process.env.NODE_ENV === 'development') {
        throw new Error(errorMessage);
      } else {
        // In production, just show a generic toast.
        toast({
            title: 'Error de Permiso',
            description: 'No tienes permiso para realizar esta acción.',
            variant: 'destructive',
        })
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [user, toast]);

  return null; // This component does not render anything
}
