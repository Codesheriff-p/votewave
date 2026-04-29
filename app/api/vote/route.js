import { NextResponse } from 'next/server'
import { castVote, getElectionById } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: 'You must be logged in to vote.' }, { status: 401 })

    const { electionId, candidateId } = await req.json()
    if (!electionId || !candidateId)
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

    const election = await getElectionById(electionId)
    if (!election)
      return NextResponse.json({ error: 'Election not found.' }, { status: 404 })
    if (election.status === 'closed')
      return NextResponse.json({ error: 'This election is closed.' }, { status: 400 })

    const result = await castVote(electionId, candidateId, session.id)
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 409 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/vote error:', error)
    return NextResponse.json({ error: 'Failed to cast vote.' }, { status: 500 })
  }
}