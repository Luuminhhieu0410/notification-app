import { createContext, useContext } from 'react';

export interface HomePageContextValue {
  compact: boolean;
  contentId?: string;
  quote: string;
  authorName: string | null;
  hasPrevious: boolean;
  isNavigating: boolean;
  isPreviousPending: boolean;
  isNextPending: boolean;
  goPrevious: () => void;
  goNext: () => void;
}

export const HomePageContext = createContext<HomePageContextValue | undefined>(
  undefined,
);

export function useHomePageContext() {
  const context = useContext(HomePageContext);

  if (!context) {
    throw new Error(
      'useHomePageContext must be used within HomePageContext.Provider',
    );
  }

  return context;
}
