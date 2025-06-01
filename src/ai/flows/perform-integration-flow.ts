
'use server';
/**
 * @fileOverview Performs integration operations using an AI model.
 *
 * - performIntegration - A function that handles definite and indefinite integrals.
 * - IntegrationInput - The input type for the performIntegration function.
 * - IntegrationOutput - The return type for the performIntegration function.
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
});
export type IntegrationOutput = z.infer<typeof IntegrationOutputSchema>;

export async function performIntegration(
  input: IntegrationInput
): Promise<IntegrationOutput> {
  return performIntegrationFlow(input);
}

const systemPrompt = `You are an expert calculus assistant specialized in performing integrations.
Given a function, a variable of integration, and optionally bounds for a definite integral, calculate the integral.

- The 'integralResult' field in your output MUST contain ONLY the resulting mathematical expression or value, suitable for direct LaTeX rendering (e.g., "x^3/3 + C" or "1/2"). Do NOT include any explanations, apologies, conversational text, or delimiters like \\(...\\) or \\[...\\] in this 'integralResult' field.
- For indefinite integrals (when isDefinite is false), ALWAYS add "+ C" to the 'integralResult' string (e.g., "x^3/3 + C").
- For definite integrals (when isDefinite is true), evaluate the integral from the lowerBound to the upperBound.
- Provide a detailed and COMPLETE step-by-step explanation of how you arrived at the result in the 'steps' field. Aim to provide steps for all integrations. Ensure the derivation is carried through to the final answer. For each step, clearly state the mathematical rule or principle applied (e.g., "Power Rule for Integration", "Integration by Parts", "Substitution Method", "Evaluating at bounds"). Format these steps clearly for readability. If, in rare cases, an integral is a direct lookup with no intermediate steps possible (e.g., \\(\\int dx = x + C\\) ), then state "Direct integration lookup." in the steps field, but otherwise, always provide the derivation.
  **Crucially, ALL mathematical notation within the 'steps' field must be enclosed in the standard inline LaTeX delimiters (e.g., \\\\(...\\\\) as shown in the examples below)**. This includes, but is not limited to:
    - Variables (e.g., \\\\(x\\\\), \\\\(u\\\\), \\\\(dv\\\\)).
    - Numbers that are part of a mathematical context (e.g., coefficients like \\\\(2\\\\) in \\\\(2x\\\\)).
    - Operators and symbols (e.g., \\\\(+\\\\), \\\\(-\\\\), \\\\(\\int\\\\), \\\\(\\frac{d}{dx}\\\\)).
    - Full expressions (e.g., \\\\(x^2 + C\\\\), \\\\(\\frac{1}{2} \\ln|u|\\\\)).
    - Constants of integration (e.g., \\\\(C\\\\)).
  Do not leave any mathematical symbol or expression outside of these delimiters within the steps.
  Ensure the steps are not truncated or abbreviated.
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

Perform the integration based on these details. Provide the result, detailed and complete steps (stating the rule for each step and ensuring no truncation), and a plot hint.
Ensure 'originalQuery' in your output accurately reflects these input parameters.
The 'integralResult' field MUST BE only the pure LaTeX expression. All mathematical expressions, symbols, variables, and numbers in the 'steps' field MUST BE formatted with inline MathJax/KaTeX delimiters \\\\(...\\\\).`,
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
    return {
        ...output,
        originalQuery: input 
    };
  }
);

