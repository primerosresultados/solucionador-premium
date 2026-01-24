import { ActionPlanStep } from './steps/ActionPlanStep';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '../dashboard/Dashboard';
import { useProblemSolver } from '../../hooks/useProblemSolverContext';
import { DefinitionStep } from './steps/DefinitionStep';
import { CausesStep } from './steps/CausesStep';
import { BrainstormStep } from './steps/BrainstormStep';
import { SelectionStep } from './steps/SelectionStep';
import { StrategyStep } from './steps/StrategyStep';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

export function Wizard() {
    const { state } = useProblemSolver();
    const { isAuthenticated } = useAuth();
    const { showDashboard } = useUI();

    const renderStep = () => {
        if (showDashboard && isAuthenticated) {
            return <Dashboard key="dash" />;
        }

        switch (state.currentStep) {
            case 'definition':
                return <DefinitionStep key="def" />;
            case 'causes':
                return <CausesStep key="cau" />;
            case 'brainstorm':
                return <BrainstormStep key="brain" />;
            case 'selection':
                return <SelectionStep key="sel" />;
            case 'strategy':
                return <StrategyStep key="strat" />;
            case 'action-plan':
                return <ActionPlanStep key="plan" />;
            default:
                return <DefinitionStep key="def-default" />;
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={showDashboard ? 'dashboard' : state.currentStep}
                    initial={{ opacity: 0, x: showDashboard ? 0 : 20, scale: showDashboard ? 0.98 : 1 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: showDashboard ? 0 : -20, scale: showDashboard ? 0.98 : 1 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
