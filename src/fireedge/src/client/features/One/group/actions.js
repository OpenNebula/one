import { createAction } from 'client/features/One/utils'
import { groupService } from 'client/features/One/group/services'

export const getGroup = createAction('group', groupService.getGroup)

export const getGroups = createAction(
  'group/pool',
  groupService.getGroups,
  response => ({ groups: response })
)
