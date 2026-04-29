import { NextResponse } from 'next/server'
import { getVoterByEmail } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })

    const voter = await getVoterByEmail(email)
    if (!voter)
      return NextResponse.json({ error: 'No account found with that email.' }, { status: 401 })

    const ok = await verifyPassword(password, voter.passwordHash)
    if (!ok)
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })

    if (voter.status === 'suspended')
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })

    const token = await createSession(voter)
    const res = NextResponse.json({
      voter: {
        id:         voter.id,
        fullName:   voter.fullName,
        email:      voter.email,
        studentId:  voter.studentId,
        department: voter.department,
        faculty:    voter.faculty,
        level:      voter.level,
      }
    })
    res.cookies.set('votewave_session', token, {
      httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/'
    })
    return res
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}