/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

import { useAuth } from 'client/features/Auth'
import { useGetVRoutersQuery } from 'client/features/OneApi/vrouter'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VRouterColumns from 'client/components/Tables/VRouters/columns'
import VRouterRow from 'client/components/Tables/VRouters/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'vrouters'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Routers table
 */
const VRoutersTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useAuth()
  const { data = [], isFetching, refetch } = useGetVRoutersQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.V_ROUTER)?.filters,
        columns: VRouterColumns,
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
      RowComponent={VRouterRow}
      {...rest}
    />
  )
}

VRoutersTable.propTypes = { ...EnhancedTable.propTypes }
VRoutersTable.displayName = 'VRoutersTable'

export default VRoutersTable
