import { useState, useEffect } from 'react';
import { Bot, Eye, EyeOff, Check, AlertCircle, Loader2, Sparkles, Cpu, ScanLine, BookOpen } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { SystemAIConfig } from '../../types/database.types';

export default function AIConfigTab() {
  const [configs, setConfigs] = useState<SystemAIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAIConfigs();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las configuraciones de IA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleFieldChange = (id: string, field: keyof SystemAIConfig, value: any) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = async (config: SystemAIConfig) => {
    setTestingId(config.id);
    setTestResults(prev => {
      const copy = { ...prev };
      delete copy[config.id];
      return copy;
    });

    const result = await adminService.testAIConnection(config.provider, config.model_name, config.api_key);
    setTestResults(prev => ({ ...prev, [config.id]: result }));
    setTestingId(null);
  };

  const handleSaveConfig = async (config: SystemAIConfig) => {
    setSavingId(config.id);
    try {
      await adminService.saveAIConfig(config);
      setSaveMessages(prev => ({ ...prev, [config.id]: '¡Configuración guardada exitosamente!' }));
      setTimeout(() => {
        setSaveMessages(prev => {
          const copy = { ...prev };
          delete copy[config.id];
          return copy;
        });
      }, 3500);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const providerModels: Record<string, string[]> = {
    gemini: [
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemma-4-26b-a4b-it'
    ],
    grok: [
      'grok-2-latest',
      'grok-2-vision-1212',
      'grok-beta'
    ],
    openai: [
      'gpt-4o',
      'gpt-4o-mini'
    ]
  };

  const getIconForType = (id: string) => {
    if (id === 'chat_assistant') return <Bot size={22} className="text-blue-600" />;
    if (id === 'ocr_multimodal') return <ScanLine size={22} className="text-indigo-600" />;
    return <BookOpen size={22} className="text-purple-600" />;
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Cargando parámetros de Inteligencia Artificial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Parametrización de Motores de IA</h3>
        <p className="text-slate-500 text-sm">
          Configura los proveedores, modelos y credenciales de IA según su propósito dentro de la plataforma
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Configuraciones */}
      <div className="grid grid-cols-1 gap-6">
        {configs.map((config) => {
          const availableModels = providerModels[config.provider] || [config.model_name];
          const isTesting = testingId === config.id;
          const isSaving = savingId === config.id;
          const testResult = testResults[config.id];
          const saveMsg = saveMessages[config.id];

          return (
            <div
              key={config.id}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getIconForType(config.id)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{config.name}</h4>
                    <p className="text-xs text-slate-500 max-w-xl">{config.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Estado:</label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(config.id, 'is_active', !config.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      config.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {/* Proveedor */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Proveedor de IA
                  </label>
                  <select
                    value={config.provider}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      handleFieldChange(config.id, 'provider', newProv);
                      const defModel = providerModels[newProv]?.[0] || '';
                      if (defModel) handleFieldChange(config.id, 'model_name', defModel);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium capitalize"
                  >
                    <option value="gemini">Google Gemini (Recomendado)</option>
                    <option value="grok">xAI Grok</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Cpu size={14} /> Modelo Seleccionado
                  </label>
                  <select
                    value={config.model_name}
                    onChange={(e) => handleFieldChange(config.id, 'model_name', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    API Key de Acceso
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[config.id] ? 'text' : 'password'}
                      value={config.api_key || ''}
                      onChange={(e) => handleFieldChange(config.id, 'api_key', e.target.value)}
                      placeholder="Pega la API Key del proveedor..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(config.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showKeys[config.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultado del Test */}
              {testResult && (
                <div className={`mt-5 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
                  testResult.success 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {testResult.success ? <Check size={16} className="shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 text-red-600" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {saveMsg && (
                <div className="mt-5 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check size={16} className="shrink-0 text-blue-600" />
                  <span>{saveMsg}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleTestConnection(config)}
                  disabled={isTesting || !config.api_key}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Probar Conexión en Vivo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveConfig(config)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
