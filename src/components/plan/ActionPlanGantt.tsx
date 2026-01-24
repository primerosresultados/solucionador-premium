import type { ActionStep } from '../../types';
import { cn } from '../../lib/utils';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';
import { CheckSquare, Square, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

interface GanttProps {
    steps: ActionStep[];
    onToggle: (id: string) => void;
}

export function ActionPlanGantt({ steps, onToggle }: GanttProps) {
    if (steps.length === 0) return (
        <div className="py-24 text-center border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[40px] italic text-neutral-400 font-medium">
            Define tareas para visualizar el cronograma.
        </div>
    );

    const dates = steps.map(s => new Date(s.deadline));
    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = startOfDay(new Date(Math.max(...dates.map(d => d.getTime()), addDays(minDate, 14).getTime())));

    const totalDays = Math.max(differenceInDays(maxDate, minDate) + 1, 14);
    const days = Array.from({ length: totalDays }, (_, i) => addDays(minDate, i));

    return (
        <div className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-900 rounded-[40px] p-10 overflow-x-auto scrollbar-hide shadow-inner">
            <div className="flex items-center gap-4 mb-10 ml-2">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-cyan-500 shadow-sm border border-neutral-100 dark:border-neutral-700">
                    <CalendarDays size={20} />
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em]">
                        Cronograma Táctico (Gantt)
                    </h3>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-300 mt-1 uppercase tracking-widest">Visualización de Plazos</p>
                </div>
            </div>

            <div className="min-w-[700px] space-y-6">
                <div className="flex border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
                    <div className="w-[30%] text-[9px] font-black text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.32em] pl-14">Hito / Tarea</div>
                    <div className="flex-1 flex justify-between px-6">
                        {days.filter((_, i) => i % Math.ceil(totalDays / 7) === 0).map((date, i) => (
                            <span key={i} className="text-[9px] font-black text-neutral-400 dark:text-neutral-700 uppercase tracking-widest">
                                {format(date, 'MMM d')}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, idx) => {
                        const dayIndex = differenceInDays(startOfDay(new Date(step.deadline)), minDate);
                        const progress = (dayIndex / (totalDays - 1)) * 100;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center group"
                            >
                                <div className="w-[30%] pr-6 flex items-center gap-4">
                                    <button
                                        onClick={() => onToggle(step.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 outline-none",
                                            step.completed
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 hover:border-cyan-500/50"
                                        )}
                                    >
                                        {step.completed ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} />}
                                    </button>
                                    <p className={cn(
                                        "text-[13px] font-black tracking-tight truncate uppercase tracking-widest",
                                        step.completed ? "text-neutral-400 dark:text-neutral-600 line-through" : "text-neutral-800 dark:text-neutral-200"
                                    )}>
                                        {step.description}
                                    </p>
                                </div>
                                <div className="flex-1 h-10 relative bg-white dark:bg-black/40 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800/40 cursor-pointer shadow-sm group-hover:border-cyan-500/30 transition-all" onClick={() => onToggle(step.id)}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(progress, 8)}%` }}
                                        className={cn(
                                            "absolute top-0 bottom-0 transition-colors duration-700 ease-out flex items-center px-4",
                                            step.completed ? "bg-emerald-500/20" : "bg-cyan-500/10"
                                        )}
                                        style={{
                                            left: 0,
                                            borderRight: `2px solid ${step.completed ? '#10b981' : '#06b6d4'}`,
                                        }}
                                    >
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            step.completed ? "bg-emerald-500" : "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                                        )} />
                                    </motion.div>

                                    {/* Deadline indicator icon on the bar */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-10 border-2 border-white dark:border-black shadow-lg"
                                        style={{
                                            left: `calc(${progress}% - 6px)`,
                                            backgroundColor: step.completed ? '#10b981' : '#06b6d4',
                                        }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
