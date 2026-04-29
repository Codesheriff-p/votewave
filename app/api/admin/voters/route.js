import { NextResponse } from 'next/server'
import { getVoters } from '@/lib/db'

export async function GET() {
  try {
    const voters = await getVoters()
    // Remove password hashes before sending to client
    const safe = voters.map(({ passwordHash, ...v }) => v)
    return NextResponse.json({ voters: safe })
  } catch (error) {
    console.error('GET /api/admin/voters error:', error)
    return NextResponse.json({ voters: [] }, { status: 500 })
  }
}