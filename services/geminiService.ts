import { GoogleGenAI } from "@google/genai";
import { Medicine } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const askDrugInfo = async (query: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: "You are a helpful pharmaceutical assistant. Provide concise, accurate information about medicines, side effects, interactions, and dosage guidelines. Format your response in clean Markdown. Do not give medical advice for severe conditions; always recommend consulting a doctor.",
      }
    });
    return response.text || "No information available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error retrieving information. Please try again.";
  }
};

export const analyzeInventory = async (inventory: Medicine[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable.";

  const inventorySummary = inventory.map(m => ({
    name: m.name,
    stock: m.stock,
    expiry: m.expiryDate,
    category: m.category
  }));

  const prompt = `Analyze this medicine inventory data: ${JSON.stringify(inventorySummary)}. 
  Identify items with low stock (less than 10) or expiring soon (within 3 months). 
  Suggest a restocking priority list and any merchandising tips based on categories. 
  Keep it concise and actionable.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing inventory.";
  }
};
