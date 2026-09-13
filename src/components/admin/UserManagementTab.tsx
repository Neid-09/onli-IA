import { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, Check, Loader2, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import type { Profile, UserRole } from '../../types/database.types';

export default function UserManagementTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole, userEmail: string) => {
    if (userId === currentUser?.id && newRole !== 'administrador') {
      const confirmSelf = window.confirm(
        '⚠️ ATENCIÓN: Estás modificando tu propio rol de administrador. Si lo cambias, perderás acceso a este panel. ¿Deseas continuar?'
      );
      if (!confirmSelf) return;
    }

    setUpdatingId(userId);
    setError(null);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccessMessage(`Rol de ${userEmail} actualizado a "${newRole}".`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(`No fue posible actualizar el rol de ${userEmail}: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<UserRole, string> = {
    administrador: 'bg-purple-100 text-purple-800 border-purple-200',
    funcionario: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ciudadano: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Gestión de Usuarios y Roles</h3>
          <p className="text-slate-500 text-sm">Control de acceso y permisos según el perfil del usuario</p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors shrink-0"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="todos">Todos los Roles</option>
            <option value="ciudadano">Ciudadanos</option>
            <option value="funcionario">Funcionarios</option>
            <option value="administrador">Administradores</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Cargando directorio de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron usuarios</p>
            <p className="text-xs text-slate-400 mt-1">Prueba con otros términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Usuario</th>
                  <th className="py-3.5 px-6">Correo</th>
                  <th className="py-3.5 px-6">Rol Actual</th>
                  <th className="py-3.5 px-6">Fecha Registro</th>
                  <th className="py-3.5 px-6 text-right">Asignar Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.full_name || 'Sin Nombre'}
                              {isSelf && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{u.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {u.email}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border capitalize ${roleColors[u.role] || roleColors.ciudadano}`}>
                          <Shield size={12} />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isUpdating ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Guardando...</span>
                          </div>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.email)}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700"
                          >
                            <option value="ciudadano">Ciudadano</option>
                            <option value="funcionario">Funcionario</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
