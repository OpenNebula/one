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
import { useGetZonesQuery } from 'client/features/OneApi/zone'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import ZoneColumns from 'client/components/Tables/Zones/columns'
import ZoneRow from 'client/components/Tables/Zones/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'zones'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Zones table
 */
const ZonesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetZonesQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.ZONE)?.filters,
        columns: ZoneColumns,
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
      RowComponent={ZoneRow}
      {...rest}
    />
  )
}

ZonesTable.propTypes = { ...EnhancedTable.propTypes }
ZonesTable.displayName = 'ZonesTable'

export default ZonesTable
