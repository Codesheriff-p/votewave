import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getElectionById, updateCandidatePhoto } from '@/lib/db'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData    = await req.formData()
    const file        = formData.get('file')
    const electionId  = formData.get('electionId')
    const candidateId = formData.get('candidateId')

    if (!file || !electionId || !candidateId)
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

    if (!file.type.startsWith('image/'))
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })

    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json({ error: 'Image must be under 4MB.' }, { status: 400 })

    // Verify election and candidate exist
    const election = await getElectionById(electionId)
    if (!election)
      return NextResponse.json({ error: 'Election not found.' }, { status: 404 })

    const candidate = election.candidates.find(c => c.id === candidateId)
    if (!candidate)
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

    // Upload to UploadThing cloud
    const response = await utapi.uploadFiles(file)

    if (response.error)
      return NextResponse.json(
        { error: 'Upload failed: ' + response.error.message },
        { status: 500 }
      )

    const photoUrl = response.data.url

    // Save URL to database
    await updateCandidatePhoto(candidateId, photoUrl)

    console.log('Photo uploaded:', photoUrl)
    return NextResponse.json({ photoUrl, success: true })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}