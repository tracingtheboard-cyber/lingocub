import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/tutor', async (req, res) => {
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

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const { passageText, question } = req.body;

    const prompt = `
You are Lele, a friendly AI English tutor (a smart lion wearing glasses) for a Primary 4 student (age 10) in Singapore. 
The student is reading this passage:
"${passageText}"

They just asked you a question about it:
"${question}"

Your task:
Answer their question in a SHORT, very simple, and encouraging way. 
Use primary school English vocabulary. Max 2-3 sentences.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.get('/api/daily-passage', async (req, res) => {
  try {
    const prompt = `
Generate a short, highly engaging reading comprehension passage for a Primary 4 student in Singapore (age 10).
Topic: Choose randomly from everyday magic, science fiction, historical mystery, or a fun adventure in Singapore (e.g., Jewel Changi, Sentosa, or school life).
Keep the vocabulary at the Primary 4 MOE syllabus level (use some challenging words that require context to understand). Max 3 short paragraphs.
Include 2 multiple-choice questions about the story. The questions should test inference or vocabulary in context, not just simple fact retrieval.
Include 2 simple multiple-choice questions about the story.
Return ONLY a valid JSON object matching this structure EXACTLY:
{
  "title": "Story Title",
  "content": ["Paragraph 1 text.", "Paragraph 2 text."],
  "emojis": {
    "topRight": "🚀", "topLeft": "🌟", "bottomRight": "🌍", "bottomLeft": "👽", "middleRight": "🛸", "center": "🚀 🌟 🌍"
  },
  "questions": [
    {
      "id": 100,
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "successMsg": "Correct! You got it."
    },
    {
      "id": 101,
      "text": "Second question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "successMsg": "Awesome! That is right."
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const passage = JSON.parse(response.choices[0].message.content);
    res.json(passage);
  } catch (error) {
    console.error('Error generating passage:', error);
    res.status(500).json({ error: 'Failed to generate passage' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🦁 AI Tutor Server running on http://localhost:${PORT}`);
});
