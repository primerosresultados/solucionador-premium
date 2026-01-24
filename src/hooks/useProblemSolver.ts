import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { INITIAL_STATE } from '../types';
import type { ProblemState, Solution, ActionStep } from '../types';

export function useProblemSolver() {
    const { user, isAuthenticated } = useAuth();
    const [state, setState] = useState<ProblemState>(INITIAL_STATE);
    const [projectId, setProjectId] = useState<string | null>(null);

    // Cargar datos reales de Supabase si está autenticado
    useEffect(() => {
        if (!isAuthenticated || !user) {
            // Si no está autenticado, usar LocalStorage como fallback o empezar de cero
            const saved = localStorage.getItem('problem-solver-state');
            if (saved) {
                try { setState(JSON.parse(saved)); } catch (e) { console.error(e); }
            }
            return;
        }

        // Cargar proyecto desde Supabase
        const fetchProject = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*, action_steps(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setProjectId(data.id);
                setState({
                    definition: data.definition || '',
                    importance: data.importance || '',
                    vision: data.vision || '',
                    strategy: data.strategy || '',
                    redefined: [], // Por ahora no persistimos esto o lo adaptamos
                    rootCauses: [], // Debería ir en una tabla aparte si se quiere persistir
                    solutions: [], // Debería ir en una tabla aparte
                    selectedSolutionId: null,
                    actionPlan: data.action_steps.map((s: any) => ({
                        id: s.id,
                        description: s.description,
                        deadline: s.deadline,
                        completed: s.completed
                    })),
                    startedAt: data.created_at,
                    updatedAt: data.created_at,
                    currentStep: 'definition'
                });
            } else if (error && error.code === 'PGRST116') {
                // No existe proyecto todavía
                setProjectId(null);
            }
        };

        fetchProject();
    }, [isAuthenticated, user]);

    // Sincronizar cambios localmente
    const updateState = useCallback(async (updates: Partial<ProblemState>) => {
        const newState = { ...state, ...updates, updatedAt: new Date().toISOString() };
        setState(newState);
        localStorage.setItem('problem-solver-state', JSON.stringify(newState));

        // Si hay proyecto real, sincronizar con Supabase
        if (projectId && isAuthenticated) {
            await supabase.from('projects').update({
                definition: updates.definition || state.definition,
                importance: updates.importance || state.importance,
                vision: updates.vision || state.vision,
                strategy: updates.strategy || state.strategy,
            }).eq('id', projectId);
        }
    }, [state, projectId, isAuthenticated]);

    // Función para guardar/crear proyecto inicial
    const saveInitialDefinition = useCallback(async (definition: string) => {
        if (isAuthenticated && user && !projectId) {
            const { data, error } = await supabase
                .from('projects')
                .insert({ user_id: user.id, definition })
                .select()
                .single();
            if (data) setProjectId(data.id);
            if (error) console.error(error);
        }
        updateState({ definition });
    }, [isAuthenticated, user, projectId, updateState]);

    const resetState = useCallback(() => {
        setState({ ...INITIAL_STATE, startedAt: new Date().toISOString() });
        setProjectId(null);
        localStorage.removeItem('problem-solver-state');
    }, []);

    // Simplificación de acciones para esta fase de integración
    const setDefinition = saveInitialDefinition;
    const setImportance = useCallback((importance: string) => updateState({ importance }), [updateState]);
    const setVision = useCallback((vision: string) => updateState({ vision }), [updateState]);
    const setStrategy = useCallback((strategy: string) => updateState({ strategy }), [updateState]);

    const addActionStep = useCallback(async (step: ActionStep) => {
        setState(prev => ({ ...prev, actionPlan: [...prev.actionPlan, step] }));
        if (projectId && isAuthenticated) {
            await supabase.from('action_steps').insert({
                project_id: projectId,
                description: step.description,
                deadline: step.deadline,
                completed: step.completed
            });
        }
    }, [projectId, isAuthenticated]);

    const toggleActionStep = useCallback(async (id: string) => {
        const step = state.actionPlan.find(s => s.id === id);
        if (!step) return;

        setState(prev => ({
            ...prev,
            actionPlan: prev.actionPlan.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
        }));

        if (projectId && isAuthenticated) {
            await supabase.from('action_steps')
                .update({ completed: !step.completed })
                .eq('id', id);
        }
    }, [state.actionPlan, projectId, isAuthenticated]);

    return {
        state,
        updateState,
        resetState,
        actions: {
            setDefinition,
            setImportance,
            setVision,
            setStrategy,
            addRedefinition: (redef: string) => updateState({ redefined: [...state.redefined, redef] }),
            addRootCause: (cause: string) => updateState({ rootCauses: [...state.rootCauses, cause] }),
            addSolution: (sol: Solution) => updateState({ solutions: [...state.solutions, sol] }),
            selectSolution: (id: string) => updateState({ selectedSolutionId: id }),
            addActionStep,
            toggleActionStep
        }
    };
}
