import { createAction } from 'client/features/One/utils'
import { userService } from 'client/features/One/user/services'

export const changeGroup = createAction('user/change-group', userService.changeGroup)
export const getUser = createAction('user', userService.getUser)

export const getUsers = createAction(
  'user/pool',
  userService.getUsers,
  response => ({ users: response })
)

export const updateUser = createAction('user/update', userService.updateUser)
