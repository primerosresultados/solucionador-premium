import { ArrowRight, Check, Star, Target } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function SelectionStep() {
    const { state, actions, updateState } = useProblemSolver();

    const handleSelect = (id: string) => {
        actions.selectSolution(id);
    };

    const handleNext = () => {
        updateState({ currentStep: 'strategy' });
    };

    const handleBack = () => {
        updateState({ currentStep: 'brainstorm' });
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner">
                        <Target size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Selección Ganadora
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    Aplica el <span className="text-neutral-900 dark:text-neutral-100 font-bold">Principio de Pareto</span>. ¿Qué solución genera el 80% de los resultados con el 20% del esfuerzo?
                </p>
            </header>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {state.solutions.length === 0 ? (
                        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/20 border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[40px]">
                            <p className="text-neutral-400 text-lg font-medium italic">Debes proponer soluciones en el paso anterior.</p>
                        </div>
                    ) : (
                        state.solutions.map((sol, index) => {
                            const isSelected = state.selectedSolutionId === sol.id;
                            return (
                                <motion.div
                                    key={sol.id}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelect(sol.id)}
                                    className={cn(
                                        "cursor-pointer p-10 rounded-[36px] border-2 transition-all duration-500 flex items-center justify-between group relative overflow-hidden",
                                        isSelected
                                            ? "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.08] border-cyan-500 shadow-2xl shadow-cyan-500/10"
                                            : "bg-white dark:bg-neutral-900/30 border-neutral-100 dark:border-neutral-800 hover:border-cyan-500/50"
                                    )}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-sm",
                                            isSelected ? "bg-cyan-500 border-cyan-500 scale-125 rotate-[360deg]" : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 group-hover:border-cyan-500/30"
                                        )}>
                                            {isSelected ? (
                                                <Check size={20} className="text-white dark:text-black" strokeWidth={4} />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                                            )}
                                        </div>
                                        <div>
                                            <span className={cn(
                                                "text-2xl font-black tracking-tight transition-all duration-500 block",
                                                isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-neutral-400 dark:text-neutral-500 group-hover:text-black dark:group-hover:text-white"
                                            )}>
                                                {sol.description}
                                            </span>
                                            {isSelected && (
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-500 mt-2 block">Selección Prioritaria</span>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative z-10 hidden md:flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20"
                                        >
                                            <Star size={16} fill="currentColor" /> Idea Estrella
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <div className="flex justify-between items-center pt-10 border-t border-neutral-100 dark:border-neutral-900/50">
                <button
                    onClick={handleBack}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all"
                >
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    disabled={!state.selectedSolutionId}
                    className="relative group px-16 py-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.3em] rounded-[32px] transition-all hover:scale-[1.05] hover:shadow-[0_20px_60px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-10 shadow-2xl"
                >
                    <span className="flex items-center gap-4">
                        Definir Estrategia
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                </button>
            </div>
        </div>
    );
}
