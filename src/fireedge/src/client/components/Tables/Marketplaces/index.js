import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useMarketplace, useMarketplaceApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import MarketplaceColumns from 'client/components/Tables/Marketplaces/columns'
import MarketplaceRow from 'client/components/Tables/Marketplaces/row'

const MarketplacesTable = () => {
  const columns = React.useMemo(() => MarketplaceColumns, [])

  const marketplaces = useMarketplace()
  const { getMarketplaces } = useMarketplaceApi()
  const { filterPool } = useAuth()

  const { fetchRequest, loading, reloading } = useFetch(getMarketplaces)

  useEffect(() => { fetchRequest() }, [filterPool])

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
