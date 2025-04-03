// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  history?: Message[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { message, history = [] } = body;

    // Format history untuk Claude API
    const formattedMessages = [
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Menggunakan Claude AI API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Model Claude dengan API gratis (haiku lebih murah)
        max_tokens: 1000,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return NextResponse.json({ response: data.content[0].text });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses permintaan' },
      { status: 500 }
    );
  }
}