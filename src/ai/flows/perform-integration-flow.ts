
'use server';
/**
 * @fileOverview Performs integration operations using an AI model.
 * This flow definition is now primarily for defining the input/output types
 * for the client-side page, as the actual solving logic is now handled by
 * the WolframAlpha+Gemini pipeline in actions.ts.
 *
 * - performIntegration - (No longer directly called for solving, types are key)
 * - IntegrationInput - The input type for the integration operation.
 * - IntegrationOutput - The return type expected by the integration page.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

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
      'The result of the integration. This MUST be ONLY the pure mathematical expression or value, suitable for direct LaTeX rendering (e.g., "x^3/3 + C" or "1/2"). Do NOT include any delimiters like \\(...\\) or \\[...\\] in this field. For indefinite integrals, include "+ C".'
    ),
  steps: z.string().optional().describe("A detailed and complete step-by-step explanation of how the result was obtained, from start to finish. For each step, clearly state the mathematical rule or principle applied (e.g., \"Power Rule for Integration\", \"Integration by Parts\", \"Substitution Method\"). This should be formatted as readable text. Use simple LaTeX for ALL mathematical expressions, symbols, variables, and numbers within steps, ensuring they are wrapped in `\\(...\\)` delimiters (e.g., `\\(x^2\\)`, `\\(\\int u \\, du\\)`). If no detailed steps are applicable (e.g., direct lookup), provide a brief explanation like 'Direct integration lookup.'"),
  originalQuery: IntegrationInputSchema.describe("The original input parameters for the integration."),
  plotHint: z.string().optional().describe("A brief description of what a plot of the original function and its integral might show."),
  additionalHints: z.string().optional().describe("Additional educational hints or insights about the integration problem. Mathematical notation here should also use inline LaTeX delimiters."),
});
export type IntegrationOutput = z.infer<typeof IntegrationOutputSchema>;

// This flow is no longer the primary one called by the action for solving.
// It's kept for type reference consistency if any part of the system still expects it.
// The actual solving logic is now in actions.ts, using the Wolfram+Gemini pipeline.
export async function performIntegration(
  input: IntegrationInput
): Promise<IntegrationOutput> {
  console.warn("DEPRECATED: performIntegrationFlow directly called. The system should be using the WolframAlpha pipeline via handlePerformIntegrationAction in actions.ts.");
  // Fallback behavior or throw error
  return {
    integralResult: "Error: Deprecated flow called.",
    steps: "This integration method is outdated. Please use the main UI.",
    originalQuery: input,
    plotHint: "Cannot generate plot hint via deprecated flow.",
    additionalHints: "Cannot generate hints via deprecated flow."
  };
}

// Original prompt logic (now superseded by Wolfram+Gemini via explainWolframStepsFlow)
const systemPromptDEPRECATED = `You are an expert calculus assistant specialized in performing integrations.
Given a function, a variable of integration, and optionally bounds for a definite integral, calculate the integral.
Output Requirements:
- 'integralResult': ONLY the resulting mathematical expression/value for LaTeX (e.g., "x^3/3 + C"). For indefinite integrals, ALWAYS add "+ C".
- 'steps': Detailed step-by-step explanation. For EACH step, state the rule applied. ALL math in steps (variables, numbers, symbols like \\(\\int\\), expressions) MUST be wrapped in inline LaTeX delimiters \\(...\\).
- 'plotHint': Brief text describing what a plot of the function and its integral might show.
- 'originalQuery': Echo of the input.
`;

const integrationPromptDEPRECATED = ai.definePrompt({
  name: 'integrationPromptDEPRECATED', // Renamed to avoid conflict if ever run
  input: {schema: IntegrationInputSchema},
  output: {schema: IntegrationOutputSchema.omit({ additionalHints: true }) }, // Old schema didn't have hints
  system: systemPromptDEPRECATED,
  prompt: `Function: {{{functionString}}}
Variable of Integration: {{{variable}}}
Is Definite: {{{isDefinite}}}
{{#if isDefinite}}
Lower Bound: {{{lowerBound}}}
Upper Bound: {{{upperBound}}}
{{/if}}

Perform the integration. Provide the result, detailed steps, and a plot hint.
Ensure 'originalQuery' reflects input. 'integralResult' is pure LaTeX. All math in 'steps' uses \\(...\\) delimiters.`,
  config: {
    temperature: 0.1, 
    safetySettings: [ 
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
});

const performIntegrationFlowDEPRECATED = ai.defineFlow(
  {
    name: 'performIntegrationFlowDEPRECATED', // Renamed
    inputSchema: IntegrationInputSchema,
    outputSchema: IntegrationOutputSchema.omit({ additionalHints: true }),
  },
  async (input) => {
    const {output} = await integrationPromptDEPRECATED(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the integration operation.');
    }
    return {
        ...output,
        originalQuery: input 
    };
  }
);
