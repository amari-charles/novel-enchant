import type { SceneImageProps } from '../../shared/type-definitions'

export function SceneImage({ scene }: SceneImageProps) {
  const getGenerationStatus = () => {
    if (scene.processing_status === 'processing') {
      return 'generating'
    }
    if (scene.processing_status === 'failed') {
      return 'failed'
    }
    if (!scene.primary_image) {
      return 'pending'
    }
    return 'completed'
  }

  const status = getGenerationStatus()

  // Only render completed images in Reader Mode
  if (status !== 'completed' || !scene.primary_image) {
    return null
  }

  return (
    <div className="my-4">
      <img
        src={scene.primary_image.image_url}
        alt=""
        className="w-full rounded-lg"
        style={{ 
          aspectRatio: scene.primary_image.dimensions 
            ? `${scene.primary_image.dimensions.width}/${scene.primary_image.dimensions.height}`
            : '16/9'
        }}
      />
    </div>
  )
}