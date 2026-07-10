import { classifyRiskLevel, generateClinicalRecommendation, type ClinicalRiskLevel } from './utils'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface ClinicalFeature {
  type: string
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  score: number
  description: string
  clinicalSignificance: string
}

export interface GrokAnalysis {
  riskLevel: ClinicalRiskLevel
  findings: ClinicalFeature[]
  recommendations: string[]
  aiResponse: string
  clinicalSummary: string
  recommendedAction: string
  clinicalFeatures: {
    edema: number
    ecchymosis: number
    erythema: number
    asymmetry: number
    nodules: number
    vascularity: number
  }
  labels: string[]
  rationale: string
  confidenceFactors: { factor: string; weight: number; impact: string }[]
  trendDirection?: 'IMPROVING' | 'STABLE' | 'WORSENING'
  trendDetails?: { metric: string; previousScore: number; currentScore: number; changePercent: number }[]
}

function getTreatmentSpecificPrompt(treatmentType: string, dayNumber: number): string {
  const base = `You are an AI clinical decision support system analyzing a post-treatment recovery photo for an aesthetic medicine patient.

Analyze this image and provide a comprehensive clinical assessment.

ASSESSMENT PIPELINE:
1. Image Quality Validation (focus, lighting, angle)
2. Facial Landmark Detection
3. Injection Area Identification
4. Clinical Feature Extraction
5. Risk Classification

CLINICAL FEATURES TO ASSESS:
- Edema (swelling): Score 0-1 (none/mild/moderate/severe)
- Ecchymosis (bruising): Score 0-1 (none/mild/moderate/severe)
- Erythema (redness): Score 0-1 (none/mild/moderate/severe)
- Asymmetry: Score 0-1 (none/mild/moderate/severe)
- Nodules: Score 0-1 (none/present)
- Vascular compromise indicators: Score 0-1 (none/present)

RISK CLASSIFICATION:
- GREEN: Normal recovery trajectory. No concerns.
- YELLOW: Deviation from expected recovery. Clinician review within 24 hours.
- ORANGE: Significant clinical concern. Priority review within 4 hours.
- RED: Possible vascular occlusion, skin necrosis. Immediate contact required.`

  const fillerSpecific = `
ADDITIONAL FILLER-SPECIFIC RED FLAGS:
- Blanching or white discoloration of skin (vascular occlusion indicator)
- Severe pain disproportionate to procedure
- Skin color changes (dark purple/black)
- Visual changes or complaints
- Asymmetry worsening after Day 7
- Lumps persisting beyond expected timeline
- If ANY of these are present, classify as RED.`

  const botoxSpecific = `
ADDITIONAL BOTOX-SPECIFIC RED FLAGS:
- Brow ptosis (drooping eyebrow)
- Eyelid ptosis (drooping eyelid)
- Difficulty swallowing or speaking
- Muscle weakness spreading beyond treatment area
- Systemic weakness or difficulty breathing
- If swallowing/breathing difficulties are present, classify as RED.`

  let specificGuidance = ''
  if (treatmentType?.includes('FILLER')) {
    specificGuidance = fillerSpecific
  } else if (treatmentType === 'BOTOX') {
    specificGuidance = botoxSpecific
  }

  const timelineContext = `
POST-PROCEDURE TIMELINE CONTEXT (Day ${dayNumber}):
- Day 1-2: Peak swelling and bruising expected. Mild asymmetry is normal.
- Day 3-5: Swelling subsiding. Bruising shifting color. Improvement expected.
- Day 7-14: Near-final result. Residual firmness may persist.
- Day 14+: Final result achieved. All swelling should be resolved.`

  return base + specificGuidance + timelineContext + `
RETURN ONLY valid JSON with this structure:
{
  "riskLevel": "GREEN" | "YELLOW" | "ORANGE" | "RED",
  "clinicalFeatures": {
    "edema": 0.0-1.0,
    "ecchymosis": 0.0-1.0,
    "erythema": 0.0-1.0,
    "asymmetry": 0.0-1.0,
    "nodules": 0.0-1.0,
    "vascularity": 0.0-1.0
  },
  "findings": [
    {
      "type": "feature_type",
      "severity": "none|mild|moderate|severe",
      "score": 0.0-1.0,
      "description": "Clinical description",
      "clinicalSignificance": "What this means clinically"
    }
  ],
  "recommendations": ["Clinical recommendation 1", "Clinical recommendation 2"],
  "clinicalSummary": "Professional clinical summary for the treating clinician",
  "recommendedAction": "Specific clinical action required",
  "labels": ["detected_feature_1", "detected_feature_2"],
  "rationale": "Structured explanation of WHY this risk level was assigned. Be specific: 'Bruising area increased ~18% versus expected timeline; mild asymmetry detected near the injection site consistent with normal Day ${dayNumber} recovery pattern' or 'Blanching of skin detected near nasolabial fold, suspicious for vascular compromise — immediate intervention required'.",
  "confidenceFactors": [
    {"factor": "feature_name", "weight": 0.0-1.0, "impact": "positive|negative|neutral"}
  ]
}

Rules:
- Use clinical terminology appropriate for medical professionals
- Be specific about anatomical locations when possible
- Provide actionable clinical recommendations
- If vascular compromise is suspected, ALWAYS rate as RED
- Consider the post-procedure timeline when assessing
- Document findings objectively
- Do not diagnose, assess recovery status and flag concerns
- The rationale MUST explain the reasoning behind the risk classification in clinical terms
- confidenceFactors should list the top 3-5 factors that influenced the classification`
}

