
'use server';
/**
 * @fileOverview Takes WolframAlpha results and explains them using an AI model.
 *
 * - explainWolframSteps - A function that enhances WolframAlpha output.
 * - ExplainWolframStepsInput - The input type.
 * - ExplainWolframStepsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import { gpt35Turbo } from 'genkitx-openai'; // Import the specific model
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
  plotHint: z.string().optional().describe("A brief textual description of what a plot of the original function and its integral might look like (e.g., 'A parabola and its cubic antiderivative'). This is for a textual description, not for generating an actual plot.")
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

4.  **Provide Plot Hint (Optional)**: Briefly describe what a visualization of the original function and its integral might look like (e.g., "The original function is a line, its integral is a parabola").

Focus on clarity, accuracy, and educational value.
`;

const explainWolframStepsPrompt = ai.definePrompt({
  name: 'explainWolframStepsPrompt',
  model: gpt35Turbo, // Use the imported model object
  input: { schema: ExplainWolframStepsInputSchema },
  output: { schema: ExplainWolframStepsOutputSchema },
  system: systemPrompt,
  prompt: `
{{#if originalQuery}}Original User Query Context: {{{originalQuery}}}{{/if}}

WolframAlpha Plaintext Steps:
{{{wolframPlaintextSteps}}}

WolframAlpha Plaintext Result:
{{{wolframPlaintextResult}}}

Please provide your enhanced explanation, formatted LaTeX result, any additional hints, and a plot hint based on the system instructions.
Ensure all math in your 'explainedSteps' and 'additionalHints' is wrapped in \\(...\\) delimiters.
Ensure 'formattedResult' is ONLY the LaTeX string of the mathematical answer.
`,
  config: {
    temperature: 0.3,
    // Removed safetySettings as they are typically Gemini-specific
  },
});

const explainWolframStepsFlow = ai.defineFlow(
  {
    name: 'explainWolframStepsFlow',
    inputSchema: ExplainWolframStepsInputSchema,
    outputSchema: ExplainWolframStepsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await explainWolframStepsPrompt(input);
      if (!output || !output.explainedSteps || !output.formattedResult) {
        console.error('explainWolframStepsFlow: AI returned null or incomplete output.', output);
        // Attempt to return a more graceful fallback but still indicate an issue.
        return {
          explainedSteps: "Could not generate a full explanation for the steps at this time. The result from WolframAlpha is provided.",
          formattedResult: input.wolframPlaintextResult || "Result not available from WolframAlpha.", 
          additionalHints: "No additional hints available due to an issue processing the steps.",
          plotHint: "Plot hint not available due to an issue processing the steps.",
        };
      }
      return output;
    } catch (error: any) {
      console.error('explainWolframStepsFlow: Error calling explainWolframStepsPrompt -', error.message, error.stack);
      let userFriendlyMessage = "An unexpected error occurred while trying to explain the solution with the AI model.";
      if (error.message && error.message.toLowerCase().includes('api key')) {
        userFriendlyMessage = "AI model API key is missing or invalid. Please check configuration.";
      } else if (error.message && error.message.toLowerCase().includes('quota')) {
        userFriendlyMessage = "AI model API quota exceeded. Please try again later.";
      }
      // Return a structured error within the expected output schema.
      return {
        explainedSteps: `Error during AI explanation: ${userFriendlyMessage}`,
        formattedResult: input.wolframPlaintextResult || "Result from WolframAlpha (explanation failed).",
        additionalHints: "Explanation process encountered an error.",
        plotHint: "Explanation process encountered an error."
      };
    }
  }
);

