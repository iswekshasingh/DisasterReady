
import { getGeminiClient } from '../config/gemini.js';

export const generateScenarioFeedback = async (
  scenarioTitle,
  disasterType,
  evaluationResults
) => {
  const ai = getGeminiClient();

  const prompt = `
You are a supportive disaster preparedness training coach.

Analyze the trainee's performance in this simulation:
Scenario: ${scenarioTitle}
Disaster type: ${disasterType}

The backend has already evaluated the answers.
Use the evaluation results and explanations provided below:

${JSON.stringify(evaluationResults, null, 2)}

Provide feedback with these sections:

1. Performance Summary
2. What the trainee did well
3. Mistakes and areas to improve
4. Key safety lessons to remember

IMPORTANT:
- Do not change or recalculate the score.
- Do not contradict the supplied answer evaluations.
- Base safety guidance only on the supplied explanations.
- Do not invent emergency instructions.
- Keep the feedback concise, constructive and easy to understand.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
};

export default {
  generateScenarioFeedback,
};
