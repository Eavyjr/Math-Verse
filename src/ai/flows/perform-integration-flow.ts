
'use server';
/**
 * @fileOverview Performs integration operations using an AI model.
 *
 * - performIntegration - A function that handles definite and indefinite integrals.
 * - IntegrationInput - The input type for the performIntegration function.
 * - IntegrationOutput - The return type for the performIntegration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntegrationInputSchema = z.object({
  functionString: z.string().describe('The function to integrate (e.g., "x^2", "sin(x)").'),
  variable: z.string().default('x').describe('The variable of integration (e.g., "x", "t").'),
  isDefinite: z.boolean().default(false).describe('Whether the integral is definite or indefinite.'),
  lowerBound: z.string().optional().describe('The lower bound for a definite integral (e.g., "0", "a").'),
  upperBound: z.string().optional().describe('The upper bound for a definite integral (e.g., "1", "b").'),
});
export type IntegrationInput = z.infer<typeof IntegrationInputSchema>;

const IntegrationOutputSchema = z.object({
  integralResult: z
    .string()
    .describe(
      'The result of the integration. This should be purely the mathematical expression or value, suitable for LaTeX rendering. For indefinite integrals, include "+ C".'
    ),
  steps: z.string().optional().describe("A step-by-step explanation of how the result was obtained. This should be formatted as readable text. Avoid complex LaTeX in steps; use simple math notation if necessary (e.g., x^2, not \\(x^2\\))."),
  originalQuery: IntegrationInputSchema.describe("The original input parameters for the integration."),
  plotHint: z.string().optional().describe("A brief description of what a plot of the original function and its integral might show."),
});
export type IntegrationOutput = z.infer<typeof IntegrationOutputSchema>;

export async function performIntegration(
  input: IntegrationInput
): Promise<IntegrationOutput> {
  return performIntegrationFlow(input);
}

const systemPrompt = `You are an expert calculus assistant specialized in performing integrations.
Given a function, a variable of integration, and optionally bounds for a definite integral, calculate the integral.

- The 'integralResult' field in your output MUST contain ONLY the resulting mathematical expression or value. This 'integralResult' should be directly usable for LaTeX rendering (e.g., "x^3/3 + C" or "1/2"). Do not include any explanations, apologies, or conversational text in the 'integralResult' field.
- For indefinite integrals (when isDefinite is false), ALWAYS add "+ C" to the result.
- For definite integrals (when isDefinite is true), evaluate the integral from the lowerBound to the upperBound.
- If possible and applicable, provide a step-by-step explanation of how you arrived at the result in the 'steps' field. Format these steps clearly for readability.
- Provide a brief 'plotHint' describing what a visualization of the function and its integral might look like (e.g., "A parabola and its cubic antiderivative"). This is for a textual description, not for generating an actual plot.

Handle the input function and variable carefully.
The 'originalQuery' field in the output should be an echo of the input you received.
`;

const integrationPrompt = ai.definePrompt({
  name: 'integrationPrompt',
  input: {schema: IntegrationInputSchema},
  output: {schema: IntegrationOutputSchema},
  system: systemPrompt,
  prompt: `Function: {{{functionString}}}
Variable of Integration: {{{variable}}}
Is Definite: {{{isDefinite}}}
{{#if isDefinite}}
Lower Bound: {{{lowerBound}}}
Upper Bound: {{{upperBound}}}
{{/if}}

Perform the integration based on these details. Provide the result, steps (if applicable), and a plot hint.
Ensure 'originalQuery' in your output accurately reflects these input parameters.`,
  config: {
    temperature: 0.1, // Lower temperature for more deterministic math results
    safetySettings: [ // Adjusted safety settings for potentially complex math terms
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
});

const performIntegrationFlow = ai.defineFlow(
  {
    name: 'performIntegrationFlow',
    inputSchema: IntegrationInputSchema,
    outputSchema: IntegrationOutputSchema,
  },
  async (input) => {
    const {output} = await integrationPrompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the integration operation.');
    }
    // Ensure originalQuery is part of the output, as requested in the prompt schema
    return {
        ...output,
        originalQuery: input 
    };
  }
);
