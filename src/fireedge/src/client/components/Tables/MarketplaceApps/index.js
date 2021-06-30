import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useMarketplaceApp, useMarketplaceAppApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import MarketplaceAppColumns from 'client/components/Tables/MarketplaceApps/columns'
import MarketplaceAppRow from 'client/components/Tables/MarketplaceApps/row'

const MarketplaceAppsTable = () => {
  const columns = React.useMemo(() => MarketplaceAppColumns, [])

  const marketplaceApps = useMarketplaceApp()
  const { getMarketplaceApps } = useMarketplaceAppApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getMarketplaceApps)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (marketplaceApps?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={marketplaceApps}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={MarketplaceAppRow}
    />
  )
}

export default MarketplaceAppsTable
