export type ProblemStep = 'definition' | 'causes' | 'brainstorm' | 'selection' | 'strategy' | 'action-plan';

export interface Solution {
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    score?: number;
}

export interface ActionStep {
    id: string;
    description: string;
    deadline: string;
    completed: boolean;
    assignedTo?: string;
}

export interface ProblemState {
    currentStep: ProblemStep;
    definition: string;
    importance: string;
    vision: string;
    redefined: string[];
    rootCauses: string[];
    solutions: Solution[];
    selectedSolutionId: string | null;
    strategy: string; // New field
    actionPlan: ActionStep[];
    startedAt: string;
    updatedAt: string;
}

export const INITIAL_STATE: ProblemState = {
    currentStep: 'definition',
    definition: '',
    importance: '',
    vision: '',
    redefined: [],
    rootCauses: [],
    solutions: [],
    selectedSolutionId: null,
    strategy: '', // New field
    actionPlan: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
