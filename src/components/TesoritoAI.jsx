import React, { useState, useRef } from 'react';
import { Bot, X, Send, Image as ImageIcon, CheckCircle2, AlertTriangle, Settings, Loader2 } from 'lucide-react';
import { processWithTesorito } from '../services/aiEngine';
import { toast } from 'react-hot-toast';

export default function TesoritoAI({ onAIAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('deborita_gemini_key') || '');
  
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor sube una imagen válida.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage({
          base64: event.target.result,
          mimeType: file.type
        });
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem('deborita_gemini_key', apiKey.trim());
      toast.success('Clave API guardada exitosamente.');
      setShowSettings(false);
    } else {
      localStorage.removeItem('deborita_gemini_key');
      toast.success('Clave API eliminada.');
      setShowSettings(false);
    }
  };

  const handleProcess = async () => {
    if (!text.trim() && !image) {
      toast.error('Escribe algo o sube una imagen.');
      return;
    }

    setIsProcessing(true);
    setPendingConfirmation(null);

    try {
      const result = await processWithTesorito(text, image?.base64, image?.mimeType);
      
      if (result.action === 'UNKNOWN') {
        toast.error('Tesorito no entendió la instrucción. Sé más específico.');
      } else {
        setPendingConfirmation(result);
      }
    } catch (err) {
      toast.error(err.message || 'Error procesando con IA.');
      if (err.message && err.message.includes('API')) {
        setShowSettings(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = () => {
    if (pendingConfirmation) {
      onAIAction(pendingConfirmation.action, pendingConfirmation.data);
      toast.success('¡Registro creado mágicamente por Tesorito!');
      resetState();
      setIsOpen(false);
    }
  };

  const resetState = () => {
    setText('');
    setImage(null);
    setImagePreview(null);
    setPendingConfirmation(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Bot className="w-6 h-6 group-hover:animate-bounce" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tesorito AI</h3>
              <p className="text-violet-100 text-xs">Asistente Contable Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-5 overflow-y-auto flex-1">
          {showSettings ? (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Configuración de Inteligencia Artificial</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tesorito requiere una clave de Google Gemini (gemini-1.5-flash). Puedes configurarla aquí de manera local para este dispositivo.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">API Key de Gemini</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          ) : pendingConfirmation ? (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-start gap-4">
                <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <p className="text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                    "{pendingConfirmation.humanSummary}"
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-semibold">
                    Confianza: {pendingConfirmation.confidence}%
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Datos Extraídos</h5>
                <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(pendingConfirmation.data, null, 2)}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetState}
                  className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar y Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-800/50">
                <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed">
                  <strong>¡Hola! Soy Tesorito.</strong> Cuéntame qué necesitas registrar o sube una foto de un recibo. Yo me encargaré de clasificarlo.
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ej: Registra un diezmo de 50000 del hermano Juan de hoy. O 'Salieron 20000 del comite de jovenes para pizzas'."
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
              />

              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Comprobante" className="h-24 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                  <button
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                  title="Subir Imagen/Recibo"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Foto</span>
                </button>
                
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || (!text.trim() && !image)}
                  className="flex-1 p-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Procesar con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
