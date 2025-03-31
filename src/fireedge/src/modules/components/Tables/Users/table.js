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
import { ReactElement, useMemo } from 'react'

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { UserAPI, useViews } from '@FeaturesModule'
import { getUserQuotaUsage } from '@ModelsModule'
import { LinearProgressWithTooltip } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import UserColumns from '@modules/components/Tables/Users/columns'
import UserRow from '@modules/components/Tables/Users/row'

const DEFAULT_DATA_CY = 'users'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Users table
 */
const UsersTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data: users = [], isFetching, refetch } = UserAPI.useGetUsersQuery()

  // Filter data if there is filter function
  const data =
    props?.filterData && typeof props?.filterData === 'function'
      ? props?.filterData(users)
      : users

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.USER)?.filters,
        columns: UserColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Enabled,
      id: 'enabled',
      accessor: ({ ENABLED }) => (+ENABLED ? T.Yes : T.No),
    },
    { header: T.AuthDriver, id: 'auth-driver', accessor: 'AUTH_DRIVER' },
    {
      header: T.VMs,
      id: 'vms',
      accessor: ({ VM_QUOTA }) => {
        const vmQuotaUsage = useMemo(
          () => getUserQuotaUsage('VM', VM_QUOTA),
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
          () => getUserQuotaUsage('DATASTORE', DATASTORE_QUOTA),
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
          () => getUserQuotaUsage('NETWORK', NETWORK_QUOTA),
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
          () => getUserQuotaUsage('IMAGE', IMAGE_QUOTA),
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
  const { component, header } = WrapperRow(UserRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

UsersTable.propTypes = { ...EnhancedTable.propTypes }
UsersTable.displayName = 'UsersTable'

export default UsersTable
