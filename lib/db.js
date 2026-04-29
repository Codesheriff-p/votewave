import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ── VOTERS ────────────────────────────────────────────────────────────────────
export async function getVoters() {
  return prisma.voter.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function getVoterByEmail(email) {
  return prisma.voter.findUnique({
    where: { email: email.trim().toLowerCase() },
  })
}

export async function getVoterById(id) {
  return prisma.voter.findUnique({ where: { id } })
}

export async function createVoter(data) {
  const byEmail = await prisma.voter.findUnique({
    where: { email: data.email.trim().toLowerCase() },
  })
  if (byEmail) return { error: 'An account with this email already exists.' }

  const byStudentId = await prisma.voter.findUnique({
    where: { studentId: data.studentId.trim() },
  })
  if (byStudentId) return { error: 'This Student ID is already registered.' }

  const voter = await prisma.voter.create({
    data: {
      fullName:     data.fullName.trim(),
      email:        data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      studentId:    data.studentId.trim(),
      department:   data.department?.trim() || '',
      faculty:      data.faculty?.trim()    || '',
      level:        data.level              || '',
    },
  })
  return { voter }
}

export async function updateVoterStatus(id, status) {
  return prisma.voter.update({ where: { id }, data: { status } })
}

export async function deleteVoterById(id) {
  return prisma.voter.delete({ where: { id } })
}

// ── ELECTIONS ─────────────────────────────────────────────────────────────────
export async function getElections() {
  return prisma.election.findMany({
    include: { candidates: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getElectionById(id) {
  return prisma.election.findUnique({
    where:   { id },
    include: { candidates: true },
  })
}

export async function createElection(data) {
  const candidates = (data.candidates || [])
    .filter(c => (typeof c === 'string' ? c.trim() : c?.name?.trim()))
    .map(c =>
      typeof c === 'string'
        ? { name: c.trim() }
        : {
            name:       c.name?.trim()      || '',
            post:       c.post?.trim()       || '',
            department: c.department?.trim() || '',
            level:      c.level?.trim()      || '',
            manifesto:  c.manifesto?.trim()  || '',
            color:      c.color              || '#00e5a0',
            avatar:     c.avatar?.trim()     || '',
          }
    )

  return prisma.election.create({
    data: {
      title:       data.title.trim(),
      description: data.description?.trim() || '',
      candidates:  { create: candidates },
    },
    include: { candidates: true },
  })
}

export async function updateElectionStatus(id, status) {
  return prisma.election.update({ where: { id }, data: { status } })
}

export async function deleteElectionById(id) {
  return prisma.election.delete({ where: { id } })
}

// ── VOTES ─────────────────────────────────────────────────────────────────────
export async function getVotesByElection(electionId) {
  return prisma.vote.findMany({ where: { electionId } })
}

export async function hasVoted(electionId, voterId) {
  const vote = await prisma.vote.findUnique({
    where: { voterId_electionId: { voterId, electionId } },
  })
  return !!vote
}

export async function getVoterVote(electionId, voterId) {
  const vote = await prisma.vote.findUnique({
    where: { voterId_electionId: { voterId, electionId } },
  })
  return vote || null
}

export async function castVote(electionId, candidateId, voterId) {
  const existing = await prisma.vote.findUnique({
    where: { voterId_electionId: { voterId, electionId } },
  })
  if (existing) return { error: 'You have already voted in this election.' }

  await prisma.vote.create({
    data: { electionId, candidateId, voterId },
  })
  return { success: true }
}

// ── RESULTS ───────────────────────────────────────────────────────────────────
export async function getEnrichedResults(election) {
  const votes = await getVotesByElection(election.id)
  const tally = {}
  votes.forEach(v => {
    tally[v.candidateId] = (tally[v.candidateId] || 0) + 1
  })

  const candidates = (election.candidates || [])
    .map(c => ({
      ...c,
      votes: tally[c.id] || 0,
      pct:   votes.length > 0
        ? Math.round(((tally[c.id] || 0) / votes.length) * 100)
        : 0,
    }))
    .sort((a, b) => b.votes - a.votes)

  return { candidates, totalVotes: votes.length }
}

// ── PHOTOS ────────────────────────────────────────────────────────────────────
export async function updateCandidatePhoto(candidateId, photoUrl) {
  return prisma.candidate.update({
    where: { id: candidateId },
    data:  { photo: photoUrl },
  })
}

// Compatibility stubs
export function saveElections() {}
export function read()  {}
export function write() {}