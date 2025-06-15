
'use server';
/**
 * @fileOverview Performs integration operations using a Gemini AI model directly.
 *
 * - performIntegration - A function that handles the integration calculation.
 * - IntegrationInput - The input type for the performIntegration function.
 * - IntegrationOutput - The return type for the performIntegration function.
 */

import {ai} from '@/ai/genkit';
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
  plotHint: z.string().optional().describe("A brief description of what a plot of the original function and its integral might show. Use inline LaTeX \\(...\\) for any math."),
  additionalHints: z.string().optional().describe("Additional educational hints or insights about the integration problem. Mathematical notation here should also use inline LaTeX delimiters \\(...\\)."),
});
export type IntegrationOutput = z.infer<typeof IntegrationOutputSchema>;

export async function performIntegration(
  input: IntegrationInput
): Promise<IntegrationOutput> {
  return performIntegrationFlow(input);
}

const systemPrompt = `You are an expert calculus assistant specialized in performing integrations.
Given a function, a variable of integration, and optionally bounds for a definite integral, calculate the integral.

Output Requirements:
- 'integralResult': Provide ONLY the resulting mathematical expression or value, formatted as a clean LaTeX string (e.g., "x^3/3 + C" or "1/2"). For indefinite integrals, ALWAYS add "+ C". DO NOT use any delimiters like \\(...\\) or \\[...\\] around this result.
- 'steps': Provide a detailed, step-by-step explanation of how the result was obtained. For EACH step, clearly state the mathematical rule or principle applied (e.g., "Power Rule for Integration", "Integration by Parts with u=... and dv=...", "Substitution Method using u=..."). Format these steps clearly for readability. ALL mathematical expressions, variables, and notations within the steps (e.g., \\(f(x)\\), \\(x^2\\), \\(\\frac{d}{dx}\\), numbers like \\(3\\), results of intermediate steps, or even a simple variable like \\(u\\)) MUST be written in simple LaTeX and enclosed in inline MathJax/KaTeX delimiters, which are \\(...\\).
- 'plotHint': Briefly describe what a plot of the original function and its integral (or the area for definite integrals) might look like. Use inline LaTeX \\(...\\) for any mathematical notation in the hint.
- 'additionalHints': (Optional) Offer 1-2 brief, helpful insights, common pitfalls related to this type of integration, or connections to other mathematical concepts. Format math in hints with \\(...\\) as well.
- 'originalQuery': This field will be an echo of the input you received; you don't need to generate it.

If the integral is too complex or cannot be expressed in elementary terms, state this clearly in the 'integralResult' (e.g., "Non-elementary integral") and provide an explanation in the 'steps' field.
`;

const integrationPrompt = ai.definePrompt({
  name: 'performIntegrationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: IntegrationInputSchema},
  output: {schema: IntegrationOutputSchema.omit({originalQuery: true})}, // AI doesn't generate originalQuery
  system: systemPrompt,
  prompt: `Function: {{{functionString}}}
Variable of Integration: {{{variable}}}
Is Definite: {{{isDefinite}}}
{{#if isDefinite}}
Lower Bound: {{{lowerBound}}}
Upper Bound: {{{upperBound}}}
{{/if}}

Perform the integration according to the system instructions.
Provide the 'integralResult' as a pure LaTeX string.
Provide 'steps' with all math wrapped in \\(...\\) delimiters.
Provide 'plotHint' and 'additionalHints' (optional) with math also wrapped in \\(...\\) delimiters.
`,
  config: {
    temperature: 0.2, 
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
    if (!output || !output.integralResult) { // Check for the essential field
      console.error("performIntegrationFlow: AI model did not return a valid output object or integralResult is missing.");
      return {
        integralResult: "Error: AI model failed to provide a result.",
        steps: "The AI model did not return steps for this integration.",
        originalQuery: input,
        plotHint: "Plot hint not available due to model error.",
        additionalHints: "Additional hints not available due to model error."
      };
    }
    return {
        ...output, // Contains integralResult, steps, plotHint, additionalHints from AI
        originalQuery: input 
    };
  }
);
