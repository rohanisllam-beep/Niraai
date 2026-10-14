import React, { createContext, useContext, useState } from 'react';
import { LivingConceptId } from '../types/livingConcepts';

interface LivingConceptContextType {
  concept: LivingConceptId;
  setConcept: (c: LivingConceptId) => void;
  isSelectorOpen: boolean;
  setIsSelectorOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'nira_living_concept_v2';

const LivingConceptContext = createContext<LivingConceptContextType>({
  concept: 'aurora-weave',
  setConcept: () => {},
  isSelectorOpen: false,
  setIsSelectorOpen: () => {},
});

export const LivingConceptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [concept, setConceptState] = useState<LivingConceptId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LivingConceptId;
      if (
        saved &&
        [
          'aurora-weave',
          'liquid-cell',
          'light-filament',
          'soft-core',
          'micro-nebula',
          'liquid-infinity',
        ].includes(saved)
      ) {
        return saved;
      }
    } catch {}
    return 'aurora-weave';
  });

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const setConcept = (c: LivingConceptId) => {
    setConceptState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  return (
    <LivingConceptContext.Provider
      value={{
        concept,
        setConcept,
        isSelectorOpen,
        setIsSelectorOpen,
      }}
    >
      {children}
    </LivingConceptContext.Provider>
  );
};

export const useLivingConcept = () => useContext(LivingConceptContext);
