import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";
import { getSession } from '@/lib/auth';
import { getElectionById, updateCandidatePhoto } from '@/lib/db';

const utapi = new UTApi();
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  const electionId = formData.get('electionId');
  const candidateId = formData.get('candidateId');

  if (!file || !electionId || !candidateId)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });

  if (!file.type.startsWith('image/'))
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });

  // 1. Upload to Cloud (Uploadthing) instead of local folder
  const response = await utapi.uploadFiles(file);

  if (!response.data) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const photoUrl = response.data.url; // This is the permanent cloud link

  // 2. Verify election and candidate exist
  const election = await getElectionById(electionId);
  if (!election)
    return NextResponse.json({ error: 'Election not found.' }, { status: 404 });

  const candidate = election.candidates.find(c => c.id === candidateId);
  if (!candidate)
    return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });

  // 3. Save the permanent cloud URL to your database
  await updateCandidatePhoto(candidateId, photoUrl);

  return NextResponse.json({ photoUrl });
}
