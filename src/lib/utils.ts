import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Clinical Risk Classification (Green/Yellow/Orange/Red) ───

export type ClinicalRiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'

export interface RiskClassification {
  level: ClinicalRiskLevel
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  responseTimeline: string
}

export const RISK_LEVELS: Record<ClinicalRiskLevel, RiskClassification> = {
  GREEN: {
    level: 'GREEN',
    label: 'Normal Recovery',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Normal recovery trajectory. No intervention required.',
    responseTimeline: 'Continue scheduled check-ins',
  },
  YELLOW: {
    level: 'YELLOW',
    label: 'Needs Review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Deviation from expected recovery. Clinician review recommended.',
    responseTimeline: 'Review within 24 hours',
  },
  ORANGE: {
    level: 'ORANGE',
    label: 'Priority Review',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Significant clinical concern. Priority review required.',
    responseTimeline: 'Review within 4 hours',
  },
  RED: {
    level: 'RED',
    label: 'Immediate Alert',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Possible vascular occlusion, skin necrosis, or emergency. Immediate contact required.',
    responseTimeline: 'Immediate contact',
  },
}

export function classifyRiskLevel(scores: {
  swelling: number
  bruising: number
  redness: number
  asymmetry: number
  nodules?: number
  vascularity?: number
  treatmentType?: string
  dayNumber?: number
}): RiskClassification {
  const { swelling, bruising, redness, asymmetry, nodules = 0, vascularity = 0, treatmentType, dayNumber } = scores

  if (vascularity > 0.7 || swelling > 0.8) {
    return RISK_LEVELS.RED
  }

  if (treatmentType?.includes('FILLER') && dayNumber && dayNumber > 3) {
    if (asymmetry > 0.5) return RISK_LEVELS.ORANGE
    if (swelling > 0.6) return RISK_LEVELS.ORANGE
  }

  if (treatmentType === 'BOTOX' && dayNumber && dayNumber > 7) {
    if (asymmetry > 0.4) return RISK_LEVELS.YELLOW
  }

  const maxScore = Math.max(swelling, bruising, redness, asymmetry, nodules)
  if (maxScore > 0.7 || (swelling > 0.5 && asymmetry > 0.5)) {
    return RISK_LEVELS.ORANGE
  }

  if (maxScore > 0.4 || (swelling > 0.3 && bruising > 0.3)) {
    return RISK_LEVELS.YELLOW
  }

  return RISK_LEVELS.GREEN
}

