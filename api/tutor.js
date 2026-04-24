import { OpenAI } from 'openai';

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { passageText, questionText, childsAnswer } = req.body;

    const prompt = `
You are a friendly, encouraging AI English tutor named Lele (a smart lion wearing glasses) for a Primary 4 student in Singapore. 
The student just answered a multiple-choice reading comprehension question INCORRECTLY.

Passage they read:
"${passageText}"

Question they were asked:
"${questionText}"

The wrong answer they chose: "${childsAnswer}"

Your task:
Write a SHORT, gentle, and encouraging hint (max 2 sentences) to guide them to find the correct answer in the text. 
DO NOT give them the direct answer.
Start with a gentle "Oops!" or "Not quite!" and then guide them to look at a specific part of the text.
Use simple, primary school English vocabulary.

Hint:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
}
