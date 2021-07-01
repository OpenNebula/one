import { createAction } from 'client/features/One/utils'
import { zoneService } from 'client/features/One/zone/services'
import { RESOURCES } from 'client/features/One/slice'

export const getZone = createAction(
  'zone/detail',
  zoneService.getZone
)

export const getZones = createAction(
  'zone/pool',
  zoneService.getZones,
  response => ({ [RESOURCES.zone]: response })
)
