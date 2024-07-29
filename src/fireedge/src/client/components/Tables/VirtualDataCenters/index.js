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
import { useMemo, ReactElement } from 'react'

import { useViews } from 'client/features/Auth'
import { useGetVDCsQuery } from 'client/features/OneApi/vdc'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VDCColumns from 'client/components/Tables/VirtualDataCenters/columns'
import VDCRow from 'client/components/Tables/VirtualDataCenters/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'vdcs'

/**
 * @param {object} props - Props
 * @returns {ReactElement} VM Templates table
 */
const VDCsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetVDCsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VDC)?.filters,
        columns: VDCColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={VDCRow}
      {...rest}
    />
  )
}

VDCsTable.propTypes = { ...EnhancedTable.propTypes }
VDCsTable.displayName = 'VDCsTable'

export default VDCsTable
