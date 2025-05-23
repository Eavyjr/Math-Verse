import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Import the OpenAI plugin

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai({ // Add the OpenAI plugin configuration
    // // You can specify OpenAI API key options here if needed,
    // // but it's often best to let it pick up from OPENAI_API_KEY environment variable.
    // // apiKey: process.env.OPENAI_API_KEY 
    // })
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for the app remains Gemini
});

