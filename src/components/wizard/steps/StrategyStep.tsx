import { useState, useCallback } from 'react';
import { ArrowRight, Mic, MicOff, Lightbulb, Sparkles, Map } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';
import { motion } from 'framer-motion';

export function StrategyStep() {
    const { state, actions, updateState } = useProblemSolver();
    const [strategy, setStrategy] = useState(state.strategy || '');
    const [isListening, setIsListening] = useState(false);

    const selectedSolution = state.solutions.find(s => s.id === state.selectedSolutionId);

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setStrategy(prev => prev + (prev ? ' ' : '') + transcript);
        };
        recognition.start();
    }, []);

    const handleNext = () => {
        actions.setStrategy(strategy);
        updateState({ currentStep: 'action-plan' });
    };

    const handleBack = () => {
        updateState({ currentStep: 'selection' });
    };

    return (
        <div className="space-y-16 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                        <Map size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Capa Estratégica
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    Ya tienes el destino. Ahora describe <span className="text-neutral-900 dark:text-neutral-100 font-bold">el método</span> táctico que seguirás para ejecutar la solución con eficiencia.
                </p>
            </header>

            {selectedSolution && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-cyan-500/[0.03] dark:bg-cyan-500/[0.08] border-2 border-cyan-500/20 p-10 rounded-[40px] flex items-start gap-8 shadow-sm"
                >
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-[22px] text-cyan-500 shadow-xl shadow-cyan-500/10">
                        <Lightbulb size={28} />
                    </div>
                    <div>
                        <h3 className="text-[11px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-[0.3em] mb-2">Misión a Ejecutar</h3>
                        <p className="text-neutral-900 dark:text-neutral-100 text-3xl font-black tracking-tight leading-none">"{selectedSolution.description}"</p>
                    </div>
                </motion.div>
            )}

            <div className="space-y-6 p-10 bg-white dark:bg-neutral-900/40 rounded-[48px] border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Sparkles size={16} className="text-amber-500" />
                        Lógica de Implementación
                    </label>
                    <button
                        onClick={startListening}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${isListening
                            ? `bg-red-500/10 border-red-500 text-red-600 dark:text-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]`
                            : `bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-amber-500 dark:hover:border-white shadow-inner`
                            }`}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                            {isListening ? 'Escuchando' : 'Dictar Estrategia'}
                        </span>
                    </button>
                </div>

                <textarea
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Ej: Automatizaré el proceso de captura y delegaré la revisión a mi equipo para liberar 5 horas semanales..."
                    className="w-full h-64 border border-neutral-100 dark:border-neutral-900 rounded-[32px] p-10 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-amber-500/50 transition-all resize-none text-2xl font-bold tracking-tight leading-relaxed shadow-inner"
                />
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-neutral-100 dark:border-neutral-900/50">
                <button
                    onClick={handleBack}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all"
                >
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    disabled={!strategy.trim()}
                    className="relative group px-16 py-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.3em] rounded-[32px] transition-all hover:scale-[1.05] hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] active:scale-95 disabled:opacity-10 shadow-2xl"
                >
                    <span className="flex items-center gap-4">
                        Desglosar en Tareas
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                </button>
            </div>
        </div>
    );
}
