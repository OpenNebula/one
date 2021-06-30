import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useMarketplace, useMarketplaceApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import MarketplaceColumns from 'client/components/Tables/Marketplaces/columns'
import MarketplaceRow from 'client/components/Tables/Marketplaces/row'

const MarketplacesTable = () => {
  const columns = React.useMemo(() => MarketplaceColumns, [])

  const marketplaces = useMarketplace()
  const { getMarketplaces } = useMarketplaceApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getMarketplaces)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (marketplaces?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={marketplaces}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={MarketplaceRow}
    />
  )
}

export default MarketplacesTable
