import { useState } from 'react';
import { ArrowRight, Plus, HelpCircle, Target } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';
import { motion, AnimatePresence } from 'framer-motion';

export function CausesStep() {
    const { state, actions, updateState } = useProblemSolver();
    const [newCause, setNewCause] = useState('');

    const handleAddCause = () => {
        if (!newCause.trim()) return;
        if (state.rootCauses.includes(newCause.trim())) return;
        actions.addRootCause(newCause.trim());
        setNewCause('');
    };

    const handleNext = () => {
        updateState({ currentStep: 'brainstorm' });
    };

    const handleBack = () => {
        updateState({ currentStep: 'definition' });
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-inner">
                        <HelpCircle size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Análisis de Raíz
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    No ataques los síntomas. Pregúntate <span className="text-neutral-900 dark:text-neutral-100 font-bold">"¿Por qué?"</span> repetidamente hasta llegar al núcleo del desafío.
                </p>
            </header>

            <div className="space-y-12">
                <section className="bg-white dark:bg-neutral-900/40 p-10 rounded-[40px] border border-neutral-200 dark:border-neutral-800 space-y-10 shadow-sm transition-all duration-500">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Target size={14} className="text-purple-500" />
                            Identificar Causas Potenciales
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newCause}
                                onChange={(e) => setNewCause(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCause()}
                                placeholder="Ej: Procesos de comunicación fragmentados..."
                                className="flex-1 border border-neutral-100 dark:border-neutral-900 rounded-[24px] px-8 py-6 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-purple-500/50 transition-all text-xl font-bold tracking-tight shadow-inner"
                            />
                            <button
                                onClick={handleAddCause}
                                disabled={!newCause.trim()}
                                className="bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-black w-24 rounded-[24px] transition-all disabled:opacity-20 flex items-center justify-center shadow-xl active:scale-95"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <AnimatePresence initial={false}>
                            {state.rootCauses.map((cause, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-6 bg-neutral-50/50 dark:bg-black/40 rounded-[28px] border border-neutral-100 dark:border-neutral-900 group hover:border-purple-500/30 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-6 overflow-hidden">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center font-black text-neutral-400 dark:text-neutral-600 text-sm border border-neutral-100 dark:border-neutral-700">
                                            {idx + 1}
                                        </div>
                                        <span className="text-neutral-800 dark:text-neutral-200 text-lg font-bold tracking-tight truncate">{cause}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {state.rootCauses.length === 0 && (
                            <div className="py-16 text-center border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[32px]">
                                <p className="text-neutral-400 font-medium italic">Aún no has identificado causas.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="flex justify-between items-center pt-8">
                <button
                    onClick={handleBack}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all"
                >
                    Regresar
                </button>
                <button
                    onClick={handleNext}
                    disabled={state.rootCauses.length === 0}
                    className="relative group px-12 py-6 bg-neutral-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest rounded-[32px] transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-10 shadow-2xl"
                >
                    <span className="flex items-center gap-4">
                        Continuar
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                </button>
            </div>
        </div>
    );
}
