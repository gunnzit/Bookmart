const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

export const LOCATIONS: string[] = [
  ...range(1, 12).map(n => 'Sector ' + n + ', Chandigarh'),
  ...range(14, 56).flatMap(n => (n === 40 ? ['Sector 40, Chandigarh', 'Sector 40-C, Chandigarh'] : ['Sector ' + n + ', Chandigarh'])),
  'Manimajra, Chandigarh', 'Burail, Chandigarh', 'Dhanas, Chandigarh',
  ...[1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 20, 21, 25].map(n => 'Sector ' + n + ', Panchkula'),
  'Kalka, Panchkula',
  'Phase 1, Mohali', 'Phase 2, Mohali', 'Phase 3B1, Mohali', 'Phase 3B2, Mohali',
  ...range(4, 11).map(n => 'Phase ' + n + ', Mohali'),
  ...[...range(58, 68), 70, 71, 72].map(n => 'Sector ' + n + ', Mohali'),
  'Aerocity, Mohali', 'Kharar, Mohali', 'Zirakpur', 'Derabassi', 'Dera Bassi',
]

export const QUICK_SECTORS = [
  'Sector 40-C, Chandigarh',
  'Sector 35, Chandigarh',
  'Sector 26, Chandigarh',
  'Sector 9, Chandigarh',
  'Phase 7, Mohali',
]

export function isAllowedArea(area: string): boolean {
  return LOCATIONS.includes(area)
}