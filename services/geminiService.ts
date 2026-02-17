import { GoogleGenAI, Type } from "@google/genai";
import { Resource } from '../types';

const apiKey = process.env.API_KEY || ''; 
// In a real app, we would handle the missing key more gracefully in the UI.
// For now, we assume it's injected or valid.

const ai = new GoogleGenAI({ apiKey });

export const generateEventDescription = async (title: string, roughNotes: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Please configure your environment.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an event marketing expert for a university. 
      Write a compelling, exciting event description (max 150 words) for a campus event.
      Event Title: ${title}
      Notes: ${roughNotes}
      
      Include a catchy hook and clear value proposition for students.`,
    });
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const recommendResource = async (requirement: string, availableResources: Resource[]): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  // Simplify resource list for token efficiency
  const resourceSummary = availableResources.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    capacity: r.capacity,
    features: r.features
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I have these campus resources: ${JSON.stringify(resourceSummary)}.
      
      A user needs: "${requirement}".
      
      Recommend the best SINGLE resource ID from the list. 
      Return ONLY the JSON object with the resourceId and a short reason.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resourceId: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};
