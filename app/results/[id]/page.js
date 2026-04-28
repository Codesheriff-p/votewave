'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, CheckCircle2 } from 'lucide-react'

const COLORS = ['#00e5a0','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#facc15']

export default function ResultsPage() {
  const router = useRouter()
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [voter, setVoter] = useState(null)
  const [animated, setAnimated] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [meRes, elRes] = await Promise.all([
      fetch('/api/auth/me'), fetch(`/api/elections/${id}`)
    ])
    const meData = await meRes.json()
    const elData = await elRes.json()
    if (!elData.election) { router.push('/dashboard'); return }
    setVoter(meData.voter)
    setElection(elData.election)
    setLoading(false)
    setAnimated(false)
    setTimeout(() => setAnimated(true), 100)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner" style={{ width:32, height:32, borderWidth:3 }}/>
    </div>
  )

  const candidates = election.candidates || []
  const totalVotes = election.totalVotes || 0
  const winner = candidates[0]
  const myVote = election.myVote
  const myCandidate = myVote ? candidates.find(c => c.id === myVote.candidateId) : null

  return (
    <div className="results-page">
      <div className="results-inner">
        <div className="results-topbar">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={17}/> Back to Dashboard
          </button>
          <button className="btn-ghost refresh-btn" onClick={fetchData}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        <div className="results-header">
          <h1>{election.title}</h1>
          <div className="results-meta-row">
            <span className={`election-status-badge ${election.status}`}>
              {election.status === 'active' ? '● Live Results' : '◉ Final Results'}
            </span>
            <span className="total-votes-label"><strong>{totalVotes}</strong> total votes</span>
          </div>
          {myCandidate && (
            <div className="my-vote-result-bar">
              <CheckCircle2 size={14}/>
              You voted for <strong>{myCandidate.name}</strong>
              {winner && myCandidate.id === winner.id && winner.votes > 0 ? ' · 🏆 Currently winning!' :
               winner && winner.votes > myCandidate.votes ? ` · Trailing by ${winner.votes - myCandidate.votes} votes` : ''}
            </div>
          )}
        </div>

        {totalVotes === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><p>No votes have been cast yet.</p></div>
        ) : (
          <>
            {winner && winner.votes > 0 && (
              <div className="winner-card">
                <Trophy size={26} className="winner-trophy"/>
                <div className="winner-avatar">{winner.name.charAt(0).toUpperCase()}</div>
                <div className="winner-info">
                  <span className="winner-tag">{election.status === 'closed' ? '🏆 Winner' : '🏆 Leading'}</span>
                  <h2>{winner.name}</h2>
                  <p>{winner.votes} votes · {winner.pct}%</p>
                </div>
              </div>
            )}

            <div className="chart-section">
              <h3>Vote Breakdown</h3>
              <div className="bar-chart">
                {candidates.map((c, i) => {
                  const isMe = myCandidate?.id === c.id
                  return (
                    <div key={c.id} className={`bar-row ${isMe ? 'bar-row-mine' : ''}`}>
                      <div className="bar-label">
                        <span className="bar-name">
                          {i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':`${i+1}. `}{c.name}
                          {isMe && <span className="bar-my-tag"> (your vote)</span>}
                        </span>
                        <span className="bar-count">{c.votes} votes</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{
                          width: animated ? `${c.pct}%` : '0%',
                          background: COLORS[i % COLORS.length],
                          transitionDelay: `${i * 100}ms`
                        }}/>
                        <span className="bar-pct">{c.pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="donut-section">
              <DonutChart candidates={candidates} totalVotes={totalVotes}/>
              <div className="donut-legend">
                {candidates.map((c, i) => (
                  <div key={c.id} className="legend-item">
                    <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}/>
                    <span>{c.name}</span>
                    <span className="legend-pct">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DonutChart({ candidates, totalVotes }) {
  const size=190, cx=95, cy=95, r=68, sw=26
  const circ = 2 * Math.PI * r
  let offset = 0
  const segs = candidates.map((c, i) => {
    const dash = totalVotes > 0 ? (c.votes / totalVotes) * circ : 0
    const seg = { ...c, dash, gap: circ - dash, offset, color: COLORS[i % COLORS.length] }
    offset += dash
    return seg
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a2e" strokeWidth={sw}/>
      {segs.map(s => (
        <circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circ/4}
          style={{ transform:'rotate(-90deg)', transformOrigin:`${cx}px ${cy}px` }} opacity={0.9}/>
      ))}
      <text x={cx} y={cy-8} textAnchor="middle" fill="#e2e8f0" fontSize="26" fontWeight="700">{totalVotes}</text>
      <text x={cx} y={cy+13} textAnchor="middle" fill="#94a3b8" fontSize="11">total votes</text>
    </svg>
  )
}
