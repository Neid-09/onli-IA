import type { IAIProvider, ExtractedDocumentData, GeminiModel } from './aiTypes';

export class GeminiProvider implements IAIProvider {
  name = 'Google Gemini Multimodal';
  private apiKey: string;
  private primaryModel: GeminiModel = 'gemini-flash-latest';
  private fallbackModels: GeminiModel[] = [
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemma-4-26b-a4b-it'
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  private async callGemini(model: GeminiModel, contents: any[]): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en modelo ${model} (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async extractDocumentData(base64Data: string, mimeType: string): Promise<ExtractedDocumentData> {
    if (!this.apiKey) {
      throw new Error('No se ha configurado la API Key de Gemini (VITE_GEMINI_API_KEY).');
    }

    // Remover prefijo data:image/...;base64, si viene incluido
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

    const systemPrompt = `Eres un asistente experto en digitalización y OCR de documentos de la administración pública.
Analiza la imagen adjunta de una petición, derecho de petición, oficio o reclamo ciudadano.
Extrae y devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin bloques de código, solo el json plano) con las siguientes propiedades:
{
  "solicitante": "Nombre completo de la persona que firma o radica la solicitud, o string vacío si no se encuentra",
  "identificacion": "Número de cédula o documento de identidad si aparece, o string vacío",
  "email": "Correo electrónico mencionado en el documento si aparece, o string vacío",
  "categoria": "Una de las siguientes opciones según el tema: 'Agua y Alcantarillado', 'Basuras', 'Alumbrado', 'Vías y Espacio Público', 'Seguridad y Convivencia', 'Trámite Administrativo'",
  "asunto": "Resumen claro de 1 línea del objeto de la petición",
  "descripcion": "Transcripción clara y fiel de los hechos y la petición puntual redactada en el documento",
  "rawText": "Transcripción completa de todo el texto visible legible en el documento"
}`;

    const contents = [
      {
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ];

    // Intentar con el modelo primario y continuar con fallbacks si es necesario
    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const result = await this.callGemini(model, contents);
        const candidate = result.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('Respuesta vacía del modelo');
        }

        // Limpiar posibles bloques ```json ... ```
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as ExtractedDocumentData;
        }

        return {
          descripcion: text,
          rawText: text,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Fallo con el modelo ${model}, intentando siguiente...`, err.message);
      }
    }

    throw new Error(`No fue posible procesar el documento con OCR: ${lastError?.message || 'Error desconocido'}`);
  }

  async chat(prompt: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No se ha configurado la API Key de Gemini.');
    }

    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const result = await this.callGemini(model, contents);
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(`Error en el asistente virtual: ${lastError?.message}`);
  }
}
