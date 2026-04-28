import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// ── Voters ────────────────────────────────────────────────────────────────────
export async function getVoters() {
  const result = await pool.query(
    'SELECT * FROM voters ORDER BY created_at DESC'
  )
  return result.rows
}

export async function getVoterByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM voters WHERE email = $1',
    [email.toLowerCase()]
  )
  return result.rows[0] || null
}

export async function getVoterById(id) {
  const result = await pool.query(
    'SELECT * FROM voters WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

export async function createVoter(data) {
  // Check if email exists
  const existingEmail = await pool.query(
    'SELECT email FROM voters WHERE email = $1',
    [data.email.toLowerCase()]
  )
  if (existingEmail.rows[0]) {
    return { error: 'An account with this email already exists.' }
  }
  
  // Check if studentId exists
  const existingStudent = await pool.query(
    'SELECT student_id FROM voters WHERE student_id = $1',
    [data.studentId.trim()]
  )
  if (existingStudent.rows[0]) {
    return { error: 'This Student ID is already registered.' }
  }
  
  const result = await pool.query(
    `INSERT INTO voters (full_name, email, password_hash, student_id, department, faculty, level, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [
      data.fullName.trim(),
      data.email.trim().toLowerCase(),
      data.passwordHash,
      data.studentId.trim(),
      data.department?.trim() || '',
      data.faculty?.trim() || '',
      data.level || ''
    ]
  )
  return { voter: result.rows[0] }
}

export async function updateVoterStatus(id, status) {
  const result = await pool.query(
    'UPDATE voters SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  )
  return result.rows[0]
}

export async function deleteVoterById(id) {
  const result = await pool.query(
    'DELETE FROM voters WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

// ── Elections ─────────────────────────────────────────────────────────────────
export async function getElections() {
  const result = await pool.query(
    `SELECT e.*, 
      COALESCE(
        json_agg(json_build_object('id', c.id, 'name', c.name, 'post', c.post, 'department', c.department, 'level', c.level, 'manifesto', c.manifesto, 'color', c.color, 'photo', c.photo)) 
        FILTER (WHERE c.id IS NOT NULL), 
        '[]'
      ) as candidates
     FROM elections e
     LEFT JOIN candidates c ON e.id = c.election_id
     GROUP BY e.id
     ORDER BY e.created_at DESC`
  )
  return result.rows
}

export async function getElectionById(id) {
  const result = await pool.query(
    `SELECT e.*, 
      COALESCE(
        json_agg(json_build_object('id', c.id, 'name', c.name, 'post', c.post, 'department', c.department, 'level', c.level, 'manifesto', c.manifesto, 'color', c.color, 'photo', c.photo)) 
        FILTER (WHERE c.id IS NOT NULL), 
        '[]'
      ) as candidates
     FROM elections e
     LEFT JOIN candidates c ON e.id = c.election_id
     WHERE e.id = $1
     GROUP BY e.id`,
    [id]
  )
  return result.rows[0] || null
}

export async function createElection(data) {
  // First create election
  const electionResult = await pool.query(
    'INSERT INTO elections (title, description, created_at) VALUES ($1, $2, NOW()) RETURNING id',
    [data.title.trim(), data.description?.trim() || '']
  )
  const electionId = electionResult.rows[0].id
  
  // Then create candidates
  const candidates = (data.candidates || [])
    .filter(c => c && (typeof c === 'string' ? c.trim() : c.name?.trim()))
  
  for (const candidate of candidates) {
    const name = typeof candidate === 'string' ? candidate : candidate.name
    await pool.query(
      `INSERT INTO candidates (name, post, department, level, manifesto, color, photo, election_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        name.trim(),
        candidate.post || null,
        candidate.department || null,
        candidate.level || null,
        candidate.manifesto || null,
        candidate.color || null,
        candidate.avatar || null,
        electionId
      ]
    )
  }
  
  return getElectionById(electionId)
}

export async function updateElectionStatus(id, status) {
  const result = await pool.query(
    'UPDATE elections SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  )
  return result.rows[0]
}

export async function deleteElectionById(id) {
  // Delete votes first (due to foreign key constraints)
  await pool.query('DELETE FROM votes WHERE election_id = $1', [id])
  await pool.query('DELETE FROM candidates WHERE election_id = $1', [id])
  const result = await pool.query(
    'DELETE FROM elections WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

// ── Votes ─────────────────────────────────────────────────────────────────────
export async function getVotesByElection(electionId) {
  const result = await pool.query(
    'SELECT * FROM votes WHERE election_id = $1',
    [electionId]
  )
  return result.rows
}

export async function hasVoted(electionId, voterId) {
  const result = await pool.query(
    'SELECT id FROM votes WHERE election_id = $1 AND voter_id = $2',
    [electionId, voterId]
  )
  return result.rows.length > 0
}

export async function getVoterVote(electionId, voterId) {
  const result = await pool.query(
    'SELECT * FROM votes WHERE election_id = $1 AND voter_id = $2',
    [electionId, voterId]
  )
  return result.rows[0] || null
}

export async function castVote(electionId, candidateId, voterId) {
  const existing = await hasVoted(electionId, voterId)
  if (existing) return { error: 'You have already voted in this election.' }
  
  await pool.query(
    'INSERT INTO votes (election_id, candidate_id, voter_id, created_at) VALUES ($1, $2, $3, NOW())',
    [electionId, candidateId, voterId]
  )
  return { success: true }
}

// ── Results ───────────────────────────────────────────────────────────────────
export async function getEnrichedResults(election) {
  const votes = await getVotesByElection(election.id)
  const tally = {}
  votes.forEach(v => { tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1 })
  
  const candidates = (election.candidates || []).map(c => ({
    ...c,
    votes: tally[c.id] || 0,
    pct: votes.length > 0
      ? Math.round(((tally[c.id] || 0) / votes.length) * 100)
      : 0,
  })).sort((a, b) => b.votes - a.votes)
  
  return { candidates, totalVotes: votes.length }
}

export async function updateCandidatePhoto(candidateId, photoUrl) {
  const result = await pool.query(
    'UPDATE candidates SET photo = $1 WHERE id = $2 RETURNING *',
    [photoUrl, candidateId]
  )
  return result.rows[0]
}

export function saveElections() { }

export { pool }