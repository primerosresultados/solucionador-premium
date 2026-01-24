import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckSquare, Square, Rocket, Plus, Lock, ListFilter, GanttChart } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../lib/utils';
import { ActionPlanGantt } from '../../plan/ActionPlanGantt';
import { AuthModal } from '../../auth/AuthModal';

export function ActionPlanStep() {
    const { state, actions, updateState } = useProblemSolver();
    const { isAuthenticated } = useAuth();

    const [desc, setDesc] = useState('');
    const [deadline, setDeadline] = useState('');
    const [showAuth, setShowAuth] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('gantt');

    const selectedSolution = state.solutions.find(s => s.id === state.selectedSolutionId);

    const handleAdd = () => {
        if (!desc.trim()) return;
        actions.addActionStep({
            id: crypto.randomUUID(),
            description: desc.trim(),
            deadline: deadline || new Date().toISOString().split('T')[0],
            completed: false
        });
        setDesc('');
        setDeadline('');
    };

    const handleBack = () => {
        updateState({ currentStep: 'strategy' });
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                        <Rocket size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Plan de Ejecución
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    Transforma la estrategia en <span className="text-neutral-900 dark:text-neutral-100 font-bold">pasos concretos</span>. El éxito es el resultado de la disciplina táctica diaria.
                </p>
            </header>

            <div className="space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {selectedSolution && (
                        <div className="flex-1 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.08] border-2 border-cyan-500/10 p-8 rounded-[40px] flex items-center gap-6 shadow-sm">
                            <Rocket className="text-cyan-500 shrink-0" size={28} />
                            <div>
                                <h3 className="text-[10px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-[0.3em] mb-1">Misión Principal</h3>
                                <p className="text-neutral-900 dark:text-neutral-200 text-xl font-black tracking-tight leading-none">"{selectedSolution.description}"</p>
                            </div>
                        </div>
                    )}

                    <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 self-center md:self-end">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                                viewMode === 'list' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xl" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-white")}
                        >
                            <ListFilter size={14} /> Lista
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                                viewMode === 'gantt' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xl" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-white")}
                        >
                            <GanttChart size={14} /> Gantt
                        </button>
                    </div>
                </div>

                <section className="bg-white dark:bg-neutral-900/40 p-10 rounded-[48px] border border-neutral-200 dark:border-neutral-800 space-y-10 shadow-sm transition-all duration-500 relative">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Plus size={16} className="text-emerald-500" />
                            Añadir Paso Táctico
                        </label>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="¿Cuál es la acción siguiente?"
                                className="flex-[2] bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[24px] px-8 py-6 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/50 transition-all text-xl font-bold tracking-tight shadow-inner"
                            />
                            <div className="flex-1 relative">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" size={20} />
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full h-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[24px] pl-16 pr-6 py-6 focus:outline-none focus:border-emerald-500/50 text-neutral-500 dark:text-neutral-400 font-bold text-lg"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={!desc.trim()}
                                className="bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-black min-w-[100px] h-20 rounded-[24px] transition-all disabled:opacity-10 shadow-xl flex items-center justify-center active:scale-95"
                            >
                                <Plus size={32} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 min-h-[400px]">
                        {viewMode === 'list' ? (
                            <div className="grid grid-cols-1 gap-4">
                                <AnimatePresence initial={false}>
                                    {state.actionPlan.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[40px] italic text-neutral-400 font-medium">
                                            Comienza a desglosar tu misión en pasos accionables.
                                        </motion.div>
                                    ) : (
                                        state.actionPlan.map((step) => (
                                            <motion.div
                                                key={step.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={cn(
                                                    "flex items-center gap-6 p-8 rounded-[32px] border transition-all duration-500 relative group",
                                                    step.completed
                                                        ? "bg-neutral-50 dark:bg-neutral-950/20 border-neutral-100 dark:border-neutral-900 opacity-40 shadow-none scale-98"
                                                        : "bg-white dark:bg-black/40 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30 shadow-sm hover:shadow-xl"
                                                )}
                                            >
                                                <button
                                                    onClick={() => {
                                                        if (!isAuthenticated) {
                                                            setShowAuth(true);
                                                            return;
                                                        }
                                                        actions.toggleActionStep(step.id);
                                                    }}
                                                    className={cn(
                                                        "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 outline-none",
                                                        step.completed
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 hover:border-emerald-500/50"
                                                    )}
                                                >
                                                    {step.completed ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} />}
                                                </button>

                                                <div className="flex-1 overflow-hidden">
                                                    <p className={cn("text-xl font-black tracking-tight", step.completed ? "line-through text-neutral-400 dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-200")}>
                                                        {step.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[9px] text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar size={12} /> {step.deadline}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <ActionPlanGantt
                                steps={state.actionPlan}
                                onToggle={(id) => {
                                    if (!isAuthenticated) {
                                        setShowAuth(true);
                                        return;
                                    }
                                    actions.toggleActionStep(id);
                                }}
                            />
                        )}
                    </div>
                </section>
            </div>

            <AnimatePresence mode="wait">
                {!isAuthenticated && state.actionPlan.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-500/5 border-2 border-amber-500/20 p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 mt-16"
                    >
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner">
                                <Lock size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">Seguimiento Protegido</h4>
                                <p className="text-neutral-500 dark:text-neutral-500 text-lg font-medium mt-2">Inicia sesión para poder marcar tus avances y recibir alertas.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAuth(true)}
                            className="px-12 py-6 bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest rounded-[24px] hover:scale-105 transition-all shadow-2xl"
                        >
                            Iniciar Sesión
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-start">
                <button
                    onClick={handleBack}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all"
                >
                    Anterior
                </button>
            </div>

            <AnimatePresence>
                {showAuth && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/60 dark:bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm relative"
                        >
                            <AuthModal onAccess={() => setShowAuth(false)} />
                            <button
                                onClick={() => setShowAuth(false)}
                                className="mt-8 w-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase text-[10px] font-black tracking-[0.3em]"
                            >
                                Cerrar Ventana
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
