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
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { GroupAPI, useViews } from '@FeaturesModule'
import { getGroupQuotaUsage } from '@ModelsModule'
import { LinearProgressWithTooltip } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import GroupColumns from '@modules/components/Tables/Groups/columns'
import GroupRow from '@modules/components/Tables/Groups/row'
import { Component, useMemo } from 'react'

const DEFAULT_DATA_CY = 'groups'

/**
 * `GroupsTable` component displays a table of groups with their respective primary and secondary labels.
 *
 * @param {object} props - Component properties.
 * @param {object} [props.rootProps={}] - Root properties for the table.
 * @param {object} [props.searchProps={}] - Search properties for the table.
 * @param {Array} props.vdcGroups - Array of VDC groups.
 * @param {Array<string|number>} [props.secondaryGroups=[]] - Array of IDs of the secondary groups.
 * @param {object} props.rest - Rest of the properties.
 * @returns {Component} Rendered component.
 */
const GroupsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    vdcGroups,
    singleSelect = false,
    ...rest
  } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data: groups = [],
    isFetching,
    refetch,
  } = GroupAPI.useGetGroupsQuery()

  const data =
    props?.filterData && typeof props?.filterData === 'function'
      ? props?.filterData(groups)
      : groups

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.GROUP)?.filters,
        columns: GroupColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Users,
      id: 'users',
      accessor: ({ USERS }) => (Array.isArray(USERS?.ID) ? USERS.ID.length : 0),
    },
    {
      header: T.VMs,
      id: 'vms',
      accessor: ({ VM_QUOTA }) => {
        const vmQuotaUsage = useMemo(
          () => getGroupQuotaUsage('VM', VM_QUOTA),
          [VM_QUOTA]
        )

        return (
          <LinearProgressWithTooltip
            value={vmQuotaUsage.vms.percentOfUsed}
            label={vmQuotaUsage.vms.percentLabel}
            tooltipTitle={T.VMCount}
            icon=""
          />
        )
      },
    },
    {
      header: T.Datastores,
      id: 'datastores',
      accessor: ({ DATASTORE_QUOTA }) => {
        const datastoreQuotaUsage = useMemo(
          () => getGroupQuotaUsage('DATASTORE', DATASTORE_QUOTA),
          [DATASTORE_QUOTA]
        )

        return (
          <LinearProgressWithTooltip
            value={datastoreQuotaUsage.size.percentOfUsed}
            label={datastoreQuotaUsage.size.percentLabel}
            tooltipTitle={T.DatastoreSize}
            icon=""
          />
        )
      },
    },
    {
      header: T.Networks,
      id: 'networks',
      accessor: ({ NETWORK_QUOTA }) => {
        const networkQuotaUsage = useMemo(
          () => getGroupQuotaUsage('NETWORK', NETWORK_QUOTA),
          [NETWORK_QUOTA]
        )

        return (
          <LinearProgressWithTooltip
            value={networkQuotaUsage.leases.percentOfUsed}
            label={networkQuotaUsage.leases.percentLabel}
            tooltipTitle={T.NetworkLeases}
            icon=""
          />
        )
      },
    },
    {
      header: T.ImageRVMS,
      id: 'images',
      accessor: ({ IMAGE_QUOTA }) => {
        const imageQuotaUsage = useMemo(
          () => getGroupQuotaUsage('IMAGE', IMAGE_QUOTA),
          [IMAGE_QUOTA]
        )

        return (
          <LinearProgressWithTooltip
            value={imageQuotaUsage.rvms.percentOfUsed}
            label={imageQuotaUsage.rvms.percentLabel}
            tooltipTitle={T.ImageRVMS}
            icon=""
          />
        )
      },
    },
  ]
  const { component, header } = WrapperRow(GroupRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      singleSelect={singleSelect}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

GroupsTable.propTypes = { ...EnhancedTable.propTypes }
GroupsTable.displayName = 'GroupsTable'

export default GroupsTable
