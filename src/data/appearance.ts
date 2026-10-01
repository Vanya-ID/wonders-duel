export type PaletteId = 'papyrus' | 'marble' | 'olive' | 'nile' | 'terracotta' | 'lavender'

export type BackgroundId = 'none' | 'marble' | 'meander'

export const PALETTES: { id: PaletteId; label: string }[] = [
  { id: 'papyrus', label: 'Папирус' },
  { id: 'marble', label: 'Мрамор и лазурь' },
  { id: 'olive', label: 'Оливковая роща' },
  { id: 'nile', label: 'Ночь над Нилом' },
  { id: 'terracotta', label: 'Терракота' },
  { id: 'lavender', label: 'Лаванда' },
]

export const BACKGROUNDS: { id: BackgroundId; label: string }[] = [
  { id: 'none', label: 'Без фона' },
  { id: 'marble', label: 'Мрамор' },
  { id: 'meander', label: 'Меандр' },
]
