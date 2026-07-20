/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import { GroupAPI, UserAPI, useGeneralApi } from '@FeaturesModule'
import { getActionsAvailable } from '@UtilsModule'

import { AddUsersAction, EditAdminsAction, RemoveUsersAction } from './Action'

import { GROUP_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { LoadingDisplay } from '@modules/resources/LoadingState'
import { UserGroupsTab, Table } from '@ComponentsV2Module'
import {
  getGroupId,
  groupTabPropTypes,
} from '@modules/resources/resources/Group/Tabs/common'

const DEFAULT_USER_ACTIONS = {
  [GROUP_ACTIONS.ADD_USERS]: true,
  [GROUP_ACTIONS.REMOVE_USERS]: true,
  [GROUP_ACTIONS.EDIT_ADMINS]: true,
}

const userColumns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  { accessorKey: 'GNAME', header: T.Group, grow: false },
  { accessorKey: 'IS_ADMIN_GROUP_LABEL', header: T.Admin },
  { accessorKey: 'ENABLED_LABEL', header: T.Enabled },
  { accessorKey: 'AUTH_DRIVER', header: T.AuthDriver },
]

const isSameId = (firstId, secondId) => String(firstId) === String(secondId)

const toIds = (value) =>
  []
    .concat(value ?? [])
    .filter((id) => id !== undefined && id !== null && id !== '')
    .map(String)

const getUserGroupIds = (user = {}) =>
  toIds([user?.GID, ...toIds(user?.GROUPS?.ID)])

const hasGroupId = (user = {}, groupId) =>
  getUserGroupIds(user).some((id) => isSameId(id, groupId))

const getPrimaryGroupId = (user = {}) =>
  String(user?.GID ?? toIds(user?.GROUPS?.ID)?.[0] ?? '')

const getUserTableRow = (user = {}, adminIds = []) => {
  const isAdmin = adminIds.some((id) => isSameId(id, user?.ID))

  return {
    ...user,
    IS_ADMIN_GROUP: isAdmin,
    IS_ADMIN_GROUP_LABEL: isAdmin ? T.Yes : T.No,
    ENABLED_LABEL: +user?.ENABLED ? T.Yes : T.No,
  }
}

const getUsersInGroup = (users = [], groupId, adminIds = []) =>
  users
    .filter((user) => hasGroupId(user, groupId))
    .map((user) => getUserTableRow(user, adminIds))

const getUsersNotInGroup = (users = [], groupId) =>
  users.filter((user) => !hasGroupId(user, groupId))

const getRemovableUsers = (users = [], groupId) =>
  users.filter(
    (user) =>
      hasGroupId(user, groupId) && !isSameId(getPrimaryGroupId(user), groupId)
  )

/**
 * Renders the group users tab.
 *
 * @param {object} root0 - Props
 * @param {object} root0.tabProps - Tab properties
 * @param {object} root0.tabProps.actions - Actions for tab
 * @param {string} root0.id - Group id
 * @returns {ReactElement} Group users tab
 */
const GroupUsersInfoTab = ({ tabProps: { actions } = {}, id: groupId }) => {
  const { enqueueSuccess } = useGeneralApi()
  const [addAdmin] = GroupAPI.useAddAdminToGroupMutation()
  const [removeAdmin] = GroupAPI.useRemoveAdminFromGroupMutation()
  const [addUser] = UserAPI.useAddGroupMutation()
  const [removeUser] = UserAPI.useRemoveFromGroupMutation()
  const {
    data: users = [],
    refetch: refetchUsers,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isError: isUsersError,
    error: usersError,
  } = UserAPI.useGetUsersQuery()
  const {
    data: group,
    refetch: refetchGroup,
    isLoading: isLoadingGroup,
    isFetching: isFetchingGroup,
    isError: isGroupError,
    error: groupError,
  } = GroupAPI.useGetGroupQuery({ id: groupId })

  const adminIds = useMemo(() => toIds(group?.ADMINS?.ID), [group?.ADMINS?.ID])
  const groupUsersRows = useMemo(
    () => getUsersInGroup([].concat(users ?? []), groupId, adminIds),
    [users, groupId, adminIds]
  )

  const isLoading =
    isLoadingUsers || isFetchingUsers || isLoadingGroup || isFetchingGroup
  const actionsAvailable = getActionsAvailable(actions)

  if (isLoading || !group) {
    return (
      <LoadingDisplay
        isLoading={isLoading}
        isEmpty={!group}
        error={
          isUsersError
            ? usersError?.data
            : isGroupError
            ? groupError?.data
            : undefined
        }
      />
    )
  }

  const filterUsersByAdmin = (data) =>
    getUsersInGroup([].concat(data ?? []), groupId, adminIds)

  const filterUsersNotLinked = (data) =>
    getUsersNotInGroup([].concat(data ?? []), groupId)

  const filterUsersLinked = (data) =>
    getRemovableUsers([].concat(data ?? []), groupId)

  const refreshData = async () => {
    await Promise.all([refetchGroup(), refetchUsers()])
  }

  const submitAdmins = async (adminsToAdd = [], adminsToRemove = []) => {
    await Promise.all([
      ...adminsToAdd.map((user) => addAdmin({ id: groupId, user })),
      ...adminsToRemove.map((user) => removeAdmin({ id: groupId, user })),
    ])

    await refreshData()

    enqueueSuccess(T['groups.actions.edit.admins.success'])
  }

  const submitAddUsers = async (usersToAdd = []) => {
    await Promise.all(
      usersToAdd.map((userId) => addUser({ id: userId, group: groupId }))
    )

    await refreshData()

    enqueueSuccess(T['groups.actions.add.user.success'])
  }

  const submitRemoveUsers = async (usersToRemove = []) => {
    await Promise.all(
      usersToRemove.map((userId) => removeUser({ id: userId, group: groupId }))
    )

    await refreshData()

    enqueueSuccess(T['groups.actions.add.user.success'])
  }

  return (
    <UserGroupsTab
      primaryTitle={null}
      actions={
        <>
          {actionsAvailable?.includes?.(GROUP_ACTIONS.ADD_USERS) && (
            <AddUsersAction
              filterData={filterUsersNotLinked}
              submit={submitAddUsers}
            />
          )}

          {actionsAvailable?.includes?.(GROUP_ACTIONS.REMOVE_USERS) && (
            <RemoveUsersAction
              filterData={filterUsersLinked}
              submit={submitRemoveUsers}
            />
          )}

          {actionsAvailable?.includes?.(GROUP_ACTIONS.EDIT_ADMINS) && (
            <EditAdminsAction
              admins={adminIds}
              filterData={filterUsersByAdmin}
              submit={submitAdmins}
            />
          )}
        </>
      }
      primaryGroup={
        <Table
          data={groupUsersRows}
          columns={userColumns}
          size="medium"
          isRowsSelectable
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20]}
          getRowId={(row) => String(row.ID)}
          openRowDetailsOnClick
          rowDetailsResourceId={RESOURCE_NAMES.USER}
        />
      }
    />
  )
}

GroupUsersInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupUsersInfoTab.displayName = 'GroupUsersInfoTab'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab view configuration
 * @returns {ReactElement} Group users tab
 */
export const Users = ({ data, config }) => (
  <GroupUsersInfoTab
    id={getGroupId(data)}
    tabProps={{
      ...config,
      actions: config?.actions ?? DEFAULT_USER_ACTIONS,
    }}
  />
)

Users.propTypes = groupTabPropTypes

Users.id = 'user'
Users.title = T.Users

export default GroupUsersInfoTab
