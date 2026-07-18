export interface DecisionNode {
  id: string
  condition: string
  description: string
  riskLevel?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
  action?: string
  next?: string
}

export interface DecisionTree {
  treatmentType: string
  name: string
  description: string
  riskFactors: RiskFactor[]
  decisionNodes: DecisionNode[]
  escalationTriggers: EscalationTrigger[]
  expectedTimeline: TimelineMilestone[]
  patientExplanation: string
}

export interface RiskFactor {
  name: string
  description: string
  weight: number
  redFlag?: boolean
  treatmentSpecific?: boolean
}

export interface EscalationTrigger {
  id: string
  condition: string
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENT'
  action: string
  notifyDoctor: boolean
  notifyPatient: boolean
}

export interface TimelineMilestone {
  day: number
  label: string
  expectedFindings: string
  abnormalIf: string
}

export interface ExplainabilityOutput {
  treatmentType: string
  treatmentName: string
  dayNumber: number
  riskLevel: string
  riskExplanation: string
  findingsExplanation: FindingExplanation[]
  whatWeChecked: string[]
  whyThisRiskLevel: string
  whatHappensNext: string
  whenToWorry: string[]
  patientFriendlySummary: string
  decisionPath: DecisionPathEntry[]
}

export interface FindingExplanation {
  feature: string
  patientTerm: string
  clinicalTerm: string
  score: number
  severity: string
  explanation: string
  isNormalForDay: boolean
  comparisonToExpected: string
}

export interface DecisionPathEntry {
  node: string
  evaluated: boolean
  result: 'PASS' | 'FAIL' | 'SKIP'
  explanation: string
}

