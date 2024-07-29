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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { UsersTable } from 'client/components/Tables'

import {
  useGetGroupQuery,
  useAddAdminToGroupMutation,
  useRemoveAdminFromGroupMutation,
} from 'client/features/OneApi/group'
import { getActionsAvailable } from 'client/models/Helper'
import { GROUP_ACTIONS, T } from 'client/constants'

import { EditAdminsActions } from './Actions'

import { useGeneralApi } from 'client/features/General'

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
const GroupUsersTab = ({ tabProps: { actions } = {}, id }) => {
  const { enqueueSuccess } = useGeneralApi()
  const [addAdmins] = useAddAdminToGroupMutation()
  const [removeAdmins] = useRemoveAdminFromGroupMutation()

  const { data: group, refetch } = useGetGroupQuery({ id })
  const adminsGroup = Array.isArray(group.ADMINS?.ID)
    ? group.ADMINS?.ID
    : [group.ADMINS?.ID]

  const actionsAvailable = getActionsAvailable(actions)

  // Filter function to get only group users and add if the user is admin group
  const filterData = (data) => {
    const filterUsers = data.filter((user) => {
      // filter users by group id
      const groupsUser = Array.isArray(user.GROUPS.ID)
        ? user.GROUPS.ID
        : [user.GROUPS.ID]

      return groupsUser.some((groupUser) => groupUser === id)
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

  // Add and remove administrators
  const submitAdmins = async (adminsToAdd, adminsToRemove) => {
    // Add admins
    await Promise.all(adminsToAdd.map((user) => addAdmins({ id, user })))

    // Remove admins
    await Promise.all(adminsToRemove.map((user) => removeAdmins({ id, user })))

    // Refresh info
    refetch({ id })

    // Success message
    enqueueSuccess(T['groups.actions.edit.admins.success'])
  }

  return (
    <div>
      {actionsAvailable?.includes?.(GROUP_ACTIONS.EDIT_ADMINS) && (
        <EditAdminsActions
          admins={adminsGroup}
          filterData={filterData}
          submit={submitAdmins}
        />
      )}
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <UsersTable
          disableRowSelect
          disableGlobalSort
          groupId={id}
          filterData={filterData}
        />
      </Stack>
    </div>
  )
}

GroupUsersTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupUsersTab.displayName = 'GroupUsersTab'

export default GroupUsersTab
