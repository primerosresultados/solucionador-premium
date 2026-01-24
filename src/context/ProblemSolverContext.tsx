import { createContext, type ReactNode } from 'react';
import { useProblemSolver as useProblemSolverHook } from '../hooks/useProblemSolver';
import type { ProblemState, Solution, ActionStep } from '../types';

export interface ProblemSolverContextType {
    state: ProblemState;
    updateState: (updates: Partial<ProblemState>) => void;
    resetState: () => void;
    actions: {
        setDefinition: (definition: string) => void;
        setImportance: (importance: string) => void;
        setVision: (vision: string) => void;
        setStrategy: (strategy: string) => void;
        addRedefinition: (redef: string) => void;
        addRootCause: (cause: string) => void;
        addSolution: (solution: Solution) => void;
        selectSolution: (id: string) => void;
        addActionStep: (step: ActionStep) => void;
        toggleActionStep: (id: string) => void;
    };
}

export const ProblemSolverContext = createContext<ProblemSolverContextType | undefined>(undefined);

export function ProblemSolverProvider({ children }: { children: ReactNode }) {
    const solver = useProblemSolverHook();
    return (
        <ProblemSolverContext.Provider value={solver}>
            {children}
        </ProblemSolverContext.Provider>
    );
}
