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

export function calculateRiskLevel(scores: {
  swelling: number
  bruising: number
  redness: number
  asymmetry: number
}): { level: string; color: string } {
  const maxScore = Math.max(scores.swelling, scores.bruising, scores.redness, scores.asymmetry)
  const avgScore = (scores.swelling + scores.bruising + scores.redness + scores.asymmetry) / 4

  if (maxScore > 0.8 || avgScore > 0.6) {
    return { level: 'CRITICAL', color: 'text-red-600 bg-red-50' }
  }
  if (maxScore > 0.6 || avgScore > 0.4) {
    return { level: 'HIGH', color: 'text-orange-600 bg-orange-50' }
  }
  if (maxScore > 0.4 || avgScore > 0.2) {
    return { level: 'MEDIUM', color: 'text-yellow-600 bg-yellow-50' }
  }
  return { level: 'LOW', color: 'text-green-600 bg-green-50' }
}

export function getRecoveryTimeline(treatmentType: string): number[] {
  const timelines: Record<string, number[]> = {
    BOTOX: [1, 2, 5, 10, 14],
    FILLER_HYALURONIC: [1, 2, 3, 5, 7, 14],
    FILLER_CALCIUM_HYDROXYLAPATITE: [1, 3, 7, 14, 30],
    FILLER_POLY_L_LACTIC: [1, 3, 7, 14, 30],
    MESOTHERAPY: [1, 2, 5, 10],
    PRP: [1, 3, 7, 14],
    OTHER: [1, 2, 5, 10, 14],
  }
  return timelines[treatmentType] || timelines.OTHER
}
