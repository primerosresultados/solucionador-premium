import { motion } from 'framer-motion';
import {
    Settings,
    LayoutDashboard,
    ShieldCheck,
    CheckCircle2,
    Mail,
    Smartphone,
    ChevronRight,
    LogOut,
    Moon,
    Sun,
    Zap,
    TrendingUp,
    Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProblemSolver } from '../../hooks/useProblemSolverContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function Dashboard() {
    const { user, updateUser, logout } = useAuth();
    const { state } = useProblemSolver();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'admin'>('overview');

    if (!user) return null;

    const stats = [
        { label: 'Problemas Resueltos', value: '14', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+2 esta semana' },
        { label: 'Pasos Pendientes', value: state.actionPlan.filter(s => !s.completed).length.toString(), icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10', trend: 'Siguiente: Hoy' },
        { label: 'Tasa de Éxito', value: '94%', icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10', trend: '+4% vs mes anterior' },
    ];

    const handleToggleNotification = (id: 'email' | 'browser' | 'reminders') => {
        updateUser({
            notifications: {
                ...user.notifications,
                [id]: !user.notifications[id]
            }
        });
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Premium Dashboard Header */}
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-neutral-200 dark:border-neutral-800/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                            Dashboard Estratégico
                        </div>
                        {user.role === 'admin' && (
                            <div className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                                <ShieldCheck size={10} /> Super Admin
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                            Panel de Control
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-lg mt-4 max-w-lg">
                            Bienvenido de nuevo, <span className="text-neutral-900 dark:text-neutral-200">{user.name}</span>. Tu rendimiento táctico ha subido un 12% esta semana.
                        </p>
                    </div>
                </div>

                {/* Navigation Switcher */}
                <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1.5 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 self-start shadow-inner">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest",
                            activeTab === 'overview' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xl shadow-black/[0.05]" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-white")}
                    >
                        <LayoutDashboard size={14} /> Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest",
                            activeTab === 'settings' ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xl shadow-black/[0.05]" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-white")}
                    >
                        <Settings size={14} /> Ajustes
                    </button>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest",
                                activeTab === 'admin' ? "bg-cyan-500 dark:bg-cyan-500 text-white dark:text-black shadow-xl" : "text-neutral-500 hover:text-cyan-500")}
                        >
                            <Zap size={14} /> Admin
                        </button>
                    )}
                </div>
            </header>

            {/* Control Buttons (Floating integrated) */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
                <button onClick={toggleTheme} className="p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl text-neutral-600 dark:text-neutral-400 hover:scale-110 active:scale-95 transition-all">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={logout} className="p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl text-neutral-600 dark:text-neutral-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all">
                    <LogOut size={20} />
                </button>
            </div>

            {activeTab === 'overview' && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((s, i) => (
                            <div key={i} className="group bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <s.icon size={80} />
                                </div>
                                <div className={cn("p-4 rounded-2xl w-fit mb-6", s.bg, s.color)}>
                                    <s.icon size={24} />
                                </div>
                                <div>
                                    <h4 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter leading-none">{s.value}</h4>
                                    <p className="text-neutral-400 dark:text-neutral-500 text-[11px] font-black uppercase tracking-[0.2em] mt-3">{s.label}</p>
                                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        <span className="text-[10px] font-bold text-emerald-500">{s.trend}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Featured Plan Section */}
                    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-[48px] p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-cyan-500/[0.03] to-transparent" />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-widest leading-none">Proyecto de Alto Impacto</h3>
                                    <p className="text-neutral-500 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Seguimiento en tiempo real</p>
                                </div>
                            </div>

                            {state.actionPlan.length > 0 ? (
                                <div className="space-y-10">
                                    <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800">
                                        <p className="text-neutral-400 text-[11px] font-black uppercase tracking-widest mb-4">Misión Actual</p>
                                        <h4 className="text-neutral-900 dark:text-neutral-100 text-3xl font-black tracking-tight leading-snug">"{state.definition}"</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                <TrendingUp size={16} className="text-cyan-500" /> Rendimiento Global
                                            </span>
                                            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                                                {Math.round((state.actionPlan.filter(s => s.completed).length / state.actionPlan.length) * 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-5 rounded-full overflow-hidden p-1 shadow-inner border border-neutral-200 dark:border-neutral-800">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(state.actionPlan.filter(s => s.completed).length / state.actionPlan.length) * 100}%` }}
                                                className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full shadow-[0_4px_12px_rgba(6,182,212,0.4)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center border-3 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[40px]">
                                    <p className="text-neutral-400 text-lg font-medium">No hay misiones estratégicas activas.</p>
                                    <button className="mt-6 px-10 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl">Comenzar Ahora</button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'settings' && (
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-3xl space-y-12"
                >
                    <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-[48px] p-12 space-y-12 shadow-2xl">
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                                Preferencias Estratégicas
                            </h3>
                            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-lg">Personaliza cómo el Solucionador interactúa con tu flujo de trabajo.</p>
                        </div>

                        <div className="grid gap-6">
                            {[
                                { id: 'email', label: 'Briefing Semanal', desc: 'Recibe un análisis profundo de tus metas cada lunes.', icon: Mail, color: 'text-blue-500' },
                                { id: 'browser', label: 'Push Táctico', desc: 'Alertas inmediatas para tareas críticas en este dispositivo.', icon: Smartphone, color: 'text-cyan-500' },
                            ].map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleToggleNotification(notif.id as any)}
                                    className="group flex items-center justify-between p-8 bg-neutral-50 dark:bg-neutral-800/20 rounded-[32px] border-2 border-transparent hover:border-cyan-500/20 cursor-pointer transition-all duration-300"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn("p-4 bg-white dark:bg-neutral-800 rounded-[22px] shadow-sm border border-neutral-100 dark:border-neutral-700 transition-all", notif.color)}>
                                            <notif.icon size={26} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-neutral-900 dark:text-white leading-none">{notif.label}</p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">{notif.desc}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-16 h-8 rounded-full relative transition-all duration-500 p-1.5",
                                        (user.notifications as any)[notif.id] ? "bg-cyan-500" : "bg-neutral-200 dark:bg-neutral-700 shadow-inner"
                                    )}>
                                        <div className={cn(
                                            "w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center",
                                            (user.notifications as any)[notif.id] ? "translate-x-8" : "translate-x-0"
                                        )}>
                                            {(user.notifications as any)[notif.id] && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'admin' && user.role === 'admin' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-[48px] p-12 shadow-2xl overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl text-cyan-500 flex items-center justify-center shadow-inner border border-cyan-500/20">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">Gestión Táctica</h3>
                                <p className="text-neutral-500 dark:text-neutral-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Monitor de Rendimiento Global</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-6 py-4 bg-neutral-100 dark:bg-neutral-900 rounded-[20px] text-sm font-black text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800">
                                12,402 Usuarios Activos
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-neutral-400 dark:text-neutral-600 border-b border-neutral-100 dark:border-neutral-800 uppercase text-[10px] font-black tracking-[0.3em]">
                                    <th className="pb-8 px-6">Miembro Estratégico</th>
                                    <th className="pb-8 px-6">Nivel</th>
                                    <th className="pb-8 px-6">Carga Actual</th>
                                    <th className="pb-8 px-6">Rendimiento</th>
                                    <th className="pb-8 px-6 text-right">Ficha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-900/50">
                                {[
                                    { name: 'Ximena Castro', email: 'ximena@corp.com', level: 'Premium', plan: 'Escalado Logístico', perf: 92, avatar: 'XC' },
                                    { name: 'David Miller', email: 'david@fin.com', level: 'Pro', plan: 'Auditoría Global Q4', perf: 45, avatar: 'DM' },
                                    { name: 'Sofía Rey', email: 'sofia@dev.com', level: 'Premium', plan: 'Migración Infraestructura', perf: 78, avatar: 'SR' },
                                    { name: 'Lucas Pazo', email: 'lucas@sales.com', level: 'Básico', plan: 'Apertura Mercado Latam', perf: 15, avatar: 'LP' },
                                ].map((u, i) => (
                                    <tr key={i} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-all duration-300">
                                        <td className="py-8 px-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-neutral-400 text-xs border border-neutral-200 dark:border-neutral-700 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                                    {u.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-black text-neutral-900 dark:text-white text-base leading-none">{u.name}</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold mt-2 uppercase tracking-widest">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 px-6">
                                            <span className={cn(
                                                "px-4 py-2 text-[9px] font-black uppercase rounded-xl tracking-widest border",
                                                u.level === 'Premium' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                    u.level === 'Pro' ? "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent"
                                            )}>
                                                {u.level}
                                            </span>
                                        </td>
                                        <td className="py-8 px-6">
                                            <span className="text-neutral-700 dark:text-neutral-300 text-[11px] font-black uppercase tracking-widest italic group-hover:text-cyan-500 transition-colors">"{u.plan}"</span>
                                        </td>
                                        <td className="py-8 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                                                    <div className={cn("h-full", u.perf > 80 ? "bg-emerald-500" : u.perf > 50 ? "bg-cyan-500" : "bg-pink-500")} style={{ width: `${u.perf}%` }} />
                                                </div>
                                                <span className="text-xs font-black text-neutral-900 dark:text-white">{u.perf}%</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-6 text-right">
                                            <button className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-sm">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
