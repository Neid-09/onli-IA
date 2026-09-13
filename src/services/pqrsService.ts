import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PQRS, PQRSRow } from '../types/database.types';

// Adaptador de la fila de Supabase al modelo de la UI
function mapRowToPQRS(row: PQRSRow): PQRS {
  return {
    id: row.id,
    solicitante: row.solicitante,
    categoria: row.categoria,
    descripcion: row.descripcion,
    estado: row.estado,
    fechaRadicacion: row.fecha_radicacion,
    plazoLegal: row.plazo_legal,
    respuestaOficial: row.respuesta_oficial || '',
    created_at: row.created_at,
  };
}

export const pqrsService = {
  /**
   * Obtiene todos los registros de trámites/PQRS
   */
  async getAll(): Promise<PQRS[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pqrs')
          .select('*')
          .order('fecha_radicacion', { ascending: false });

        if (error) {
          console.error('Error al consultar Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
          return (data as PQRSRow[]).map(mapRowToPQRS);
        }
      } catch (err) {
        console.warn('Fallo al consultar Supabase, intentando fallback local...', err);
      }
    }

    // Fallback a la API local de contingencia
    const res = await fetch('/api/pqrs');
    if (!res.ok) {
      throw new Error('No fue posible cargar los expedientes.');
    }
    return await res.json();
  },

  /**
   * Obtiene un trámite por su ID de radicado
   */
  async getById(id: string): Promise<PQRS | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pqrs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`Error al buscar ID ${id} en Supabase:`, error);
          throw error;
        }

        if (data) {
          return mapRowToPQRS(data as PQRSRow);
        }
      } catch (err) {
        console.warn('Fallo en Supabase getById, intentando fallback local...', err);
      }
    }

    // Fallback local
    const all = await this.getAll();
    return all.find((item) => item.id.toLowerCase() === id.toLowerCase()) || null;
  },

  /**
   * Crea un nuevo trámite en Supabase
   */
  async create(nuevo: Omit<PQRS, 'created_at'>): Promise<PQRS> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no está configurado para operaciones de escritura.');
    }

    const rowToInsert: Partial<PQRSRow> = {
      id: nuevo.id,
      solicitante: nuevo.solicitante,
      categoria: nuevo.categoria,
      descripcion: nuevo.descripcion,
      estado: nuevo.estado || 'En trámite',
      fecha_radicacion: nuevo.fechaRadicacion || new Date().toISOString(),
      plazo_legal: nuevo.plazoLegal,
      respuesta_oficial: nuevo.respuestaOficial || '',
    };

    const { data, error } = await supabase
      .from('pqrs')
      .insert([rowToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error al insertar en Supabase:', error);
      throw error;
    }

    return mapRowToPQRS(data as PQRSRow);
  }
};
