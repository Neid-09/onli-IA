import type { IAIProvider, ExtractedDocumentData } from './aiTypes';
import { GeminiProvider } from './geminiProvider';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

class AIService {
  private chatProvider: IAIProvider;
  private ocrProvider: IAIProvider;
  private isLoaded = false;

  constructor() {
    this.chatProvider = new GeminiProvider();
    this.ocrProvider = new GeminiProvider();
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
        if (config.id === 'chat_assistant' && config.provider === 'gemini') {
          this.chatProvider = new GeminiProvider(config.api_key);
        } else if (config.id === 'ocr_multimodal' && config.provider === 'gemini') {
          this.ocrProvider = new GeminiProvider(config.api_key);
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
}

export const aiService = new AIService();
