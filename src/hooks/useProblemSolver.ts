import { useState, useEffect, useCallback } from 'react';
import { INITIAL_STATE } from '../types';
import type { ProblemState, Solution, ActionStep } from '../types';

const STORAGE_KEY = 'problem-solver-state';

export function useProblemSolver() {
    const [state, setState] = useState<ProblemState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved state', e);
                return INITIAL_STATE;
            }
        }
        return INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const updateState = useCallback((updates: Partial<ProblemState>) => {
        setState(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    }, []);

    const resetState = useCallback(() => {
        setState({ ...INITIAL_STATE, startedAt: new Date().toISOString() });
    }, []);

    const setDefinition = useCallback((definition: string) => updateState({ definition }), [updateState]);
    const setImportance = useCallback((importance: string) => updateState({ importance }), [updateState]);
    const setVision = useCallback((vision: string) => updateState({ vision }), [updateState]);
    const setStrategy = useCallback((strategy: string) => updateState({ strategy }), [updateState]);

    const addRedefinition = useCallback((redef: string) => {
        setState(prev => ({
            ...prev,
            redefined: [...prev.redefined, redef],
            updatedAt: new Date().toISOString()
        }));
    }, []);

    const addRootCause = useCallback((cause: string) => {
        setState(prev => ({
            ...prev,
            rootCauses: [...prev.rootCauses, cause],
            updatedAt: new Date().toISOString()
        }));
    }, []);

    const addSolution = useCallback((solution: Solution) => {
        setState(prev => ({
            ...prev,
            solutions: [...prev.solutions, solution],
            updatedAt: new Date().toISOString()
        }));
    }, []);

    const selectSolution = useCallback((id: string) => updateState({ selectedSolutionId: id }), [updateState]);

    const addActionStep = useCallback((step: ActionStep) => {
        setState(prev => ({
            ...prev,
            actionPlan: [...prev.actionPlan, step],
            updatedAt: new Date().toISOString()
        }));
    }, []);

    const toggleActionStep = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            actionPlan: prev.actionPlan.map(step =>
                step.id === id ? { ...step, completed: !step.completed } : step
            ),
            updatedAt: new Date().toISOString()
        }));
    }, []);

    return {
        state,
        updateState,
        resetState,
        actions: {
            setDefinition,
            setImportance,
            setVision,
            setStrategy,
            addRedefinition,
            addRootCause,
            addSolution,
            selectSolution,
            addActionStep,
            toggleActionStep
        }
    };
}
