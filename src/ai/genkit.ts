import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Import the OpenAI plugin - Commented out due to install issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai(), // Initialize the OpenAI plugin - Commented out due to install issues
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for the app remains Gemini
});
