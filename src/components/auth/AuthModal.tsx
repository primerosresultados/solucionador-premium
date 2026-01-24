import { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AuthModal({ onAccess }: { onAccess: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.email, formData.password, formData.name);
            }
            onAccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white drop-shadow-sm">
                    {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </h2>
                <p className="text-neutral-500 text-sm mt-2 font-medium">
                    {isLogin
                        ? 'Inicia sesión para guardar y marcar tus avances'
                        : 'Únete para gestionar tus planes de acción'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="space-y-1">
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" size={18} />
                            <input
                                type="text"
                                required
                                placeholder="Nombre completo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="correo@ejemplo.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="Tu contraseña"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-neutral-200 transition-all disabled:opacity-50 mt-4 group shadow-xl active:scale-[0.98]"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>{isLogin ? 'Entrar' : 'Registrarme'}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors outline-none"
                >
                    {isLogin ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Entra'}
                </button>
            </div>
        </div>
    );
}
