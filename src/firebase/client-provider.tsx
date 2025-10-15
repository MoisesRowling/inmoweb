'use client';
import React, { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the root of your application.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseInstance = initializeFirebase();

  return (
    <FirebaseProvider value={firebaseInstance}>
        {children}
    </FirebaseProvider>
  );
}
