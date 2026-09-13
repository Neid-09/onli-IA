import type { IAIProvider, ExtractedDocumentData } from './aiTypes';
import { GeminiProvider } from './geminiProvider';
import { GroqProvider } from './groqProvider';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

class AIService {
  private chatProvider: IAIProvider;
  private ocrProvider: IAIProvider;
  private isLoaded = false;

  constructor() {
    this.chatProvider = new GeminiProvider();
    // Por defecto usar Groq para OCR según la solicitud
    this.ocrProvider = new GroqProvider();
  }

  /**
   * Sincroniza los proveedores con la configuración activa en base de datos
   */
  async syncWithDatabase(): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('system_ai_configs')
        .select('*')
        .eq('is_active', true);

      if (error || !data) return;

      for (const config of data) {
        if (config.id === 'chat_assistant') {
          if (config.provider === 'groq') {
            this.chatProvider = new GroqProvider(config.api_key);
          } else {
            this.chatProvider = new GeminiProvider(config.api_key);
          }
        } else if (config.id === 'ocr_multimodal') {
          if (config.provider === 'groq') {
            this.ocrProvider = new GroqProvider(config.api_key);
          } else {
            this.ocrProvider = new GeminiProvider(config.api_key);
          }
        }
      }

      this.isLoaded = true;
    } catch (err) {
      console.warn('No se pudieron sincronizar las configuraciones de IA desde Supabase, usando default.', err);
    }
  }

  getProviderName(): string {
    return this.chatProvider.name;
  }

  /**
   * Procesa una imagen o documento escaneado mediante OCR inteligente
   */
  async extractFromDocument(base64Data: string, mimeType: string): Promise<ExtractedDocumentData> {
    if (!this.isLoaded) await this.syncWithDatabase();
    return await this.ocrProvider.extractDocumentData(base64Data, mimeType);
  }

  /**
   * Consulta interactiva al asistente de IA
   */
  async askAssistant(prompt: string, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    if (!this.isLoaded) await this.syncWithDatabase();
    return await this.chatProvider.chat(prompt, history);
  }

  /**
   * Genera un borrador de resolución oficial institucional con Copiloto IA fundamentado en normativas
   */
  async generateOfficialResolution(
    solicitante: string,
    categoria: string,
    descripcion: string,
    id: string
  ): Promise<{ propuesta: string; fundamento: string }> {
    if (!this.isLoaded) await this.syncWithDatabase();

    // 1. Consultar normativas relevantes a la categoría
    let contextNormas = '';
    try {
      const { data: normas } = await supabase
        .from('normativas')
        .select('titulo, articulo, contenido, fuente_legal')
        .or(`categoria.ilike.%${categoria}%,contenido.ilike.%${categoria}%`)
        .limit(3);

      if (normas && normas.length > 0) {
        contextNormas = normas.map(n => `- ${n.titulo} (${n.fuente_legal}, ${n.articulo}): ${n.contenido}`).join('\n');
      }
    } catch {
      // Continuar con prompt base si falla
    }

    const prompt = `Actúa como asesor jurídico y redactor oficial de la Administración Municipal (Gobierno Local).
Tu tarea es redactar una RESOLUCIÓN OFICIAL FORMAL para dar respuesta a la siguiente Petición/PQRS ciudadana.

DATOS DEL EXPEDIENTE:
- Número de Radicado: ${id}
- Ciudadano Peticionario: ${solicitante}
- Categoría del Trámite: ${categoria}
- Hechos y Solicitud del Ciudadano: "${descripcion}"

MARCO JURÍDICO APLICABLE:
${contextNormas || '- Ley 1437 de 2011 (Código de Procedimiento Administrativo y de lo Contencioso Administrativo)'}

INSTRUCCIONES DE REDACCIÓN:
1. Redacta un oficio formal, claro, respetuoso y con alta calidad institucional.
2. Debe contener:
   - Saludo protocolario al ciudadano.
   - Referencia al radicado y síntesis de la solicitud.
   - Fundamentación legal (cita de normas o decretos aplicables).
   - Acciones concretas adoptadas por la administración (inspección técnica, reprogramación de cuadrilla, reparación o respuesta de fondo según el caso).
   - Canales para seguimiento y despedida oficial institucional.
3. Responde EXCLUSIVAMENTE con un JSON plano sin bloques markdown:
{
  "propuesta": "...texto completo redactado de la resolución oficial...",
  "fundamento": "...artículos o leyes principales citadas en la respuesta..."
}`;

    try {
      const rawResponse = await this.chatProvider.chat(prompt);
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          propuesta: parsed.propuesta || rawResponse,
          fundamento: parsed.fundamento || 'Ley 1437 de 2011 - CPACA',
        };
      }
      return {
        propuesta: rawResponse,
        fundamento: 'Ley 1437 de 2011 - CPACA',
      };
    } catch (err: any) {
      return {
        propuesta: `En atención a su requerimiento radicado bajo el expediente ${id}, la Administración Municipal le informa que su solicitud relativa a ${categoria} ha sido revisada por el equipo técnico competente. Se han coordinado las acciones operativas pertinentes en el sector indicado para brindar solución oportuna conforme a los plazos previstos en la Ley 1437 de 2011.`,
        fundamento: 'Ley 1437 de 2011, Artículo 14',
      };
    }
  }
}

export const aiService = new AIService();
