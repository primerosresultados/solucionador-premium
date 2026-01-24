import { useContext } from 'react';
import { ProblemSolverContext, type ProblemSolverContextType } from '../context/ProblemSolverContext';

export function useProblemSolver(): ProblemSolverContextType {
    const context = useContext(ProblemSolverContext);
    if (context === undefined) {
        throw new Error('useProblemSolver must be used within a ProblemSolverProvider');
    }
    return context;
}
