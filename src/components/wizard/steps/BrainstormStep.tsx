import { useState } from 'react';
import { ArrowRight, Plus, Lightbulb, Sparkles } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';
import { motion, AnimatePresence } from 'framer-motion';

export function BrainstormStep() {
    const { state, actions, updateState } = useProblemSolver();
    const [desc, setDesc] = useState('');

    const handleAdd = () => {
        if (!desc.trim()) return;
        actions.addSolution({
            id: crypto.randomUUID(),
            description: desc.trim(),
            pros: [],
            cons: []
        });
        setDesc('');
    };

    const handleNext = () => {
        updateState({ currentStep: 'selection' });
    };

    const handleBack = () => {
        updateState({ currentStep: 'causes' });
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-inner">
                        <Lightbulb size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Lluvia de Ideas
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    Busca la <span className="text-neutral-900 dark:text-neutral-100 font-bold">cantidad</span>. No juzgues ninguna idea todavía. Cuantas más opciones, mayor probabilidad de encontrar la ganadora.
                </p>
            </header>

            <div className="space-y-12">
                <section className="bg-white dark:bg-neutral-900/40 p-10 rounded-[40px] border border-neutral-200 dark:border-neutral-800 space-y-10 shadow-sm transition-all duration-500">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Sparkles size={14} className="text-yellow-500" />
                            Nueva Solución Posible
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="¿Qué podríamos intentar? Registra todo..."
                                className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[24px] px-8 py-6 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-yellow-500/50 transition-all text-xl font-bold tracking-tight shadow-inner"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!desc.trim()}
                                className="bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-black w-24 rounded-[24px] transition-all disabled:opacity-20 flex items-center justify-center shadow-xl active:scale-95"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-6">
                        <AnimatePresence initial={false}>
                            {state.solutions.map((sol) => (
                                <motion.div
                                    key={sol.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-neutral-50/50 dark:bg-black/40 p-8 rounded-[32px] border border-neutral-100 dark:border-neutral-900 flex gap-6 group hover:border-yellow-500/30 transition-all duration-300 shadow-sm"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-100 dark:border-neutral-700 text-yellow-500 group-hover:scale-110 transition-transform shadow-sm">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-neutral-800 dark:text-neutral-200 text-xl font-bold tracking-tight">{sol.description}</span>
                                        <span className="text-neutral-400 dark:text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Idea Potencial</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {state.solutions.length === 0 && (
                            <div className="py-20 text-center border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[40px]">
                                <p className="text-neutral-400 font-medium italic">Elige tu primera gran idea.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={handleBack}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all"
                >
                    Atrás
                </button>
                <div className="flex items-center gap-10">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">Total Ideas</span>
                        <span className="text-3xl font-black text-neutral-900 dark:text-white leading-none">{state.solutions.length}</span>
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={state.solutions.length === 0}
                        className="relative group px-16 py-6 bg-neutral-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest rounded-[32px] transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-10 shadow-2xl"
                    >
                        <span className="flex items-center gap-4">
                            Siguiente etapa
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
