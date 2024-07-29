/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Draft, ThunkAction } from '@reduxjs/toolkit'

import userApi from 'client/features/OneApi/user'
import groupApi from 'client/features/OneApi/group'
import { LockLevel, Permission, User, Group } from 'client/constants'
import { xmlToJson } from 'client/models/Helper'

/**
 * Checks if the parameters are valid to update the pool store.
 *
 * @param {Draft} draft - The draft to check
 * @param {string} resourceId - The resource ID
 * @returns {boolean} - True if the parameters are valid, false otherwise
 */
export const isUpdateOnPool = (draft, resourceId) =>
  Array.isArray(draft) && resourceId !== undefined

/**
 * Update the pool of resources with the new data.
 *
 * @param {string} params - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @param {string} [params.resourceFromQuery] - The resource from query (user, group, ...)
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateResourceOnPool =
  ({ id: resourceId, resourceFromQuery }) =>
  (draft) => {
    if (!isUpdateOnPool(draft, resourceId)) return

    const index = draft.findIndex(({ ID }) => +ID === +resourceId)
    index !== -1 && (draft[index] = resourceFromQuery)
  }

/**
 * Remove the resource from the pool.
 *
 * @param {string} params - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const removeResourceOnPool =
  ({ id: resourceId }) =>
  (draft) => {
    if (!isUpdateOnPool(draft, resourceId)) return

    draft.filter(({ ID }) => +ID !== +resourceId)
  }

/**
 * Update the name of a resource in the store.
 *
 * @param {string} params - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @param {string} [params.name] - The name of the resource
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateNameOnResource =
  ({ id: resourceId, name: newName }) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if ((updatePool && !resource) || newName === undefined) return

    resource.NAME = newName
  }

/**
 * Update the lock level of a resource in the store.
 *
 * @param {string} params - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @param {LockLevel} [params.level] - The new lock level. By default, the lock level is 4.
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateLockLevelOnResource =
  ({ id: resourceId, level = '4' }) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    resource.LOCK = { LOCKED: level }
  }

/**
 * Update to unlock a resource in the store.
 *
 * @param {string} params - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @param {string} [params.level] - The new lock level
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const removeLockLevelOnResource =
  ({ id: resourceId }) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    resource.LOCK = undefined
  }

/**
 * Update the permissions of a resource in the store.
 *
 * @param {object} params - Request parameters
 * @param {string} params.id - The id of the resource
 * @param {Permission|'-1'} params.ownerUse - User use
 * @param {Permission|'-1'} params.ownerManage - User manage
 * @param {Permission|'-1'} params.ownerAdmin - User administrator
 * @param {Permission|'-1'} params.groupUse - Group use
 * @param {Permission|'-1'} params.groupManage - Group manage
 * @param {Permission|'-1'} params.groupAdmin - Group administrator
 * @param {Permission|'-1'} params.otherUse - Other use
 * @param {Permission|'-1'} params.otherManage - Other manage
 * @param {Permission|'-1'} params.otherAdmin - Other administrator
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updatePermissionOnResource =
  ({ id: resourceId, ...permissions }) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    Object.entries(permissions)
      .filter(([_, value]) => value !== '-1')
      .forEach(([name, value]) => {
        const ensuredName = {
          ownerUse: 'OWNER_U',
          ownerManage: 'OWNER_M',
          ownerAdmin: 'OWNER_A',
          groupUse: 'GROUP_U',
          groupManage: 'GROUP_M',
          groupAdmin: 'GROUP_A',
          otherUse: 'OTHER_U',
          otherManage: 'OTHER_M',
          otherAdmin: 'OTHER_A',
        }[name]

        resource.PERMISSIONS[ensuredName] = value
      })
  }

/**
 * Select the users and groups from the current state.
 * - If `options.userId` is provided, only the user with the given id will be selected.
 * - If `options.groupId` is provided, only the group with the given id will be selected.
 *
 * @param {object} state - The current state
 * @param {string} options - The options to filter the users and groups
 * @param {string} options.userId - The user id
 * @param {string} options.groupId - The group id
 * @returns {
 * { users: User[], groups: Group[] } | { user: User, group: Group }
 * } - The users and groups or the user and group by id
 */
export const selectOwnershipFromState = (state, { userId, groupId } = {}) => {
  const { data: users } = userApi.endpoints.getUsers.select()(state)
  const { data: groups } = groupApi.endpoints.getGroups.select()(state)

  if (!userId && !groupId) return { users, groups }

  const user = users.find(({ ID }) => +ID === +userId)
  const group = groups.find(({ ID }) => +ID === +groupId)

  return { user, group }
}

/**
 * Update the ownership of a resource in the store.
 *
 * @param {object} state - The current state
 * @param {string} [params] - The parameters from query
 * @param {string} [params.id] - The id of the resource
 * @param {string} [params.user] - The user id to update
 * @param {string} [params.group] - The group id to update
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateOwnershipOnResource = (
  state,
  { id: resourceId, user: userId, group: groupId } = {}
) => {
  const { user, group } = selectOwnershipFromState(state, { userId, groupId })

  return (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    user?.ID > -1 && (resource.UID = user.ID)
    user?.NAME !== undefined && (resource.UNAME = user.NAME)

    group?.ID > -1 && (resource.GID = group.ID)
    group?.NAME !== undefined && (resource.GNAME = group.NAME)
  }
}

/**
 * Update the resource template in the store.
 *
 * @param {object} params - Request params
 * @param {number|string} params.id -  The id of the resource
 * @param {string} params.template - The new user template contents on XML format
 * @param {0|1} params.replace
 * - Update type:
 * ``0``: Replace the whole template.
 * ``1``: Merge new template with the existing one.
 * @param {string} [templateAttribute] - The attribute name of the resource template. By default is `TEMPLATE`.
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateTemplateOnResource =
  (
    { id: resourceId, template: xml, replace = 0 },
    templateAttribute = 'TEMPLATE'
  ) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)
    const newTemplateJson = xmlToJson(xml)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    resource[templateAttribute] =
      +replace === 0
        ? newTemplateJson
        : { ...resource[templateAttribute], ...newTemplateJson }
  }

/**
 * Update the template body of a document in the store.
 *
 * @param {object} params - Request params
 * @param {number|string} params.id -  The id of the resource
 * @param {object} params.template - The new template contents on JSON format
 * @param {boolean} [params.append]
 * - ``true``: Merge new template with the existing one.
 * - ``false``: Replace the whole template.
 *
 * By default, ``true``.
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateTemplateOnDocument =
  ({ id: resourceId, template, append = true }) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, resourceId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +resourceId)
      : draft

    if (updatePool && !resource) return

    resource.TEMPLATE.BODY = append
      ? { ...resource.TEMPLATE.BODY, ...template }
      : template
  }

/**
 * Updates the current user groups in the store.
 *
 * @param {object} params - Request params
 * @param {string|number} params.id - The id of the user
 * @param {string|number} params.group - The group id to update
 * @param {boolean} [remove] - Remove the group from the user
 * @returns {function(Draft):ThunkAction} - Dispatches the action
 */
export const updateUserGroups =
  ({ id: userId, group: groupId }, remove = false) =>
  (draft) => {
    const updatePool = isUpdateOnPool(draft, userId)

    const resource = updatePool
      ? draft.find(({ ID }) => +ID === +userId)
      : draft

    if ((updatePool && !resource) || groupId === undefined) return

    const currentGroups = [resource.GROUPS.ID].flat()

    resource.GROUPS.ID = remove
      ? currentGroups.filter((id) => +id !== +groupId)
      : currentGroups.concat(groupId)
  }
