'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, X, Check, Lock, Unlock,
  Users, BarChart3, ShieldAlert, ShieldCheck, GraduationCap,
  Upload, ImageIcon
} from 'lucide-react'

const ADMIN_PASSWORD = 'Prince@2004'

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering',
  'Medicine & Surgery', 'Pharmacy', 'Nursing', 'Law', 'Accounting', 'Business Administration',
  'Economics', 'Mass Communication', 'Education', 'Agriculture', 'Architecture', 'Other'
]
const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level', 'Postgraduate']
const COLORS = ['#00e5a0', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#facc15', '#f87171']

function blankCandidate(i) {
  return { name: '', department: '', level: '', manifesto: '', color: COLORS[i % COLORS.length], photoFile: null, preview: null }
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('elections')
  const [elections, setElections] = useState([])
  const [voters, setVoters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', candidates: [blankCandidate(0), blankCandidate(1)] })
  const [formError, setFormError] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authErr, setAuthErr] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null)

  const fetchData = useCallback(async () => {
    const [elRes, voRes] = await Promise.all([fetch('/api/elections'), fetch('/api/admin/voters')])
    setElections((await elRes.json()).elections || [])
    setVoters((await voRes.json()).voters || [])
  }, [])

  useEffect(() => { if (authed) fetchData() }, [authed, fetchData])

  // update one field on one candidate
  const setC = (i, key, val) => setForm(f => {
    const c = [...f.candidates]
    c[i] = { ...c[i], [key]: val }
    return { ...f, candidates: c }
  })

  function pickPhoto(i, file) {
    if (!file) return
    setC(i, 'photoFile', file)
    setC(i, 'preview', URL.createObjectURL(file))
  }

  function addCandidate() {
    setForm(f => ({ ...f, candidates: [...f.candidates, blankCandidate(f.candidates.length)] }))
  }

  function removeCandidate(i) {
    setForm(f => ({ ...f, candidates: f.candidates.filter((_, idx) => idx !== i) }))
  }

  async function handleCreate() {
    setFormError('')
    if (!form.title.trim()) return setFormError('Election title is required.')
    const valid = form.candidates.filter(c => c.name.trim())
    if (valid.length < 2) return setFormError('At least 2 candidates with names are required.')

    setCreating(true)

    // 1 — create election (without photos first)
    const res = await fetch('/api/elections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        candidates: form.candidates
          .filter(c => c.name.trim())
          .map(c => ({
            name: c.name.trim(),
            department: c.department,
            level: c.level,
            manifesto: c.manifesto.trim(),
            color: c.color,
          }))
      })
    })

    if (!res.ok) { setCreating(false); return setFormError('Failed to create election.') }
    const { election } = await res.json()

    // 2 — upload photos for candidates that have one
    const validCandidates = form.candidates.filter(c => c.name.trim())
    const uploadErrors = []
    for (let i = 0; i < validCandidates.length; i++) {
      const c = validCandidates[i]
      const dbC = election.candidates[i]
      if (!c.photoFile || !dbC) continue
      const fd = new FormData()
      fd.append('file', c.photoFile)
      fd.append('electionId', election.id)
      fd.append('candidateId', dbC.id)
      const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!upRes.ok) {
        const upData = await upRes.json()
        uploadErrors.push(`${c.name}: ${upData.error || 'Upload failed'}`)
      }
    }
    if (uploadErrors.length > 0) {
      setFormError(`Election created, but photo upload failed — ${uploadErrors.join('; ')}`)
      setCreating(false)
      fetchData()
      return
    }

    setCreating(false)
    setForm({ title: '', description: '', candidates: [blankCandidate(0), blankCandidate(1)] })
    setShowForm(false)
    fetchData()
  }

  async function handleToggleStatus(e) {
    await fetch(`/api/elections/${e.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: e.status === 'active' ? 'closed' : 'active' })
    })
    fetchData()
  }

  async function handleDeleteElection(id) {
    if (!confirm('Delete this election and all its votes?')) return
    await fetch(`/api/elections/${id}`, { method: 'DELETE' })
    fetchData()
  }

  async function handleToggleVoter(v) {
    await fetch(`/api/admin/voters/${v.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: v.status === 'active' ? 'suspended' : 'active' })
    })
    fetchData()
  }

  async function handleDeleteVoter(id) {
    if (!confirm('Remove this student?')) return
    await fetch(`/api/admin/voters/${id}`, { method: 'DELETE' })
    fetchData()
  }

  async function handlePhotoUpload(ev, electionId, candidateId) {
    const file = ev.target.files[0]
    if (!file) return
    setUploadingFor(candidateId)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('electionId', electionId)
    fd.append('candidateId', candidateId)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploadingFor(null)
    if (res.ok) fetchData()
    else alert(data.error || 'Upload failed')
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="admin-auth">
      <div className="auth-card">
        <button className="back-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={17} /> Back</button>
        <div className="auth-lock-icon">🔐</div>
        <h2>Admin Access</h2>
        <p>Enter the admin password to manage elections.</p>
        <p className="hint-text">Contact the system administrator for access.</p>
        <input type="password" placeholder="Enter password…" value={adminKey} className="auth-input"
          onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (adminKey === ADMIN_PASSWORD ? (setAuthed(true), setAuthErr('')) : setAuthErr('Incorrect password'))} />
        {authErr && <p className="error-msg">{authErr}</p>}
        <button className="btn-primary full-width" onClick={() => {
          if (adminKey === ADMIN_PASSWORD) { setAuthed(true); setAuthErr('') }
          else setAuthErr('Incorrect password')
        }}>Unlock Panel</button>
      </div>
    </div>
  )

  // ── Main panel ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-panel">
      <div className="panel-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={17} /> Back</button>
        <div><h1>Admin Panel</h1><p className="panel-sub">Manage elections and student voters</p></div>
        {tab === 'elections' && (
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> New Election</button>
        )}
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'elections' ? 'active' : ''}`} onClick={() => setTab('elections')}>
          <BarChart3 size={14} /> Elections <span className="tab-count">{elections.length}</span>
        </button>
        <button className={`admin-tab ${tab === 'voters' ? 'active' : ''}`} onClick={() => setTab('voters')}>
          <GraduationCap size={14} /> Students <span className="tab-count">{voters.length}</span>
        </button>
      </div>

      {/* ── CREATE ELECTION MODAL ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Election</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)}><X size={17} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Election details */}
              <label>Election Title *</label>
              <input className="field" placeholder="e.g. SUG President 2025/2026"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <label>Description</label>
              <input className="field" placeholder="Brief description (optional)"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              {/* Candidates */}
              <div style={{ margin: '20px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ margin: 0 }}>Candidates *</label>
                <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '.78rem' }} onClick={addCandidate}>
                  <Plus size={12} /> Add Candidate
                </button>
              </div>

              <div className="new-candidates-grid">
                {form.candidates.map((c, i) => (
                  <div key={i} className="new-candidate-card">
                    {/* Remove button */}
                    {form.candidates.length > 2 && (
                      <button className="ncc-remove" onClick={() => removeCandidate(i)}><X size={12} /></button>
                    )}

                    {/* Colour stripe */}
                    <div className="ncc-stripe" style={{ background: c.color }} />

                    {/* Photo picker */}
                    <label className="ncc-photo-wrap">
                      {c.preview
                        ? <img src={c.preview} alt="" className="ncc-photo" />
                        : <div className="ncc-photo-placeholder">
                          <Upload size={18} />
                          <span>Upload photo</span>
                        </div>
                      }
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => pickPhoto(i, e.target.files[0])} />
                      {c.preview && <div className="ncc-photo-overlay"><Upload size={13} /> Change</div>}
                    </label>

                    {/* Fields */}
                    <div className="ncc-fields">
                      <input className="field" placeholder="Full name *"
                        value={c.name} onChange={e => setC(i, 'name', e.target.value)} />

                      <select className="field" value={c.department} onChange={e => setC(i, 'department', e.target.value)}>
                        <option value="">Department…</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>

                      <select className="field" value={c.level} onChange={e => setC(i, 'level', e.target.value)}>
                        <option value="">Level…</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>

                      <input className="field" placeholder='Quote / manifesto e.g. "Better welfare for all"'
                        value={c.manifesto} onChange={e => setC(i, 'manifesto', e.target.value)} />

                      {/* Colour picker */}
                      <div className="ncc-color-row">
                        <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Card colour:</span>
                        {COLORS.map(col => (
                          <button key={col} className={`ncc-color-dot ${c.color === col ? 'active' : ''}`}
                            style={{ background: col }} onClick={() => setC(i, 'color', col)} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formError && <p className="error-msg" style={{ marginTop: 12 }}>{formError}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? <><span className="spinner" /> Creating…</> : <><Check size={15} /> Create Election</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ELECTIONS TAB ── */}
      {tab === 'elections' && (
        <div className="admin-elections">
          {elections.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><p>No elections yet.</p></div>
            : elections.map(e => (
              <div key={e.id} className={`admin-election-card ${e.status}`}>
                <div className="aec-header">
                  <div>
                    <span className={`status-badge ${e.status}`}>{e.status === 'active' ? '● Active' : '◉ Closed'}</span>
                    <h3>{e.title}</h3>
                    {e.description && <p className="aec-desc">{e.description}</p>}
                  </div>
                  <div className="aec-actions">
                    <button className={`btn-icon-text ${e.status === 'active' ? 'warning' : 'success'}`} onClick={() => handleToggleStatus(e)}>
                      {e.status === 'active' ? <><Lock size={13} /> Close</> : <><Unlock size={13} /> Reopen</>}
                    </button>
                    <button className="btn-icon-text danger" onClick={() => handleDeleteElection(e.id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

                <div className="aec-stats">
                  <span className="aec-stat"><Users size={13} /> {e.candidates?.length || 0} candidates</span>
                  <span className="aec-stat">🗳️ {e.totalVotes || 0} votes</span>
                </div>

                {/* Photo upload per candidate */}
                <p className="aec-photo-label">Candidate Photos — hover to upload / change</p>
                <div className="candidate-upload-grid">
                  {e.candidates?.map(c => (
                    <div key={c.id} className="candidate-upload-card">
                      <div className="cup-photo-wrap">
                        {c.photo
                          ? <img src={c.photo} alt={c.name} className="cup-photo" />
                          : <div className="cup-placeholder" style={{ background: c.color || 'var(--surface2)' }}>
                            <ImageIcon size={20} /><span>No photo</span>
                          </div>
                        }
                        <label className="cup-upload-overlay">
                          {uploadingFor === c.id
                            ? <span className="spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                            : <><Upload size={14} /> {c.photo ? 'Change' : 'Upload'}</>
                          }
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={ev => handlePhotoUpload(ev, e.id, c.id)}
                            disabled={uploadingFor === c.id} />
                        </label>
                      </div>
                      <div className="cup-name">{c.name}</div>
                      <div className="cup-status" style={{ color: c.photo ? 'var(--success)' : 'var(--text3)' }}>
                        {c.photo ? '✓ Uploaded' : 'No photo'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── VOTERS TAB ── */}
      {tab === 'voters' && (
        <div className="admin-voters">
          {voters.length === 0
            ? <div className="empty-state"><div className="empty-icon">👥</div><p>No students registered yet.</p></div>
            : <>
              <div className="voters-table-header">
                <span>Student</span><span>ID / Dept</span><span>Level</span>
                <span>Registered</span><span>Status</span><span>Actions</span>
              </div>
              {voters.map(v => (
                <div key={v.id} className={`voter-row ${v.status}`}>
                  <div className="voter-row-info">
                    <div className="voter-avatar-sm">{v.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="voter-name">{v.fullName}</span>
                      <span className="voter-email">{v.email}</span>
                    </div>
                  </div>
                  <div>
                    <span className="voter-nid">{v.studentId || '—'}</span>
                    <span className="voter-email" style={{ display: 'block' }}>{v.department || '—'}</span>
                  </div>
                  <span className="voter-date">{v.level || '—'}</span>
                  <span className="voter-date">{new Date(v.createdAt).toLocaleDateString()}</span>
                  <span className={`voter-status ${v.status}`}>{v.status === 'active' ? '● Active' : '⊘ Suspended'}</span>
                  <div className="voter-actions">
                    <button className={`btn-icon-text ${v.status === 'active' ? 'warning' : 'success'}`} onClick={() => handleToggleVoter(v)}>
                      {v.status === 'active' ? <><ShieldAlert size={12} /> Suspend</> : <><ShieldCheck size={12} /> Activate</>}
                    </button>
                    <button className="btn-icon-text danger" onClick={() => handleDeleteVoter(v.id)}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </>
          }
        </div>
      )}
    </div>
  )
}