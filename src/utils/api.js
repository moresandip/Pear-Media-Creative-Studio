
import axios from 'axios';

// --- API Configuration ---
// These should ideally be in process.env.VITE_GEMINI_API_KEY etc.
// For the prototype, we'll use a helper to get/set them if not found.
const GET_API_KEY = (service) => localStorage.getItem(`${service}_api_key`) || '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';

export const enhancePrompt = async (userInput, apiKey) => {
  try {
    const response = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, {
      contents: [{
        parts: [{
          text: `You are an expert prompt engineer. Enhance this image prompt for a professional AI art generator. Make it descriptive, specify lighting, style, and camera angles. Keep the final result to about 50 words. original prompt: "${userInput}"`
        }]
      }]
    });
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Enhancement failed:', error);
    throw error;
  }
};

export const generateImage = async (prompt, apiKey) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      });

      if (response.status === 503) {
        const errorData = await response.json();
        const waitTimeSeconds = errorData.estimated_time || 10;
        console.log(`Model is loading. Waiting ${waitTimeSeconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTimeSeconds * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      if (attempt === 9) {
        console.error('Image generation failed completely:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

export const analyzeImage = async (base64Image, apiKey) => {
  try {
    const response = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, {
      contents: [{
        parts: [
          { text: "Analyze this image and describe its subject, style, lighting, and mood in detail. Then, suggest a new similar image prompt that would create a variation of this style." },
          { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ]
      }]
    });
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
};
