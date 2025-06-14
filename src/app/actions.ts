
'use server';

import { classifyExpression, type ClassifyExpressionInput, type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { performAlgebraicOperation, type AlgebraicOperationInput, type AlgebraicOperationOutput } from '@/ai/flows/perform-algebraic-operation';
import { performIntegration, type IntegrationInput, type IntegrationOutput } from '@/ai/flows/perform-integration-flow';
import { performDifferentiation, type DifferentiationInput, type DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';
import { solveDifferentialEquation, type DESolutionInput, type DESolutionOutput } from '@/ai/flows/solve-differential-equation-flow';
import { performMatrixOperation, type MatrixOperationInput, type MatrixOperationOutput } from '@/ai/flows/perform-matrix-operation';
import { performVectorOperation, type VectorOperationInput, type VectorOperationOutput } from '@/ai/flows/perform-vector-operation';
import { getMathChatbotResponse, type MathChatbotInput } from '@/ai/flows/math-chatbot-flow'; 

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

const genkitUnreachableError = 'Failed to connect to the AI service (Genkit). Please ensure it is running and accessible (e.g., via `pnpm genkit:dev`).';

// Types for WolframAlpha API response structure (simplified)
interface WolframPod {
  title: string;
  id: string;
  subpods: Array<{
    title: string;
    plaintext: string;
    img?: { src: string; alt: string; title: string; width: number; height: number; type: string; };
  }>;
}

interface WolframQueryResult {
  success: boolean;
  error: false | { code: string; msg: string; };
  numpods: number;
  pods?: WolframPod[];
  // ... other fields
}

interface WolframAlphaApiResponse {
  queryresult: WolframQueryResult;
}


export async function handleClassifyExpressionAction(
  expression: string
): Promise<ActionResult<ClassifyExpressionOutput>> {
  if (!expression || expression.trim() === '') {
    console.log("handleClassifyExpressionAction: Expression is empty.");
    return { data: null, error: 'Expression cannot be empty.' };
  }

  try {
    console.log("handleClassifyExpressionAction: Calling classifyExpression flow for:", expression);
    const input: ClassifyExpressionInput = { expression };
    const result = await classifyExpression(input);
    console.log("handleClassifyExpressionAction: Received result from flow:", result);
    if (!result || (result.classification === "Classification not available." && result.solutionStrategies === "Solution strategies not available." && result.originalExpression === expression)) {
      console.warn("handleClassifyExpressionAction: AI flow returned default/empty-like data for expression:", expression);
    }
    return { data: result, error: null };
  } catch (e) {
    let errorMessage = 'An error occurred while processing your request. Please try again.';
    if (e instanceof Error) {
        console.error("Error in handleClassifyExpressionAction (server) for expression '"+expression+"':", e.message, e.stack);
        if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
            errorMessage = genkitUnreachableError;
        } else if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output') || e.message.includes('not available due to model error')) {
            errorMessage = 'The AI model could not process this expression. Please try a different expression.';
        } else {
            errorMessage = e.message || 'An unknown error occurred during classification.';
        }
    } else if (typeof e === 'string') {
        errorMessage = e;
        console.error("String error in handleClassifyExpressionAction (server) for expression '"+expression+"':", e);
    } else {
        console.error("Unknown error type in handleClassifyExpressionAction (server) for expression '"+expression+"':", e);
    }
    console.error("handleClassifyExpressionAction: Returning error to client:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformAlgebraicOperationAction(
  expression: string,
  operation: AlgebraicOperationInput['operation']
): Promise<ActionResult<AlgebraicOperationOutput>> {
  if (!expression || expression.trim() === '') {
    return { data: null, error: 'Expression cannot be empty.' };
  }
  if (!operation) {
    return { data: null, error: 'Operation must be selected.' };
  }

  try {
    const input: AlgebraicOperationInput = { expression, operation };
    const result = await performAlgebraicOperation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing algebraic operation:', e);
    let errorMessage = 'An error occurred while performing the operation. Please try again.';
     if (e instanceof Error) {
        if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
            errorMessage = genkitUnreachableError;
        } else if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this expression with this operation. Please try a different expression or operation.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your expression or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformIntegrationAction(
  input: IntegrationInput
): Promise<ActionResult<IntegrationOutput>> {
  if (!input.functionString || input.functionString.trim() === '') {
    return { data: null, error: 'Function to integrate cannot be empty.' };
  }
  if (input.isDefinite) {
    if (!input.lowerBound || input.lowerBound.trim() === '') {
      return { data: null, error: 'Lower bound is required for definite integrals.' };
    }
    if (!input.upperBound || input.upperBound.trim() === '') {
      return { data: null, error: 'Upper bound is required for definite integrals.' };
    }
  }

  try {
    const result = await performIntegration(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing integration:', e);
    let errorMessage = 'An error occurred while performing the integration. Please try again.';
     if (e instanceof Error) {
        if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
            errorMessage = genkitUnreachableError;
        } else if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this integration. Please try a different function or check your bounds.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your input or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformDifferentiationAction(
  input: DifferentiationInput
): Promise<ActionResult<DifferentiationOutput>> {
  if (!input.functionString || input.functionString.trim() === '') {
    return { data: null, error: 'Function to differentiate cannot be empty.' };
  }
  if (!input.variable || input.variable.trim() === '') {
    return { data: null, error: 'Variable of differentiation cannot be empty.' };
  }
  if (input.order < 1) {
    return { data: null, error: 'Order of derivative must be at least 1.' };
  }

  try {
    const result = await performDifferentiation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing differentiation:', e);
    let errorMessage = 'An error occurred while performing the differentiation. Please try again.';
     if (e instanceof Error) {
        if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
            errorMessage = genkitUnreachableError;
        } else if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this differentiation. Please try a different function or order.';
        } else {
            errorMessage = `An AI processing error occurred. Please check your input or try again. Details: ${e.message}`;
        }
    }
    return { data: null, error: errorMessage };
  }
}

export async function handleSolveDifferentialEquationAction(
  input: DESolutionInput 
): Promise<ActionResult<DESolutionOutput>> { 
  if (!input.equationString || input.equationString.trim() === '') {
    return { data: null, error: 'Differential equation cannot be empty.' };
  }
   if (!input.dependentVariable || input.dependentVariable.trim() === '') {
    return { data: null, error: 'Dependent variable cannot be empty.' };
  }
   if (!input.independentVariable || input.independentVariable.trim() === '') {
    return { data: null, error: 'Independent variable cannot be empty.' };
  }
  if (input.initialConditions) {
    for (const ic of input.initialConditions) {
      if (!ic || ic.trim() === '') { 
        return { data: null, error: 'Initial condition string cannot be empty if provided.' };
      }
    }
  }

  try {
    const result = await solveDifferentialEquation(input);
     if (!result) { 
        console.error('handleSolveDifferentialEquationAction: Flow returned null or undefined without throwing an error.');
        return { data: null, error: 'AI model did not provide a response. Please try a different query.' };
    }
    
    const allKeyFieldsEmpty = 
      (result.classification === null || (typeof result.classification === 'string' && result.classification.trim() === "")) &&
      (result.solutionMethod === null || (typeof result.solutionMethod === 'string' && result.solutionMethod.trim() === "")) &&
      (result.generalSolution === null || (typeof result.generalSolution === 'string' && result.generalSolution.trim() === "")) &&
      (result.particularSolution === null || result.particularSolution === undefined || (typeof result.particularSolution === 'string' && result.particularSolution.trim() === "")) &&
      (result.steps === null || (typeof result.steps === 'string' && result.steps.trim() === ""));

    if (allKeyFieldsEmpty) {
        console.warn('handleSolveDifferentialEquationAction: AI model returned a response, but all key information fields were empty or null for query:', input.equationString);
        return { data: null, error: 'AI model returned a response, but all key information fields were empty or null. Please try a different or more specific equation.' };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error('Error solving differential equation in action:', e);
    let errorMessage = 'An error occurred while solving the differential equation. Please try again.';
    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
          errorMessage = genkitUnreachableError;
      } else if (e.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (e.message.includes('model did not return a valid solution') || e.message.includes('received null or undefined') || e.message.includes('empty or whitespace-only') || e.message.includes('empty or insufficient response') || e.message.includes('no substantial information')) {
        errorMessage = 'The AI model could not process this differential equation. Please check your input or try a simpler equation. Details: ' + e.message;
      } else {
        errorMessage = `An AI processing error occurred: ${e.message}`;
      }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformMatrixOperationAction(
  matrixA: number[][],
  operation: MatrixOperationInput['operation'],
  matrixB?: number[][],
  scalarValue?: number
): Promise<ActionResult<MatrixOperationOutput>> {
  if (!matrixA || matrixA.length === 0 || matrixA[0].length === 0) {
    return { data: null, error: 'Matrix A cannot be empty.' };
  }
  if (!operation) {
    return { data: null, error: 'Operation must be selected.' };
  }

  const matrixAString = JSON.stringify(matrixA);
  let matrixBString: string | undefined = undefined;
  if (['add', 'subtract', 'multiply'].includes(operation)) {
    if (!matrixB || matrixB.length === 0 || matrixB[0].length === 0) {
      return { data: null, error: `Matrix B is required for operation: ${operation}.` };
    }
    matrixBString = JSON.stringify(matrixB);
  }

  if (operation === 'scalarMultiply') {
    if (scalarValue === undefined || scalarValue === null || isNaN(scalarValue)) {
        return { data: null, error: 'A valid scalar value is required for scalar multiplication.' };
    }
  }

  const input: MatrixOperationInput = {
    matrixAString,
    operation,
    ...(matrixBString && { matrixBString }),
    ...(scalarValue !== undefined && { scalarValue }),
  };

  try {
    const result = await performMatrixOperation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing matrix operation:', e);
    let errorMessage = 'An error occurred while performing the matrix operation. Please try again.';
     if (e instanceof Error) {
        if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
            errorMessage = genkitUnreachableError;
        } else if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this matrix operation. Please check your input.';
        } else {
            errorMessage = `An AI processing error occurred. Details: ${e.message}`;
        }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { data: null, error: errorMessage };
  }
}

export async function handlePerformVectorOperationAction(
  input: VectorOperationInput
): Promise<ActionResult<VectorOperationOutput>> {
  if (!input.vectorA || input.vectorA.length === 0) {
    return { data: null, error: 'Vector A cannot be empty.' };
  }
  if (!input.operation) {
    return { data: null, error: 'Operation must be selected.' };
  }

  const binaryOps = ['add', 'subtract', 'dotProduct', 'crossProduct', 'angleBetween'];
  if (binaryOps.includes(input.operation) && (!input.vectorB || input.vectorB.length === 0)) {
    return { data: null, error: `Vector B is required for the '${input.operation}' operation.` };
  }
  if (input.operation === 'scalarMultiplyA' && (input.scalar === undefined || isNaN(input.scalar))) {
    return { data: null, error: 'A valid scalar value is required for scalar multiplication.' };
  }

  try {
    const result = await performVectorOperation(input);
    return { data: result, error: null };
  } catch (e) {
    console.error('Error performing vector operation in action:', e);
    let errorMessage = 'An error occurred while performing the vector operation.';
    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
          errorMessage = genkitUnreachableError;
      } else if (e.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (e.message.includes('model did not return valid output')) {
        errorMessage = 'The AI model could not process this vector operation. Please check your input.';
      } else {
        errorMessage = `An AI processing error occurred: ${e.message}`;
      }
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { data: null, error: errorMessage };
  }
}


export async function handleChatbotMessageAction(userInput: string): Promise<string> {
  if (!userInput || userInput.trim() === '') {
    console.warn("[Action:handleChatbotMessageAction] User input is empty.");
    return 'User input cannot be empty.';
  }

  const input: MathChatbotInput = { userInput };
  console.log("[Action:handleChatbotMessageAction] Calling getMathChatbotResponse with input:", input);
  try {
    const botResponse = await getMathChatbotResponse(input);
    console.log("[Action:handleChatbotMessageAction] Received botResponse from flow:", botResponse);

    if (!botResponse || botResponse.trim() === '') {
      console.warn("[Action:handleChatbotMessageAction] Flow returned null, undefined, or empty string.");
      return "Sorry, I couldn't formulate a response. Please try rephrasing.";
    }
    return botResponse;
  } catch (e: any) {
    console.error('[Action:handleChatbotMessageAction] Error calling getMathChatbotResponse:', e);
    let errorMessage = 'Sorry, I encountered an error trying to respond. Please try again.';
    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
          errorMessage = 'Sorry, I\'m having trouble connecting to my brain (AI service). Please ensure Genkit is running and try again.';
      } else if (e.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (e.message.includes('model did not return a valid output') || 
                 e.message.includes('couldn\'t process that request') || 
                 e.message.includes('AI model provided no usable text response') ||
                 e.message.includes('AI returned an empty or null response')) {
        errorMessage = "I'm sorry, I couldn't process that request right now. Could you try rephrasing?";
      } else {
        errorMessage = `An AI processing error occurred: ${e.message}`;
      }
    }
    return errorMessage;
  }
}

export async function fetchWolframAlphaStepsAction(
  expression: string
): Promise<ActionResult<string>> {
  if (!expression || expression.trim() === '') {
    return { data: null, error: 'Expression cannot be empty.' };
  }

  const WOLFRAM_APP_ID = 'LKRWWW-KW2L4V2652'; // Store securely in production
  const encodedInput = encodeURIComponent(expression);
  const apiUrl = `https://api.wolframalpha.com/v2/query?appid=${WOLFRAM_APP_ID}&input=${encodedInput}&format=plaintext&podstate=Step-by-step+solution&output=json`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Attempt to read error body if possible
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) { /* ignore if cannot read body */ }
      console.error(`WolframAlpha API Error ${response.status}: ${response.statusText}`, errorBody);
      return { data: null, error: `WolframAlpha API request failed with status ${response.status}: ${response.statusText}. ${errorBody}` };
    }

    const data: WolframAlphaApiResponse = await response.json();

    if (!data.queryresult.success) {
      if (data.queryresult.error && typeof data.queryresult.error === 'object') {
        return { data: null, error: `WolframAlpha Error: ${data.queryresult.error.msg} (Code: ${data.queryresult.error.code})` };
      }
      return { data: null, error: 'WolframAlpha could not process the query. No specific error message provided.' };
    }

    if (!data.queryresult.pods || data.queryresult.pods.length === 0) {
      return { data: null, error: 'No results (pods) returned from WolframAlpha.' };
    }
    
    const stepByStepPod = data.queryresult.pods.find(
      pod => 
        pod.id?.toLowerCase().includes('step-by-step solution') ||
        pod.id?.toLowerCase().includes('step-by-step') ||
        pod.title?.toLowerCase().includes('step-by-step solution') ||
        (pod.id?.toLowerCase().includes('integral') && pod.subpods.some(sp => sp.title?.toLowerCase().includes('step-by-step')))
    );

    if (stepByStepPod && stepByStepPod.subpods.length > 0) {
      const steps = stepByStepPod.subpods
        .map(subpod => subpod.plaintext)
        .filter(text => text && text.trim() !== '')
        .join('\n\n---\n\n'); 
      return { data: steps || 'No step-by-step solution found in the designated pod.', error: null };
    } else {
      const integralPod = data.queryresult.pods.find(
        pod => pod.id?.toLowerCase().includes('indefiniteintegral') || pod.id?.toLowerCase().includes('definiteintegral') || pod.title?.toLowerCase().includes('integral')
      );
      if (integralPod && integralPod.subpods.length > 0) {
          const resultText = integralPod.subpods
            .map(subpod => subpod.plaintext)
            .filter(text => text && text.trim() !== '')
            .join('\n\n');
          return { data: `Result found (but not explicitly step-by-step):\n${resultText}`, error: null };
      }
      console.warn("WolframAlpha Full Response (for debugging - no specific steps pod found):", data);
      return { data: null, error: 'No step-by-step solution or direct integral result pod found.' };
    }

  } catch (err: any) {
    console.error('Error in fetchWolframAlphaStepsAction:', err);
    return { data: null, error: `Server-side fetch error: ${err.message || 'An unknown error occurred during the API call.'}` };
  }
}
