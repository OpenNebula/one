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
import { useGetMarketplaceAppsQuery } from 'client/features/OneApi/marketplaceApp'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import MarketplaceAppColumns from 'client/components/Tables/MarketplaceApps/columns'
import MarketplaceAppRow from 'client/components/Tables/MarketplaceApps/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'apps'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Marketplace Apps table
 */
const MarketplaceAppsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data: marketplaceApps = [],
    isFetching,
    refetch,
  } = useGetMarketplaceAppsQuery()

  // Filter data if there is filter function
  const data =
    props?.filterData && typeof props?.filterData === 'function'
      ? props?.filterData(marketplaceApps)
      : marketplaceApps

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.APP)?.filters,
        columns: MarketplaceAppColumns,
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
      RowComponent={MarketplaceAppRow}
      {...rest}
    />
  )
}

MarketplaceAppsTable.propTypes = { ...EnhancedTable.propTypes }
MarketplaceAppsTable.displayName = 'MarketplaceAppsTable'

export default MarketplaceAppsTable
