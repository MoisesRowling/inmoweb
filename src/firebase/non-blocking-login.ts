'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

type AuthCallback = (userCredential: UserCredential) => void;
type AuthErrorCallback = (error: any) => void;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance)
    .catch((error) => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: 'anonymous-signin', // Placeholder path
                operation: 'write',
                requestResourceData: { action: 'anonymous-signin' }
            })
        )
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
    authInstance: Auth, 
    email: string, 
    password: string,
    onSuccess?: AuthCallback,
    onError?: AuthErrorCallback,
): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
        if (onSuccess) onSuccess(userCredential);
    })
    .catch((error) => {
        if(onError) {
            onError(error);
        } else {
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: 'email-signup', // Placeholder path
                    operation: 'write',
                    requestResourceData: { email }
                })
            )
        }
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
    authInstance: Auth, 
    email: string, 
    password: string,
    onSuccess?: AuthCallback,
    onError?: AuthErrorCallback
): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
        if (onSuccess) onSuccess(userCredential);
    })
    .catch((error) => {
        // If an onError callback is provided, use it.
        // This is for handling standard auth errors like wrong password.
        if (onError) {
            onError(error);
        } else {
            // Otherwise, assume it's a permissions issue and emit a contextual error.
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: 'email-signin', // Placeholder path for sign-in operation
                    operation: 'write', // Sign-in is conceptually a 'write' to the auth system
                    requestResourceData: { email }
                })
            )
        }
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
