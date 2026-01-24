import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, User as UserIcon, LogOut, Moon, Sun } from 'lucide-react';
import { useProblemSolver } from '../../hooks/useProblemSolverContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUI } from '../../context/UIContext';
import { Logo } from './Logo';
import { useState } from 'react';
import { AuthModal } from '../auth/AuthModal';

interface LayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export function Layout({ children, header }: LayoutProps) {
    const { resetState } = useProblemSolver();
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { showDashboard, setShowDashboard } = useUI();
    const [showAuth, setShowAuth] = useState(false);

    return (
        <div className="min-h-screen relative selection:bg-cyan-500/30 overflow-x-hidden">

            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/[0.03] dark:bg-cyan-500/[0.02] blur-[140px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/[0.03] dark:bg-purple-500/[0.02] blur-[140px] rounded-full" />
            </div>

            {/* Floating Global Actions */}
            <div className="fixed top-8 right-8 flex items-center gap-3 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-white rounded-2xl transition-all shadow-xl shadow-black/[0.02]"
                    title="Alternar Tema"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    onClick={() => {
                        if (confirm('¿Estás seguro de que quieres reiniciar el proceso?')) {
                            resetState();
                            setShowDashboard(false);
                        }
                    }}
                    className="p-3 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-white rounded-2xl transition-all shadow-xl shadow-black/[0.02]"
                    title="Reiniciar Todo"
                >
                    <RotateCcw size={18} />
                </button>

                {isAuthenticated ? (
                    <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-1.5 pr-4 rounded-2xl shadow-2xl shadow-black/[0.05]">
                        <button
                            onClick={() => setShowDashboard(!showDashboard)}
                            className="w-9 h-9 rounded-xl bg-cyan-500 text-black flex items-center justify-center font-black text-xs uppercase shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                            title={showDashboard ? "Volver al Solucionador" : "Ir a mi Panel"}
                        >
                            {user?.name.substring(0, 2)}
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAuth(true)}
                        className="p-3 bg-white/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-cyan-500 dark:hover:text-white rounded-2xl shadow-xl shadow-black/[0.05] transition-all"
                    >
                        <UserIcon size={18} />
                    </button>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 flex flex-col min-h-screen relative z-10">

                <header className="mb-20 flex flex-col items-center text-center">
                    <Logo />
                    <div className="mt-8 space-y-2">
                        <h1 className="text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
                            Problem Solver
                        </h1>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-black tracking-[0.5em] uppercase">
                            Brian Tracy Method
                        </p>
                    </div>
                </header>

                {!showDashboard && (
                    <div className="mb-20">
                        {header}
                    </div>
                )}

                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        {children}
                    </AnimatePresence>
                </main>

                <footer className="mt-40 pb-12 border-t border-neutral-200 dark:border-neutral-900 text-center pt-12">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.6em] font-black">
                        Claridad • Enfoque • Libertad
                    </p>
                </footer>
            </div>

            {/* Auth Modal Overlay */}
            <AnimatePresence>
                {showAuth && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/60 dark:bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-sm"
                        >
                            <AuthModal onAccess={() => setShowAuth(false)} />
                            <button
                                onClick={() => setShowAuth(false)}
                                className="mt-8 w-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase text-[10px] font-black tracking-[0.3em] transition-colors"
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
