import { v4 as uuidv4 } from 'uuid';

/**
 * Generate math questions using Google Gemini API
 * @param {string} topic - The math topic (e.g., "Calculus", "Algebra")
 * @param {number} count - Number of questions to generate
 * @param {string} difficulty - Difficulty level ("Easy", "Medium", "Hard")
 * @returns {Promise<Array>} - Array of question objects
 */
export const generateQuestions = async (topic, count = 3, difficulty = 'Medium') => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // 1. Check for API Key
    if (!apiKey) {
        console.warn("Gemini API Key missing. Using Mock Mode.");
        return generateMockQuestions(topic, count, difficulty);
    }

    try {
        // 2. Construct the Prompt
        const prompt = `
      You are a math teacher. Generate ${count} math questions about "${topic}" at "${difficulty}" level.
      Strictly return a valid JSON Array only. Do not include any markdown formatting (like \`\`\`json).
      Each item in the array must have the following structure:
      {
        "question": "The question text with LaTeX math (e.g., $x^2$)",
        "answer": "The step-by-step answer or final solution",
        "space": "Suggested space for the answer in pixels (e.g., 40, 80, 120, 160)"
      }
    `;

        // 3. Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No content returned from Gemini.");
        }

        // 4. Parse the Response
        // Clean up potential markdown code blocks provided by the AI
        const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedQuestions = JSON.parse(cleanedText);

        // Add unique IDs
        return parsedQuestions.map(q => ({
            id: uuidv4(),
            no: 0, // Will be set by parent
            question: q.question,
            answer: q.answer,
            spaceNeeded: parseInt(q.space) || 40, // Default to 40 if parsing fails
            type: 'Math'
        }));

    } catch (error) {
        console.error("Error generating questions:", error);
        // Fallback to mock data on error
        return generateMockQuestions(topic, count, difficulty);
    }
};

/**
 * Mock Data Generator (Fallback)
 */
const generateMockQuestions = (topic, count, difficulty) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockData = Array.from({ length: count }, (_, i) => ({
                id: uuidv4(),
                no: 0, // Placeholder
                question: `[MOCK ${difficulty}] Solve the following problem related to ${topic}: $\\int x^${i + 2} \\, dx$`,
                answer: `The answer is $\\frac{x^${i + 3}}{${i + 3}} + C$`,
                spaceNeeded: 80,
                type: 'Math'
            }));
            resolve(mockData);
        }, 2000); // Simulate network delay
    });
};
