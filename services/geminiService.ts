import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a text response based on chat history and character persona.
 * Supports optional image input.
 */
export const generateChatResponse = async (
  prompt: string,
  imageData: { mimeType: string; data: string } | null,
  history: { role: string; parts: { text: string }[] }[],
  systemInstruction: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the current message contents
    const currentParts: any[] = [];
    
    // Add image if present
    if (imageData) {
      currentParts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data
        }
      });
    }
    
    // Add text prompt
    if (prompt) {
      currentParts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history, // Previous messages
        { role: 'user', parts: currentParts } // Current message with text and/or image
      ],
      config: {
        systemInstruction,
        temperature: 0.8, // Slightly creative
      }
    });

    return response.text || "Desculpe, não consegui pensar em nada.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
};

/**
 * Converts text to speech using the Gemini TTS model.
 * Returns the base64 encoded audio string.
 */
export const generateSpeech = async (text: string, voiceName: VoiceName): Promise<string> => {
  try {
    const model = "gemini-2.5-flash-preview-tts";
    
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from API");
    }

    return base64Audio;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};