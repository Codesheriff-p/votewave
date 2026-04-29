import { NextResponse } from 'next/server'
import {
  getElectionById, updateElectionStatus,
  deleteElectionById, getEnrichedResults, getVoterVote
} from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req, { params }) {
  try {
    const { id }   = await params
    const session  = await getSession()
    const election = await getElectionById(id)
    if (!election) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const results = await getEnrichedResults(election)
    const myVote  = session ? await getVoterVote(id, session.id) : null

    return NextResponse.json({ election: { ...election, ...results, myVote } })
  } catch (error) {
    console.error('GET /api/elections/[id] error:', error)
    return NextResponse.json({ error: 'Failed to get election.' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id }     = await params
    const { status } = await req.json()
    await updateElectionStatus(id, status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/elections/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update election.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    await deleteElectionById(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/elections/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete election.' }, { status: 500 })
  }
}