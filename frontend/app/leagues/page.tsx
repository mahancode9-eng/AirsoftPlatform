"use client"

import { useEffect, useState } from "react"
import {
  api,
  fmtDate,
  getToken,
  League,
  MatchItem,
  Standing,
  Team,
} from "@/lib/api"

interface LeaderRow {
  user_id: number
  full_name: string
  games_played: number
  wins: number
  losses: number
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selected, setSelected] = useState<League | null>(null)
  const [standings, setStandings] = useState<Standing[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [leaders, setLeaders] = useState<LeaderRow[]>([])
  const [tab, setTab] = useState<"standings" | "matches" | "teams" | "leaders">("standings")

  const [teamName, setTeamName] = useState("")
  const [teamTag, setTeamTag] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    api<League[]>("/leagues")
      .then((ls) => {
        setLeagues(ls)
        if (ls.length > 0) setSelected(ls[0])
      })
      .catch(() => null)
    api<Team[]>("/teams").then(setTeams).catch(() => null)
    api<LeaderRow[]>("/leaderboard").then(setLeaders).catch(() => null)
  }, [])

  useEffect(() => {
    if (!selected) return
    api<Standing[]>(`/leagues/${selected.id}/standings`).then(setStandings).catch(() => null)
    api<MatchItem[]>(`/leagues/${selected.id}/matches`).then(setMatches).catch(() => null)
  }, [selected])

  const createTeam = async () => {
    setMessage("")
    try {
      await api("/teams", {
        method: "POST",
        body: JSON.stringify({ name: teamName, tag: teamTag }),
      })
      setMessage("تیم شما ساخته شد!")
      setTeamName("")
      setTeamTag("")
      api<Team[]>("/teams").then(setTeams).catch(() => null)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "خطا")
    }
  }

  const joinTeam = async (teamId: number) => {
    setMessage("")
    try {
      await api(`/teams/${teamId}/join`, { method: "POST" })
      setMessage("به تیم پیوستید!")
      api<Team[]>("/teams").then(setTeams).catch(() => null)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "خطا")
    }
  }

  const tabs = [
    { id: "standings" as const, label: "جدول لیگ" },
    { id: "matches" as const, label: "مسابقات" },
    { id: "teams" as const, label: "تیم‌ها" },
    { id: "leaders" as const, label: "برترین بازیکنان" },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">لیگ و تیم‌ها</h1>

      {leagues.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l)}
              className={
                "rounded-lg border px-4 py-2 text-sm transition " +
                (selected?.id === l.id ? "border-army bg-army text-white" : "border-line bg-white text-muted hover:border-army")
              }
            >
              {l.name} {l.season && `(${l.season})`}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "px-4 py-2 text-sm transition " +
              (tab === t.id ? "border-b-2 border-army font-bold text-army" : "text-muted hover:text-ink")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "standings" && (
        <div className="card mt-6 overflow-x-auto p-0">
          {standings.length === 0 ? (
            <p className="p-5 text-muted">هنوز مسابقه‌ای در این لیگ برگزار نشده است.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="p-3">#</th>
                  <th className="p-3">تیم</th>
                  <th className="p-3">بازی</th>
                  <th className="p-3">برد</th>
                  <th className="p-3">مساوی</th>
                  <th className="p-3">باخت</th>
                  <th className="p-3">امتیاز</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.team_id} className="border-b border-line last:border-0">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-bold">{s.team_name} {s.team_tag && <span className="text-xs text-muted">[{s.team_tag}]</span>}</td>
                    <td className="p-3">{s.played}</td>
                    <td className="p-3 text-positive">{s.wins}</td>
                    <td className="p-3">{s.draws}</td>
                    <td className="p-3 text-danger">{s.losses}</td>
                    <td className="p-3 font-bold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "matches" && (
        <div className="mt-6 grid gap-3">
          {matches.length === 0 && <p className="text-muted">مسابقه‌ای ثبت نشده است.</p>}
          {matches.map((m) => (
            <div key={m.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold">{m.team_a?.name}</span>
                <span className="rounded-lg bg-soft px-3 py-1 font-bold" dir="ltr">
                  {m.status === "played" ? `${m.score_a} - ${m.score_b}` : "vs"}
                </span>
                <span className="font-bold">{m.team_b?.name}</span>
              </div>
              <div className="text-sm text-muted">
                {m.status === "played" ? "پایان‌یافته" : fmtDate(m.scheduled_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "teams" && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="grid gap-3">
            {teams.length === 0 && <p className="text-muted">هنوز تیمی ساخته نشده است.</p>}
            {teams.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="font-bold">
                    {t.name} {t.tag && <span className="text-xs text-muted">[{t.tag}]</span>}
                  </div>
                  {getToken() && (
                    <button className="btn-outline px-3 py-1 text-xs" onClick={() => joinTeam(t.id)}>
                      پیوستن
                    </button>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted">
                  اعضا: {t.members.map((m) => m.user?.full_name).filter(Boolean).join("، ") || "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="card h-fit">
            <div className="font-bold">ساخت تیم جدید</div>
            {getToken() ? (
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="label">نام تیم</label>
                  <input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                </div>
                <div>
                  <label className="label">تگ (اختیاری، مثل WLF)</label>
                  <input className="input" dir="ltr" value={teamTag} onChange={(e) => setTeamTag(e.target.value)} maxLength={6} />
                </div>
                <button className="btn-primary" disabled={!teamName} onClick={createTeam}>ساخت تیم</button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">برای ساخت تیم ابتدا وارد شوید.</p>
            )}
            {message && <p className="mt-3 text-sm text-accent">{message}</p>}
          </div>
        </div>
      )}

      {tab === "leaders" && (
        <div className="card mt-6 overflow-x-auto p-0">
          {leaders.length === 0 ? (
            <p className="p-5 text-muted">هنوز آماری ثبت نشده است.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="p-3">#</th>
                  <th className="p-3">بازیکن</th>
                  <th className="p-3">بازی‌ها</th>
                  <th className="p-3">برد</th>
                  <th className="p-3">باخت</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((p, i) => (
                  <tr key={p.user_id} className="border-b border-line last:border-0">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-bold">{p.full_name}</td>
                    <td className="p-3">{p.games_played}</td>
                    <td className="p-3 text-positive">{p.wins}</td>
                    <td className="p-3 text-danger">{p.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
