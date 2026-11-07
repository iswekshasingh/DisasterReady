import { getGeminiClient } from '../config/gemini.js';

/**
 * Service for interacting with Google Gemini API for disaster scenario evaluations
 */
export const generateScenarioFeedback = async (scenarioTitle, disasterType, userActions) => {
  const ai = getGeminiClient();

  const prompt = `
You are an expert emergency response and disaster preparedness trainer.
Evaluate the following emergency response actions taken by a trainee during a ${disasterType} simulation: "${scenarioTitle}".

Trainee Actions:
${JSON.stringify(userActions, null, 2)}

Provide a concise, constructive evaluation covering:
1. Summary of performance
2. Key strengths
3. Critical mistakes or areas to improve
4. Recommended survival tips
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return response.text;
};

export default {
  generateScenarioFeedback,
};

