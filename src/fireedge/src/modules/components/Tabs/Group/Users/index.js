/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { UsersTable } from '@modules/components/Tables'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { GROUP_ACTIONS, T } from '@ConstantsModule'
import { GroupAPI, UserAPI, useGeneralApi } from '@FeaturesModule'
import { getActionsAvailable } from '@ModelsModule'

import { AddUsersAction, EditAdminsActions, RemoveUsersAction } from './Actions'

const _ = require('lodash')

/**
 * Renders users tab showing the users of the group.
 *
 * @param {object} props - Props
 * @param {string} props.id - Group id
 * @param {object} props.tabProps - Tab props
 * @param {object} props.tabProps.actions - Actions to this tab
 * @returns {ReactElement} Information tab
 */
const GroupUsersTab = ({ tabProps: { actions } = {}, id: groupId }) => {
  const { enqueueSuccess } = useGeneralApi()
  const [addAdmins] = GroupAPI.useAddAdminToGroupMutation()
  const [removeAdmins] = GroupAPI.useRemoveAdminFromGroupMutation()
  const [addUser] = UserAPI.useAddGroupMutation()
  const [removeUser] = UserAPI.useRemoveFromGroupMutation()
  const { data: users } = UserAPI.useGetUsersQuery()

  const { data: group, refetch } = GroupAPI.useGetGroupQuery({ id: groupId })
  const adminsGroup = Array.isArray(group.ADMINS?.ID)
    ? group.ADMINS?.ID
    : [group.ADMINS?.ID]

  const actionsAvailable = getActionsAvailable(actions)

  // Filter function to get only group users and add if the user is admin group
  const filterDataByAdmin = (data) => {
    // Returns all users of this group
    const filterUsers = data.filter((user) => {
      // filter users by group id
      const groupsUser = Array.isArray(user.GROUPS.ID)
        ? user.GROUPS.ID
        : [user.GROUPS.ID]

      return groupsUser.some((groupUser) => groupUser === groupId)
    })

    const admins = Array.isArray(group.ADMINS?.ID)
      ? group.ADMINS?.ID
      : [group.ADMINS?.ID]

    return filterUsers.map((user) => {
      const userCopy = _.cloneDeep(_.cloneDeep(user))
      userCopy.IS_ADMIN_GROUP = admins.some((admin) => admin === user.ID)

      return userCopy
    })
  }

  // Filter users and show the ones that are not in a group
  const filterDataNotInGroup = (data) =>
    data.filter((user) => {
      // filter users by group id
      const groupsUser = Array.isArray(user.GROUPS.ID)
        ? user.GROUPS.ID
        : [user.GROUPS.ID]

      return !groupsUser.some((groupUser) => groupUser === groupId)
    })

  // Filter users and show the ones that are in the current group and are not his primary group
  const filterDataInGroup = (data) =>
    data.filter((user) => {
      const USER_GROUPS = [].concat(user.GROUPS.ID ?? [])
      const primaryGroupId = user?.GID ?? USER_GROUPS?.[0]

      // filter users by group id
      const groupsUser = Array.isArray(user.GROUPS.ID)
        ? user.GROUPS.ID
        : [user.GROUPS.ID]

      return (
        groupsUser.some((groupUser) => groupUser === groupId) &&
        primaryGroupId !== groupId
      )
    })

  // Add and remove administrators
  const submitAdmins = async (adminsToAdd, adminsToRemove) => {
    // Add admins
    await Promise.all(
      adminsToAdd.map((user) => addAdmins({ id: groupId, user }))
    )

    // Remove admins
    await Promise.all(
      adminsToRemove.map((user) => removeAdmins({ id: groupId, user }))
    )

    // Refresh info
    refetch({ id: groupId })

    // Success message
    enqueueSuccess(T['groups.actions.edit.admins.success'])
  }

  const submitNewUsers = async (usersToAdd) => {
    await Promise.all(
      usersToAdd.map((user) => addUser({ id: user, group: groupId }))
    )

    // Refresh info
    refetch({ id: groupId })

    // Success message
    enqueueSuccess(T['groups.actions.add.user.success'])
  }

  const submitDeleteUsers = async (usersToAdd) => {
    await Promise.all(
      usersToAdd.map((user) => removeUser({ id: user, group: groupId }))
    )

    // Refresh info
    refetch({ id: groupId })

    // Success message
    enqueueSuccess(T['groups.actions.add.user.success'])
  }

  return (
    <Stack direction="column">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="start"
        gap="1rem"
      >
        {actionsAvailable?.includes?.(GROUP_ACTIONS.ADD_USERS) && (
          <AddUsersAction
            users={users}
            filterData={filterDataNotInGroup}
            submit={submitNewUsers}
          />
        )}

        {actionsAvailable?.includes?.(GROUP_ACTIONS.REMOVE_USERS) && (
          <RemoveUsersAction
            users={users}
            filterData={filterDataInGroup}
            submit={submitDeleteUsers}
          />
        )}

        {actionsAvailable?.includes?.(GROUP_ACTIONS.EDIT_ADMINS) && (
          <EditAdminsActions
            admins={adminsGroup}
            filterData={filterDataByAdmin}
            submit={submitAdmins}
          />
        )}
      </Stack>
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <UsersTable.Table
          disableRowSelect
          disableGlobalSort
          groupId={groupId}
          filterData={filterDataByAdmin}
        />
      </Stack>
    </Stack>
  )
}

GroupUsersTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupUsersTab.displayName = 'GroupUsersTab'

export default GroupUsersTab
