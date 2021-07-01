import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useVNetwork, useVNetworkApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VNetworkColumns from 'client/components/Tables/VNetworks/columns'
import VNetworkRow from 'client/components/Tables/VNetworks/row'

const VNetworksTable = () => {
  const columns = React.useMemo(() => VNetworkColumns, [])

  const vNetworks = useVNetwork()
  const { getVNetworks } = useVNetworkApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getVNetworks)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (vNetworks?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vNetworks}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VNetworkRow}
    />
  )
}

export default VNetworksTable
