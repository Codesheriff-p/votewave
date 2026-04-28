'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Check, AlertCircle, UserCircle, BookOpen, GraduationCap, Camera } from 'lucide-react'

export default function VotePage() {
  const router = useRouter()
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [voter, setVoter] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [meRes, elRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/elections/${id}`)
      ])
      const meData = await meRes.json()
      if (!meData.voter) { router.push('/auth'); return }
      const elData = await elRes.json()
      if (!elData.election) { router.push('/dashboard'); return }
      setVoter(meData.voter)
      setElection(elData.election)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleVote() {
    if (!selected) return setError('Please select a candidate first.')
    setAnimating(true)
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ electionId: id, candidateId: selected })
    })
    const data = await res.json()
    setAnimating(false)
    if (!res.ok) { setError(data.error); return }
    setSubmitted(true)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  const alreadyVoted = election.myVote != null
  const isClosed = election.status === 'closed'
  const selectedCandidate = election.candidates?.find(c => c.id === selected)

  if (submitted) {
    const candidate = election.candidates?.find(c => c.id === selected)
    return (
      <div className="vp-page">
        <div className="vp-success">
          <div className="success-animation">
            <div className="success-ring" />
            <div className="success-check">✓</div>
          </div>
          <h2>Vote Cast!</h2>
          <div className="success-candidate-card">
            {candidate?.photo
              ? <img src={candidate.photo} alt={candidate.name} className="success-photo" />
              : <div className="success-avatar" style={{ background: candidate?.color || 'var(--accent)' }}>
                {candidate?.avatar || candidate?.name?.charAt(0)}
              </div>
            }
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{candidate?.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{candidate?.post}</p>
            </div>
          </div>
          <p className="success-voter">Recorded for <strong>{voter?.fullName}</strong> · {voter?.studentId}</p>
          <p className="success-sub">Your vote is securely saved.</p>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
            <button className="btn-ghost" onClick={() => router.push(`/results/${id}`)}>View Results</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="vote-page-wrap">
      <div className="vote-page-inner">

        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={17} /> Back to Dashboard
        </button>

        {voter && (
          <div className="voter-id-bar">
            <UserCircle size={14} />
            <span>Voting as <strong>{voter.fullName}</strong> — {voter.studentId}</span>
            {voter.department && <span className="vid-dept">· {voter.department}, {voter.level}</span>}
          </div>
        )}

        <div className="vote-header">
          <span className={`election-status-badge ${election.status}`}>
            {isClosed ? '◉ Election Closed' : '● Live Election'}
          </span>
          <h1>{election.title}</h1>
          {election.description && <p className="vote-desc">{election.description}</p>}
        </div>

        {(alreadyVoted || isClosed) ? (
          <div className="already-voted">
            <AlertCircle size={40} className="alert-icon" />
            <h3>{isClosed ? 'Election Closed' : 'Already Voted'}</h3>
            <p>{isClosed ? 'This election has ended.' : 'You have already cast your vote.'}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => router.push('/dashboard')}>Dashboard</button>
              <button className="btn-ghost" onClick={() => router.push(`/results/${id}`)}>View Results</button>
            </div>
          </div>
        ) : (
          <>
            <p className="vote-instruction">
              <Camera size={14} /> Tap a card to select your candidate — one vote only.
            </p>

            {/* ── CARD GRID ── */}
            <div className="ballot-card-grid">
              {election.candidates?.map((c, i) => {
                const isSelected = selected === c.id
                return (
                  <button
                    key={c.id}
                    className={`ballot-card ${isSelected ? 'ballot-card-selected' : ''}`}
                    style={{ '--card-color': c.color || `hsl(${i * 55}, 65%, 55%)` }}
                    onClick={() => { setSelected(c.id); setError('') }}
                  >
                    {/* Selected tick badge */}
                    {isSelected && (
                      <div className="ballot-card-tick">
                        <Check size={14} />
                      </div>
                    )}

                    {/* Top accent stripe */}
                    <div className="ballot-card-bar" />

                    {/* Photo or initials */}
                    <div className="ballot-card-photo-wrap">
                      {c.photo
                        ? <img src={c.photo} alt={c.name} className="ballot-card-photo" />
                        : <div className="ballot-card-avatar">
                          {c.avatar || c.name.charAt(0).toUpperCase()}
                        </div>
                      }
                    </div>

                    {/* Info */}
                    <div className="ballot-card-info">
                      <span className="ballot-card-name">{c.name}</span>
                      <span className="ballot-card-post">{c.post}</span>
                      <div className="ballot-card-meta">
                        <span><GraduationCap size={11} /> {c.department}</span>
                        <span><BookOpen size={11} /> {c.level}</span>
                      </div>
                      {c.manifesto && (
                        <span className="ballot-card-manifesto">"{c.manifesto}"</span>
                      )}
                    </div>

                    {/* Bottom select button */}
                    <div className={`ballot-card-select ${isSelected ? 'chosen' : ''}`}>
                      {isSelected ? <><Check size={13} /> Selected</> : 'Select'}
                    </div>
                  </button>
                )
              })}
            </div>

            {error && <p className="error-msg centered" style={{ marginTop: 12 }}>{error}</p>}

            {selected && !animating && (
              <div className="confirm-banner">
                You are about to vote for <strong>{selectedCandidate?.name}</strong>
                {selectedCandidate?.post ? ` — ${selectedCandidate.post}` : ''}
              </div>
            )}

            <button
              className={`btn-cast ${animating ? 'loading' : ''} ${!selected ? 'disabled' : ''}`}
              onClick={handleVote}
              disabled={!selected || animating}
            >
              {animating
                ? <><span className="spinner" /> Submitting…</>
                : <><Check size={17} /> Confirm & Cast Vote</>}
            </button>
            <p className="ballot-note">⚠️ One vote per election. Cannot be undone.</p>
          </>
        )}
      </div>
    </div>
  )
}