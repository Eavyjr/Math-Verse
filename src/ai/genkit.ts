
import { config as dotenvConfig } from 'dotenv'; // Renamed to avoid potential conflicts
dotenvConfig(); // Load environment variables from .env or .env.local

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import openAI from 'genkitx-openai';

// Check and log OpenAI API Key status
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn(
    "CRITICAL WARNING (Genkit Init): OPENAI_API_KEY is not set in the environment. The OpenAI plugin will likely fail or use a default/test key if the plugin supports it, which may lead to errors or unexpected behavior."
  );
} else {
  console.log(
    "INFO (Genkit Init): OPENAI_API_KEY is set. Length:", 
    openaiApiKey.length, 
    `(Starts with: ${openaiApiKey.substring(0, 5)}...)` // Log a small part for verification
  );
}

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: openaiApiKey, // Use the checked variable
    }),
  ],
});

