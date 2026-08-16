// Motor de Inteligencia Artificial para Tesorito
// Soporta nativamente Groq (Llama 3) y como fallback Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

export function getAI() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const localKey = localStorage.getItem('deborita_gemini_key');
  const key = (localKey || envKey)?.trim();
  
  if (!key) {
    throw new Error('No se encontró una clave API para Tesorito. Configúrala en el sistema.');
  }
  return key;
}

export async function processWithTesorito(text, base64Image = null, mimeType = null) {
  try {
    const apiKey = getAI();

    const systemInstruction = `
Eres "Tesorito", el asistente de contabilidad inteligente de una iglesia.
Tu tarea es analizar el texto o la imagen de un comprobante proporcionado por el usuario y extraer los datos para registrar un asiento contable.

Debes responder SIEMPRE Y ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni texto adicional).
El JSON debe tener la siguiente estructura estricta:

{
  "action": "CREATE_OFFERING" | "CREATE_TITHE" | "CREATE_MOVEMENT" | "CREATE_PROJECT" | "UNKNOWN",
  "data": {
    "amount": numero,
    "destinationCommitteeName": string o null,
    "description": string,
    "date": "YYYY-MM-DD",
    "memberOrGroupName": string,
    "type": "INGRESO" | "EGRESO",
    "committeeName": string,
    "name": string,
    "targetAmount": numero o null
  },
  "confidence": numero (0 a 100, indicando seguridad de la lectura),
  "humanSummary": "Un mensaje amigable y corto en español explicando qué entendiste."
}

REGLAS VITALES:
- Usa la fecha actual si no se especifica (asume ${new Date().toISOString().slice(0, 10)}).
- Elimina cualquier formato de moneda, solo usa números enteros (ej. 50000, no "50.000").
- Si no estás seguro de la acción, retorna "action": "UNKNOWN".
- NUNCA devuelvas nada que no sea JSON puro.
`;

    const promptText = `Analiza la siguiente instrucción o comprobante y conviértelo a formato contable JSON.\n\nInstrucción del usuario: "${text || 'Ninguna, lee la imagen.'}"`;

    // Lógica dual: Si la llave parece de Google, usa Gemini SDK; si no, usa Groq vía Fetch
    if (apiKey.startsWith('AIzaSy')) {
      if (!genAIInstance || genAIInstance.apiKey !== apiKey) {
        genAIInstance = new GoogleGenerativeAI(apiKey);
        genAIInstance.apiKey = apiKey;
      }
      const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let result;
      if (base64Image && mimeType) {
        result = await model.generateContent([systemInstruction, promptText, { inlineData: { data: base64Image.split(',').pop(), mimeType } }]);
      } else {
        result = await model.generateContent([systemInstruction, promptText]);
      }
      const response = await result.response;
      let textResponse = response.text().trim();
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      return JSON.parse(textResponse);
    } else {
      let messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ];

      let modelName = "llama-3.1-8b-instant";

      if (base64Image && mimeType) {
        modelName = "llama-3.2-90b-vision-preview";
        const cleanBase64 = base64Image.split(',').pop();
        messages[1].content = [
          { type: "text", text: promptText },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${cleanBase64}` } }
        ];
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`Error de red o clave API inválida. (Código: ${response.status})`);
      const result = await response.json();
      let textResponse = result.choices[0].message.content.trim();
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      return JSON.parse(textResponse);
    }
  } catch (err) {
    console.error("Error en Tesorito:", err);
    throw new Error(err.message || "Fallo en la comunicación con la Inteligencia Artificial.");
  }
}
