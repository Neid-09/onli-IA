export interface PQRS {
  id: string;
  solicitante: string;
  categoria: string;
  descripcion: string;
  estado: 'En trámite' | 'Resuelto' | 'Pendiente' | 'Rechazado' | string;
  fechaRadicacion: string;
  plazoLegal: string;
  respuestaOficial: string;
  respuestaBorradorIa?: string;
  funcionarioResponsable?: string;
  fechaResolucion?: string;
  fundamentoLegal?: string;
  created_at?: string;
}

export interface PQRSRow {
  id: string;
  solicitante: string;
  categoria: string;
  descripcion: string;
  estado: string;
  fecha_radicacion: string;
  plazo_legal: string;
  respuesta_oficial: string;
  respuesta_borrador_ia?: string;
  funcionario_responsable?: string;
  fecha_resolucion?: string;
  fundamento_legal?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'ciudadano' | 'funcionario' | 'administrador';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface SystemAIConfig {
  id: 'chat_assistant' | 'ocr_multimodal' | 'embeddings_search' | string;
  name: string;
  description?: string;
  provider: 'gemini' | 'grok' | 'openai' | string;
  model_name: string;
  api_key: string;
  is_active: boolean;
  updated_at?: string;
}
