import { calculateRiskLevel, getRecoveryTimeline, formatDate, getInitials } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('calculateRiskLevel', () => {
    it('should return LOW risk for low scores', () => {
      const result = calculateRiskLevel({
        swelling: 0.1,
        bruising: 0.1,
        redness: 0.1,
        asymmetry: 0.1,
      })
      expect(result.level).toBe('LOW')
      expect(result.color).toContain('green')
    })

    it('should return MEDIUM risk for moderate scores', () => {
      const result = calculateRiskLevel({
        swelling: 0.5,
        bruising: 0.3,
        redness: 0.2,
        asymmetry: 0.1,
      })
      expect(result.level).toBe('MEDIUM')
      expect(result.color).toContain('yellow')
    })

    it('should return HIGH risk for high scores', () => {
      const result = calculateRiskLevel({
        swelling: 0.7,
        bruising: 0.5,
        redness: 0.4,
        asymmetry: 0.3,
      })
      expect(result.level).toBe('HIGH')
      expect(result.color).toContain('orange')
    })

    it('should return CRITICAL risk for very high scores', () => {
      const result = calculateRiskLevel({
        swelling: 0.9,
        bruising: 0.8,
        redness: 0.7,
        asymmetry: 0.6,
      })
      expect(result.level).toBe('CRITICAL')
      expect(result.color).toContain('red')
    })
  })

  describe('getRecoveryTimeline', () => {
    it('should return correct timeline for BOTOX', () => {
      const timeline = getRecoveryTimeline('BOTOX')
      expect(timeline).toEqual([1, 2, 5, 10, 14])
    })

    it('should return correct timeline for FILLER_HYALURONIC', () => {
      const timeline = getRecoveryTimeline('FILLER_HYALURONIC')
      expect(timeline).toEqual([1, 2, 3, 5, 7, 14])
    })

    it('should return default timeline for unknown type', () => {
      const timeline = getRecoveryTimeline('UNKNOWN')
      expect(timeline).toEqual([1, 2, 5, 10, 14])
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should format date string correctly', () => {
      const formatted = formatDate('2024-06-20')
      expect(formatted).toContain('Jun')
      expect(formatted).toContain('20')
    })
  })

  describe('getInitials', () => {
    it('should return first letters of name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Alice Smith')).toBe('AS')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should limit to 2 characters', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })
  })
})
