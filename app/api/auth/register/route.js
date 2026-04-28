import { NextResponse } from 'next/server'
import { createVoter } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req) {
  const { fullName, email, password, studentId, department, faculty, level } = await req.json()
  if (!fullName || !email || !password || !studentId || !department || !level)
    return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
  if (password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

  const passwordHash = await hashPassword(password)
  const result = await createVoter({ fullName, email, passwordHash, studentId, department, faculty, level })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })

  const token = await createSession(result.voter)
  const res = NextResponse.json({ voter: { id: result.voter.id, fullName: result.voter.fullName, email: result.voter.email, studentId: result.voter.studentId, department: result.voter.department, faculty: result.voter.faculty, level: result.voter.level } })
  res.cookies.set('votewave_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
