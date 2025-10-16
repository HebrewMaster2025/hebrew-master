export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, targetLanguage = 'Hebrew', sourceLanguage = 'English' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    console.log('Translating:', text.substring(0, 50) + '...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in ${sourceLanguage} to ${targetLanguage} translation. Provide accurate, natural translations that preserve the meaning and tone of the original text. Only respond with the translation, nothing else.`,
          },
          {
            role: 'user',
            content: `Translate the following ${sourceLanguage} text to ${targetLanguage}:\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await openaiResponse.json();
    const translation = data.choices[0].message.content.trim();

    console.log('Translation successful');

    return res.status(200).json({
      original: text,
      translation: translation,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    return res.status(500).json({
      error: error.message || 'Translation failed',
    });
  }
}