export function getRiskBadgeVariant(level: string) {
  switch (level) {
    case 'RED': return 'destructive'
    case 'ORANGE': return 'destructive'
    case 'YELLOW': return 'secondary'
    case 'GREEN': return 'outline'
    default: return 'outline'
  }
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'RED': return 'text-red-600 bg-red-50'
    case 'ORANGE': return 'text-orange-600 bg-orange-50'
    case 'YELLOW': return 'text-yellow-600 bg-yellow-50'
    case 'GREEN': return 'text-green-600 bg-green-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

// ─── Recovery Timelines ───────────────────────────────────────

export function getRecoveryTimeline(treatmentType: string): number[] {
  const timelines: Record<string, number[]> = {
    BOTOX: [1, 2, 5, 10, 14],
    FILLER_HYALURONIC: [1, 3, 7, 14, 30],
    FILLER_CALCIUM_HYDROXYLAPATITE: [1, 3, 7, 14, 30],
    FILLER_POLY_L_LACTIC: [1, 3, 7, 14, 30],
    FILLER_POLYALKYLIMIDE: [1, 3, 7, 14, 30],
    FILLER_POLYMETHYLMETHACRYLATE: [1, 3, 7, 14, 30],
    MESOTHERAPY: [1, 2, 5, 10],
    PRP: [1, 3, 7, 14],
    SKIN_BOOSTER: [1, 3, 7, 14],
    MICRONEEDLING: [1, 2, 5, 7, 14],
    PDO_THREADS: [1, 3, 7, 14, 30],
    FAT_DISSOLVING: [1, 3, 7, 14, 30],
    OTHER: [1, 2, 5, 10, 14],
  }
  return timelines[treatmentType] || timelines.OTHER
}

// ─── Injection Areas ──────────────────────────────────────────

export const INJECTION_AREAS = {
  FOREHEAD: ['Mid Forehead', 'Lateral Forehead', 'Temporal Fusion Point'],
  GLABELLA: ['Corrugator Supercilii', 'Procerus'],
  CROWS_FEET: ['Lateral Canthal', 'Orbicularis Oculi'],
  LIPS: ['Upper Lip Body', 'Lower Lip Body', 'Vermilion Border', 'Cupid\'s Bow', 'Philtrum Columns', 'Oral Commissures'],
  CHEEKS: ['Malar Eminence', 'Zygomatic Arch', 'Submalar Region'],
  JAWLINE: ['Jawline Body', 'Mandibular Angle', 'Pre-jowl Sulcus'],
  CHIN: ['Chin Apex', 'Chin Body'],
  TEMPLE: ['Temporal Fossa', 'Temporal Crest'],
  NOSE: ['Dorsum', 'Tip', 'Radix', 'Columella', 'Alar Base'],
  NASOLABIAL_FOLDS: ['Nasolabial Fold'],
  MARIONETTE_LINES: ['Marionette Lines'],
  TEAR_TROUGH: ['Infraorbital Hollow', 'Nasojugal Groove'],
  NECK: ['Platysma Bands', 'Submental Area'],
}

// ─── Treatment Types ──────────────────────────────────────────

export const TREATMENT_TYPES = [
  { value: 'BOTOX', label: 'Botox (Botulinum Toxin)', category: 'Neuromodulator' },
  { value: 'FILLER_HYALURONIC', label: 'Hyaluronic Acid Filler', category: 'Dermal Filler' },
  { value: 'FILLER_CALCIUM_HYDROXYLAPATITE', label: 'Calcium Hydroxylapatite Filler', category: 'Dermal Filler' },
  { value: 'FILLER_POLY_L_LACTIC', label: 'Poly-L-Lactic Acid Filler', category: 'Dermal Filler' },
  { value: 'FILLER_POLYALKYLIMIDE', label: 'Polyalkylimide Filler', category: 'Dermal Filler' },
  { value: 'FILLER_POLYMETHYLMETHACRYLATE', label: 'PMMA Filler', category: 'Dermal Filler' },
  { value: 'MESOTHERAPY', label: 'Mesotherapy', category: 'Biostimulator' },
  { value: 'PRP', label: 'PRP (Platelet-Rich Plasma)', category: 'Regenerative' },
  { value: 'SKIN_BOOSTER', label: 'Skin Booster', category: 'Biostimulator' },
  { value: 'MICRONEEDLING', label: 'Microneedling', category: 'Skin Rejuvenation' },
  { value: 'PDO_THREADS', label: 'PDO Threads', category: 'Thread Lift' },
  { value: 'FAT_DISSOLVING', label: 'Fat Dissolving Injections', category: 'Injectable' },
  { value: 'OTHER', label: 'Other', category: 'Other' },
]

// ─── Complication Types ───────────────────────────────────────

export const COMPLICATION_TYPES = [
  { value: 'BRUISING', label: 'Bruising (Ecchymosis)', typicalOnset: 'Day 0-1', resolves: 'Day 7-14', riskLevel: 'GREEN' },
  { value: 'SWELLING', label: 'Swelling (Edema)', typicalOnset: 'Day 0-3', resolves: 'Day 3-7', riskLevel: 'GREEN' },
  { value: 'DELAYED_SWELLING', label: 'Delayed Swelling', typicalOnset: 'Day 5-14', resolves: 'Variable', riskLevel: 'YELLOW' },
  { value: 'INFECTION', label: 'Infection', typicalOnset: 'Day 2-7+', resolves: 'With treatment', riskLevel: 'ORANGE' },
  { value: 'NODULES', label: 'Nodules', typicalOnset: 'Day 7+', resolves: 'Variable', riskLevel: 'YELLOW' },
  { value: 'GRANULOMA', label: 'Granuloma', typicalOnset: 'Weeks-Months', resolves: 'With treatment', riskLevel: 'ORANGE' },
  { value: 'TYNDALL_EFFECT', label: 'Tyndall Effect', typicalOnset: 'Variable', resolves: 'With treatment', riskLevel: 'YELLOW' },
  { value: 'PTOSIS', label: 'Ptosis', typicalOnset: 'Day 0-3', resolves: 'Weeks', riskLevel: 'ORANGE' },
  { value: 'SMILE_ASYMMETRY', label: 'Smile Asymmetry', typicalOnset: 'Day 0-7', resolves: 'Days-Weeks', riskLevel: 'YELLOW' },
  { value: 'VASCULAR_OCCLUSION', label: 'Vascular Occlusion', typicalOnset: 'Immediate-Hours', resolves: 'Emergency', riskLevel: 'RED' },
  { value: 'SKIN_NECROSIS', label: 'Skin Necrosis', typicalOnset: 'Hours-Days', resolves: 'Permanent', riskLevel: 'RED' },
  { value: 'HYPERSENSITIVITY', label: 'Hypersensitivity', typicalOnset: 'Hours-Days', resolves: 'With treatment', riskLevel: 'ORANGE' },
  { value: 'MIGRATION', label: 'Migration', typicalOnset: 'Weeks-Months', resolves: 'With treatment', riskLevel: 'ORANGE' },
  { value: 'INFLAMMATION', label: 'Inflammation', typicalOnset: 'Weeks', resolves: 'With treatment', riskLevel: 'YELLOW' },
]

// ─── Clinical Recommendation Generator ────────────────────────

export function generateClinicalRecommendation(
  riskLevel: ClinicalRiskLevel,
  treatmentType: string,
  dayNumber: number,
  findings: { type: string; severity: string; description: string }[]
): string {
  const protocol = TREATMENT_PROTOCOLS[treatmentType]
  const normalSymptoms = protocol?.normalSymptoms || []

  switch (riskLevel) {
    case 'GREEN':
      return `CLINICAL ASSESSMENT — GREEN\n\nAssessment: Expected post-procedure recovery.\nDay ${dayNumber} post-${treatmentType.replace(/_/g, ' ').toLowerCase()}.\nNo concerning features identified.\n\nClinical Recommendation:\nExpected healing trajectory. Continue current management.\nNo intervention recommended.\n\nFollow-up: Continue scheduled check-ins.`
    
    case 'YELLOW':
      return `CLINICAL ASSESSMENT — YELLOW\n\nAssessment: Deviation from expected recovery.\nDay ${dayNumber} post-${treatmentType.replace(/_/g, ' ').toLowerCase()}.\nFindings: ${findings.map(f => f.description).join('; ')}\n\nClinical Recommendation:\nRecommend clinician review within 24 hours.\nSuggest in-person assessment to evaluate clinical correlation.\n\nFollow-up: Pending clinician review.`
    
    case 'ORANGE':
      return `CLINICAL ASSESSMENT — ORANGE\n\nAssessment: Significant clinical concern.\nDay ${dayNumber} post-${treatmentType.replace(/_/g, ' ').toLowerCase()}.\nFindings: ${findings.map(f => f.description).join('; ')}\n\nClinical Recommendation:\nPriority clinician review within 4 hours.\nRecommend in-person assessment with vital signs.\n\nFollow-up: Pending urgent clinician review.`
    
    case 'RED':
      return `CLINICAL ASSESSMENT — RED\n\nAssessment: Possible vascular compromise or emergency.\nDay ${dayNumber} post-${treatmentType.replace(/_/g, ' ').toLowerCase()}.\nFindings: ${findings.map(f => f.description).join('; ')}\n\nEMERGENCY ACTIONS:\n1. Contact patient IMMEDIATELY\n2. Apply warm compress to area\n3. If hyaluronidase available: inject per protocol\n4. If no improvement in 60 minutes: refer to emergency department\n5. Document all findings and interventions\n\nFollow-up: Emergency — immediate clinician intervention required.`
    
    default:
      return 'Clinical assessment pending.'
  }
}

// ─── Treatment Protocol Library ───────────────────────────────

export interface TreatmentProtocolData {
  procedureType: string
  category: string
  substance: string
  typicalVolumes: string
  recoveryTimeline: Record<string, string>
  normalSymptoms: string[]
  warningSigns: string[]
  emergencySigns: string[]
  followUpSchedule: { day: number; type: string; purpose: string }[]
  contraindications: string[]
  postProcedureInstructions: string[]
  redFlagCriteria: { condition: string; riskLevel: string; timeframe: string }[]
  silenceRiskWeight: number
}

export const TREATMENT_PROTOCOLS: Record<string, TreatmentProtocolData> = {
  BOTOX: {
    procedureType: 'BOTOX',
    category: 'Neuromodulator',
    substance: 'Botulinum Toxin Type A',
    typicalVolumes: '20-64 units',
    recoveryTimeline: {
      day_0_1: 'Onset of effect begins. Mild swelling at injection sites possible.',
      day_2_7: 'Effect becoming visible. Peak effect at Day 14.',
      day_7_14: 'Full effect achieved. Any asymmetry may be assessed.',
      day_14_30: 'Effect stable. Maintenance planning.',
    },
    normalSymptoms: ['Mild swelling at injection sites', 'Minor bruising', 'Headache', 'Temporary heaviness'],
    warningSigns: ['Brow ptosis', 'Eyelid droop', 'Difficulty swallowing', 'Muscle weakness spreading'],
    emergencySigns: ['Difficulty breathing', 'Difficulty swallowing', 'Voice changes', 'Systemic weakness'],
    followUpSchedule: [
      { day: 1, type: 'Photo + Questionnaire', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Effect assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Full effect evaluation' },
    ],
    contraindications: ['Known allergy to botulinum toxin', 'Infection at treatment site', 'Pregnancy', 'Neuromuscular disorders'],
    postProcedureInstructions: [
      'Do not lie down for 4 hours after treatment',
      'Avoid rubbing or massaging the treated area for 24 hours',
      'Avoid strenuous exercise for 24 hours',
      'Avoid alcohol for 24 hours',
      'Contact clinic if you experience difficulty swallowing, speaking, or breathing',
    ],
    redFlagCriteria: [
      { condition: 'Brow ptosis', riskLevel: 'ORANGE', timeframe: 'Day 0-7' },
      { condition: 'Eyelid droop', riskLevel: 'ORANGE', timeframe: 'Day 0-7' },
      { condition: 'Difficulty swallowing', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Voice changes', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Systemic weakness', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Asymmetry beyond Day 7', riskLevel: 'YELLOW', timeframe: 'Day 7+' },
    ],
    silenceRiskWeight: 1.0,
  },
  FILLER_HYALURONIC: {
    procedureType: 'FILLER_HYALURONIC',
    category: 'Dermal Filler',
    substance: 'Hyaluronic Acid',
    typicalVolumes: '0.5mL - 2.0mL',
    recoveryTimeline: {
      day_0_1: 'Peak swelling and bruising expected. Ice recommended.',
      day_2_3: 'Swelling begins to subside. Bruising may shift color.',
      day_4_7: 'Major swelling resolved. Minor asymmetry possible.',
      day_7_14: 'Near-final result visible. Residual firmness may persist.',
      day_14_30: 'Final result achieved. All swelling resolved.',
    },
    normalSymptoms: ['Swelling', 'Bruising', 'Tenderness', 'Firmness at injection site', 'Minor asymmetry (early)', 'Lumps/bumps that resolve within 2 weeks'],
    warningSigns: ['Increasing swelling after Day 3', 'Blanching or white discoloration', 'Severe pain disproportionate to procedure', 'Skin discoloration (dark purple/black)', 'Asymmetry worsening after Day 7'],
    emergencySigns: ['Sudden severe pain', 'Blanching of skin', 'Visual changes or blindness', 'Skin necrosis indicators', 'Signs of vascular occlusion'],
    followUpSchedule: [
      { day: 1, type: 'Photo + Questionnaire', purpose: 'Early assessment' },
      { day: 3, type: 'Photo + Questionnaire', purpose: 'Swelling monitoring' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Final result documentation' },
    ],
    contraindications: ['Active infection at treatment site', 'Known allergy to product components', 'Pregnancy or breastfeeding', 'Autoimmune disease (relative)', 'Anticoagulant therapy (relative)'],
    postProcedureInstructions: [
      'Apply ice packs for 10 minutes on, 10 minutes off for first 24 hours',
      'Avoid strenuous exercise for 48 hours',
      'Avoid extreme heat (sauna, hot yoga) for 48 hours',
      'Sleep elevated for first 2 nights',
      'Avoid aspirin/NSAIDs for 48 hours if medically safe',
      'Do not massage the area unless instructed',
      'Contact clinic immediately if you experience severe pain, skin color changes, or vision changes',
    ],
    redFlagCriteria: [
      { condition: 'Blanching of skin', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Severe pain disproportionate to procedure', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Visual changes or blindness', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Skin necrosis indicators', riskLevel: 'RED', timeframe: 'Hours-Days' },
      { condition: 'Increasing swelling after Day 3', riskLevel: 'ORANGE', timeframe: 'Day 3+' },
      { condition: 'Asymmetry worsening after Day 7', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Persistent lumps beyond Day 14', riskLevel: 'YELLOW', timeframe: 'Day 14+' },
    ],
    silenceRiskWeight: 1.5,
  },
  FILLER_CALCIUM_HYDROXYLAPATITE: {
    procedureType: 'FILLER_CALCIUM_HYDROXYLAPATITE',
    category: 'Dermal Filler',
    substance: 'Calcium Hydroxylapatite (Radiesse)',
    typicalVolumes: '1.0mL - 2.0mL',
    recoveryTimeline: {
      day_0_2: 'Peak swelling expected. Apply ice.',
      day_3_7: 'Swelling subsiding. Product integrating.',
      day_7_14: 'Near-final result. Collagen stimulation beginning.',
      day_14_30: 'Collagen production increasing. Results improving.',
    },
    normalSymptoms: ['Swelling', 'Bruising', 'Tenderness', 'Firmness', 'Mild asymmetry'],
    warningSigns: ['Nodule formation', 'Persistent redness', 'Skin discoloration', 'Worsening asymmetry'],
    emergencySigns: ['Blanching', 'Severe pain', 'Visual changes', 'Skin necrosis'],
    followUpSchedule: [
      { day: 1, type: 'Photo + Questionnaire', purpose: 'Early assessment' },
      { day: 3, type: 'Photo + Questionnaire', purpose: 'Swelling monitoring' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Final result documentation' },
    ],
    contraindications: ['Active infection', 'Known allergy to product components', 'Pregnancy', 'Autoimmune disease'],
    postProcedureInstructions: [
      'Apply ice for 20 minutes every 2 hours for first 24 hours',
      'Avoid strenuous exercise for 48 hours',
      'Avoid extreme heat for 48 hours',
      'Do not massage unless instructed',
      'Contact clinic for any concerning symptoms',
    ],
    redFlagCriteria: [
      { condition: 'Blanching of skin', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Severe pain', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Visual changes', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Nodule formation', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Persistent redness', riskLevel: 'YELLOW', timeframe: 'Day 3+' },
    ],
    silenceRiskWeight: 1.4,
  },
  SKIN_BOOSTER: {
    procedureType: 'SKIN_BOOSTER',
    category: 'Biostimulator',
    substance: 'Hyaluronic Acid (low concentration)',
    typicalVolumes: '1.0mL - 3.0mL per session',
    recoveryTimeline: {
      day_0_1: 'Mild swelling and redness at injection sites.',
      day_2_3: 'Swelling resolving. Skin glowing.',
      day_7_14: 'Skin quality improving. Hydration increasing.',
    },
    normalSymptoms: ['Mild swelling', 'Redness', 'Small bumps at injection sites', 'Mild tenderness'],
    warningSigns: ['Persistent redness', 'Signs of infection', 'Nodule formation', 'Allergic reaction'],
    emergencySigns: ['Severe allergic reaction', 'Signs of infection', 'Vision changes'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy'],
    postProcedureInstructions: [
      'Avoid makeup for 12 hours',
      'Avoid strenuous exercise for 24 hours',
      'Keep skin hydrated',
      'Avoid sun exposure for 48 hours',
    ],
    redFlagCriteria: [
      { condition: 'Persistent redness beyond Day 3', riskLevel: 'YELLOW', timeframe: 'Day 3+' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Nodule formation', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
    ],
    silenceRiskWeight: 1.0,
  },
  PRP: {
    procedureType: 'PRP',
    category: 'Regenerative',
    substance: 'Platelet-Rich Plasma',
    typicalVolumes: '2.0mL - 5.0mL',
    recoveryTimeline: {
      day_0_1: 'Mild swelling, redness, bruising at injection sites.',
      day_2_3: 'Swelling resolving. Mild tenderness.',
      day_7_14: 'Skin quality improving. Collagen production increasing.',
    },
    normalSymptoms: ['Mild swelling', 'Bruising', 'Redness', 'Tenderness', 'Mild headache'],
    warningSigns: ['Persistent redness', 'Signs of infection', 'Fever', 'Pus formation'],
    emergencySigns: ['Severe infection signs', 'High fever', 'Spreading redness'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Blood disorders', 'Anticoagulant therapy', 'Pregnancy', 'Cancer'],
    postProcedureInstructions: [
      'Avoid makeup for 24 hours',
      'Avoid sun exposure for 48 hours',
      'Avoid strenuous exercise for 24 hours',
      'Keep area clean and dry for 12 hours',
    ],
    redFlagCriteria: [
      { condition: 'Persistent redness beyond Day 3', riskLevel: 'YELLOW', timeframe: 'Day 3+' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Fever', riskLevel: 'ORANGE', timeframe: 'Day 1+' },
      { condition: 'Pus formation', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
    ],
    silenceRiskWeight: 1.0,
  },
  MICRONEEDLING: {
    procedureType: 'MICRONEEDLING',
    category: 'Skin Rejuvenation',
    substance: 'N/A (mechanical)',
    typicalVolumes: 'N/A',
    recoveryTimeline: {
      day_0_1: 'Redness, swelling, skin feels like sunburn.',
      day_2_3: 'Redness subsiding. Mild peeling possible.',
      day_5_7: 'Skin healing. New skin visible.',
      day_7_14: 'Significant improvement in skin texture.',
    },
    normalSymptoms: ['Redness', 'Swelling', 'Tightness', 'Mild peeling', 'Skin sensitivity'],
    warningSigns: ['Persistent redness beyond Day 3', 'Signs of infection', 'Scarring', 'Hyperpigmentation'],
    emergencySigns: ['Severe infection', 'Allergic reaction', 'Scarring'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 3, type: 'Photo', purpose: 'Healing assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active acne', 'Active infection', 'Rosacea', 'Eczema', 'Pregnancy'],
    postProcedureInstructions: [
      'Do not wash face for 12 hours',
      'Avoid sun exposure for 48 hours',
      'Avoid makeup for 24 hours',
      'Use gentle moisturizer',
      'Avoid strenuous exercise for 24 hours',
    ],
    redFlagCriteria: [
      { condition: 'Persistent redness beyond Day 3', riskLevel: 'YELLOW', timeframe: 'Day 3+' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Scarring', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Hyperpigmentation', riskLevel: 'YELLOW', timeframe: 'Day 14+' },
    ],
    silenceRiskWeight: 1.0,
  },
  FILLER_POLY_L_LACTIC: {
    procedureType: 'FILLER_POLY_L_LACTIC',
    category: 'Dermal Filler',
    substance: 'Poly-L-Lactic Acid (Sculptra)',
    typicalVolumes: '1.0mL - 2.0mL per session',
    recoveryTimeline: {
      day_0_2: 'Swelling and bruising expected.',
      day_3_7: 'Swelling subsiding. Product integrating.',
      day_7_14: 'Collagen stimulation beginning.',
      day_14_30: 'Collagen production increasing. Results improving.',
    },
    normalSymptoms: ['Swelling', 'Bruising', 'Tenderness', 'Firmness', 'Mild asymmetry'],
    warningSigns: ['Nodule formation', 'Persistent redness', 'Skin discoloration'],
    emergencySigns: ['Blanching', 'Severe pain', 'Visual changes', 'Skin necrosis'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Collagen response' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy', 'Autoimmune disease'],
    postProcedureInstructions: [
      'Apply ice for 20 minutes every 2 hours for first 24 hours',
      'Massage the treated area 5 minutes, 5 times a day for 5 days',
      'Avoid strenuous exercise for 48 hours',
      'Avoid extreme heat for 48 hours',
    ],
    redFlagCriteria: [
      { condition: 'Blanching of skin', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Severe pain', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Nodule formation', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Persistent asymmetry beyond Day 14', riskLevel: 'YELLOW', timeframe: 'Day 14+' },
    ],
    silenceRiskWeight: 1.3,
  },
  FILLER_POLYALKYLIMIDE: {
    procedureType: 'FILLER_POLYALKYLIMIDE',
    category: 'Dermal Filler',
    substance: 'Polyalkylimide (Bio-Alcamid)',
    typicalVolumes: '1.0mL - 3.0mL',
    recoveryTimeline: {
      day_0_2: 'Mild swelling and bruising.',
      day_3_7: 'Swelling resolving. Product settling.',
      day_7_14: 'Near-final result.',
      day_14_30: 'Final result achieved.',
    },
    normalSymptoms: ['Mild swelling', 'Bruising', 'Tenderness', 'Firmness'],
    warningSigns: ['Persistent redness', 'Nodule formation', 'Migration signs'],
    emergencySigns: ['Blanching', 'Severe pain', 'Visual changes'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy'],
    postProcedureInstructions: [
      'Apply ice for first 24 hours',
      'Avoid strenuous exercise for 48 hours',
      'Avoid extreme heat for 48 hours',
      'Contact clinic for any concerning symptoms',
    ],
    redFlagCriteria: [
      { condition: 'Blanching of skin', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Severe pain', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Signs of migration', riskLevel: 'ORANGE', timeframe: 'Weeks-Months' },
      { condition: 'Nodule formation', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
    ],
    silenceRiskWeight: 1.3,
  },
  FILLER_POLYMETHYLMETHACRYLATE: {
    procedureType: 'FILLER_POLYMETHYLMETHACRYLATE',
    category: 'Dermal Filler',
    substance: 'PMMA (Artefill)',
    typicalVolumes: '0.5mL - 2.0mL',
    recoveryTimeline: {
      day_0_2: 'Swelling and bruising expected.',
      day_3_7: 'Swelling subsiding.',
      day_7_14: 'Product integrating.',
      day_14_30: 'Final result. Collagen stimulation ongoing.',
    },
    normalSymptoms: ['Swelling', 'Bruising', 'Tenderness', 'Firmness', 'Mild asymmetry'],
    warningSigns: ['Nodule formation', 'Persistent redness', 'Granuloma signs'],
    emergencySigns: ['Blanching', 'Severe pain', 'Visual changes', 'Skin necrosis'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Final result' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy', 'Autoimmune disease'],
    postProcedureInstructions: [
      'Apply ice for first 24 hours',
      'Avoid strenuous exercise for 48 hours',
      'Do not massage unless instructed',
      'Contact clinic for any concerning symptoms',
    ],
    redFlagCriteria: [
      { condition: 'Blanching of skin', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Severe pain', riskLevel: 'RED', timeframe: 'Immediate' },
      { condition: 'Granuloma formation', riskLevel: 'ORANGE', timeframe: 'Weeks-Months' },
      { condition: 'Nodule formation', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
    ],
    silenceRiskWeight: 1.3,
  },
  MESOTHERAPY: {
    procedureType: 'MESOTHERAPY',
    category: 'Biostimulator',
    substance: 'Vitamins, enzymes, hormones, plant extracts',
    typicalVolumes: '1.0mL - 5.0mL per session',
    recoveryTimeline: {
      day_0_1: 'Mild swelling, redness, bruising at injection sites.',
      day_2_3: 'Swelling resolving. Mild tenderness.',
      day_5_10: 'Skin improving. Hydration increasing.',
    },
    normalSymptoms: ['Mild swelling', 'Bruising', 'Redness', 'Tenderness', 'Small bumps'],
    warningSigns: ['Persistent redness', 'Signs of infection', 'Allergic reaction'],
    emergencySigns: ['Severe allergic reaction', 'Signs of infection'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy', 'Blood disorders'],
    postProcedureInstructions: [
      'Avoid makeup for 12 hours',
      'Avoid sun exposure for 48 hours',
      'Avoid strenuous exercise for 24 hours',
      'Keep skin hydrated',
    ],
    redFlagCriteria: [
      { condition: 'Persistent redness beyond Day 3', riskLevel: 'YELLOW', timeframe: 'Day 3+' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Allergic reaction', riskLevel: 'ORANGE', timeframe: 'Hours-Days' },
    ],
    silenceRiskWeight: 1.0,
  },
  PDO_THREADS: {
    procedureType: 'PDO_THREADS',
    category: 'Thread Lift',
    substance: 'Polydioxanone threads',
    typicalVolumes: 'N/A (threads)',
    recoveryTimeline: {
      day_0_2: 'Significant swelling and bruising expected.',
      day_3_7: 'Swelling subsiding. Bruising fading.',
      day_7_14: 'Lifting effect becoming visible.',
      day_14_30: 'Final result. Collagen production increasing.',
    },
    normalSymptoms: ['Swelling', 'Bruising', 'Tenderness', 'Tightness', 'Mild asymmetry', 'Dimpling'],
    warningSigns: ['Thread extrusion', 'Infection signs', 'Persistent asymmetry', 'Skin puckering'],
    emergencySigns: ['Severe infection', 'Thread migration', 'Skin necrosis'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 3, type: 'Photo', purpose: 'Swelling monitoring' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Final result' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy', 'Autoimmune disease'],
    postProcedureInstructions: [
      'Avoid extreme facial expressions for 2 weeks',
      'Avoid sleeping on your side for 1 week',
      'Avoid strenuous exercise for 2 weeks',
      'Avoid dental procedures for 2 weeks',
      'Contact clinic immediately for any concerning symptoms',
    ],
    redFlagCriteria: [
      { condition: 'Thread extrusion', riskLevel: 'ORANGE', timeframe: 'Days-Weeks' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Severe asymmetry', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Skin necrosis', riskLevel: 'RED', timeframe: 'Hours-Days' },
    ],
    silenceRiskWeight: 1.4,
  },
  FAT_DISSOLVING: {
    procedureType: 'FAT_DISSOLVING',
    category: 'Injectable',
    substance: 'Deoxycholic acid (Kybella)',
    typicalVolumes: '1.0mL - 2.0mL per session',
    recoveryTimeline: {
      day_0_2: 'Significant swelling expected (normal response).',
      day_3_7: 'Swelling subsiding. Bruising fading.',
      day_7_14: 'Swelling mostly resolved.',
      day_14_30: 'Fat reduction becoming visible.',
    },
    normalSymptoms: ['Significant swelling', 'Bruising', 'Tenderness', 'Numbness', 'Firmness'],
    warningSigns: ['Persistent swelling beyond Day 7', 'Signs of infection', 'Skin irregularity'],
    emergencySigns: ['Severe infection', 'Nerve injury signs', 'Skin necrosis'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Swelling monitoring' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 30, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy', 'Infection at treatment site'],
    postProcedureInstructions: [
      'Apply ice for 20 minutes every 2 hours for first 48 hours',
      'Avoid strenuous exercise for 1 week',
      'Avoid extreme heat for 48 hours',
      'Massage the area gently 3 times a day for 1 week',
      'Swelling is normal and expected for 5-7 days',
    ],
    redFlagCriteria: [
      { condition: 'Severe swelling beyond Day 7', riskLevel: 'ORANGE', timeframe: 'Day 7+' },
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Skin necrosis', riskLevel: 'RED', timeframe: 'Days' },
      { condition: 'Nerve injury signs', riskLevel: 'RED', timeframe: 'Days-Weeks' },
    ],
    silenceRiskWeight: 1.2,
  },
  OTHER: {
    procedureType: 'OTHER',
    category: 'Other',
    substance: 'Unknown',
    typicalVolumes: 'Variable',
    recoveryTimeline: {
      day_0_1: 'Monitor for immediate complications.',
      day_2_7: 'Standard recovery monitoring.',
      day_7_14: 'Assess treatment outcome.',
    },
    normalSymptoms: ['Mild swelling', 'Mild bruising', 'Tenderness'],
    warningSigns: ['Persistent symptoms', 'Signs of infection', 'Worsening condition'],
    emergencySigns: ['Severe pain', 'Signs of infection', 'Allergic reaction'],
    followUpSchedule: [
      { day: 1, type: 'Photo', purpose: 'Early assessment' },
      { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
      { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
    ],
    contraindications: ['Active infection', 'Known allergy', 'Pregnancy'],
    postProcedureInstructions: [
      'Follow post-procedure instructions provided by your clinician',
      'Contact clinic for any concerning symptoms',
      'Upload photos at scheduled check-in times',
    ],
    redFlagCriteria: [
      { condition: 'Signs of infection', riskLevel: 'ORANGE', timeframe: 'Day 2+' },
      { condition: 'Severe pain', riskLevel: 'ORANGE', timeframe: 'Immediate' },
      { condition: 'Allergic reaction', riskLevel: 'ORANGE', timeframe: 'Hours-Days' },
    ],
    silenceRiskWeight: 1.0,
  },
}

// ─── SOAP Note Generator ──────────────────────────────────────

export function generateSOAPNote(data: {
  patientName: string
  treatmentType: string
  dayNumber: number
  symptoms: string
  findings: string
  riskLevel: string
  recommendations: string[]
}): string {
  return `SUBJECTIVE:
- Patient reports: ${data.symptoms || 'No symptoms reported'}
- Day ${data.dayNumber} post-${data.treatmentType.replace(/_/g, ' ').toLowerCase()}

OBJECTIVE:
- Clinical photography: Day ${data.dayNumber} post-${data.treatmentType.replace(/_/g, ' ').toLowerCase()}
- AI Assessment: ${data.riskLevel} — ${data.findings}

ASSESSMENT:
- Day ${data.dayNumber} post-${data.treatmentType.replace(/_/g, ' ').toLowerCase()}
- Current status: ${data.riskLevel}

PLAN:
${data.recommendations.map(r => `- ${r}`).join('\n')}
- Follow-up as scheduled`
}

// ─── Clinical Query Parser ────────────────────────────────────

export function parseClinicalQuery(query: string): {
  intent: string
  filters: Record<string, string>
} {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('prolonged swelling') || lowerQuery.includes('swelling over') || lowerQuery.includes('swollen') || lowerQuery.includes('swelling')) {
    const durationMatch = lowerQuery.match(/(\d+)\s*day/)
    return { intent: 'PROLONGED_SWELLING', filters: { symptom: 'swelling', duration: durationMatch ? durationMatch[1] : '10' } }
  }
  if (lowerQuery.includes('missed') || lowerQuery.includes('miss') || lowerQuery.includes('overdue') || lowerQuery.includes('didn') || lowerQuery.includes('did not')) {
    if (lowerQuery.includes('check') || lowerQuery.includes('checkin') || lowerQuery.includes('check-in')) {
      return { intent: 'MISSED_CHECKIN', filters: {} }
    }
  }
  if (lowerQuery.includes('follow') || lowerQuery.includes('follow-up') || lowerQuery.includes('followup') || lowerQuery.includes('upcoming') || lowerQuery.includes('this week')) {
    return { intent: 'MISSED_CHECKIN', filters: {} }
  }
  if (lowerQuery.includes('vascular') || lowerQuery.includes('occlusion') || lowerQuery.includes('necrosis')) {
    return { intent: 'VASCULAR_ALERTS', filters: { type: 'VASCULAR_OCCLUSION' } }
  }
  if (lowerQuery.includes('complication') || lowerQuery.includes('adverse') || lowerQuery.includes('side effect')) {
    return { intent: 'COMPLICATIONS', filters: {} }
  }
  if (lowerQuery.includes('active') && lowerQuery.includes('complication')) {
    return { intent: 'COMPLICATIONS', filters: {} }
  }
  if (lowerQuery.includes('patient') || lowerQuery.includes('search') || lowerQuery.includes('find')) {
    return { intent: 'PATIENT_SEARCH', filters: { search: query } }
  }
  if (lowerQuery.includes('batch') || lowerQuery.includes('product')) {
    return { intent: 'COMPLICATIONS', filters: {} }
  }

  return { intent: 'PATIENT_SEARCH', filters: { search: query } }
}
