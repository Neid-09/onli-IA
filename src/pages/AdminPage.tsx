import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Bot, ArrowLeft, ShieldAlert, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService, type DashboardStats } from '../services/adminService';
import UserManagementTab from '../components/admin/UserManagementTab';
import AIConfigTab from '../components/admin/AIConfigTab';

interface Props {
  onNavigate: (path: string) => void;
}

export default function AdminPage({ onNavigate }: Props) {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'ai'>('users');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (profile?.role === 'administrador') {
      adminService.getDashboardStats().then(setStats).catch(console.error);
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm">Verificando credenciales administrativas...</p>
      </div>
    );
  }

  // Guardián de acceso: solo administradores
  if (!user || profile?.role !== 'administrador') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/10">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Esta sección está reservada exclusivamente para el personal con rol de <strong>Administrador</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs text-slate-500 text-left space-y-1">
            <p><strong>Usuario:</strong> {profile?.email || 'No autenticado'}</p>
            <p><strong>Rol actual:</strong> <span className="capitalize">{profile?.role || 'Ninguno'}</span></p>
          </div>
          <button
            onClick={() => onNavigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
          >
            <ArrowLeft size={16} />
            <span>Volver al Portal Ciudadano</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              <span>Consola de Administración Central</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Panel de Control Administrativo
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestión de permisos, seguridad y parametrización de servicios de Inteligencia Artificial
            </p>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-xs self-start md:self-auto"
          >
            <ArrowLeft size={16} />
            <span>Volver al Portal</span>
          </button>
        </div>

        {/* KPIs Resumen */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios</span>
                <Users size={18} className="text-blue-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.totalUsuarios}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats.totalCiudadanos} ciudadanos</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Funcionarios</span>
                <ShieldCheck size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.totalFuncionarios}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats.totalAdministradores} administradores</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total PQRS</span>
                <FileText size={18} className="text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.totalPqrs}</p>
              <p className="text-[11px] text-slate-400 mt-1">Expedientes en base de datos</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resueltas</span>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.pqrsResueltas}</p>
              <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <Clock size={12} /> {stats.pqrsEnTramite} en trámite
              </p>
            </div>
          </div>
        )}

        {/* Pestañas de Navegación del Panel */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={18} />
            <span>Usuarios y Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot size={18} />
            <span>Configuración de APIs de IA</span>
          </button>
        </div>

        {/* Vista Activa */}
        <div className="pt-2">
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'ai' && <AIConfigTab />}
        </div>
      </div>
    </div>
  );
}
