import { getAdminClient } from '@/lib/supabase'
import { getPublicUrl } from '@/lib/r2'
import { notFound } from 'next/navigation'
import type { GenerationVideo } from '@/types/generation'

export default async function SharedVideoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = getAdminClient()

  const { data: generation } = await supabase
    .from('generations')
    .select('id, product_name, videos, visibility, share_token, created_at')
    .eq('share_token', token)
    .eq('visibility', 'unlisted')
    .single()

  if (!generation || !generation.videos?.length) {
    notFound()
  }

  const video = generation.videos[0] as GenerationVideo
  const videoUrl = video.videoSubtitledR2Key
    ? getPublicUrl(video.videoSubtitledR2Key)
    : video.videoR2Key
    ? getPublicUrl(video.videoR2Key)
    : null

  if (!videoUrl) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-text-primary">{generation.product_name}</h1>
          <p className="text-sm text-text-muted">Made with UGCFirst</p>
        </div>
        <div className="rounded-xl overflow-hidden bg-black shadow-2xl">
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full"
            style={{ aspectRatio: '9/16', maxHeight: '70vh' }}
          />
        </div>
        <div className="text-center">
          <a
            href="https://ugcfirst.com"
            className="text-sm text-mint hover:underline"
          >
            Create your own UGC videos &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
