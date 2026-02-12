
import { GoogleGenAI, Type } from "@google/genai";
import { MotivationContent, Category } from "../types";

/**
 * Helper function to generate a category-specific prompt for the motivation content.
 */
const getCategoryPrompt = (category: Category): string => {
  switch (category) {
    case 'love':
      return "Generate a beautiful, romantic, and deep love quote in Hindi (Shayari style or modern). It should be emotional and perfect for a couple's photo background.";
    case 'trading':
      return "Generate a high-energy motivational quote about stock market trading, crypto, or financial discipline in Hindi. Mention success, patience, or risk management.";
    case 'friendship':
      return "Generate a heartwarming quote about true friendship and loyalty in Hindi. Something that friends would want to share with each other.";
    case 'motivational':
    default:
      return "Generate a powerful motivational quote for success, hard work, or personal growth in Hindi. Make it punchy and impactful.";
  }
};

/**
 * Generates text content (title, body, and background theme) using gemini-3-flash-preview.
 */
export async function generateMotivationContent(category: Category = 'motivational'): Promise<MotivationContent> {
  try {
    // Always initialize a new GoogleGenAI instance right before the API call to ensure current configuration.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categorySpecificPrompt = getCategoryPrompt(category);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${categorySpecificPrompt} Return ONLY a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, catchy headline (3-6 words) in Hindi.",
            },
            body: {
              type: Type.STRING,
              description: "A detailed but concise message (15-30 words) in Hindi.",
            },
            theme: {
              type: Type.STRING,
              description: `A one-word English theme for image generation related to ${category} (e.g., 'sunset', 'candles', 'chart', 'cityscape').`,
            },
          },
          required: ["title", "body", "theme"],
        },
      },
    });

    // Access the .text property directly to get the generated string.
    const text = response.text;
    if (!text) throw new Error("Model returned no text");

    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr) as MotivationContent;
    }
    
    return JSON.parse(text) as MotivationContent;
  } catch (e) {
    console.error("Failed to generate content:", e);
    return {
      title: "सफलता की राह",
      body: "आज का संघर्ष कल की जीत है। खुद पर भरोसा रखें और मेहनत जारी रखें।",
      theme: category === 'trading' ? 'stock market' : (category === 'love' ? 'romantic sunset' : 'success gold')
    };
  }
}

/**
 * Generates a background image using gemini-2.5-flash-image based on the provided theme.
 */
export async function generateImageFromTheme(theme: string): Promise<string> {
  try {
    // Always initialize a new GoogleGenAI instance right before the API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Cinematic professional high-quality background. Theme: ${theme}. Minimalist design, high resolution, soft lighting, mood-setting. No people, no text in the image itself. High contrast.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) throw new Error("Invalid response format: no parts");

    // Iterate through all parts to find the image part (inlineData).
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    // Fallback Unsplash image if API fails
    return `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000`;
  }
}
