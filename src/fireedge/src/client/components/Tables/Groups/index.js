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
import { LinearProgressWithTooltip } from 'client/components/Status'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import GroupColumns from 'client/components/Tables/Groups/columns'
import GroupRow from 'client/components/Tables/Groups/row'
import { RESOURCE_NAMES, T } from 'client/constants'
import { useViews } from 'client/features/Auth'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { getQuotaUsage } from 'client/models/Group'
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
  const { data = [], isFetching, refetch } = useGetGroupsQuery()

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
          () => getQuotaUsage('VM', VM_QUOTA),
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
          () => getQuotaUsage('DATASTORE', DATASTORE_QUOTA),
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
          () => getQuotaUsage('NETWORK', NETWORK_QUOTA),
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
  ]
  const { component, header } = WrapperRow(GroupRow)

  return (
    <EnhancedTable
      columns={columns}
      data={data}
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
