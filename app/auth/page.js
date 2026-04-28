'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, LogIn, CheckCircle, GraduationCap } from 'lucide-react'

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering',
  'Medicine & Surgery', 'Pharmacy', 'Nursing', 'Law', 'Accounting', 'Business Administration',
  'Economics', 'Mass Communication', 'Education', 'Agriculture', 'Architecture', 'Other'
]
const FACULTIES = [
  'Faculty of Science', 'Faculty of Engineering', 'Faculty of Medicine',
  'Faculty of Law', 'Faculty of Social Sciences', 'Faculty of Arts',
  'Faculty of Education', 'Faculty of Agriculture', 'Other'
]
const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level', 'Postgraduate']

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    fullName: '', email: '', password: '', confirm: '',
    studentId: '', department: '', faculty: '', level: ''
  })

  const setL = k => e => setLoginForm(f => ({ ...f, [k]: e.target.value }))
  const setR = k => e => setRegForm(f => ({ ...f, [k]: e.target.value }))

  async function handleLogin() {
    setError('')
    if (!loginForm.email || !loginForm.password) return setError('Please fill in all fields.')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push('/dashboard')
  }

  async function handleRegister() {
    setError('')
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.studentId)
      return setError('Full name, email, student ID and password are required.')
    if (!regForm.department) return setError('Please select your department.')
    if (!regForm.level) return setError('Please select your level.')
    if (regForm.password.length < 6) return setError('Password must be at least 6 characters.')
    if (regForm.password !== regForm.confirm) return setError('Passwords do not match.')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (success) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="reg-success">
          <CheckCircle size={56} className="reg-success-icon" />
          <h2>Registration Successful!</h2>
          <p>Welcome to VoteWave. Redirecting…</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="brand-logo"><GraduationCap size={36} /></div>
            <h1>VoteWave ✓</h1>
            <p>The official platform for transparent, secure school elections.</p>
            <div className="brand-features">
              <div className="brand-feat">✓ One vote per election</div>
              <div className="brand-feat">✓ Live result tracking</div>
              <div className="brand-feat">✓ Vote in multiple elections</div>
              <div className="brand-feat">✓ Student ID verified</div>
              <div className="brand-feat">✓ Secure JWT sessions</div>
              <div className="brand-feat">✓ Real database backend</div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}>
              <LogIn size={15} /> Sign In
            </button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError('') }}>
              <UserPlus size={15} /> Register
            </button>
          </div>

          {mode === 'login' ? (
            <div className="auth-form">
              <div className="auth-form-header">
                <h2>Welcome back</h2>
                <p>Sign in with your student email and password</p>
              </div>
              <div className="form-group">
                <label>Student Email</label>
                <input className="field" type="email" placeholder="student@university.edu"
                  value={loginForm.email} onChange={setL('email')}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <input className="field" type={showPass ? 'text' : 'password'} placeholder="Your password"
                    value={loginForm.password} onChange={setL('password')}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  <button className="eye-btn" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button className={`btn-primary full-width auth-submit ${loading ? 'loading' : ''}`}
                onClick={handleLogin} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
              </button>
              <p className="auth-switch">Don't have an account?{' '}
                <button className="link-btn" onClick={() => { setMode('register'); setError('') }}>Register here</button>
              </p>
            </div>
          ) : (
            <div className="auth-form">
              <div className="auth-form-header">
                <h2>Create student account</h2>
                <p>Fill in your school details to register</p>
              </div>
              <div className="form-section-title">Personal Information</div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="field" placeholder="e.g. Chidi Okeke" value={regForm.fullName} onChange={setR('fullName')} />
                </div>
                <div className="form-group">
                  <label>Student ID *</label>
                  <input className="field" placeholder="e.g. CSC/2021/001" value={regForm.studentId} onChange={setR('studentId')} />
                </div>
              </div>
              <div className="form-group">
                <label>School Email *</label>
                <input className="field" type="email" placeholder="student@university.edu.ng" value={regForm.email} onChange={setR('email')} />
              </div>
              <div className="form-section-title">Academic Information</div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Faculty</label>
                  <select className="field" value={regForm.faculty} onChange={setR('faculty')}>
                    <option value="">Select faculty…</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select className="field" value={regForm.department} onChange={setR('department')}>
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Level / Year *</label>
                <div className="level-pills">
                  {LEVELS.map(l => (
                    <button key={l} type="button"
                      className={`level-pill ${regForm.level === l ? 'active' : ''}`}
                      onClick={() => setRegForm(f => ({ ...f, level: l }))}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-section-title">Security</div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Password *</label>
                  <div className="input-icon-wrap">
                    <input className="field" type={showPass ? 'text' : 'password'} placeholder="Min. 6 chars"
                      value={regForm.password} onChange={setR('password')} />
                    <button className="eye-btn" onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="input-icon-wrap">
                    <input className="field" type={showConfirm ? 'text' : 'password'} placeholder="Repeat"
                      value={regForm.confirm} onChange={setR('confirm')} />
                    <button className="eye-btn" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              {regForm.password.length > 0 && <PasswordStrength password={regForm.password} />}
              {error && <p className="error-msg">{error}</p>}
              <button className={`btn-primary full-width auth-submit ${loading ? 'loading' : ''}`}
                onClick={handleRegister} disabled={loading}>
                {loading ? <><span className="spinner" /> Registering…</> : <><UserPlus size={16} /> Create Account</>}
              </button>
              <p className="auth-switch">Already registered?{' '}
                <button className="link-btn" onClick={() => { setMode('login'); setError('') }}>Sign in</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ chars', ok: password.length >= 6 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['#f87171', '#fbbf24', '#fbbf24', '#34d399', '#00e5a0']
  return (
    <div className="pw-strength">
      <div className="pw-bars">{[0, 1, 2, 3].map(i => (
        <div key={i} className="pw-bar" style={{ background: i < score ? colors[score] : 'var(--border2)' }} />
      ))}</div>
      <div className="pw-checks">{checks.map(c => (
        <span key={c.label} className={`pw-check ${c.ok ? 'ok' : ''}`}>{c.ok ? '✓' : '○'} {c.label}</span>
      ))}</div>
    </div>
  )
}
