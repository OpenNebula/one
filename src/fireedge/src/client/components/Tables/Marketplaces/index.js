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
import PropTypes from 'prop-types'

import { useViews } from 'client/features/Auth'
import { useGetMarketplacesQuery } from 'client/features/OneApi/marketplace'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import MarketplaceColumns from 'client/components/Tables/Marketplaces/columns'
import MarketplaceRow from 'client/components/Tables/Marketplaces/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'marketplaces'

/**
 * @param {object} props - Props
 * @param {function():Array} [props.filter] - Function to filter the data
 * @returns {ReactElement} Marketplaces table
 */
const MarketplacesTable = ({ filter, ...props }) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = useGetMarketplacesQuery,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.MARKETPLACE)?.filters,
        columns: MarketplaceColumns,
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
      RowComponent={MarketplaceRow}
      {...rest}
    />
  )
}

MarketplacesTable.propTypes = {
  filter: PropTypes.func,
  ...EnhancedTable.propTypes,
}
MarketplacesTable.displayName = 'MarketplacesTable'

export default MarketplacesTable
