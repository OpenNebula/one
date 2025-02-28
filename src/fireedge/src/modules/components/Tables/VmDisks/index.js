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
import { useMemo, ReactElement } from 'react'

import { VmAPI } from '@FeaturesModule'

import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import VmDiskColumns from '@modules/components/Tables/VmDisks/columns'
import VmDiskRow from '@modules/components/Tables/VmDisks/row'

const DEFAULT_DATA_CY = 'vmdisks'

/**
 * @param {object} props - Props
 * @returns {ReactElement} VmDisk table
 */
const VmDisksTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    vmId,
    filter,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { data, isFetching, refetch } = VmAPI.useGetVmQuery({ id: vmId })

  const disks =
    typeof filter === 'function' && Array.isArray(data?.TEMPLATE?.DISK)
      ? filter(data?.TEMPLATE?.DISK ?? [])
      : data?.TEMPLATE?.DISK ?? []

  const columns = useMemo(
    () =>
      createColumns({
        filters: VmDiskColumns?.reduce(
          (acc, col) => ({ ...acc, [col?.id]: true }),
          {}
        ),
        columns: VmDiskColumns,
      }),
    [VmDiskColumns]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => (Array.isArray(disks) ? disks : [disks]), [disks])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.DISK_ID)}
      RowComponent={VmDiskRow}
      {...rest}
    />
  )
}

VmDisksTable.propTypes = { ...EnhancedTable.propTypes }
VmDisksTable.displayName = 'VmDisksTable'

export default VmDisksTable
