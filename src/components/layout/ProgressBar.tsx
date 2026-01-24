import { motion } from 'framer-motion';
import type { ProblemStep } from '../../types';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
    currentStep: ProblemStep;
}

const STEPS: { id: ProblemStep; label: string }[] = [
    { id: 'definition', label: 'Claridad' },
    { id: 'causes', label: 'Raíz' },
    { id: 'brainstorm', label: 'Ideación' },
    { id: 'selection', label: 'Enfoque' },
    { id: 'strategy', label: 'Estrategia' },
    { id: 'action-plan', label: 'Acción' },
];

export function ProgressBar({ currentStep }: ProgressBarProps) {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="flex justify-between items-center relative gap-4">
                {/* Connection Line Background */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 rounded-full" />

                {/* Animated Active Line */}
                <motion.div
                    className="absolute top-1/2 left-0 h-[2px] bg-cyan-500 -translate-y-1/2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] z-10"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {STEPS.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-4 relative z-20 flex-1">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted ? '#22c55e' : isActive ? '#06b6d4' : 'var(--bg-app)',
                                    borderColor: isCompleted ? '#22c55e' : isActive ? '#06b6d4' : '#64748b'
                                }}
                                className={cn(
                                    "w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 shadow-sm",
                                    isCompleted && "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
                                    isActive && "shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                )}
                            >
                                {isCompleted ? (
                                    <Check size={12} className="text-white" strokeWidth={4} />
                                ) : (
                                    <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-white" : "bg-neutral-300 dark:bg-neutral-700")} />
                                )}
                            </motion.div>

                            <div className="h-4 flex items-center justify-center">
                                <span className={cn(
                                    "text-[8px] md:text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300",
                                    isActive ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-600"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
