export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

const TOKEN_KEY = "airsoft_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event("auth-changed"))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event("auth-changed"))
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = "خطایی رخ داد"
    try {
      const data = await res.json()
      if (typeof data.detail === "string") detail = data.detail
      else if (Array.isArray(data.detail) && data.detail[0]?.msg)
        detail = data.detail[0].msg
    } catch (e) {
      /* ignore */
    }
    if (res.status === 401 && typeof window !== "undefined") {
      clearToken()
    }
    throw new ApiError(detail, res.status)
  }
  return res.json() as Promise<T>
}

export function fmtPrice(toman: number): string {
  if (!toman) return "رایگان"
  return toman.toLocaleString("fa-IR") + " تومان"
}

export function fmtDate(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z")
  return d.toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------- Types ----------
export interface User {
  id: number
  phone: string
  email: string | null
  full_name: string
  role: string
}

export interface Field {
  id: number
  name: string
  slug: string
  description: string
  field_type: string
  address: string
  capacity: number
  features: Record<string, boolean>
  photos: string[]
  is_active: boolean
}

export interface GameSession {
  id: number
  field_id: number
  title: string
  session_type: string
  start_time: string
  end_time: string
  capacity: number
  price_per_player: number
  remaining_capacity: number | null
  field: Field | null
}

export interface Equipment {
  id: number
  name: string
  description: string
  category: string
  price_per_session: number
  stock: number
  photo: string
  is_active: boolean
}

export interface Booking {
  id: number
  code: string
  session_id: number
  num_players: number
  is_group: boolean
  group_name: string
  note: string
  status: string
  total_amount: number
  created_at: string
  session: GameSession | null
  equipment: { equipment_id: number; quantity: number; unit_price: number; item: Equipment | null }[]
  waiver: { id: number; full_name: string } | null
}

export interface EventItem {
  id: number
  title: string
  description: string
  event_type: string
  field_id: number | null
  start_time: string
  end_time: string
  ticket_price: number
  capacity: number
  cover_photo: string
  is_active: boolean
  sold_tickets: number | null
}

export interface Ticket {
  id: number
  code: string
  event_id: number
  quantity: number
  total_amount: number
  status: string
  created_at: string
  event: EventItem | null
}

export interface Team {
  id: number
  name: string
  tag: string
  logo: string
  captain_id: number
  members: { user_id: number; user: User | null }[]
}

export interface League {
  id: number
  name: string
  season: string
  description: string
  status: string
}

export interface Standing {
  team_id: number
  team_name: string
  team_tag: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
}

export interface MatchItem {
  id: number
  league_id: number
  team_a_id: number
  team_b_id: number
  scheduled_at: string
  score_a: number
  score_b: number
  status: string
  team_a: Team | null
  team_b: Team | null
}

export interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  photo: string
  is_active: boolean
}

export interface Order {
  id: number
  code: string
  status: string
  total_amount: number
  shipping_address: string
  created_at: string
  items: { product_id: number; quantity: number; unit_price: number; product: Product | null }[]
}

export interface Review {
  id: number
  field_id: number
  rating: number
  comment: string
  created_at: string
  is_approved: boolean
  user: User | null
}

export interface PaymentRecord {
  id: number
  kind: string
  ref_id: number
  gateway: string
  amount: number
  status: string
  gateway_ref: string
  created_at: string
}

export const SESSION_TYPE_FA: Record<string, string> = {
  open_play: "بازی آزاد",
  night: "بازی شبانه",
  private: "سانس خصوصی",
  training: "تمرین",
}

export const FIELD_TYPE_FA: Record<string, string> = {
  outdoor: "فضای باز",
  indoor: "سرپوشیده",
  cqb: "CQB شهری",
  forest: "جنگلی",
  urban: "شهری",
}

export const BOOKING_STATUS_FA: Record<string, string> = {
  pending_payment: "در انتظار پرداخت",
  confirmed: "تأیید شده",
  cancelled: "لغو شده",
  attended: "حضور یافته",
  paid: "پرداخت شده",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
}

export const EVENT_TYPE_FA: Record<string, string> = {
  scenario: "سناریو",
  milsim: "میل‌سیم",
  night: "شبانه",
  tournament: "تورنمنت",
}
