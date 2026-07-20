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
import { getGroupQuotaUsage } from '@ModelsModule'

import { AddToGroup, ChangePrimaryGroup, RemoveFromGroup } from './Action'

import { RESOURCE_NAMES, T, USER_ACTIONS } from '@ConstantsModule'
import { LoadingDisplay } from '@modules/resources/LoadingState'
import { UserGroupsTab, Table } from '@ComponentsV2Module'
import {
  getUserId,
  userTabPropTypes,
} from '@modules/resources/resources/User/Tabs/common'

const isSameId = (firstId, secondId) => String(firstId) === String(secondId)

const hasGroupId = (groupIds = [], groupId) =>
  groupIds.some((id) => isSameId(id, groupId))

const getTotalUsers = ({ TOTAL_USERS, USERS } = {}) => {
  if (TOTAL_USERS !== undefined) return TOTAL_USERS

  return []
    .concat(USERS?.ID ?? [])
    .filter((id) => id !== undefined && id !== null).length
}

const getGroupTableRow = (group = {}) => {
  const vmQuotaUsage = getGroupQuotaUsage('VM', group?.VM_QUOTA)
  const datastoreQuotaUsage = getGroupQuotaUsage(
    'DATASTORE',
    group?.DATASTORE_QUOTA
  )
  const networkQuotaUsage = getGroupQuotaUsage('NETWORK', group?.NETWORK_QUOTA)
  const imageQuotaUsage = getGroupQuotaUsage('IMAGE', group?.IMAGE_QUOTA)

  return {
    ...group,
    TOTAL_USERS_LABEL: getTotalUsers(group),
    VM_QUOTA_LABEL: vmQuotaUsage?.vms?.percentLabel ?? '-',
    DATASTORE_QUOTA_LABEL: datastoreQuotaUsage?.size?.percentLabel ?? '-',
    NETWORK_QUOTA_LABEL: networkQuotaUsage?.leases?.percentLabel ?? '-',
    IMAGE_QUOTA_LABEL: imageQuotaUsage?.rvms?.percentLabel ?? '-',
  }
}

const DEFAULT_GROUP_ACTIONS = {
  chgrp: true,
  add_to_group: true,
  remove_from_group: true,
  change_primary_group: true,
}

const groupColumns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  { accessorKey: 'TOTAL_USERS_LABEL', header: T.Users, grow: false },
  { accessorKey: 'VM_QUOTA_LABEL', header: T.VMs, grow: false },
  { accessorKey: 'DATASTORE_QUOTA_LABEL', header: T.Datastores, grow: false },
  { accessorKey: 'NETWORK_QUOTA_LABEL', header: T.Networks, grow: false },
  { accessorKey: 'IMAGE_QUOTA_LABEL', header: T.ImageRVMS, grow: false },
]

/**
 * Renders the user groups tab.
 *
 * @param {object} root0 - Props
 * @param {object} root0.tabProps - Tab properties
 * @param {object} root0.tabProps.actions - Actions for tab
 * @param {string} root0.id - User id
 * @returns {ReactElement} Information tab
 */