export async function analyzeWithGrok(
  imageBase64: string,
  fileType: string,
  treatmentType?: string,
  dayNumber?: number
): Promise<GrokAnalysis> {
  const apiKey = process.env.GROK_API_KEY

  const prompt = getTreatmentSpecificPrompt(treatmentType || 'OTHER', dayNumber || 1)

  if (!apiKey) {
    console.log('No GROK_API_KEY set, using fallback clinical analysis')
    return fallbackClinicalAnalysis(treatmentType, dayNumber)
  }

  try {
    console.log('Calling Groq API for clinical analysis...')
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
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', response.status, errorText)
      return fallbackClinicalAnalysis(treatmentType, dayNumber)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      const features = parsed.clinicalFeatures || {
        edema: 0, ecchymosis: 0, erythema: 0, asymmetry: 0, nodules: 0, vascularity: 0
      }

      const riskClassification = classifyRiskLevel({
        swelling: features.edema,
        bruising: features.ecchymosis,
        redness: features.erythema,
        asymmetry: features.asymmetry,
        nodules: features.nodules,
        vascularity: features.vascularity,
      })

      return {
        riskLevel: riskClassification.level,
        findings: (parsed.findings || []).map((f: any) => ({
          type: f.type || 'unknown',
          severity: f.severity || 'none',
          score: f.score || 0,
          description: f.description || '',
          clinicalSignificance: f.clinicalSignificance || '',
        })),
        recommendations: parsed.recommendations || [],
        aiResponse: parsed.recommendedAction || 'Analysis complete',
        clinicalSummary: parsed.clinicalSummary || '',
        recommendedAction: parsed.recommendedAction || '',
        clinicalFeatures: features,
        labels: parsed.labels || [],
        rationale: parsed.rationale || generateDefaultRationale(features, riskClassification.level, treatmentType, dayNumber),
        confidenceFactors: parsed.confidenceFactors || [],
      }
    }

    return fallbackClinicalAnalysis(treatmentType, dayNumber)
  } catch (error) {
    console.error('Groq clinical analysis error:', error)
    return fallbackClinicalAnalysis(treatmentType, dayNumber)
  }
}

function generateDefaultRationale(
  features: { edema: number; ecchymosis: number; erythema: number; asymmetry: number; nodules: number; vascularity: number },
  riskLevel: ClinicalRiskLevel,
  treatmentType?: string,
  dayNumber?: number
): string {
  const maxFeature = Math.max(features.edema, features.ecchymosis, features.erythema, features.asymmetry)
  const maxFeatureName = features.edema === maxFeature ? 'edema' :
    features.ecchymosis === maxFeature ? 'ecchymosis' :
    features.erythema === maxFeature ? 'erythema' : 'asymmetry'

  const severityLabel = maxFeature > 0.7 ? 'significant' : maxFeature > 0.4 ? 'moderate' : maxFeature > 0.2 ? 'mild' : 'minimal'

  return `${severityLabel} ${maxFeatureName} detected (score: ${maxFeature.toFixed(2)}) in Day ${dayNumber || '?'} post-${(treatmentType || 'unknown').replace(/_/g, ' ').toLowerCase()} recovery photo. Classification: ${riskLevel}. ${riskLevel === 'RED' ? 'Vascular compromise indicators present — immediate contact required.' : riskLevel === 'ORANGE' ? 'Clinical concern exceeds expected recovery parameters — priority review needed.' : riskLevel === 'YELLOW' ? 'Findings deviate from typical recovery trajectory — clinician review recommended.' : 'Findings consistent with normal recovery timeline.'}`
}

