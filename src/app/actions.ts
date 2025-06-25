
'use server';

import { classifyExpression, type ClassifyExpressionInput, type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { performAlgebraicOperation, type AlgebraicOperationInput, type AlgebraicOperationOutput } from '@/ai/flows/perform-algebraic-operation';
import { performIntegration, type IntegrationInput, type IntegrationOutput } from '@/ai/flows/perform-integration-flow';
import { performDifferentiation, type DifferentiationInput, type DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';
import { solveDifferentialEquation, type DESolutionInput, type DESolutionOutput } from '@/ai/flows/solve-differential-equation-flow';
import { performMatrixOperation, type MatrixOperationInput, type MatrixOperationOutput } from '@/ai/flows/perform-matrix-operation';
import { performVectorOperation, type VectorOperationInput, type VectorOperationOutput } from '@/ai/flows/perform-vector-operation';
import { getMathChatbotResponse, type MathChatbotInput } from '@/ai/flows/math-chatbot-flow';
import { preprocessWolframQuery, type PreprocessWolframQueryInput, type PreprocessWolframQueryOutput } from '@/ai/flows/preprocess-wolfram-query-flow';

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

const genkitUnreachableError = 'Failed to connect to the AI service (Genkit). Please ensure it is running and accessible (e.g., `pnpm genkit:dev`).';

// Types for WolframAlpha API response structure
interface WolframSubpod {
  title: string;
  plaintext: string;
  img?: { src: string; alt: string; title: string; width: number; height: number; type: string; };
  mathml?: string;
}
interface WolframPod {
  title: string;
  id: string;
  scanner?: string;
  subpods: WolframSubpod[];
  error?: boolean | { code: string; msg: string; }; // Pod-level error
}

interface WolframQueryResult {
  success: boolean;
  error: false | { code: string; msg: string; }; // Query-level error
  numpods: number;
  pods?: WolframPod[];
  // ... other fields
}

interface WolframAlphaApiResponse {
  queryresult: WolframQueryResult;
}

// NEW interfaces for structured Wolfram result
export interface EnhancedSubpod {
  title: string;
  plaintext: string;
  img?: {
    src: string;
    width: number;
    height: number;
    alt: string;
  };
}

export interface EnhancedPod {
  title: string;
  id: string;
  subpods: EnhancedSubpod[];
}

export interface EnhancedWolframResult {
  originalQuery: string;
  cleanedQuery: string | null;
  pods: EnhancedPod[];
}


// Helper for fetch with timeout
const fetchWithTimeout = async (resource: RequestInfo | URL, options: RequestInit = {}, timeout: number = 20000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
};


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
    console.log("[Action:Integration] Calling direct performIntegration flow with input:", input);
    const result = await performIntegration(input);
    console.log("Raw AI Steps Received:", result.steps); 
    
    if (!result || result.integralResult.startsWith("Error: AI model failed")) {
      console.error("[Action:Integration] Error from performIntegration flow:", result?.integralResult);
      return { data: null, error: result?.integralResult || 'AI model failed to provide a valid integration result.' };
    }
    
    console.log("[Action:Integration] Received result from performIntegration flow:", result);
    return { data: result, error: null };

  } catch (e: any) {
    console.error('[Action:handlePerformIntegrationAction] Error calling performIntegration flow:', e.message, e.stack);
    let errorMessage = 'An error occurred while performing the integration with the AI model.';
    if (e instanceof Error) {
      if (e.message.toLowerCase().includes('fetch failed') || e.message.toLowerCase().includes('econnrefused')) {
        errorMessage = genkitUnreachableError;
      } else if (e.message.toLowerCase().includes('api key') || e.message.toLowerCase().includes('auth')) {
        errorMessage = 'AI service authentication error. Please check API key and configuration.';
      } else if (e.message.includes('quota')) {
        errorMessage = 'An API quota may have been exceeded. Please try again later.';
      } else if (e.message.includes('model did not return a valid output')) {
        errorMessage = 'The AI model did not return a valid output for the integration. Please try rephrasing your query.';
      } else {
        errorMessage = `Processing error: ${e.message}`;
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
  userExpression: string
): Promise<ActionResult<EnhancedWolframResult>> {
  const enhancedResultData: EnhancedWolframResult = { 
    originalQuery: userExpression, 
    cleanedQuery: null, 
    pods: [] 
  };

  if (!userExpression || userExpression.trim() === '') {
    return { data: enhancedResultData, error: 'Expression cannot be empty.' };
  }

  const WOLFRAM_APP_ID = process.env.WOLFRAM_ALPHA_APP_ID || 'LKRWWW-KW2L4V2652'; // Default public test key
  if (!WOLFRAM_APP_ID) {
    console.error("fetchWolframAlphaStepsAction: WOLFRAM_ALPHA_APP_ID is not set.");
    return { data: enhancedResultData, error: "WolframAlpha App ID is not configured on the server." };
  }

  try {
    const preprocessInput: PreprocessWolframQueryInput = { userQuery: userExpression };
    const preprocessOutput: PreprocessWolframQueryOutput = await preprocessWolframQuery(preprocessInput);
    enhancedResultData.cleanedQuery = preprocessOutput.cleanedQuery || userExpression;
    console.log("[Action:WolframTest] Preprocessed query for Wolfram:", enhancedResultData.cleanedQuery);

    const encodedInput = encodeURIComponent(enhancedResultData.cleanedQuery);
    // Updated API URL to explicitly request image format
    const apiUrl = `https://api.wolframalpha.com/v2/query?appid=${WOLFRAM_APP_ID}&input=${encodedInput}&format=plaintext,image,mathml&output=json`;
    
    const response = await fetchWithTimeout(apiUrl, {}, 20000);

    if (!response.ok) {
      let errorBody = ''; try { errorBody = await response.text(); } catch (e) {/* ignore */}
      console.error(`WolframAlpha API Error ${response.status}: ${response.statusText}`, errorBody);
      return { data: enhancedResultData, error: `WolframAlpha API request failed: ${response.status} ${response.statusText}. ${errorBody}` };
    }

    const data: WolframAlphaApiResponse = await response.json();

    if (!data.queryresult || typeof data.queryresult.success === 'undefined') {
        console.error("WolframAlpha API Error: Invalid response structure.", data);
        return { data: enhancedResultData, error: "WolframAlpha returned an invalid response format." };
    }
    
    if (!data.queryresult.success) {
      if (data.queryresult.error && typeof data.queryresult.error === 'object') {
        return { data: enhancedResultData, error: `WolframAlpha Error: ${data.queryresult.error.msg} (Code: ${data.queryresult.error.code})` };
      }
      const didyoumeanPod = data.queryresult.pods?.find(pod => pod.id === 'DidYouMeans');
      if (didyoumeanPod && didyoumeanPod.subpods.length > 0) {
        return { data: enhancedResultData, error: `WolframAlpha could not process the query. Did you mean: ${didyoumeanPod.subpods[0].plaintext}?` };
      }
      return { data: enhancedResultData, error: 'WolframAlpha could not process the query. No specific error message provided.' };
    }

    if (!data.queryresult.pods || data.queryresult.pods.length === 0) {
      return { data: enhancedResultData, error: 'No results (pods) returned from WolframAlpha.' };
    }
    
    const relevantPods: EnhancedPod[] = data.queryresult.pods
      .filter(pod => pod.id !== "Input") // Filter out the input interpretation pod
      .map(pod => ({
        id: pod.id,
        title: pod.title,
        subpods: pod.subpods.map(subpod => ({
          title: subpod.title,
          plaintext: subpod.plaintext || '',
          img: subpod.img ? {
            src: subpod.img.src,
            width: subpod.img.width,
            height: subpod.img.height,
            alt: subpod.img.alt,
          } : undefined,
        }))
      }));
    
    enhancedResultData.pods = relevantPods;

    return { data: enhancedResultData, error: null };

  } catch (err: any) {
    console.error('Error in fetchWolframAlphaStepsAction pipeline:', err.message, err.stack);
    let errorMessage = `Server-side processing error: ${err.message || 'An unknown error occurred.'}`;
    if (err.name === 'AbortError') {
        errorMessage = 'Request to WolframAlpha timed out. Please try again.';
    } else if (err.message?.toLowerCase().includes('fetch failed') || err.message?.toLowerCase().includes('econnrefused')) {
      errorMessage = 'Failed to connect to WolframAlpha service.'; 
    } else if (err.message?.includes('quota')) {
        errorMessage = 'An API service quota may have been exceeded.';
    }
    return { data: enhancedResultData, error: errorMessage };
  }
}
