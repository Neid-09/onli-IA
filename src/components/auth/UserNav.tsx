import { useState, useRef, useEffect } from 'react';
import { LogOut, KeyRound, ChevronDown, Shield, LogIn, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './LoginModal';
import SetPasswordModal from './SetPasswordModal';

interface Props {
  onNavigate?: (path: string) => void;
}

export default function UserNav({ onNavigate }: Props) {
  const { user, profile, signOut, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  if (!user || !profile) {
    return (
      <>
        <button
          onClick={() => setIsLoginOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow-md"
        >
          <LogIn size={16} />
          <span>Iniciar Sesión</span>
        </button>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </>
    );
  }

  const roleBadgeColors: Record<string, string> = {
    administrador: 'bg-purple-100 text-purple-700 border-purple-200',
    funcionario: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ciudadano: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-all border border-slate-200/60"
      >
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName || 'Usuario'}
            className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {profile.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
            {profile.fullName}
          </p>
          <p className="text-[10px] text-slate-500 font-medium capitalize leading-tight">
            {profile.role}
          </p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Conectada</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{profile.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleBadgeColors[profile.role] || roleBadgeColors.ciudadano}`}>
                <Shield size={12} />
                Rol: {profile.role}
              </span>
            </div>
          </div>

          <div className="py-1">
            {(profile.role === 'funcionario' || profile.role === 'administrador') && (
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onNavigate) onNavigate('/funcionario');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left font-bold"
              >
                <FileCheck size={16} className="text-emerald-600" />
                <span>Bandeja de Funcionario</span>
              </button>
            )}

            {profile.role === 'administrador' && (
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onNavigate) onNavigate('/admin');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors text-left font-bold"
              >
                <Shield size={16} className="text-purple-600" />
                <span>Panel Administrativo</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsPasswordModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <KeyRound size={16} className="text-slate-400" />
              <span>Cambiar Contraseña</span>
            </button>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión (Google Out)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
