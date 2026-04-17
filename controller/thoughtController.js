import model from '../config/geminiConfig.js';

export const generateMotivationalThought = async (req, res) => {
  try {
    const prompt = 'Generate a motivational thought, under 20 words. It should be motivating to help me complete my work';
    const result = await model.generateContent(prompt);
    const thought = { thought: result.response.text() };
    res.status(200).json(thought);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('Error generating motivational thought');
  }
};
