import { NextResponse } from 'next/server'
import { getElections, createElection, getEnrichedResults, getVoterVote } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  const elections = await getElections()

  const enriched = await Promise.all(
    elections.map(async e => {
      const results = await getEnrichedResults(e)
      const myVote = session ? await getVoterVote(e.id, session.id) : null
      return { ...e, ...results, myVote }
    })
  )

  return NextResponse.json({ elections: enriched })
}

export async function POST(req) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, candidates } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required.' }, { status: 400 })

  const filtered = (candidates || []).filter(c => (typeof c === 'string' ? c.trim() : c?.name?.trim()))
  if (filtered.length < 2) return NextResponse.json({ error: 'At least 2 candidates required.' }, { status: 400 })

  const election = createElection({ title, description, candidates: filtered })
  return NextResponse.json({ election })
}