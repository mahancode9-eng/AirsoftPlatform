from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    League,
    Match,
    PlayerStats,
    Team,
    TeamMember,
    User,
)
from ..schemas import (
    LeagueOut,
    MatchOut,
    PlayerStatsOut,
    ProfileOut,
    StandingOut,
    TeamCreateIn,
    TeamOut,
    UserOut,
)
from ..security import get_current_user

router = APIRouter(tags=["leagues"])


# ---------- Teams ----------
@router.post("/teams", response_model=TeamOut)
def create_team(
    data: TeamCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(TeamMember).filter(TeamMember.user_id == user.id).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="شما قبلاً عضو یک تیم هستید")
    if db.query(Team).filter(Team.name == data.name.strip()).first():
        raise HTTPException(status_code=400, detail="تیمی با این نام وجود دارد")
    team = Team(name=data.name.strip(), tag=data.tag.strip(), captain_id=user.id)
    db.add(team)
    db.flush()
    db.add(TeamMember(team_id=team.id, user_id=user.id))
    db.commit()
    return _load_team(db, team.id)


def _load_team(db: Session, team_id: int) -> Team:
    return (
        db.query(Team)
        .options(joinedload(Team.members).joinedload(TeamMember.user))
        .filter(Team.id == team_id)
        .first()
    )


@router.get("/teams", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return (
        db.query(Team)
        .options(joinedload(Team.members).joinedload(TeamMember.user))
        .order_by(Team.created_at)
        .all()
    )


@router.get("/teams/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = _load_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="تیم پیدا نشد")
    return team


@router.post("/teams/{team_id}/join", response_model=TeamOut)
def join_team(
    team_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(TeamMember).filter(TeamMember.user_id == user.id).first():
        raise HTTPException(status_code=400, detail="شما قبلاً عضو یک تیم هستید")
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="تیم پیدا نشد")
    db.add(TeamMember(team_id=team.id, user_id=user.id))
    db.commit()
    return _load_team(db, team.id)


@router.post("/teams/leave")
def leave_team(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.user_id == user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="شما عضو هیچ تیمی نیستید")
    team = db.get(Team, membership.team_id)
    if team and team.captain_id == user.id and len(team.members) > 1:
        raise HTTPException(
            status_code=400,
            detail="کاپیتان تا زمانی که اعضای دیگری در تیم هستند نمی‌تواند خارج شود",
        )
    db.delete(membership)
    if team and len(team.members) == 0:
        db.delete(team)
    db.commit()
    return {"ok": True}


# ---------- Leagues ----------
@router.get("/leagues", response_model=list[LeagueOut])
def list_leagues(db: Session = Depends(get_db)):
    return db.query(League).order_by(League.created_at.desc()).all()


@router.get("/leagues/{league_id}/matches", response_model=list[MatchOut])
def league_matches(league_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Match)
        .options(joinedload(Match.team_a), joinedload(Match.team_b))
        .filter(Match.league_id == league_id)
        .order_by(Match.scheduled_at)
        .all()
    )


@router.get("/leagues/{league_id}/standings", response_model=list[StandingOut])
def league_standings(league_id: int, db: Session = Depends(get_db)):
    league = db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="لیگ پیدا نشد")
    matches = (
        db.query(Match)
        .filter(Match.league_id == league_id, Match.status == "played")
        .all()
    )
    table: dict[int, dict] = {}

    def row(team: Team) -> dict:
        if team.id not in table:
            table[team.id] = {
                "team_id": team.id,
                "team_name": team.name,
                "team_tag": team.tag,
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points": 0,
            }
        return table[team.id]

    for m in matches:
        a, b = row(m.team_a), row(m.team_b)
        a["played"] += 1
        b["played"] += 1
        if m.score_a > m.score_b:
            a["wins"] += 1
            a["points"] += 3
            b["losses"] += 1
        elif m.score_b > m.score_a:
            b["wins"] += 1
            b["points"] += 3
            a["losses"] += 1
        else:
            a["draws"] += 1
            b["draws"] += 1
            a["points"] += 1
            b["points"] += 1

    rows = sorted(table.values(), key=lambda r: (-r["points"], -r["wins"]))
    return [StandingOut(**r) for r in rows]


# ---------- Player profiles ----------
@router.get("/players/{user_id}", response_model=ProfileOut)
def player_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="بازیکن پیدا نشد")
    stats = db.query(PlayerStats).filter(PlayerStats.user_id == user.id).first()
    membership = db.query(TeamMember).filter(TeamMember.user_id == user.id).first()
    team = _load_team(db, membership.team_id) if membership else None
    return ProfileOut(
        user=UserOut.model_validate(user),
        stats=PlayerStatsOut.model_validate(stats) if stats else None,
        team=TeamOut.model_validate(team) if team else None,
    )


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(PlayerStats)
        .options(joinedload(PlayerStats.user))
        .order_by(PlayerStats.wins.desc(), PlayerStats.kills.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "user_id": r.user_id,
            "full_name": r.user.full_name if r.user else "",
            "games_played": r.games_played,
            "wins": r.wins,
            "losses": r.losses,
            "kills": r.kills,
            "deaths": r.deaths,
        }
        for r in rows
    ]
