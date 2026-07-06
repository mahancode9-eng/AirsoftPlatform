export type GunCategory = "rifle" | "smg" | "sniper" | "shotgun" | "pistol"

export type AttachmentSlot =
  | "optic"
  | "barrel"
  | "grip"
  | "magazine"
  | "stock"
  | "tactical"
  | "sling"

export type AttachmentItem = {
  id: number
  name: string
  slug: string
  slot: AttachmentSlot
  brand: string
  description: string
  price_per_session: number
  stock: number
  photo: string
  stat_modifiers: Record<string, number>
}

export type Gun = {
  id: number
  name: string
  slug: string
  brand: string
  category: GunCategory
  power_source: string
  fps: number
  price_per_session: number
  stock: number
  photos: string[]
  stats: Record<string, number>
  is_featured: boolean
}

export type GunDetail = Gun & {
  weight_grams: number
  length_mm: number
  magazine_capacity: number
  description: string
  attachments: AttachmentItem[]
}

export const CATEGORY_FA: Record<string, string> = {
  rifle: "رایفل",
  smg: "اس‌ام‌جی",
  sniper: "اسنایپر",
  shotgun: "شاتگان",
  pistol: "پیستول",
}

export const POWER_FA: Record<string, string> = {
  aeg: "برقی (AEG)",
  gas: "گازی",
  spring: "فنری",
  hpa: "HPA",
}

export const SLOT_FA: Record<string, string> = {
  optic: "اپتیک",
  barrel: "سرلوله",
  grip: "گریپ",
  magazine: "خشاب",
  stock: "استاک",
  tactical: "چراغ / لیزر",
  sling: "بند",
}

export const STAT_FA: Record<string, string> = {
  accuracy: "دقت",
  range: "برد",
  fire_rate: "آتش‌باری",
  mobility: "تحرک",
}

export function gunPhoto(gun: { photos: string[] }): string {
  return gun.photos && gun.photos.length > 0 ? gun.photos[0] : ""
}

export function groupBySlot(items: AttachmentItem[]): Array<[string, AttachmentItem[]]> {
  const order: AttachmentSlot[] = ["optic", "barrel", "grip", "magazine", "stock", "tactical", "sling"]
  const out: Array<[string, AttachmentItem[]]> = []
  for (const slot of order) {
    const list = items.filter((a) => a.slot === slot)
    if (list.length > 0) out.push([slot, list])
  }
  return out
}
