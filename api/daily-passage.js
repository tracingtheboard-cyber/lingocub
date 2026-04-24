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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const grade = req.query.grade || "Primary 4";
    const prompt = `
Generate a short, highly engaging reading comprehension passage for a ${grade} student in Singapore.
Topic: Choose randomly from everyday magic, science fiction, historical mystery, or a fun adventure in Singapore.
Keep the vocabulary strictly at the ${grade} MOE syllabus level (use some challenging words that require context to understand). Max 3 short paragraphs.
Include 2 multiple-choice questions about the story. The questions should test inference or vocabulary in context, not just simple fact retrieval.
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
    res.status(200).json(passage);
  } catch (error) {
    console.error('Error generating passage:', error);
    res.status(500).json({ error: 'Failed to generate passage' });
  }
}
