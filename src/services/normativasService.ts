import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Normativa {
  id: number;
  titulo: string;
  categoria: string;
  articulo: string;
  contenido: string;
  fuente_legal: string;
  rank?: number;
}

export const normativasService = {
  /**
   * Obtiene todas las normativas disponibles
   */
  async getAll(): Promise<Normativa[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('normativas')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al obtener normativas:', error);
      throw error;
    }

    return (data || []) as Normativa[];
  },

  /**
   * Búsqueda semántica / contextual de normativas por lenguaje natural
   */
  async search(query: string): Promise<Normativa[]> {
    if (!query.trim()) {
      return this.getAll();
    }

    if (!isSupabaseConfigured) return [];

    try {
      // Intentar RPC search_normativas
      const { data, error } = await supabase.rpc('search_normativas', {
        search_query: query.trim(),
        max_results: 15,
      });

      if (!error && data && data.length > 0) {
        return data as Normativa[];
      }
    } catch (err) {
      console.warn('Fallo en RPC search_normativas, aplicando filtro ILIKE...', err);
    }

    // Fallback: Búsqueda con operadores de texto ILIKE
    const { data, error } = await supabase
      .from('normativas')
      .select('*')
      .or(`titulo.ilike.%${query}%,contenido.ilike.%${query}%,categoria.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error en fallback de normativas:', error);
      return [];
    }

    return (data || []) as Normativa[];
  }
};
