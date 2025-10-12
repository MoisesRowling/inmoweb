'use server';

import { suggestPortfolio } from '@/ai/flows/suggest-portfolio';
import type { SuggestPortfolioInput, SuggestPortfolioOutput } from '@/ai/flows/suggest-portfolio';

export async function getPortfolioSuggestion(
  input: SuggestPortfolioInput
): Promise<SuggestPortfolioOutput | { error: string }> {
  try {
    if (input.currentBalance <= 0) {
        return { error: 'El balance debe ser mayor a cero para recibir una sugerencia.'};
    }
    const result = await suggestPortfolio(input);
    return result;
  } catch (error) {
    console.error("Error getting portfolio suggestion:", error);
    return { error: 'Ocurrió un error al generar la sugerencia. Intenta de nuevo.' };
  }
}
