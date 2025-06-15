
'use server';
/**
 * @fileOverview Performs differentiation operations using an AI model.
 *
 * - performDifferentiation - A function that handles derivative calculations.
 * - DifferentiationInput - The input type for the performDifferentiation function.
 * - DifferentiationOutput - The return type for the performDifferentiation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DifferentiationInputSchema = z.object({
  functionString: z.string().describe('The function to differentiate (e.g., "x^3", "sin(x)*cos(x)").'),
  variable: z.string().default('x').describe('The variable of differentiation (e.g., "x", "t").'),
  order: z.number().min(1).max(10).default(1).describe('The order of the derivative (e.g., 1 for first derivative, 2 for second).'),
});
export type DifferentiationInput = z.infer<typeof DifferentiationInputSchema>;

const DifferentiationOutputSchema = z.object({
  derivativeResult: z
    .string()
    .describe(
      'The result of the differentiation. This should be purely the mathematical expression or value, suitable for LaTeX rendering using inline delimiters like \\(...\\).'
    ),
  steps: z.string().optional().describe("A detailed step-by-step explanation of how the result was obtained. For each step, clearly state the mathematical rule or principle applied (e.g., \"Power Rule\", \"Product Rule\", \"Chain Rule\"). This should be formatted as readable text. ALL mathematical expressions, variables, and notations within the steps, such as \\(f(x)\\), \\(x^2\\), \\(\\frac{d}{dx}\\), numbers like \\(3\\), or results of intermediate steps, MUST be written in simple LaTeX and enclosed in inline MathJax/KaTeX delimiters \\(...\\). For example, \"Applying the Power Rule to \\(x^2\\) yields \\(2x\\).\""),
  originalQuery: DifferentiationInputSchema.describe("The original input parameters for the differentiation."),
  plotHint: z.string().optional().describe("A brief description of what a plot of the original function and its derivative(s) might show."),
});
export type DifferentiationOutput = z.infer<typeof DifferentiationOutputSchema>;

export async function performDifferentiation(
  input: DifferentiationInput
): Promise<DifferentiationOutput> {
  return performDifferentiationFlow(input);
}

const systemPrompt = `You are an expert calculus assistant specialized in performing differentiations.
Given a function, a variable of differentiation, and the order of the derivative, calculate the derivative.

- The 'derivativeResult' field in your output MUST contain ONLY the resulting mathematical expression or value. This 'derivativeResult' should be directly usable for LaTeX rendering with inline delimiters (e.g., "\\(3x^2\\)" or "\\(cos(x) - sin(x)\\)"). Do not include any explanations, apologies, or conversational text in the 'derivativeResult' field.
- If possible and applicable, provide a detailed step-by-step explanation of how you arrived at the result in the 'steps' field. For each step, clearly state the mathematical rule or principle applied (e.g., "Power Rule", "Product Rule", "Chain Rule", "Constant Multiple Rule"). Format these steps clearly for readability. ALL mathematical expressions, variables, and notations within the steps, such as \\(f(x)\\), \\(x^2\\), \\(\\frac{d}{dx}\\), numbers like \\(3\\), or results of intermediate steps, MUST be written in simple LaTeX and enclosed in inline MathJax/KaTeX delimiters \\(...\\). For example, "Applying the Power Rule to \\(x^2\\) yields \\(2x\\)."
- Provide a brief 'plotHint' describing what a visualization of the function and its derivative(s) might look like.
- The 'originalQuery' field in the output should be an echo of the input you received.
`;

const differentiationPrompt = ai.definePrompt({
  name: 'differentiationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: DifferentiationInputSchema},
  output: {schema: DifferentiationOutputSchema},
  system: systemPrompt,
  prompt: `Function: {{{functionString}}}
Variable of Differentiation: {{{variable}}}
Order of Derivative: {{{order}}}

Perform the differentiation of order {{{order}}} for the function '{{{functionString}}}' with respect to '{{{variable}}}'.
Provide the result, detailed steps (if applicable, stating the rule for each step and ensuring ALL math notation is wrapped in \\(...\\) delimiters), and a plot hint.
Ensure 'originalQuery' in your output accurately reflects these input parameters.
Ensure all mathematical expressions in 'derivativeResult' are formatted with inline MathJax/KaTeX delimiters \\(...\\). Ensure ALL mathematical expressions, variables, and notations within the 'steps' are also formatted with inline MathJax/KaTeX delimiters \\(...\\).`,
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

const performDifferentiationFlow = ai.defineFlow(
  {
    name: 'performDifferentiationFlow',
    inputSchema: DifferentiationInputSchema,
    outputSchema: DifferentiationOutputSchema,
  },
  async (input) => {
    const {output} = await differentiationPrompt(input);
    if (!output) {
      throw new Error('AI model did not return a valid output for the differentiation operation.');
    }
    return {
        ...output,
        originalQuery: input 
    };
  }
);
