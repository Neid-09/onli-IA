import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, UserRole, SystemAIConfig } from '../types/database.types';

export interface DashboardStats {
  totalUsuarios: number;
  totalCiudadanos: number;
  totalFuncionarios: number;
  totalAdministradores: number;
  totalPqrs: number;
  pqrsEnTramite: number;
  pqrsResueltas: number;
}

export const adminService = {
  /**
   * Obtiene la lista de todos los usuarios registrados
   */
  async getUsers(): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }

    return (data || []) as Profile[];
  },

  /**
   * Actualiza el rol de un usuario en el sistema
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error(`Error al actualizar rol de ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene las configuraciones de IA activas en el sistema
   */
  async getAIConfigs(): Promise<SystemAIConfig[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('system_ai_configs')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al obtener configuraciones de IA:', error);
      throw error;
    }

    return (data || []) as SystemAIConfig[];
  },

  /**
   * Guarda o actualiza la configuración de un tipo de IA
   */
  async saveAIConfig(config: SystemAIConfig): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');

    const { error } = await supabase
      .from('system_ai_configs')
      .upsert({
        id: config.id,
        name: config.name,
        description: config.description,
        provider: config.provider,
        model_name: config.model_name,
        api_key: config.api_key,
        is_active: config.is_active,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Error al guardar configuración ${config.id}:`, error);
      throw error;
    }
  },

  /**
   * Prueba en vivo la conexión de una API Key y modelo antes de guardar
   */
  async testAIConnection(provider: string, modelName: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey.trim()) {
      return { success: false, message: 'La API Key no puede estar vacía.' };
    }

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responde únicamente con la palabra OK.' }] }]
          })
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error?.message || `Error HTTP ${res.status}` };
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return { success: true, message: `Conexión exitosa con ${modelName}! Respuesta: "${reply}"` };
      }

      if (provider === 'grok') {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error?.message || `Error HTTP ${res.status}` };
        }

        return { success: true, message: `Conexión exitosa con Grok (${modelName})!` };
      }

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error?.message || `Error HTTP ${res.status}` };
        }

        return { success: true, message: `Conexión exitosa con OpenAI (${modelName})!` };
      }

      return { success: true, message: `Proveedor ${provider} simulado correctamente.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Fallo de red al conectar con el proveedor.' };
    }
  },

  /**
   * Obtiene métricas para el dashboard de administración
   */
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
      return {
        totalUsuarios: 0,
        totalCiudadanos: 0,
        totalFuncionarios: 0,
        totalAdministradores: 0,
        totalPqrs: 0,
        pqrsEnTramite: 0,
        pqrsResueltas: 0,
      };
    }

    const [usersRes, pqrsRes] = await Promise.all([
      supabase.from('profiles').select('role'),
      supabase.from('pqrs').select('estado'),
    ]);

    const users = usersRes.data || [];
    const pqrs = pqrsRes.data || [];

    return {
      totalUsuarios: users.length,
      totalCiudadanos: users.filter(u => u.role === 'ciudadano').length,
      totalFuncionarios: users.filter(u => u.role === 'funcionario').length,
      totalAdministradores: users.filter(u => u.role === 'administrador').length,
      totalPqrs: pqrs.length,
      pqrsEnTramite: pqrs.filter(p => p.estado === 'En trámite').length,
      pqrsResueltas: pqrs.filter(p => p.estado === 'Resuelto').length,
    };
  }
};
