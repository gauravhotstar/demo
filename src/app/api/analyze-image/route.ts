import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { imagePath } = await request.json();

    if (!imagePath) {
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
    }

    // Read image file and convert to base64
    const fullPath = path.join('/home/z/my-project', imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const zai = await ZAI.create();

    const prompt = `Analyze this business card or business document and extract ALL business details in a structured JSON format. Include:
- Business name
- Tagline/slogan
- Services offered (detailed list)
- Contact information (phone, email, website)
- Address
- Social media handles
- Business hours (if any)
- Any other relevant business information

Return the response as valid JSON only, no additional text.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const content = response.choices[0]?.message?.content;

    // Try to parse as JSON, otherwise return raw content
    let businessData;
    try {
      businessData = JSON.parse(content || '{}');
    } catch (e) {
      businessData = { rawResponse: content };
    }

    return NextResponse.json({
      success: true,
      data: businessData
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image'
      },
      { status: 500 }
    );
  }
}
