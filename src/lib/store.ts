
import { create } from 'zustand';
import { type ClassifyExpressionOutput } from '@/ai/flows/classify-expression';

interface GlobalState {
  aiResponse: ClassifyExpressionOutput | null;
  isLoading: boolean;
  error: string | null;
  setAiResponse: (response: ClassifyExpressionOutput | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

export const useGlobalStore = create<GlobalState>()((set) => ({
  aiResponse: null,
  isLoading: false,
  error: null,
  setAiResponse: (response) => set({ aiResponse: response }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),
  clearAll: () => set({ aiResponse: null, isLoading: false, error: null }),
}));

// Re-export shallow from zustand/shallow to make it easily accessible
export { shallow } from 'zustand/shallow';
