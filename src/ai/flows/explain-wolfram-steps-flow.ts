
'use server';
/**
 * @fileOverview Takes WolframAlpha results and explains them using Gemini.
 *
 * - explainWolframSteps - A function that enhances WolframAlpha output.
 * - ExplainWolframStepsInput - The input type.
 * - ExplainWolframStepsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainWolframStepsInputSchema = z.object({
  wolframPlaintextSteps: z.string().describe('The step-by-step solution in plaintext from WolframAlpha.'),
  wolframPlaintextResult: z.string().describe('The final result in plaintext from WolframAlpha.'),
  originalQuery: z.string().optional().describe('The original user query or the cleaned query sent to WolframAlpha.'),
});
export type ExplainWolframStepsInput = z.infer<typeof ExplainWolframStepsInputSchema>;

const ExplainWolframStepsOutputSchema = z.object({
  explainedSteps: z.string().describe("A clear, student-friendly explanation of WolframAlpha's steps. All mathematical notation within these explanations MUST be enclosed in inline LaTeX delimiters, e.g., \\(x^2\\) or \\(\\int f(x) dx\\)."),
  formattedResult: z.string().describe("The final mathematical result, cleaned and formatted as a LaTeX string (without delimiters). E.g., 'x^3/3 + C' or '\\sin(x)'. For definite integrals, this should be the final numerical or symbolic value."),
  additionalHints: z.string().optional().describe('Any additional educational hints, common pitfalls, or interesting insights related to the integration problem. Mathematical notation here should also use inline LaTeX delimiters.'),
});
export type ExplainWolframStepsOutput = z.infer<typeof ExplainWolframStepsOutputSchema>;

export async function explainWolframSteps(
  input: ExplainWolframStepsInput
): Promise<ExplainWolframStepsOutput> {
  return explainWolframStepsFlow(input);
}

const systemPrompt = `You are an expert math tutor. Your task is to take a step-by-step solution and a final result from WolframAlpha (which are in plaintext) and enhance them for a student.

Given the original query (if provided), the WolframAlpha plaintext steps, and the WolframAlpha plaintext result for an integration problem:

1.  **Explain the Steps**: Review the WolframAlpha steps. Provide a clear, student-friendly explanation for each significant step or concept.
    *   Rephrase technical jargon into simpler terms.
    *   Highlight the key mathematical rule or technique used in each step (e.g., "Power Rule for Integration", "Substitution using u = ...", "Integration by Parts with u=... and dv=...").
    *   **Crucially, ensure ALL mathematical expressions, variables, and numbers that are part of a formula or calculation within your explanation are formatted using inline LaTeX delimiters: \\(...\\).** For example, if explaining "substitute u = 2x+1", write it as "substitute \\(u = 2x+1\\)". If referring to an integral like "integral of x^2", write it as "\\(\\int x^2 dx\\)".

2.  **Format the Result**: Take the WolframAlpha plaintext result and reformat it into a clean, standard LaTeX string.
    *   This LaTeX string should represent the mathematical expression ONLY, without any surrounding text or delimiters (e.g., output "x^3/3 + C", not "\\\\[x^3/3 + C\\\\]").
    *   Ensure constants of integration (like 'C') are included for indefinite integrals.
    *   For definite integrals, ensure the final evaluated result is presented cleanly.

3.  **Provide Additional Hints (Optional but encouraged)**: Offer 1-2 brief, helpful insights, common pitfalls related to this type of integration, or connections to other mathematical concepts. Format math in hints with \\(...\\) as well.

Focus on clarity, accuracy, and educational value.
`;

const explainWolframStepsPrompt = ai.definePrompt({
  name: 'explainWolframStepsPrompt',
  input: { schema: ExplainWolframStepsInputSchema },
  output: { schema: ExplainWolframStepsOutputSchema },
  system: systemPrompt,
  prompt: `
{{#if originalQuery}}Original User Query Context: {{{originalQuery}}}{{/if}}

WolframAlpha Plaintext Steps:
{{{wolframPlaintextSteps}}}

WolframAlpha Plaintext Result:
{{{wolframPlaintextResult}}}

Please provide your enhanced explanation, formatted LaTeX result, and any additional hints based on the system instructions.
Ensure all math in your 'explainedSteps' and 'additionalHints' is wrapped in \\(...\\) delimiters.
Ensure 'formattedResult' is ONLY the LaTeX string of the mathematical answer.
`,
  config: {
    temperature: 0.3, // Slightly more creative for explanations
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const explainWolframStepsFlow = ai.defineFlow(
  {
    name: 'explainWolframStepsFlow',
    inputSchema: ExplainWolframStepsInputSchema,
    outputSchema: ExplainWolframStepsOutputSchema,
  },
  async (input) => {
    const { output } = await explainWolframStepsPrompt(input);
    if (!output || !output.explainedSteps || !output.formattedResult) {
      console.error('explainWolframStepsFlow: AI returned null or incomplete output.');
      // Fallback or error structure
      return {
        explainedSteps: "Could not generate explanation for the steps at this time.",
        formattedResult: input.wolframPlaintextResult, // Fallback to raw result
        additionalHints: "No additional hints available.",
      };
    }
    return output;
  }
);
