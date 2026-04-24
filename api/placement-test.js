import { OpenAI } from 'openai';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const grade = req.query.grade || "Primary 4";
    const prompt = `
Generate a formal baseline reading comprehension assessment passage for a ${grade} student in Singapore.
Topic: A classic school setting or local community setting in Singapore.
Keep the vocabulary strictly at the ${grade} MOE syllabus level. Max 3 short paragraphs.
Include 2 multiple-choice questions about the story. The questions should test inference or vocabulary in context, not just simple fact retrieval.
Return ONLY a valid JSON object matching this structure EXACTLY:
{
  "title": "Placement Test: Reading Comprehension",
  "content": ["Paragraph 1 text.", "Paragraph 2 text."],
  "emojis": {
    "topRight": "📚", "topLeft": "🏫", "bottomRight": "📝", "bottomLeft": "🎓", "middleRight": "✏️", "center": "📚 🏫 📝"
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
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const passage = JSON.parse(response.choices[0].message.content);
    res.json(passage);
  } catch (error) {
    console.error('Error generating placement test:', error);
    res.status(500).json({ error: 'Failed to generate placement test' });
  }
}
