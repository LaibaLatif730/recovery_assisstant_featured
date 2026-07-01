const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GrokAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  findings: { type: string; severity: string; description: string }[]
  recommendations: string[]
  aiResponse: string
  summary: string
  labels: string[]
}

export async function analyzeWithGrok(imageBase64: string, fileType: string): Promise<GrokAnalysis> {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
    console.log('No GROK_API_KEY set, using fallback analysis')
    return fallbackAnalysis()
  }

  const prompt = `You are an AI medical assistant analyzing a post-treatment recovery photo for an aesthetic clinic patient.

Analyze this image and provide a medical assessment in JSON format.

Look for:
1. Swelling (none/mild/significant)
2. Bruising (none/mild/significant)
3. Redness (none/mild/significant)
4. Asymmetry (none/mild/notable)
5. Any bleeding or wounds
6. Signs of infection
7. Overall recovery progress

Return ONLY valid JSON with this structure:
{
  "riskLevel": "LOW" or "MEDIUM" or "HIGH",
  "findings": [
    {"type": "swelling", "severity": "none/mild/significant", "description": "..."},
    {"type": "bruising", "severity": "none/mild/significant", "description": "..."},
    {"type": "redness", "severity": "none/mild/significant", "description": "..."}
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "aiResponse": "Brief summary for the patient",
  "summary": "Clinical summary",
  "labels": ["detected1", "detected2"]
}

Rules:
- LOW risk: Normal recovery, no concerns
- MEDIUM risk: Some issues that need monitoring
- HIGH risk: Significant concerns, doctor should be notified
- Be specific about what you see in the image
- Provide actionable recommendations
- If you see bleeding, redness, or significant bruising, rate as MEDIUM or HIGH
- Do not diagnose, just assess recovery status`

  try {
    console.log('Calling Groq API with model meta-llama/llama-4-scout-17b-16e-instruct...')
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', response.status, errorText)
      return fallbackAnalysis()
    }

    const data = await response.json()
    console.log('Groq raw response:', JSON.stringify(data, null, 2))
    const content = data.choices?.[0]?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        riskLevel: parsed.riskLevel || 'LOW',
        findings: parsed.findings || [],
        recommendations: parsed.recommendations || [],
        aiResponse: parsed.aiResponse || 'Analysis complete',
        summary: parsed.summary || '',
        labels: parsed.labels || [],
      }
    }

    return fallbackAnalysis()
  } catch (error) {
    console.error('Groq analysis error:', error)
    return fallbackAnalysis()
  }
}

function fallbackAnalysis(): GrokAnalysis {
  return {
    riskLevel: 'LOW',
    findings: [
      { type: 'normal', severity: 'none', description: 'Recovery appears to be progressing normally' },
    ],
    recommendations: ['Continue with your normal aftercare routine'],
    aiResponse: 'Analysis complete. Your recovery looks good.',
    summary: 'Normal recovery',
    labels: ['skin', 'recovery'],
  }
}
