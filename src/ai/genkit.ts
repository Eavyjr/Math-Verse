
import { config as dotenvConfig } from 'dotenv'; 
dotenvConfig(); 

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
