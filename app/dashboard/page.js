'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut, Settings, Vote, BarChart3, CheckCircle2,
  Clock, BookOpen, TrendingUp, RefreshCw
} from 'lucide-react'

const ACCENT_COLORS = ['#00e5a0', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#facc15']

export default function Dashboard() {
  const router = useRouter()
  const [voter, setVoter] = useState(null)
  const [elections, setElections] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [meRes, elRes] = await Promise.all([
      fetch('/api/auth/me'), fetch('/api/elections')
    ])
    const meData = await meRes.json()
    if (!meData.voter) { router.push('/auth'); return }
    const elData = await elRes.json()
    setVoter(meData.voter)
    setElections(elData.elections || [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  )

  const enriched = elections.map(e => ({
    ...e,
    voted: e.myVote != null,
    myCandidate: e.myVote ? e.candidates?.find(c => c.id === e.myVote.candidateId) : null,
  }))

  const active = enriched.filter(e => e.status === 'active')
  const pending = active.filter(e => !e.voted)
  const voted = enriched.filter(e => e.voted)
  const votedCount = voted.length
  const displayed = tab === 'all' ? enriched : tab === 'pending' ? pending : voted

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">VoteWave</span>
        </div>
        <div className="sidebar-voter">
          <div className="sv-avatar">{voter.fullName.charAt(0).toUpperCase()}</div>
          <div className="sv-info">
            <span className="sv-name">{voter.fullName}</span>
            <span className="sv-id">{voter.studentId || voter.email}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`snav-item ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            <BarChart3 size={17} /> All Elections
            <span className="snav-badge">{enriched.length}</span>
          </button>
          <button className={`snav-item ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            <Vote size={17} /> Pending Votes
            <span className="snav-badge pending">{pending.length}</span>
          </button>
          <button className={`snav-item ${tab === 'voted' ? 'active' : ''}`} onClick={() => setTab('voted')}>
            <CheckCircle2 size={17} /> My Votes
            <span className="snav-badge done">{voted.length}</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="snav-item" onClick={() => router.push('/admin')}><Settings size={16} /> Admin Panel</button>
          <button className="snav-item logout" onClick={handleLogout}><LogOut size={16} /> Sign Out</button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">Hello, {voter.fullName.split(' ')[0]} 👋</h1>
            <p className="dash-sub">
              {voter.department && <span><BookOpen size={13} /> {voter.department}</span>}
              {voter.level && <span> · {voter.level}</span>}
            </p>
          </div>
          <button className="btn-icon-round" onClick={fetchData} title="Refresh"><RefreshCw size={15} /></button>
        </div>

        <div className="stats-row">
          {[
            { icon: <BarChart3 size={20} />, num: enriched.length, label: 'Total Elections', cls: 'blue' },
            { icon: <Vote size={20} />, num: active.length, label: 'Currently Active', cls: 'green' },
            { icon: <CheckCircle2 size={20} />, num: votedCount, label: 'Votes Cast by You', cls: 'accent' }, { icon: <Clock size={20} />, num: pending.length, label: 'Awaiting Your Vote', cls: 'orange' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className={`stat-card-icon ${s.cls}`}>{s.icon}</div>
              <div>
                <span className="stat-card-num">{s.num}</span>
                <span className="stat-card-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="section-head">
          <h2>{tab === 'all' ? 'All Elections' : tab === 'voted' ? 'Elections You Voted In' : 'Pending — Cast Your Vote'}</h2>
          {pending.length > 0 && tab !== 'pending' && (
            <span className="pulse-badge">{pending.length} awaiting</span>
          )}
        </div>

        {displayed.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">{tab === 'pending' ? '✅' : '🗳️'}</div>
            <h3>{tab === 'pending' ? "All caught up!" : "Nothing here yet"}</h3>
            <p>{tab === 'pending' ? "You've voted in all active elections." : 'Elections will appear here once created.'}</p>
          </div>
        ) : (
          <div className="election-cards-grid">
            {displayed.map((e, idx) => (
              <ElectionCard key={e.id} election={e} color={ACCENT_COLORS[idx % ACCENT_COLORS.length]}
                onVote={() => router.push(`/vote/${e.id}`)}
                onResults={() => router.push(`/results/${e.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ElectionCard({ election, color, onVote, onResults }) {
  const { candidates = [], totalVotes = 0, voted, myCandidate, status } = election
  const isActive = status === 'active'
  const top3 = candidates.slice(0, 3)
  const leader = candidates[0]

  return (
    <div className={`ecard ${voted ? 'ecard-voted' : ''} ${!isActive ? 'ecard-closed' : ''}`}>
      <div className="ecard-accent-bar" style={{ background: color }} />
      <div className="ecard-header">
        <div className="ecard-meta">
          <span className={`ecard-status ${isActive ? 'active' : 'closed'}`}>{isActive ? '● Live' : '◉ Closed'}</span>
          {voted && <span className="ecard-voted-badge"><CheckCircle2 size={12} /> Voted</span>}
        </div>
        <h3 className="ecard-title">{election.title}</h3>
        {election.description && <p className="ecard-desc">{election.description}</p>}
      </div>

      <div className="ecard-standings">
        <div className="standings-label">
          <TrendingUp size={13} /> Live Standings
          <span className="total-votes-tiny">{totalVotes} votes</span>
        </div>
        {totalVotes === 0 ? (
          <p className="no-votes-yet">No votes cast yet</p>
        ) : (
          <div className="standings-list">
            {top3.map((c, i) => {
              const isMe = myCandidate?.id === c.id
              return (
                <div key={c.id} className={`standing-row ${i === 0 ? 'leader' : ''} ${isMe ? 'my-vote' : ''}`}>
                  <span className="standing-pos">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <span className="standing-name">{c.name}</span>
                  {isMe && <span className="my-vote-tag">your vote</span>}
                  <div className="standing-bar-wrap">
                    <div className="standing-bar-track">
                      <div className="standing-bar-fill"
                        style={{ width: `${c.pct}%`, background: i === 0 ? color : 'var(--surface2)' }} />
                    </div>
                    <span className="standing-pct">{c.pct}%</span>
                  </div>
                  <span className="standing-votes">{c.votes}v</span>
                </div>
              )
            })}
            {candidates.length > 3 && <p className="more-candidates">+{candidates.length - 3} more</p>}
          </div>
        )}
      </div>

      {voted && myCandidate && (
        <div className="my-vote-highlight">
          <CheckCircle2 size={14} />
          <span>You voted for <strong>{myCandidate.name}</strong>
            {leader && myCandidate.id === leader.id && leader.votes > 0 ? ' · 🏆 Winning!' :
              leader && leader.votes > myCandidate.votes ? ` · Trailing by ${leader.votes - myCandidate.votes}v` : ''}
          </span>
        </div>
      )}

      <div className="ecard-actions">
        {isActive && !voted ? (
          <button className="btn-vote-card" onClick={onVote} style={{ '--vote-color': color }}>
            <Vote size={15} /> Cast Vote
          </button>
        ) : isActive && voted ? (
          <button className="btn-voted-disabled" disabled><CheckCircle2 size={14} /> Already Voted</button>
        ) : null}
        <button className="btn-results-card" onClick={onResults}><BarChart3 size={14} /> Full Results</button>
      </div>
    </div>
  )
}
