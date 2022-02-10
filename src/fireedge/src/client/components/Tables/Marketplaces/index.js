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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useMarketplace, useMarketplaceApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import { createColumns } from 'client/components/Tables/Enhanced/Utils'
import MarketplaceColumns from 'client/components/Tables/Marketplaces/columns'
import MarketplaceRow from 'client/components/Tables/Marketplaces/row'

const MarketplacesTable = ({ filter, ...props }) => {
  const { view, getResourceView, filterPool } = useAuth()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView('MARKETPLACE')?.filters,
        columns: MarketplaceColumns,
      }),
    [view]
  )

  const marketplaces = useMarketplace()
  const { getMarketplaces } = useMarketplaceApi()

  const { status, fetchRequest, loading, reloading, STATUS } =
    useFetch(getMarketplaces)
  const { INIT, PENDING } = STATUS

  useEffect(() => {
    fetchRequest()
  }, [filterPool])

  if (marketplaces?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={
        typeof filter === 'function'
          ? marketplaces?.filter(filter)
          : marketplaces
      }
      isLoading={loading || reloading}
      getRowId={(row) => String(row.ID)}
      RowComponent={MarketplaceRow}
      {...props}
    />
  )
}

MarketplacesTable.propTypes = {
  filter: PropTypes.func,
  ...EnhancedTable.propTypes,
}

MarketplacesTable.displayName = 'MarketplacesTable'

export default MarketplacesTable
