import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: Props) {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError('No fue posible conectar con Google. Verifica la configuración de OAuth.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Credenciales incorrectas');
    } else {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative my-auto transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-8 text-center">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 text-2xl font-black">
            M
          </div>
          <h2 id="login-modal-title" className="text-2xl font-black text-slate-900 tracking-tight">
            Portal Ciudadano
          </h2>
          <p className="text-slate-500 text-sm mt-1.5 leading-snug">
            Inicia sesión para radicar y gestionar tus trámites
          </p>
        </div>

        {/* Modal Content */}
        <div className="px-8 pb-8 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-md transition-all font-semibold text-slate-700 group cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-semibold">Continuar con Google</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold absolute">
              o
            </span>
          </div>

          {!isEmailLogin ? (
            <button
              onClick={() => setIsEmailLogin(true)}
              className="w-full py-3.5 px-4 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Ingresar con correo y contraseña
            </button>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmailLogin(false)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Volver</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[11px] text-slate-400 mt-5 leading-relaxed">
            Al continuar, aceptas las políticas de tratamiento de datos personales de la entidad municipal.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
