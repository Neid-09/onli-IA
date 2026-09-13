import type { IAIProvider, ExtractedDocumentData } from './aiTypes';
import { GeminiProvider } from './geminiProvider';

class AIService {
  private provider: IAIProvider;

  constructor() {
    // Proveedor por defecto: Gemini Multimodal
    this.provider = new GeminiProvider();
  }

  /**
   * Permite alternar de proveedor en caliente (ej: cambiar a Grok u otro)
   */
  setProvider(provider: IAIProvider) {
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Procesa una imagen o documento escaneado mediante OCR inteligente
   */
  async extractFromDocument(base64Data: string, mimeType: string): Promise<ExtractedDocumentData> {
    return await this.provider.extractDocumentData(base64Data, mimeType);
  }

  /**
   * Consulta interactiva al asistente de IA
   */
  async askAssistant(prompt: string, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    return await this.provider.chat(prompt, history);
  }
}

export const aiService = new AIService();
