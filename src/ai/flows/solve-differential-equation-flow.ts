
'use server';
/**
 * @fileOverview Solves differential equations using an AI model.
 * This version uses a simplified prompt returning a single string.
 */

import {ai} from '@/ai/genkit'; 
import {z} from 'genkit';

// Schema matching the user-provided prompt's input
// This schema is now internal to the file and not exported directly.
const DESolutionInputSchema = z.object({
  equationString: z.string().describe('The differential equation to solve.'),
  dependentVariable: z.string().default('y').describe('The dependent variable.'),
  independentVariable: z.string().default('x').describe('The independent variable.'),
  initialConditions: z.array(z.string()).optional().describe('Optional initial conditions, each as a string like "y(0)=1".'),
});
export type DESolutionInput = z.infer<typeof DESolutionInputSchema>;

// Output is now a single string as per the user's prompt definition
export type DESolutionOutput = string;


// User-provided prompt definition
const solveDifferentialEquationPrompt = ai.definePrompt({
  name: 'solveDifferentialEquationPrompt', 
  inputSchema: DESolutionInputSchema,
  output: { 
    schema: z.string().nullable(), // Allow null output from the model
  },
  // model: 'googleai/gemini-1.5-pro-latest', // Temporarily removed to use default model
  prompt: `
Differential Equation: {{{equationString}}}
Dependent Variable: {{{dependentVariable}}}
Independent Variable: {{{independentVariable}}}
{{#if initialConditions.length}}
Initial Conditions:
{{#each initialConditions}}
- {{{this}}}
{{/each}}
{{/if}}

Solve the equation and provide the solution. If possible, include steps.
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

// Exported async wrapper function to call the prompt
export async function solveDifferentialEquation(input: DESolutionInput): Promise<DESolutionOutput> {
  const response = await solveDifferentialEquationPrompt(input);
  const resultString = response.output; 

  if (resultString === null || resultString === undefined) { 
    throw new Error('AI model did not return a valid solution (received null or undefined). This could be due to the complexity or phrasing of the equation, or safety filters. Please try rephrasing, simplifying the equation, or checking if the content might be restricted.');
  }
  if (resultString.trim() === '') {
    throw new Error('AI model returned an empty or whitespace-only response. Please check your equation or try rephrasing.');
  }
  return resultString;
}

