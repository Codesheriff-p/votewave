import { NextResponse } from 'next/server'
import { updateVoterStatus, deleteVoterById } from '@/lib/db'
export async function PATCH(req, { params }) {
  const { id } = await params
  const { status } = await req.json()
  updateVoterStatus(id, status)
  return NextResponse.json({ ok: true })
}
export async function DELETE(req, { params }) {
  const { id } = await params
  deleteVoterById(id)
  return NextResponse.json({ ok: true })
}

