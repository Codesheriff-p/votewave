import { createUploadthing, createRouteHandler } from 'uploadthing/server'
import { getSession } from '@/lib/auth'
import { updateCandidatePhoto } from '@/lib/db'

const f = createUploadthing()

export const uploadRouter = {
  candidateImage: f({
    image: { maxFileSize: '4MB' },
  })
    .middleware(async ({ req }) => {
      // Check the user is logged in
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')

      // Get candidateId from the request header
      const candidateId = req.headers.get('x-candidate-id')
      if (!candidateId) throw new Error('Missing candidateId')

      return { candidateId }
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // Save the photo URL to the database
      await updateCandidatePhoto(metadata.candidateId, file.url)
      console.log('Photo saved:', file.url)
      return { url: file.url }
    }),
}

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
})