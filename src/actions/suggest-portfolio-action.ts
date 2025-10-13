'use server';

import { suggestPortfolio } from '@/ai/flows/suggest-portfolio';
import type { SuggestPortfolioInput, SuggestPortfolioOutput } from '@/ai/flows/suggest-portfolio';
import type { Property } from '@/lib/types';
import { propertiesData } from '@/lib/data';

// Since Firebase is removed, we'll use local mock data.
async function getProperties(): Promise<Property[]> {
  return propertiesData as Property[];
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
