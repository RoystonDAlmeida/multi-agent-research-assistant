import React, { createContext, useContext } from 'react';
import { useResearch } from '@/hooks/useResearch';

// Creates a React context for research-related state and functions.
// The context's value shape is inferred from the return type of the `useResearch` hook.
// It is initialized as undefined and will be provided a value by the ResearchProvider.
const ResearchContext = createContext<ReturnType<typeof useResearch> | undefined>(undefined);

// ResearchProvider component that wraps parts of the application needing access to research data.
// It initializes the research state and functions using the `useResearch` hook and makes them
// available to all descendant components through the ResearchContext.
export const ResearchProvider = ({ children }: { children: React.ReactNode }) => {
  const research = useResearch();
  return (
    <ResearchContext.Provider value={research}>
      {children}
    </ResearchContext.Provider>
  );
};

// Custom hook to consume the ResearchContext.
// It provides a convenient way for components to access the research state and functions.
// Throws an error if used outside of a ResearchProvider to ensure the context is available.
export const useResearchContext = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearchContext must be used within a ResearchProvider');
  }
  return context;
}; 