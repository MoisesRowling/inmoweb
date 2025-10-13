'use server';

import { suggestPortfolio } from '@/ai/flows/suggest-portfolio';
import type { SuggestPortfolioInput, SuggestPortfolioOutput } from '@/ai/flows/suggest-portfolio';
import type { Property } from '@/lib/types';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index-server';

// Initialize server-side Firebase
const { firestore } = initializeFirebase();

async function getProperties(): Promise<Property[]> {
  const propertiesCol = collection(firestore, 'properties');
  const snapshot = await getDocs(propertiesCol);
  return snapshot.docs.map(doc => doc.data() as Property);
}

export async function getPortfolioSuggestion(
  input: Omit<SuggestPortfolioInput, 'properties'>
): Promise<SuggestPortfolioOutput | { error: string }> {
  try {
    if (input.currentBalance <= 0) {
        return { error: 'El balance debe ser mayor a cero para recibir una sugerencia.'};
    }
    
    const properties = await getProperties();
    
    const result = await suggestPortfolio({
        ...input,
        properties,
    });
    return result;
  } catch (error) {
    console.error("Error getting portfolio suggestion:", error);
    return { error: 'Ocurrió un error al generar la sugerencia. Intenta de nuevo.' };
  }
}
