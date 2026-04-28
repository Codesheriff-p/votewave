import { NextResponse } from 'next/server'
import { getVoters } from '@/lib/db'
export async function GET() {
  const voters = awaitgetVoters().map(({ passwordHash, ...v }) => v)
  return NextResponse.json({ voters })
}
