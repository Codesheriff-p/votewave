import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSession } from '@/lib/auth'
import { getElectionById, updateCandidatePhoto } from '@/lib/db'

export async function POST(req) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData    = await req.formData()
  const file        = formData.get('file')
  const electionId  = formData.get('electionId')
  const candidateId = formData.get('candidateId')

  if (!file || !electionId || !candidateId)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  if (!file.type.startsWith('image/'))
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Image must be under 2MB.' }, { status: 400 })

  // Save to public/candidates/
  const uploadsDir = path.join(process.cwd(), 'public', 'candidates')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const ext      = file.name.split('.').pop().toLowerCase()
  const filename = `${candidateId}.${ext}`
  fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(bytes))

  const photoUrl = `/candidates/${filename}`

  // Verify election and candidate exist
  const election = await getElectionById(electionId)
  if (!election)
    return NextResponse.json({ error: 'Election not found.' }, { status: 404 })

  const candidate = election.candidates.find(c => c.id === candidateId)
  if (!candidate)
    return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  // Save photo URL to database
  await updateCandidatePhoto(candidateId, photoUrl)

  return NextResponse.json({ photoUrl })
}