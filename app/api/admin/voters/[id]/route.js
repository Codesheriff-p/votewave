import { NextResponse } from 'next/server'
import { updateVoterStatus, deleteVoterById } from '@/lib/db'

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    await updateVoterStatus(id, status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/admin/voters error:', error)
    return NextResponse.json({ error: 'Failed to update voter.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    await deleteVoterById(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/voters error:', error)
    return NextResponse.json({ error: 'Failed to delete voter.' }, { status: 500 })
  }
}