import { useState, useCallback } from 'react';
import { ArrowRight, Mic, MicOff, Sparkles, Target, Heart, CheckCircle2 } from 'lucide-react';
import { useProblemSolver } from '../../../hooks/useProblemSolverContext';

export function DefinitionStep() {
    const { state, actions, updateState } = useProblemSolver();

    const [definition, setDefinition] = useState(state.definition);
    const [importance, setImportance] = useState(state.importance || '');
    const [vision, setVision] = useState(state.vision || '');

    const [isListening, setIsListening] = useState(false);
    const [activeField, setActiveField] = useState<'definition' | 'importance' | 'vision'>('definition');

    const startListening = useCallback((field: 'definition' | 'importance' | 'vision') => {
        setActiveField(field);
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
            if (field === 'definition') setDefinition(prev => prev + (prev ? ' ' : '') + transcript);
            if (field === 'importance') setImportance(prev => prev + (prev ? ' ' : '') + transcript);
            if (field === 'vision') setVision(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.start();
    }, []);

    const handleNext = () => {
        if (!definition.trim()) return;
        actions.setDefinition(definition);
        actions.setImportance(importance);
        actions.setVision(vision);
        updateState({ currentStep: 'causes' });
    };

    const MicButton = ({ field }: { field: 'definition' | 'importance' | 'vision' }) => {
        const active = isListening && activeField === field;
        return (
            <button
                onClick={() => startListening(field)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${active
                        ? `bg-red-500/10 border-red-500 text-red-600 dark:text-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]`
                        : `bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-cyan-500 dark:hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-white shadow-sm`
                    }`}
            >
                {active ? <MicOff size={18} /> : <Mic size={18} />}
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {active ? 'Grabando...' : 'Dictar'}
                </span>
            </button>
        );
    };

    return (
        <div className="space-y-20 pb-20">
            <header className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                    Claridad y Propósito
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto text-xl font-medium">
                    El primer paso hacia la libertad estratégica es la precisión absoluta sobre el terreno actual.
                </p>
            </header>

            <div className="space-y-16">
                <section className="space-y-6 p-10 bg-white dark:bg-neutral-900/40 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm group hover:border-cyan-500/30 transition-all duration-500">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Sparkles size={16} className="text-cyan-500" />
                            1. Definición del Problema
                        </label>
                        <MicButton field="definition" />
                    </div>
                    <div className="relative">
                        <textarea
                            value={definition}
                            onChange={(e) => setDefinition(e.target.value)}
                            placeholder="¿Qué está pasando exactamente? Describe la fricción..."
                            className="w-full h-48 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[28px] p-8 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-all resize-none text-2xl font-bold tracking-tight leading-relaxed shadow-inner"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-6 p-8 bg-white dark:bg-neutral-900/40 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-pink-500/30 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Heart size={14} className="text-pink-500" />
                                2. Importancia
                            </label>
                            <MicButton field="importance" />
                        </div>
                        <textarea
                            value={importance}
                            onChange={(e) => setImportance(e.target.value)}
                            placeholder="¿Por qué es vital resolver esto ahora?"
                            className="w-full h-32 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[24px] p-6 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-pink-500/50 transition-all resize-none text-lg font-bold leading-relaxed shadow-inner"
                        />
                    </section>

                    <section className="space-y-6 p-8 bg-white dark:bg-neutral-900/40 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Target size={14} className="text-emerald-500" />
                                3. Visión de éxito
                            </label>
                            <MicButton field="vision" />
                        </div>
                        <textarea
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            placeholder="¿Cómo se siente la victoria?"
                            className="w-full h-32 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[24px] p-6 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/50 transition-all resize-none text-lg font-bold leading-relaxed shadow-inner"
                        />
                    </section>
                </div>
            </div>

            <div className="flex justify-center pt-10">
                <button
                    onClick={handleNext}
                    disabled={!definition.trim()}
                    className="relative group px-16 py-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.3em] rounded-[32px] transition-all hover:scale-[1.05] hover:shadow-[0_20px_60px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-20 shadow-2xl"
                >
                    <span className="flex items-center gap-4">
                        Empezar Análisis
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </span>
                </button>
            </div>
        </div>
    );
}
