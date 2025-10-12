// use server'

/**
 * @fileOverview Investment Portfolio Suggestion Flow.
 *
 * This file defines a Genkit flow that suggests a diversified investment
 * portfolio based on the user's current balance and risk tolerance.
 *
 * - `suggestPortfolio`: The main function to generate portfolio suggestions.
 * - `SuggestPortfolioInput`: The input type for the `suggestPortfolio` function.
 * - `SuggestPortfolioOutput`: The output type for the `suggestPortfolio` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPortfolioInputSchema = z.object({
  currentBalance: z
    .number()
    .describe('The user\'s current account balance in MXN.'),
  riskTolerance: z
    .enum(['low', 'medium', 'high'])
    .describe(
      'The user\'s risk tolerance level. Can be \'low\', \'medium\', or \'high\'.' 
    ),
  properties: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      location: z.string(),
      type: z.string(),
      price: z.number(),
      minInvestment: z.number(),
      invested: z.number(),
      totalShares: z.number(),
      ownedShares: z.number(),
      image: z.string()
    })
  ).describe('Array of available properties for investment'),
});

export type SuggestPortfolioInput = z.infer<typeof SuggestPortfolioInputSchema>;

const SuggestPortfolioOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      propertyId: z.number().describe('The ID of the suggested property.'),
      investmentPercentage: z
        .number()
        .describe(
          'The recommended percentage of the current balance to invest in this property.'
        ),
      reason: z.string().describe('The reason for recommending this property.')
    })
  ).describe('An array of investment suggestions.'),
  summary: z.string().describe('A summary of the suggested portfolio strategy.')
});

export type SuggestPortfolioOutput = z.infer<typeof SuggestPortfolioOutputSchema>;

export async function suggestPortfolio(input: SuggestPortfolioInput): Promise<SuggestPortfolioOutput> {
  return suggestPortfolioFlow(input);
}

const suggestPortfolioPrompt = ai.definePrompt({
  name: 'suggestPortfolioPrompt',
  input: {schema: SuggestPortfolioInputSchema},
  output: {schema: SuggestPortfolioOutputSchema},
  prompt: `You are an expert financial advisor specializing in real estate investment.

Given the user's current balance of {{{currentBalance}}} MXN, their risk tolerance of {{{riskTolerance}}}, and the following available properties:

{{#each properties}}
- Name: {{name}}, Location: {{location}}, Type: {{type}}, Price: {{price}}, Minimum Investment: {{minInvestment}}
{{/each}}

Suggest a diversified investment portfolio.  Provide a reason for each suggested property recommendation.  Consider the minimum investment for each property.

Ensure that the investmentPercentage values add up to 100% (or close to it).
`,
});

const suggestPortfolioFlow = ai.defineFlow(
  {
    name: 'suggestPortfolioFlow',
    inputSchema: SuggestPortfolioInputSchema,
    outputSchema: SuggestPortfolioOutputSchema,
  },
  async input => {
    const {output} = await suggestPortfolioPrompt(input);
    return output!;
  }
);
