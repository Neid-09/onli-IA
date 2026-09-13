export interface ExtractedDocumentData {
  solicitante?: string;
  identificacion?: string;
  email?: string;
  categoria?: 'Agua y Alcantarillado' | 'Basuras' | 'Alumbrado' | 'Vías y Espacio Público' | 'Seguridad y Convivencia' | 'Trámite Administrativo' | string;
  asunto?: string;
  descripcion?: string;
  rawText?: string;
}

export type GeminiModel = 
  | 'gemini-3.7-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.1-flash-lite'
  | 'gemma-4-26b-a4b-it'
  | 'gemini-flash-latest';

export interface IAIProvider {
  name: string;
  extractDocumentData(base64Data: string, mimeType: string): Promise<ExtractedDocumentData>;
  chat(prompt: string, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<string>;
}
