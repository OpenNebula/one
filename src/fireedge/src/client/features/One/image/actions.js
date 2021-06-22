import { createAction } from 'client/features/One/utils'
import { imageService } from 'client/features/One/image/services'
import { RESOURCES } from 'client/features/One/slice'

export const getImage = createAction('image', imageService.getImage)

export const getImages = createAction(
  'image/pool',
  imageService.getImages,
  response => ({ [RESOURCES.image]: response })
)
