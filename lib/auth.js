import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votewave-super-secret-key-change-in-prod'
)
const COOKIE = 'votewave_session'

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createSession(voter) {
  const token = await new SignJWT({
    id: voter.id,
    fullName: voter.fullName,
    email: voter.email,
    studentId: voter.studentId,
    department: voter.department,
    faculty: voter.faculty,
    level: voter.level,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
  return token
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export function setSessionCookie(response, token) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
}

export const COOKIE_NAME = COOKIE
