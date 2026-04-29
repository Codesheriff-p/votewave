import { createUploadthing, createRouteHandler } from "uploadthing/server"

const f = createUploadthing()

export const uploadRouter = {
  candidateImage: f({
    image: { maxFileSize: "4MB" },
  }).onUploadComplete(async ({ file, metadata }) => {
    // This runs AFTER upload succeeds

    const { candidateId } = metadata

    // ✅ Save URL to DB here
    await db.candidate.update({
      where: { id: candidateId },
      data: {
        photo: file.url,
      },
    })

    return { uploadedBy: "admin" }
  }),
}

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
})