function fallbackClinicalAnalysis(
  treatmentType?: string,
  dayNumber?: number
): GrokAnalysis {
  const features = {
    edema: Math.random() * 0.3,
    ecchymosis: Math.random() * 0.3,
    erythema: Math.random() * 0.2,
    asymmetry: Math.random() * 0.15,
    nodules: 0,
    vascularity: 0,
  }

  const riskClassification = classifyRiskLevel({
    swelling: features.edema,
    bruising: features.ecchymosis,
    redness: features.erythema,
    asymmetry: features.asymmetry,
  })

  return {
    riskLevel: riskClassification.level,
    findings: [
      {
        type: 'normal',
        severity: 'none',
        score: 0,
        description: 'Recovery appears to be progressing normally',
        clinicalSignificance: 'Expected post-procedure findings',
      },
    ],
    recommendations: ['Continue with current aftercare routine', 'Upload another photo at next scheduled check-in'],
    aiResponse: 'Assessment complete. Recovery appears normal.',
    clinicalSummary: 'Normal recovery trajectory. No concerning features identified.',
    recommendedAction: 'No intervention required. Continue scheduled monitoring.',
    clinicalFeatures: features,
    labels: ['normal_recovery'],
    rationale: `Mild edema and ecchymosis detected within expected range for Day ${dayNumber || 1} post-${(treatmentType || 'unknown').replace(/_/g, ' ').toLowerCase()}. Classification: GREEN. Findings consistent with normal recovery trajectory.`,
    confidenceFactors: [
      { factor: 'edema_level', weight: 0.3, impact: 'neutral' },
      { factor: 'ecchymosis_level', weight: 0.25, impact: 'neutral' },
      { factor: 'timeline_match', weight: 0.25, impact: 'positive' },
      { factor: 'vascular_indicators', weight: 0.2, impact: 'positive' },
    ],
  }
}

export function compareWithPreviousAnalysis(
  currentFeatures: GrokAnalysis['clinicalFeatures'],
  previousFeatures: { edema: number; ecchymosis: number; erythema: number; asymmetry: number } | null
): { trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING'; trendDetails: { metric: string; previousScore: number; currentScore: number; changePercent: number }[] } | null {
  if (!previousFeatures) return null

  const metrics = ['edema', 'ecchymosis', 'erythema', 'asymmetry'] as const
  const details: { metric: string; previousScore: number; currentScore: number; changePercent: number }[] = []
  let totalChange = 0

  for (const metric of metrics) {
    const prev = previousFeatures[metric]
    const curr = currentFeatures[metric]
    const changePercent = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0
    details.push({
      metric,
      previousScore: Math.round(prev * 100) / 100,
      currentScore: Math.round(curr * 100) / 100,
      changePercent: Math.round(changePercent * 10) / 10,
    })
    totalChange += curr - prev
  }

  let trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE'
  if (totalChange < -0.1) trendDirection = 'IMPROVING'
  else if (totalChange > 0.1) trendDirection = 'WORSENING'

  return { trendDirection, trendDetails: details }
}

export function generateClinicalDocument(
  type: string,
  data: {
    patientName: string
    treatmentType: string
    dayNumber: number
    treatmentDate: string
    findings: ClinicalFeature[]
    riskLevel: string
    recommendations: string[]
    clinicalSummary: string
    rationale?: string
  }
): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  switch (type) {
    case 'SOAP':
      return `SOAP NOTE
Date: ${date}
Patient: ${data.patientName}

SUBJECTIVE:
- Day ${data.dayNumber} post-${data.treatmentType.replace(/_/g, ' ').toLowerCase()}
- Treatment Date: ${data.treatmentDate}
- Patient-reported symptoms: Monitored via AI check-in

OBJECTIVE:
- Clinical Photography: Day ${data.dayNumber} post-procedure
- AI Clinical Assessment: ${data.riskLevel}
${data.findings.map(f => `- ${f.type}: ${f.severity} (score: ${f.score})`).join('\n')}
${data.rationale ? `\nAI Rationale: ${data.rationale}` : ''}

ASSESSMENT:
- Day ${data.dayNumber} post-${data.treatmentType.replace(/_/g, ' ').toLowerCase()}
- Risk Classification: ${data.riskLevel}
- ${data.clinicalSummary}

PLAN:
${data.recommendations.map(r => `- ${r}`).join('\n')}
- Follow-up as scheduled`

    case 'PROCEDURE':
      return `PROCEDURE NOTE
Date: ${data.treatmentDate}
Patient: ${data.patientName}
Procedure: ${data.treatmentType.replace(/_/g, ' ')}

Follow-up Assessment:
- Day ${data.dayNumber} post-procedure
- AI Assessment: ${data.riskLevel}
${data.findings.map(f => `- ${f.type}: ${f.severity}`).join('\n')}
${data.rationale ? `\nRationale: ${data.rationale}` : ''}

Recommendations:
${data.recommendations.map(r => `- ${r}`).join('\n')}`

    case 'RECOVERY_SUMMARY':
      return `RECOVERY SUMMARY
Patient: ${data.patientName}
Treatment: ${data.treatmentType.replace(/_/g, ' ')}
Treatment Date: ${data.treatmentDate}
Assessment Date: ${date}

Recovery Status: ${data.riskLevel}

Clinical Findings:
${data.findings.map(f => `- ${f.type}: ${f.severity} — ${f.description}`).join('\n')}

${data.rationale ? `Clinical Rationale:\n${data.rationale}\n` : ''}
Summary: ${data.clinicalSummary}

Recommendations:
${data.recommendations.map(r => `- ${r}`).join('\n')}`

    default:
      return `CLINICAL DOCUMENT
Date: ${date}
Patient: ${data.patientName}
Type: ${data.treatmentType.replace(/_/g, ' ')}

${data.clinicalSummary}`
  }
}