const TREATMENT_DECISION_TREES: Record<string, DecisionTree> = {
  BOTOX: {
    treatmentType: 'BOTOX',
    name: 'Botox (Botulinum Toxin)',
    description: 'Neuromodulator injection for dynamic wrinkles and muscle relaxation',
    riskFactors: [
      { name: 'Brow Ptosis', description: 'Drooping of the eyebrow above the injection site', weight: 0.8, redFlag: true, treatmentSpecific: true },
      { name: 'Eyelid Ptosis', description: 'Drooping of the upper eyelid', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Asymmetry', description: 'Uneven muscle relaxation between sides', weight: 0.5, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling at injection sites', weight: 0.3 },
      { name: 'Ecchymosis', description: 'Bruising at injection sites', weight: 0.2 },
      { name: 'Diffusion', description: 'Effect spreading to unintended muscles', weight: 0.6, redFlag: true, treatmentSpecific: true },
      { name: 'Systemic Symptoms', description: 'Difficulty swallowing, speaking, or breathing', weight: 1.0, redFlag: true, treatmentSpecific: true },
    ],
    decisionNodes: [
      { id: 'SYSTEMIC_CHECK', condition: 'difficulty_speaking || difficulty_swallowing || difficulty_breathing', description: 'Check for systemic botulinum toxin spread', riskLevel: 'RED', action: 'EMERGENCY: Contact patient immediately, refer to ER', next: 'END' },
      { id: 'EYELID_PTOSIS', condition: 'eyelid_droop > 2mm', description: 'Assess upper eyelid drooping', riskLevel: 'ORANGE', action: 'Apraclonidine 0.5% eye drops, monitor 48h', next: 'EDema_CHECK' },
      { id: 'BROW_PTOSIS', condition: 'brow_position < baseline - 3mm', description: 'Assess eyebrow drooping', riskLevel: 'YELLOW', action: 'Patient education, no treatment needed, monitor', next: 'EDema_CHECK' },
      { id: 'ASYMMETRY', condition: 'asymmetry_score > 0.3', description: 'Evaluate asymmetry between treatment sides', riskLevel: 'YELLOW', action: 'Review injection technique, consider touch-up at 2 weeks', next: 'EDema_CHECK' },
      { id: 'EDema_CHECK', condition: 'edema > 0.3', description: 'Assess injection site swelling', riskLevel: 'GREEN', action: 'Ice, elevate, monitor', next: 'ECCHYMOSIS_CHECK' },
      { id: 'ECCHYMOSIS_CHECK', condition: 'ecchymosis > 0.4', description: 'Assess bruising', riskLevel: 'GREEN', action: 'Arnica, avoid blood thinners, monitor', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_SYSTEMIC', condition: 'Systemic weakness or breathing difficulty', urgency: 'EMERGENT', action: 'Refer to emergency department immediately', notifyDoctor: true, notifyPatient: true },
      { id: 'URGENT_PTOSIS', condition: 'Eyelid ptosis not improving after 48h', urgency: 'URGENT', action: 'Schedule urgent ophthalmology consult', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Mild swelling, possible bruising', abnormalIf: 'Severe asymmetry, ptosis, or systemic symptoms' },
      { day: 3, label: 'Day 3', expectedFindings: 'Swelling resolving, effect beginning', abnormalIf: 'Worsening asymmetry, new ptosis' },
      { day: 7, label: 'Day 7', expectedFindings: 'Full effect visible, minimal swelling', abnormalIf: 'Persistent ptosis,扩散 to other muscles' },
      { day: 14, label: 'Day 14', expectedFindings: 'Final result, all swelling resolved', abnormalIf: 'Asymmetry, uneven results' },
    ],
    patientExplanation: 'Botox works by temporarily relaxing specific muscles. Common side effects like mild swelling and bruising at the injection site are normal and resolve within days. We monitor for rare complications like eyelid or eyebrow drooping, which can occur if the treatment affects nearby muscles.',
  },
  FILLER_HYALURONIC: {
    treatmentType: 'FILLER_HYALURONIC',
    name: 'Hyaluronic Acid Filler',
    description: 'Dermal filler for volume restoration and wrinkle correction',
    riskFactors: [
      { name: 'Vascular Occlusion', description: 'Filler blocking a blood vessel', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Skin Necrosis', description: 'Tissue death due to blood supply compromise', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Tyndall Effect', description: 'Bluish discoloration from superficial filler placement', weight: 0.6, treatmentSpecific: true },
      { name: 'Granuloma', description: 'Inflammatory nodules from filler reaction', weight: 0.7, treatmentSpecific: true },
      { name: 'Migration', description: 'Filler moving from injection site', weight: 0.5, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling at injection site', weight: 0.4 },
      { name: 'Ecchymosis', description: 'Bruising', weight: 0.3 },
      { name: 'Asymmetry', description: 'Uneven volume distribution', weight: 0.4 },
      { name: 'Blanching', description: 'White discoloration indicating vascular compromise', weight: 1.0, redFlag: true, treatmentSpecific: true },
    ],
    decisionNodes: [
      { id: 'VASCULAR_CHECK', condition: 'blanching || severe_pain || skin_color_change', description: 'Check for vascular compromise - FILLER EMERGENCY', riskLevel: 'RED', action: 'HYALURONIDASE: Dissolve filler immediately, warm compress, nitroglycerin paste', next: 'END' },
      { id: 'NECROSIS_CHECK', condition: 'skin_necrosis || dark_skin_patches', description: 'Assess for tissue death', riskLevel: 'RED', action: 'Immediate vascular surgery consult, hyaluronidase injection', next: 'END' },
      { id: 'TYNDALL_CHECK', condition: 'bluish_discoloration && superficial', description: 'Assess Tyndall effect', riskLevel: 'ORANGE', action: 'Hyaluronidase to dissolve superficial filler', next: 'GRANULOMA_CHECK' },
      { id: 'GRANULOMA_CHECK', condition: 'nodules > 5mm || inflamed_nodules', description: 'Assess inflammatory nodules', riskLevel: 'ORANGE', action: 'Steroid injection, possible hyaluronidase', next: 'MIGRATION_CHECK' },
      { id: 'MIGRATION_CHECK', condition: 'filler_moved_from_injection_site', description: 'Assess filler migration', riskLevel: 'YELLOW', action: 'Hyaluronidase to dissolve migrated filler', next: 'EDema_CHECK' },
      { id: 'EDema_CHECK', condition: 'edema > 0.5', description: 'Assess swelling severity', riskLevel: 'YELLOW', action: 'Ice, elevate, arnica', next: 'ASYMMETRY_CHECK' },
      { id: 'ASYMMETRY_CHECK', condition: 'asymmetry > 0.4', description: 'Assess volume asymmetry', riskLevel: 'YELLOW', action: 'Review injection technique, touch-up at 2 weeks', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_VASCULAR', condition: 'Any sign of vascular occlusion', urgency: 'EMERGENT', action: 'Emergency hyaluronidase injection and vascular consult', notifyDoctor: true, notifyPatient: true },
      { id: 'URGENT_NECROSIS', condition: 'Suspected tissue necrosis', urgency: 'URGENT', action: 'Immediate vascular surgery referral', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Moderate swelling, bruising possible', abnormalIf: 'Severe pain, blanching, skin color changes' },
      { day: 3, label: 'Day 3', expectedFindings: 'Swelling subsiding, bruising fading', abnormalIf: 'Worsening swelling, new lumps, color changes' },
      { day: 7, label: 'Day 7', expectedFindings: 'Near-final result, minimal swelling', abnormalIf: 'Persistent lumps, asymmetry, discoloration' },
      { day: 14, label: 'Day 14', expectedFindings: 'Final result achieved', abnormalIf: 'Migration, granulomas, persistent asymmetry' },
      { day: 30, label: 'Day 30', expectedFindings: 'Stable result', abnormalIf: 'Delayed granulomas, late complications' },
    ],
    patientExplanation: 'Dermal fillers add volume beneath the skin. Mild swelling and bruising are normal and resolve within a week. We monitor carefully for rare but serious complications like filler blocking a blood vessel, which requires immediate treatment. Most concerns can be addressed if caught early.',
  },
  FILLER_CALCIUM_HYDROXYLAPATITE: {
    treatmentType: 'FILLER_CALCIUM_HYDROXYLAPATITE',
    name: 'Calcium Hydroxylapatite Filler (Radiesse)',
    description: 'Biostimulatory filler for deep volume restoration',
    riskFactors: [
      { name: 'Vascular Occlusion', description: 'Filler blocking a blood vessel', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Nodule Formation', description: 'Palpable granulomas from calcium particles', weight: 0.8, treatmentSpecific: true },
      { name: 'Tyndall Effect', description: 'Bluish discoloration (less common than HA)', weight: 0.4, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling', weight: 0.4 },
      { name: 'Ecchymosis', description: 'Bruising', weight: 0.3 },
      { name: 'Asymmetry', description: 'Uneven volume', weight: 0.4 },
      { name: 'Blanching', description: 'Vascular compromise sign', weight: 1.0, redFlag: true, treatmentSpecific: true },
    ],
    decisionNodes: [
      { id: 'VASCULAR_CHECK', condition: 'blanching || severe_pain || skin_color_change', description: 'Vascular compromise check - NO hyaluronidase available', riskLevel: 'RED', action: 'Immediate vascular surgery consult, warm compress, nitroglycerin paste. Note: Hyaluronidase does NOT dissolve CaHA.', next: 'END' },
      { id: 'NODULE_CHECK', condition: 'nodules > 3mm || inflamed', description: 'Assess calcium-based nodules', riskLevel: 'ORANGE', action: 'Intralesional 5-FU + steroid injection', next: 'EDema_CHECK' },
      { id: 'EDema_CHECK', condition: 'edema > 0.5', description: 'Assess swelling', riskLevel: 'YELLOW', action: 'Ice, elevate, monitor', next: 'ASYMMETRY_CHECK' },
      { id: 'ASYMMETRY_CHECK', condition: 'asymmetry > 0.4', description: 'Assess volume distribution', riskLevel: 'YELLOW', action: 'Wait for full integration, touch-up at 4 weeks', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_VASCULAR', condition: 'Any vascular compromise', urgency: 'EMERGENT', action: 'Vascular surgery emergency consult', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Moderate swelling, bruising', abnormalIf: 'Severe pain, blanching' },
      { day: 7, label: 'Day 7', expectedFindings: 'Swelling resolving, integration beginning', abnormalIf: 'New lumps, persistent swelling' },
      { day: 14, label: 'Day 14', expectedFindings: 'Near-final result, collagen stimulation ongoing', abnormalIf: 'Nodules forming' },
      { day: 30, label: 'Day 30', expectedFindings: 'Full integration, optimal result', abnormalIf: 'Delayed nodules, granulomas' },
    ],
    patientExplanation: 'Calcium hydroxylapatite filler provides immediate volume and stimulates your own collagen production. Swelling and bruising are normal for the first week. Unlike other fillers, this type cannot be dissolved with an enzyme, so we monitor carefully for complications that might require different treatments.',
  },
  FILLER_POLY_L_LACTIC: {
    treatmentType: 'FILLER_POLY_L_LACTIC',
    name: 'Poly-L-Lactic Acid Filler (Sculptra)',
    description: 'Biostimulatory filler for gradual volume restoration',
    riskFactors: [
      { name: 'Nodule Formation', description: 'Palpable nodules from PLLA particles', weight: 0.9, treatmentSpecific: true },
      { name: 'Vascular Occlusion', description: 'Rare but possible', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling', weight: 0.4 },
      { name: 'Ecchymosis', description: 'Bruising', weight: 0.3 },
      { name: 'Asymmetry', description: 'Uneven collagen stimulation', weight: 0.5 },
    ],
    decisionNodes: [
      { id: 'VASCULAR_CHECK', condition: 'blanching || severe_pain', description: 'Vascular compromise check', riskLevel: 'RED', action: 'Immediate vascular consult', next: 'END' },
      { id: 'NODULE_CHECK', condition: 'nodules > 5mm || visible', description: 'Assess PLLA nodules', riskLevel: 'ORANGE', action: 'Intralesional steroid + 5-FU, massage protocol', next: 'EDema_CHECK' },
      { id: 'EDema_CHECK', condition: 'edema > 0.5', description: 'Assess swelling', riskLevel: 'YELLOW', action: 'Ice, massage, monitor', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_VASCULAR', condition: 'Vascular compromise', urgency: 'EMERGENT', action: 'Vascular surgery consult', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Mild swelling, possible bruising', abnormalIf: 'Severe pain, discoloration' },
      { day: 7, label: 'Day 7', expectedFindings: 'Swelling resolving, no visible change yet', abnormalIf: 'New lumps' },
      { day: 30, label: 'Day 30', expectedFindings: 'Collagen stimulation beginning, subtle improvement', abnormalIf: 'Nodules forming' },
      { day: 90, label: 'Day 90', expectedFindings: 'Full result visible', abnormalIf: 'Persistent nodules' },
    ],
    patientExplanation: 'Sculptra works gradually by stimulating your body\'s own collagen production. You won\'t see immediate results — the improvement develops over 2-3 months. Mild swelling is normal after treatment. We watch for rare nodules that can form if the product clumps, which can be treated if detected early.',
  },
  FILLER_POLYALKYLIMIDE: {
    treatmentType: 'FILLER_POLYALKYLIMIDE',
    name: 'Polyalkylimide Filler (Bio-Alcamid)',
    description: 'Semi-permanent filler for volume restoration',
    riskFactors: [
      { name: 'Biofilm', description: 'Bacterial infection on filler surface', weight: 0.9, treatmentSpecific: true },
      { name: 'Migration', description: 'Filler movement from injection site', weight: 0.6, treatmentSpecific: true },
      { name: 'Vascular Occlusion', description: 'Vessel blockage', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling', weight: 0.4 },
      { name: 'Nodules', description: 'Palpable lumps', weight: 0.5 },
    ],
    decisionNodes: [
      { id: 'VASCULAR_CHECK', condition: 'blanching || severe_pain', description: 'Vascular compromise check', riskLevel: 'RED', action: 'Immediate vascular consult', next: 'END' },
      { id: 'BIOFILM_CHECK', condition: 'delayed_onset_swelling || redness_spreading', description: 'Assess for biofilm infection', riskLevel: 'ORANGE', action: 'Antibiotic protocol (fluoroquinolone + macrolide)', next: 'NODULE_CHECK' },
      { id: 'NODULE_CHECK', condition: 'nodules > 5mm', description: 'Assess nodules', riskLevel: 'YELLOW', action: 'Antibiotic trial, possible removal', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_VASCULAR', condition: 'Vascular compromise', urgency: 'EMERGENT', action: 'Vascular surgery consult', notifyDoctor: true, notifyPatient: true },
      { id: 'URGENT_BIOFILM', condition: 'Spreading infection on filler', urgency: 'URGENT', action: 'IV antibiotics and possible surgical drainage', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Mild swelling', abnormalIf: 'Severe pain, blanching' },
      { day: 7, label: 'Day 7', expectedFindings: 'Settled, minimal swelling', abnormalIf: 'Delayed swelling, redness' },
      { day: 30, label: 'Day 30', expectedFindings: 'Stable result', abnormalIf: 'New nodules, migration' },
    ],
    patientExplanation: 'This semi-permanent filler provides long-lasting volume. Mild swelling after treatment is normal. We monitor for signs of infection or delayed reactions, which can occur weeks after treatment. Early detection and treatment of any complications is important for best outcomes.',
  },
  FILLER_POLYMETHYLMETHACRYLATE: {
    treatmentType: 'FILLER_POLYMETHYLMETHACRYLATE',
    name: 'PMMA Filler (Artefill/Bellafill)',
    description: 'Permanent filler with microspheres suspended in collagen',
    riskFactors: [
      { name: 'Granuloma', description: 'Inflammatory reaction to microspheres', weight: 0.9, treatmentSpecific: true },
      { name: 'Migration', description: 'Microsphere movement', weight: 0.7, treatmentSpecific: true },
      { name: 'Vascular Occlusion', description: 'Vessel blockage', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Delayed Hypersensitivity', description: 'Allergic reaction weeks/months later', weight: 0.8, treatmentSpecific: true },
      { name: 'Edema', description: 'Swelling', weight: 0.4 },
      { name: 'Nodules', description: 'Palpable lumps', weight: 0.6 },
    ],
    decisionNodes: [
      { id: 'VASCULAR_CHECK', condition: 'blanching || severe_pain', description: 'Vascular compromise check', riskLevel: 'RED', action: 'Immediate vascular consult', next: 'END' },
      { id: 'GRANULOMA_CHECK', condition: 'delayed_nodules > 3mm', description: 'Assess granulomas', riskLevel: 'ORANGE', action: 'Intralesional steroid + 5-FU injection series', next: 'MIGRATION_CHECK' },
      { id: 'MIGRATION_CHECK', condition: 'filler_visible_away_from_injection', description: 'Assess microsphere migration', riskLevel: 'ORANGE', action: 'Surgical consultation for removal', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_VASCULAR', condition: 'Vascular compromise', urgency: 'EMERGENT', action: 'Vascular surgery consult', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Mild swelling', abnormalIf: 'Severe pain, blanching' },
      { day: 7, label: 'Day 7', expectedFindings: 'Settled', abnormalIf: 'Increasing swelling' },
      { day: 30, label: 'Day 30', expectedFindings: 'Stable', abnormalIf: 'New nodules' },
      { day: 90, label: 'Day 90', expectedFindings: 'Long-term result', abnormalIf: 'Delayed granulomas' },
    ],
    patientExplanation: 'This permanent filler contains tiny microspheres that your body encapsulates. Most side effects resolve within a week. We monitor carefully for delayed reactions that can occur months later, including inflammatory nodules. These are treatable if detected early.',
  },
  LASER: {
    treatmentType: 'LASER',
    name: 'Laser Treatment',
    description: 'Laser resurfacing or skin rejuvenation procedure',
    riskFactors: [
      { name: 'Thermal Burn', description: 'Burn from laser energy', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Post-Inflammatory Hyperpigmentation', description: 'Dark spots after treatment', weight: 0.6, treatmentSpecific: true },
      { name: 'Hypopigmentation', description: 'Light spots from over-treatment', weight: 0.7, treatmentSpecific: true },
      { name: 'Scarring', description: 'Permanent scar formation', weight: 0.9, redFlag: true, treatmentSpecific: true },
      { name: 'Infection', description: 'Bacterial or viral infection', weight: 0.7, treatmentSpecific: true },
      { name: 'Erythema', description: 'Redness (expected but monitor severity)', weight: 0.3 },
      { name: 'Edema', description: 'Swelling (expected)', weight: 0.3 },
      { name: 'Exfoliation', description: 'Normal peeling after treatment', weight: 0.1 },
    ],
    decisionNodes: [
      { id: 'BURN_CHECK', condition: 'blistering || charring || severe_pain', description: 'Assess thermal injury', riskLevel: 'RED', action: 'Burn wound care, silver sulfadiazine, pain management', next: 'END' },
      { id: 'INFECTION_CHECK', condition: 'pus || fever || spreading_redness', description: 'Assess for infection', riskLevel: 'ORANGE', action: 'Wound culture, antibiotics, antivirals if needed', next: 'PIH_CHECK' },
      { id: 'PIH_CHECK', condition: 'hyperpigmentation > expected', description: 'Assess post-inflammatory hyperpigmentation', riskLevel: 'YELLOW', action: 'Sun protection, hydroquinone, tretinoin', next: 'SCAR_CHECK' },
      { id: 'SCAR_CHECK', condition: 'raised_scar || keloid', description: 'Assess scarring', riskLevel: 'ORANGE', action: 'Silicone sheeting, steroid injection, laser treatment', next: 'END' },
      { id: 'EXFOLIATION_CHECK', condition: 'excessive_peeling && < day_5', description: 'Assess exfoliation timing', riskLevel: 'YELLOW', action: 'Moisturize, do not pick, monitor', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_BURN', condition: 'Full-thickness burn or extensive blistering', urgency: 'EMERGENT', action: 'Burn center referral', notifyDoctor: true, notifyPatient: true },
      { id: 'URGENT_INFECTION', condition: 'Spreading infection with systemic signs', urgency: 'URGENT', action: 'Urgent dermatology consult, IV antibiotics', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Redness, swelling, warmth', abnormalIf: 'Blistering, severe pain, charring' },
      { day: 3, label: 'Day 3', expectedFindings: 'Peak swelling, beginning to darken', abnormalIf: 'Pus, spreading redness, fever' },
      { day: 7, label: 'Day 7', expectedFindings: 'Peeling, darkening (normal)', abnormalIf: 'Open wounds, signs of infection' },
      { day: 14, label: 'Day 14', expectedFindings: 'New skin visible, pink', abnormalIf: 'Persistent redness, dark spots' },
      { day: 30, label: 'Day 30', expectedFindings: 'Skin color normalizing', abnormalIf: 'Hyperpigmentation, scarring' },
    ],
    patientExplanation: 'Laser treatment works by creating controlled micro-injuries to stimulate skin renewal. Redness, swelling, and darkening are normal parts of healing. The treated area will peel as new skin forms. We monitor for complications like burns, infection, or unwanted color changes.',
  },
  CHEMICAL_PEEL: {
    treatmentType: 'CHEMICAL_PEEL',
    name: 'Chemical Peel',
    description: 'Acid-based skin resurfacing treatment',
    riskFactors: [
      { name: 'Deep Burn', description: 'Chemical burn too deep', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Hyperpigmentation', description: 'Dark spots after peel', weight: 0.6, treatmentSpecific: true },
      { name: 'Hypopigmentation', description: 'Light spots from over-treatment', weight: 0.7, treatmentSpecific: true },
      { name: 'Scarring', description: 'Scar formation', weight: 0.8, redFlag: true, treatmentSpecific: true },
      { name: 'Infection', description: 'Bacterial or viral infection', weight: 0.6, treatmentSpecific: true },
      { name: 'Cardiac toxicity', description: 'Systemic absorption of salicylic acid', weight: 1.0, redFlag: true, treatmentSpecific: true },
      { name: 'Erythema', description: 'Redness (expected)', weight: 0.3 },
      { name: 'Edema', description: 'Swelling (expected)', weight: 0.3 },
    ],
    decisionNodes: [
      { id: 'SYSTEMIC_CHECK', condition: 'tinnitus || nausea || metabolic_acidosis', description: 'Check for salicylate toxicity (TCA peels)', riskLevel: 'RED', action: 'Emergency department referral, sodium bicarbonate', next: 'END' },
      { id: 'BURN_CHECK', condition: 'white_frost || deep_penetration', description: 'Assess chemical burn depth', riskLevel: 'RED', action: 'Wound care, pain management, monitor for scarring', next: 'END' },
      { id: 'INFECTION_CHECK', condition: 'pus || fever || spreading_redness', description: 'Assess infection', riskLevel: 'ORANGE', action: 'Wound culture, antibiotics', next: 'PIH_CHECK' },
      { id: 'PIH_CHECK', condition: 'hyperpigmentation > expected_for_skin_type', description: 'Assess pigmentation changes', riskLevel: 'YELLOW', action: 'Sun protection, hydroquinone, chemical peel series', next: 'END' },
    ],
    escalationTriggers: [
      { id: 'EMERGENCY_BURN', condition: 'Full-thickness chemical burn', urgency: 'EMERGENT', action: 'Burn center referral', notifyDoctor: true, notifyPatient: true },
      { id: 'EMERGENCY_TOXICITY', condition: 'Systemic salicylate absorption', urgency: 'EMERGENT', action: 'Emergency department admission', notifyDoctor: true, notifyPatient: true },
    ],
    expectedTimeline: [
      { day: 1, label: 'Day 1', expectedFindings: 'Tightness, mild stinging', abnormalIf: 'Severe pain, white frost, blanching' },
      { day: 3, label: 'Day 3', expectedFindings: 'Darkening, tight feeling', abnormalIf: 'Blistering, open wounds' },
      { day: 5, label: 'Day 5', expectedFindings: 'Peeling begins', abnormalIf: 'Infection signs, excessive pain' },
      { day: 7, label: 'Day 7', expectedFindings: 'Peeling complete, pink skin', abnormalIf: 'Persistent redness, dark spots' },
      { day: 14, label: 'Day 14', expectedFindings: 'Skin color normalizing', abnormalIf: 'Hyperpigmentation' },
    ],
    patientExplanation: 'Chemical peels use controlled acid application to remove damaged skin layers. Tightness, darkening, and peeling are normal and expected. Your new skin will be pink and fresh underneath. We monitor for complications like burns or infection, which are rare with proper technique.',
  },
}

export function getDecisionTree(treatmentType: string): DecisionTree | null {
  return TREATMENT_DECISION_TREES[treatmentType] || null
}

export function evaluateDecisionPath(
  tree: DecisionTree,
  features: { edema: number; ecchymosis: number; erythema: number; asymmetry: number; nodules: number; vascularity: number },
  additionalFlags?: { blanching?: boolean; ptosis?: boolean; severePain?: boolean; skinColorChange?: boolean }
): DecisionPathEntry[] {
  const path: DecisionPathEntry[] = []

  for (const node of tree.decisionNodes) {
    let result: 'PASS' | 'FAIL' | 'SKIP' = 'SKIP'
    let explanation = ''

    if (node.id === 'VASCULAR_CHECK' || node.id === 'NECROSIS_CHECK') {
      if (additionalFlags?.blanching || additionalFlags?.skinColorChange || additionalFlags?.severePain) {
        result = 'FAIL'
        explanation = 'Vascular compromise indicators detected — requires immediate intervention'
      } else if (features.vascularity > 0.5) {
        result = 'FAIL'
        explanation = 'Elevated vascularity score suggests potential vascular involvement'
      } else {
        result = 'PASS'
        explanation = 'No vascular compromise indicators detected'
      }
    } else if (node.id === 'EYELID_PTOSIS' || node.id === 'BROW_PTOSIS') {
      if (additionalFlags?.ptosis) {
        result = 'FAIL'
        explanation = `${node.description} detected — requires clinical intervention`
      } else {
        result = 'PASS'
        explanation = `No ${node.description.toLowerCase()} detected`
      }
    } else if (node.id === 'ASYMMETRY' || node.id === 'ASYMMETRY_CHECK') {
      if (features.asymmetry > 0.3) {
        result = 'FAIL'
        explanation = `Asymmetry score (${features.asymmetry.toFixed(2)}) exceeds threshold — ${node.action}`
      } else {
        result = 'PASS'
        explanation = 'Symmetry within acceptable range'
      }
    } else if (node.id === 'EDema_CHECK' || node.id === 'EDema_CHECK') {
      if (features.edema > 0.5) {
        result = 'FAIL'
        explanation = `Edema score (${features.edema.toFixed(2)}) elevated — ${node.action}`
      } else {
        result = 'PASS'
        explanation = `Edema within normal range for recovery phase`
      }
    } else if (node.id === 'ECCHYMOSIS_CHECK') {
      if (features.ecchymosis > 0.4) {
        result = 'FAIL'
        explanation = `Bruising score (${features.ecchymosis.toFixed(2)}) elevated — ${node.action}`
      } else {
        result = 'PASS'
        explanation = 'Bruising within expected range'
      }
    } else if (node.id === 'NODULE_CHECK' || node.id === 'GRANULOMA_CHECK') {
      if (features.nodules > 0.3) {
        result = 'FAIL'
        explanation = `Nodule indicators detected — ${node.action}`
      } else {
        result = 'PASS'
        explanation = 'No significant nodules detected'
      }
    } else if (node.id === 'BIOFILM_CHECK') {
      if (features.erythema > 0.6 && features.edema > 0.5) {
        result = 'FAIL'
        explanation = 'Spreading redness and swelling suggest possible biofilm'
      } else {
        result = 'PASS'
        explanation = 'No biofilm indicators detected'
      }
    } else if (node.id === 'BURN_CHECK') {
      if (features.erythema > 0.8 || additionalFlags?.severePain) {
        result = 'FAIL'
        explanation = 'Severe erythema/pain suggests thermal injury'
      } else {
        result = 'PASS'
        explanation = 'No thermal injury indicators'
      }
    } else if (node.id === 'INFECTION_CHECK') {
      if (features.erythema > 0.7 && features.edema > 0.6) {
        result = 'FAIL'
        explanation = 'Signs consistent with infection — requires culture and treatment'
      } else {
        result = 'PASS'
        explanation = 'No infection indicators'
      }
    } else if (node.id === 'SYSTEMIC_CHECK') {
      result = 'PASS'
      explanation = 'No systemic symptoms reported'
    } else {
      result = 'PASS'
      explanation = 'Check passed'
    }

    path.push({ node: node.id, evaluated: true, result, explanation })
  }

  return path
}

export function generateExplainabilityOutput(
  treatmentType: string,
  dayNumber: number,
  features: { edema: number; ecchymosis: number; erythema: number; asymmetry: number; nodules: number; vascularity: number },
  riskLevel: string,
  rationale?: string
): ExplainabilityOutput {
  const tree = getDecisionTree(treatmentType)

  const featureExplanations: FindingExplanation[] = [
    {
      feature: 'Edema',
      patientTerm: 'Swelling',
      clinicalTerm: 'Edema',
      score: features.edema,
      severity: features.edema > 0.7 ? 'significant' : features.edema > 0.4 ? 'moderate' : features.edema > 0.2 ? 'mild' : 'none',
      explanation: features.edema > 0.4
        ? `You have ${features.edema > 0.7 ? 'significant' : 'moderate'} swelling. This is ${dayNumber <= 3 ? 'normal for this early stage' : 'higher than expected at Day ' + dayNumber}.`
        : `Minimal or no swelling detected. ${dayNumber <= 3 ? 'Some swelling is expected at this stage.' : 'Swelling has resolved as expected.'}`,
      isNormalForDay: dayNumber <= 3 ? features.edema > 0.2 : features.edema < 0.3,
      comparisonToExpected: dayNumber <= 3
        ? 'Swelling is expected to peak at Day 1-2'
        : dayNumber <= 7
          ? 'Swelling should be decreasing by now'
          : 'Swelling should be minimal or resolved',
    },
    {
      feature: 'Ecchymosis',
      patientTerm: 'Bruising',
      clinicalTerm: 'Ecchymosis',
      score: features.ecchymosis,
      severity: features.ecchymosis > 0.7 ? 'significant' : features.ecchymosis > 0.4 ? 'moderate' : features.ecchymosis > 0.2 ? 'mild' : 'none',
      explanation: features.ecchymosis > 0.4
        ? `You have ${features.ecchymosis > 0.7 ? 'significant' : 'moderate'} bruising. This is ${dayNumber <= 5 ? 'normal at this stage' : 'longer than expected to persist'}.`
        : `Minimal or no bruising. ${dayNumber <= 5 ? 'Bruising typically peaks at Day 2-3.' : 'Bruising has resolved as expected.'}`,
      isNormalForDay: dayNumber <= 5 ? features.ecchymosis > 0.1 : features.ecchymosis < 0.2,
      comparisonToExpected: dayNumber <= 3
        ? 'Bruising typically peaks at Day 2-3'
        : dayNumber <= 7
          ? 'Bruising should be fading'
          : 'Bruising should be resolved',
    },
    {
      feature: 'Erythema',
      patientTerm: 'Redness',
      clinicalTerm: 'Erythema',
      score: features.erythema,
      severity: features.erythema > 0.7 ? 'significant' : features.erythema > 0.4 ? 'moderate' : features.erythema > 0.2 ? 'mild' : 'none',
      explanation: features.erythema > 0.5
        ? `You have ${features.erythema > 0.7 ? 'noticeable' : 'mild'} redness. This is ${dayNumber <= 3 ? 'typical after treatment' : 'longer than expected'}.`
        : `Minimal redness detected. ${dayNumber <= 3 ? 'Some redness is normal.' : 'Redness has resolved.'}`,
      isNormalForDay: dayNumber <= 7,
      comparisonToExpected: 'Redness is expected in the first few days and should resolve gradually',
    },
    {
      feature: 'Asymmetry',
      patientTerm: 'Unevenness',
      clinicalTerm: 'Asymmetry',
      score: features.asymmetry,
      severity: features.asymmetry > 0.5 ? 'significant' : features.asymmetry > 0.3 ? 'moderate' : features.asymmetry > 0.1 ? 'mild' : 'none',
      explanation: features.asymmetry > 0.3
        ? `There is ${features.asymmetry > 0.5 ? 'noticeable' : 'mild'} asymmetry between sides. This is ${dayNumber <= 7 ? 'common early on as swelling resolves unevenly' : 'persistent and may need review'}.`
        : `Good symmetry between sides. ${dayNumber <= 7 ? 'Asymmetry early on is common and usually temporary.' : 'Symmetry is as expected.'}`,
      isNormalForDay: dayNumber <= 7,
      comparisonToExpected: 'Mild asymmetry is common in the first week as swelling resolves',
    },
  ]

  if (tree) {
    const whatWeChecked = tree.riskFactors.map(f => {
      if (f.treatmentSpecific) return `${f.name} (${f.description} — specific to ${tree.name})`
      return `${f.name} (${f.description})`
    })

    const riskExplanation = riskLevel === 'RED'
      ? `Your ${tree.name.toLowerCase()} recovery photo shows signs that require immediate attention. This is not a normal part of healing and needs urgent clinical assessment.`
      : riskLevel === 'ORANGE'
        ? `Your recovery shows some concerns that need clinical review soon. While not an emergency, these findings should be evaluated by your clinician within the next few hours.`
        : riskLevel === 'YELLOW'
          ? `Your recovery is slightly different from the expected pattern. This is usually minor and often resolves on its own, but your clinician should review this.`
          : `Your recovery is progressing normally for a ${tree.name.toLowerCase()} at Day ${dayNumber}. No concerns detected.`

    const whatHappensNext = riskLevel === 'RED'
      ? 'Your clinician has been notified and will contact you immediately. Please do not apply any products to the area and keep it clean.'
      : riskLevel === 'ORANGE'
        ? 'Your clinician will review this within 4 hours. You may receive a call or message with next steps.'
        : riskLevel === 'YELLOW'
          ? 'Your clinician will review this within 24 hours. Continue your normal aftercare routine unless advised otherwise.'
          : 'No action needed. Continue your normal aftercare routine and upload your next photo on schedule.'

    const timeline = tree.expectedTimeline.find(t => t.day === dayNumber) ||
      tree.expectedTimeline.reduce((prev, curr) => Math.abs(curr.day - dayNumber) < Math.abs(prev.day - dayNumber) ? curr : prev)

    const decisionPath = tree.decisionNodes.map(node => ({
      node: node.id,
      evaluated: true,
      result: riskLevel === 'RED' && node.riskLevel === 'RED' ? 'FAIL' as const : 'PASS' as const,
      explanation: riskLevel === 'RED' && node.riskLevel === 'RED' ? (node.action || 'Requires intervention') : `No ${node.description.toLowerCase()} detected`,
    }))

    return {
      treatmentType: tree.treatmentType,
      treatmentName: tree.name,
      dayNumber,
      riskLevel,
      riskExplanation,
      findingsExplanation: featureExplanations,
      whatWeChecked,
      whyThisRiskLevel: rationale || `Based on the analysis of your Day ${dayNumber} ${tree.name.toLowerCase()} photo, the AI assessed all clinical features including ${featureExplanations.map(f => f.patientTerm.toLowerCase()).join(', ')}. ${riskExplanation}`,
      whatHappensNext,
      whenToWorry: tree.escalationTriggers.map(t => `${t.condition}: ${t.action}`),
      patientFriendlySummary: tree.patientExplanation,
      decisionPath,
    }
  }

  return {
    treatmentType,
    treatmentName: treatmentType.replace(/_/g, ' '),
    dayNumber,
    riskLevel,
    riskExplanation: riskLevel === 'RED'
      ? 'Your recovery photo shows signs that require immediate attention.'
      : riskLevel === 'ORANGE'
        ? 'Your recovery shows some concerns that need clinical review soon.'
        : riskLevel === 'YELLOW'
          ? 'Your recovery is slightly different from the expected pattern.'
          : 'Your recovery is progressing normally.',
    findingsExplanation: featureExplanations,
    whatWeChecked: ['Swelling', 'Bruising', 'Redness', 'Symmetry', 'Nodules', 'Vascular signs'],
    whyThisRiskLevel: rationale || 'Based on analysis of your recovery photo.',
    whatHappensNext: riskLevel === 'RED'
      ? 'Your clinician has been notified and will contact you immediately.'
      : 'Continue your normal aftercare routine.',
    whenToWorry: ['Severe pain', 'Skin color changes', 'Vision changes', 'Difficulty breathing'],
    patientFriendlySummary: 'We analyzed your recovery photo to check for common post-treatment signs.',
    decisionPath: [],
  }
}

export function getAllTreatmentTypes(): { type: string; name: string; description: string }[] {
  return Object.values(TREATMENT_DECISION_TREES).map(tree => ({
    type: tree.treatmentType,
    name: tree.name,
    description: tree.description,
  }))
}
