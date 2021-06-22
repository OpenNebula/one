import { createAction } from 'client/features/One/utils'
import { imageService } from 'client/features/One/image/services'

export const getImage = createAction('image', imageService.getImage)

export const getImages = createAction(
  'image/pool',
  imageService.getImages,
  response => ({ images: response })
)
