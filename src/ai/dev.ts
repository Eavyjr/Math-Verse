
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-math-trivia.ts';
import '@/ai/flows/classify-expression.ts';
import '@/ai/flows/perform-algebraic-operation.ts';
import '@/ai/flows/perform-integration-flow.ts';
import '@/ai/flows/perform-differentiation-flow.ts';
import '@/ai/flows/solve-differential-equation-flow.ts';
import '@/ai/flows/perform-matrix-operation.ts';
import '@/ai/flows/math-chatbot-flow.ts';
import '@/ai/flows/perform-vector-operation.ts';
import '@/ai/flows/preprocess-wolfram-query-flow.ts';
// Removed: import '@/ai/flows/explain-wolfram-steps-flow.ts';
