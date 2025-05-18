'use server';

import { classifyExpression, type ClassifyExpressionInput, type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

export async function handleClassifyExpressionAction(
  expression: string
): Promise<ActionResult<ClassifyExpressionOutput>> {
  if (!expression || expression.trim() === '') {
    return { data: null, error: 'Expression cannot be empty.' };
  }

  try {
    const input: ClassifyExpressionInput = { expression };
    const result = await classifyExpression(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error classifying expression:', e);
    // It's good practice to not expose raw error messages to the client
    // For AI errors, they might contain sensitive info or be too technical
    if (e instanceof Error && e.message.includes('quota')) {
         return { data: null, error: 'API quota exceeded. Please try again later.' };
    }
    return { data: null, error: 'An error occurred while processing your request. Please try again.' };
  }
}