const GroupsInfoTab = ({ tabProps: { actions } = {}, id: userId }) => {
  const { enqueueSuccess } = useGeneralApi()
  const {
    data: groups = [],
    refetch,
    isLoading: isLoadingGroups,
    isFetching: isFetchingGroups,
  } = GroupAPI.useGetGroupsQuery()
  const {
    data: user,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
    isError,
    error,
  } = UserAPI.useGetUserQuery({ id: userId })
  const [addUser] = UserAPI.useAddGroupMutation()
  const [removeUser] = UserAPI.useRemoveFromGroupMutation()
  const [changeGroup] = UserAPI.useChangeGroupMutation()

  const USER_GROUPS = [].concat(user?.GROUPS?.ID ?? [])
  const isLoading =
    isLoadingGroups || isFetchingGroups || isLoadingUser || isFetchingUser

  const actionsAvailable = getActionsAvailable(actions)

  const primaryGroupId = user?.GID ?? USER_GROUPS?.[0]

  const primaryGroup = useMemo(
    () => groups.find((group) => isSameId(group.ID, primaryGroupId)),
    [groups, primaryGroupId]
  )

  const secondaryGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          !isSameId(group?.ID, primaryGroupId) &&
          hasGroupId(USER_GROUPS, group?.ID)
      ),
    [groups, primaryGroupId, USER_GROUPS]
  )

  const primaryGroupRows = useMemo(
    () => (primaryGroup ? [getGroupTableRow(primaryGroup)] : []),
    [primaryGroup]
  )
  const secondaryGroupRows = useMemo(
    () => secondaryGroups.map(getGroupTableRow),
    [secondaryGroups]
  )

  if (isLoading || !user) {
    return (
      <LoadingDisplay
        isLoading={isLoading}
        isEmpty={!user}
        error={isError ? error?.data : undefined}
      />
    )
  }

  if (!primaryGroup) {
    return <LoadingDisplay isEmpty />
  }

  /* Filter groups showing only the ones the user is not linked into */
  const filterGroupsNotLinked = (data) =>
    data.filter((group) => !hasGroupId(USER_GROUPS, group.ID))

  /* Filter groups showing only the ones the user is linked into and it's not its primary group */
  const filterGroupsLinked = (data) => {
    const x = data.filter(
      (group) =>
        hasGroupId(USER_GROUPS, group.ID) && !isSameId(group.ID, primaryGroupId)
    )

    return x
  }

  /* Filter groups showing only the ones the user has not as primary group */
  const filterByNotPrimaryGroup = (data) =>
    data.filter((group) => !isSameId(group.ID, primaryGroupId))

  const submitAddToGroup = async (groupsToAdd) => {
    await Promise.all(
      groupsToAdd.map((groupId) => addUser({ id: userId, group: groupId }))
    )

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  const submitRemoveFromGroup = async (groupsToAdd) => {
    await Promise.all(
      groupsToAdd.map((groupId) => removeUser({ id: userId, group: groupId }))
    )

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  const changePrimaryGroup = async (group) => {
    if (!group) return

    await changeGroup({ id: userId, group: group })

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  return (
    <UserGroupsTab
      actions={
        <>
          {actionsAvailable?.includes?.(USER_ACTIONS.ADD_TO_GROUP) && (
            <AddToGroup
              filterData={filterGroupsNotLinked}
              submit={submitAddToGroup}
            />
          )}

          {actionsAvailable?.includes?.(USER_ACTIONS.REMOVE_FROM_GROUP) && (
            <RemoveFromGroup
              filterData={filterGroupsLinked}
              submit={submitRemoveFromGroup}
            />
          )}

          {actionsAvailable?.includes?.(USER_ACTIONS.CHANGE_PRIMARY_GROUP) && (
            <ChangePrimaryGroup
              filterData={filterByNotPrimaryGroup}
              submit={changePrimaryGroup}
            />
          )}
        </>
      }
      primaryGroup={
        <Table
          data={primaryGroupRows}
          columns={groupColumns}
          dataCy="primary-group"
          size="medium"
          isRowsSelectable
          isDisablePagination
          getRowId={(row) => String(row.ID)}
          openRowDetailsOnClick
          rowDetailsResourceId={RESOURCE_NAMES.GROUP}
        />
      }
      secondaryGroups={[
        {
          id: 'secondary-groups',
          content: (
            <Table
              data={secondaryGroupRows}
              columns={groupColumns}
              dataCy="secondary-group"
              size="medium"
              isRowsSelectable
              isDisablePagination
              getRowId={(row) => String(row.ID)}
              openRowDetailsOnClick
              rowDetailsResourceId={RESOURCE_NAMES.GROUP}
            />
          ),
        },
      ].filter(() => secondaryGroupRows.length > 0)}
    />
  )
}

GroupsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab view configuration
 * @returns {ReactElement} User groups tab
 */
export const Group = ({ data, config }) => (
  <GroupsInfoTab
    id={getUserId(data)}
    tabProps={{
      ...config,
      actions: config?.actions ?? DEFAULT_GROUP_ACTIONS,
    }}
  />
)

Group.propTypes = userTabPropTypes

Group.id = 'group'
Group.title = T.Group

export default GroupsInfoTab
