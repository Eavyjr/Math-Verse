import { config } from 'dotenv';
config(); // Load environment variables from .env or .env.local

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import openAI from 'genkitx-openai'; // Corrected import based on user feedback

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({ // Corrected plugin usage
      apiKey: process.env.OPENAI_API_KEY, // Will be read from environment variables
    }),
  ],
});
