import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";
import { getSession } from '@/lib/auth';
import { getElectionById, updateCandidatePhoto } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Check for UploadThing token before attempting upload
    if (!process.env.UPLOADTHING_TOKEN) {
      console.error('UPLOADTHING_TOKEN is not set in environment variables.');
      return NextResponse.json(
        { error: 'Server misconfiguration: UPLOADTHING_TOKEN is missing. Add it to .env.local from your UploadThing dashboard.' },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    const electionId = formData.get('electionId');
    const candidateId = formData.get('candidateId');

    if (!file || !electionId || !candidateId) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
    }

    const utapi = new UTApi();

    // Upload to UploadThing
    const response = await utapi.uploadFiles(file);

    // UploadThing v7 returns { data: { ufsUrl, ... }, error } directly (not an array)
    // Handle both shapes: single object or array
    let photoUrl = null;
    if (Array.isArray(response)) {
      photoUrl = response[0]?.data?.ufsUrl ?? response[0]?.data?.url ?? null;
    } else {
      photoUrl = response?.data?.ufsUrl ?? response?.data?.url ?? null;
    }

    if (!photoUrl) {
      const errMsg = Array.isArray(response)
        ? response[0]?.error?.message
        : response?.error?.message;
      console.error('UploadThing upload failed:', errMsg || JSON.stringify(response));
      return NextResponse.json(
        { error: `Upload failed: ${errMsg || 'No URL returned. Check UPLOADTHING_TOKEN in .env.local'}` },
        { status: 500 }
      );
    }

    // Verify election exists
    const election = await getElectionById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found.' }, { status: 404 });
    }

    // Verify candidate exists
    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    // Save URL to DB
    await updateCandidatePhoto(candidateId, photoUrl);

    return NextResponse.json({ success: true, photoUrl });

  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    return NextResponse.json({ error: error.message || 'Upload failed.' }, { status: 500 });
  }
}
