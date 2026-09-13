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
    respuestaBorradorIa: row.respuesta_borrador_ia || '',
    funcionarioResponsable: row.funcionario_responsable || '',
    fechaResolucion: row.fecha_resolucion,
    fundamentoLegal: row.fundamento_legal || '',
    userId: row.user_id || undefined,
    solicitanteEmail: row.solicitante_email || undefined,
    created_at: row.created_at,
  };
}

export const pqrsService = {
  /**
   * Obtiene todos los registros de trámites/PQRS (opcionalmente filtrados por usuario titular)
   */
  async getAll(userId?: string): Promise<PQRS[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('pqrs')
          .select('*')
          .order('fecha_radicacion', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

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
   * Crea un nuevo trámite en Supabase y genera automáticamente el borrador de respuesta con IA
   */
  async create(nuevo: Omit<PQRS, 'created_at'>): Promise<PQRS> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no está configurado para operaciones de escritura.');
    }

    let borradorIa = nuevo.respuestaBorradorIa || '';
    let fundamento = nuevo.fundamentoLegal || '';

    // Si no trae borrador previo, la IA lo genera automáticamente
    if (!borradorIa) {
      try {
        const { aiService } = await import('./ai/aiService');
        const resolucionPromise = aiService.generateOfficialResolution(
          nuevo.id,
          nuevo.categoria,
          nuevo.solicitante,
          nuevo.descripcion
        );

        // Timeout de seguridad de 4 segundos para no bloquear la experiencia de radicación
        const timeoutPromise = new Promise<{ propuesta: string; fundamento: string }>((resolve) =>
          setTimeout(() => resolve({ propuesta: '', fundamento: '' }), 4000)
        );

        const res = await Promise.race([resolucionPromise, timeoutPromise]);
        if (res.propuesta) {
          borradorIa = res.propuesta;
          fundamento = res.fundamento;
        } else {
          // Si tardó más del timeout, dejar la tarea en segundo plano para guardarlo al concluir
          resolucionPromise
            .then(async (lateRes) => {
              if (lateRes.propuesta) {
                await this.guardarBorradorIA(nuevo.id, lateRes.propuesta, lateRes.fundamento);
              }
            })
            .catch((err) => console.warn('[IA Auto-Delegación Background] Error:', err));
        }
      } catch (err) {
        console.warn('[IA Auto-Delegación] No se pudo generar borrador previo:', err);
      }
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
      respuesta_borrador_ia: borradorIa,
      fundamento_legal: fundamento,
      user_id: nuevo.userId || null,
      solicitante_email: nuevo.solicitanteEmail || '',
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
  },

  /**
   * Resuelve oficialmente una PQRS con visto bueno de un funcionario
   */
  async resolverPQRS(
    id: string,
    respuestaOficial: string,
    funcionarioNombre: string,
    fundamentoLegal?: string
  ): Promise<PQRS> {
    if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.');

    const updatePayload: Partial<PQRSRow> = {
      estado: 'Resuelto',
      respuesta_oficial: respuestaOficial.trim(),
      funcionario_responsable: funcionarioNombre.trim(),
      fecha_resolucion: new Date().toISOString(),
      fundamento_legal: fundamentoLegal ? fundamentoLegal.trim() : '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pqrs')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error al resolver PQRS ${id}:`, error);
      throw error;
    }

    return mapRowToPQRS(data as PQRSRow);
  },

  /**
   * Guarda un borrador generado por la IA para revisión posterior
   */
  async guardarBorradorIA(id: string, borrador: string, fundamentoLegal?: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('pqrs')
      .update({
        respuesta_borrador_ia: borrador,
        fundamento_legal: fundamentoLegal || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error(`Error al guardar borrador de IA para PQRS ${id}:`, error);
    }
  }
};
