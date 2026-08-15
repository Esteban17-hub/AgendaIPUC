import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

// Inicializador dinámico para permitir clave desde .env o localStorage
export function getAI() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const localKey = localStorage.getItem('deborita_gemini_key');
  const key = localKey || envKey;
  
  if (!key) {
    throw new Error('No se encontró una clave API para Tesorito. Configúrala en el sistema.');
  }
  
  if (!genAIInstance || genAIInstance.apiKey !== key) {
    genAIInstance = new GoogleGenerativeAI(key);
    genAIInstance.apiKey = key;
  }
  return genAIInstance;
}

export async function processWithTesorito(text, base64Image = null, mimeType = null) {
  try {
    const ai = getAI();
    // Usar gemini-1.5-flash para velocidad y soporte multimodal
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
Eres "Tesorito", el asistente de contabilidad inteligente de una iglesia.
Tu tarea es analizar el texto o la imagen de un comprobante proporcionado por el usuario y extraer los datos para registrar un asiento contable.

Debes responder SIEMPRE Y ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni texto adicional).
El JSON debe tener la siguiente estructura estricta:

{
  "action": "CREATE_OFFERING" | "CREATE_TITHE" | "CREATE_MOVEMENT" | "CREATE_PROJECT" | "UNKNOWN",
  "data": {
    // Si es CREATE_OFFERING:
    "amount": numero,
    "destinationCommitteeName": string o null,
    "description": string (ej: nombre de quien da o detalle),
    "date": "YYYY-MM-DD"
    
    // Si es CREATE_TITHE:
    "grossIncome": numero,
    "date": "YYYY-MM-DD",
    "memberOrGroupName": string (nombre del hermano o grupo de balance)
    
    // Si es CREATE_MOVEMENT:
    "type": "INGRESO" | "EGRESO",
    "amount": numero,
    "committeeName": string,
    "description": string,
    "date": "YYYY-MM-DD"
    
    // Si es CREATE_PROJECT:
    "name": string,
    "targetAmount": numero o null,
    "description": string
  },
  "confidence": numero (0 a 100, indicando seguridad de la lectura),
  "humanSummary": "Un mensaje amigable y corto en español explicando qué entendiste. (Ej: 'Entendí que es una ofrenda de $50,000 para el Comité de Damas.')"
}

REGLAS VITALES:
- Usa la fecha actual si no se especifica (asume ${new Date().toISOString().slice(0, 10)}).
- Elimina cualquier formato de moneda, solo usa números enteros (ej. 50000, no "50.000").
- Si no estás seguro de la acción, retorna "action": "UNKNOWN".
- Intenta deducir de qué comité hablan basándote en palabras clave (ej: damas, jóvenes, escuela dominical, construcción).
- NUNCA devuelvas nada que no sea JSON.
`;

    const prompt = `Analiza la siguiente instrucción o comprobante y conviértelo a formato contable JSON.\n\nInstrucción del usuario: "${text || 'Ninguna, lee la imagen.'}"`;

    let result;
    if (base64Image && mimeType) {
      // Remover prefijos data:image/png;base64, si existen
      const cleanBase64 = base64Image.split(',').pop();
      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      };
      result = await model.generateContent([systemInstruction, prompt, imagePart]);
    } else {
      result = await model.generateContent([systemInstruction, prompt]);
    }

    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Limpiar markdown si el modelo lo agrega por error
    textResponse = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    try {
      const jsonParsed = JSON.parse(textResponse);
      return jsonParsed;
    } catch (parseError) {
      console.error("Respuesta cruda de IA:", textResponse);
      throw new Error("Tesorito devolvió un formato irreconocible.");
    }
  } catch (err) {
    console.error("Error en Tesorito:", err);
    throw err;
  }
}
