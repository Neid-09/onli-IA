import type { IAIProvider, ExtractedDocumentData } from './aiTypes';

export class GroqProvider implements IAIProvider {
  name = 'Groq Vision LPU (Qwen)';
  private apiKey: string;
  private primaryModel = 'qwen/qwen3.8-27b';
  private fallbackModels = ['qwen/qwen3.6-27b'];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  }

  async extractDocumentData(base64Data: string, mimeType: string): Promise<ExtractedDocumentData> {
    if (!this.apiKey) {
      throw new Error('No se ha configurado la API Key de Groq (VITE_GROQ_API_KEY).');
    }

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const dataUrl = `data:${mimeType || 'image/png'};base64,${cleanBase64}`;

    const systemPrompt = `Eres un asistente experto en digitalización y OCR de documentos de la administración pública.
Analiza la imagen adjunta de una petición, derecho de petición, oficio o reclamo ciudadano.
Extrae y devuelve EXCLUSIVAMENTE un objeto JSON válido con las siguientes propiedades:
{
  "solicitante": "Nombre completo de la persona que firma o radica la solicitud, o string vacío si no se encuentra",
  "identificacion": "Número de cédula o documento de identidad si aparece, o string vacío",
  "email": "Correo electrónico mencionado en el documento si aparece, o string vacío",
  "categoria": "Una de las siguientes opciones según el tema: 'Agua y Alcantarillado', 'Basuras', 'Alumbrado', 'Vías y Espacio Público', 'Seguridad y Convivencia', 'Trámite Administrativo'",
  "asunto": "Resumen claro de 1 línea del objeto de la petición",
  "descripcion": "Transcripción clara y fiel de los hechos y la petición puntual redactada en el documento",
  "rawText": "Transcripción completa de todo el texto visible legible en el documento"
}`;

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: systemPrompt },
                  {
                    type: 'image_url',
                    image_url: { url: dataUrl }
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 600
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || `Error HTTP ${res.status}`);
        }

        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error('Respuesta vacía de Groq');
        }

        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as ExtractedDocumentData;
        }

        return {
          descripcion: rawContent,
          rawText: rawContent
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Fallo con el modelo Groq ${model}:`, err.message);
      }
    }

    throw new Error(`No fue posible procesar el documento con Groq OCR: ${lastError?.message || 'Error desconocido'}`);
  }

  async chat(prompt: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No se ha configurado la API Key de Groq.');
    }

    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.primaryModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Error HTTP ${res.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  }
}
