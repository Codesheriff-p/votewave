import { NextResponse } from 'next/server'
import { getElectionById, updateElectionStatus, deleteElectionById, getEnrichedResults, getVoterVote } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req, { params }) {
  const { id } = await params
  const session = await getSession()
  const election = await getElectionById(id)
  if (!election) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const results = await getEnrichedResults(election)
  const myVote = session ? await getVoterVote(id, session.id) : null

  return NextResponse.json({ election: { ...election, ...results, myVote } })
}

export async function PATCH(req, { params }) {
  const { id } = await params
  const { status } = await req.json()
  updateElectionStatus(id, status)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req, { params }) {
  const { id } = await params
  deleteElectionById(id)
  return NextResponse.json({ ok: true })
}