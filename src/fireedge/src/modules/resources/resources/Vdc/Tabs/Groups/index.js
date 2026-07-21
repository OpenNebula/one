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

import { GroupAPI, VdcAPI } from '@FeaturesModule'
import { getGroupQuotaUsage } from '@ModelsModule'
import { LoadingDisplay } from '@modules/resources/LoadingState'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { ProgressBar, Table, UserGroupsTab } from '@ComponentsV2Module'

import {
  getVdcId,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

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

const getQuotaColumn = (id, header, type, quotaField, usageField) => ({
  accessorKey: id,
  header,
  cell: ({ row }) => {
    const { percentOfUsed = 0, percentLabel = '-' } =
      getGroupQuotaUsage(type, row.original?.[quotaField] ?? {})?.[
        usageField
      ] ?? {}

    return (
      <ProgressBar value={percentOfUsed} label={percentLabel} isLabelVisible />
    )
  },
})

const groupColumns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  { accessorKey: 'TOTAL_USERS_LABEL', header: T.Users },
  getQuotaColumn('VM_QUOTA_LABEL', T.VMs, 'VM', 'VM_QUOTA', 'vms'),
  getQuotaColumn(
    'DATASTORE_QUOTA_LABEL',
    T.Datastores,
    'DATASTORE',
    'DATASTORE_QUOTA',
    'size'
  ),
  getQuotaColumn(
    'NETWORK_QUOTA_LABEL',
    T.Networks,
    'NETWORK',
    'NETWORK_QUOTA',
    'leases'
  ),
  getQuotaColumn(
    'IMAGE_QUOTA_LABEL',
    T.ImageRVMS,
    'IMAGE',
    'IMAGE_QUOTA',
    'rvms'
  ),
]

/**
 * Renders the VDC groups tab.
 *
 * @param {object} root0 - Props
 * @param {string} root0.id - VDC id
 * @returns {ReactElement} VDC groups tab
 */
const GroupsInfoTab = ({ id: vdcId }) => {
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isFetching: isFetchingGroups,
  } = GroupAPI.useGetGroupsQuery()
  const {
    data: vdc,
    isLoading: isLoadingVdc,
    isFetching: isFetchingVdc,
    isError,
    error,
  } = VdcAPI.useGetVDCQuery({ id: vdcId })

  const vdcGroupIds = useMemo(
    () =>
      []
        .concat(vdc?.GROUPS?.ID ?? [])
        .filter((id) => id !== undefined && id !== null),
    [vdc?.GROUPS?.ID]
  )

  const groupRows = useMemo(
    () =>
      groups
        .filter((group) => hasGroupId(vdcGroupIds, group?.ID))
        .map(getGroupTableRow),
    [groups, vdcGroupIds]
  )

  const isLoading =
    isLoadingGroups || isFetchingGroups || isLoadingVdc || isFetchingVdc

  if (isLoading || !vdc) {
    return (
      <LoadingDisplay
        isLoading={isLoading}
        isEmpty={!vdc}
        error={isError ? error?.data : undefined}
      />
    )
  }

  return (
    <UserGroupsTab
      primaryTitle={null}
      primaryGroup={
        <Table
          dataCy="vdc-groups"
          data={groupRows}
          columns={groupColumns}
          size="medium"
          isRowsSelectable={false}
          isDisablePagination={groupRows.length <= 5}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 25]}
          getRowId={(row) => String(row.ID)}
          openRowDetailsOnClick
          rowDetailsResourceId={RESOURCE_NAMES.GROUP}
        />
      }
    />
  )
}

GroupsInfoTab.propTypes = {
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {ReactElement} VDC groups tab
 */
export const Groups = ({ data }) => <GroupsInfoTab id={getVdcId(data)} />

Groups.propTypes = vdcTabPropTypes

Groups.id = 'groups'
Groups.title = T.Groups

export default GroupsInfoTab
