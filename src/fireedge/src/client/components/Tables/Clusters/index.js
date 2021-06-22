import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useCluster, useClusterApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import ClusterColumns from 'client/components/Tables/Clusters/columns'
import ClusterRow from 'client/components/Tables/Clusters/row'

const ClustersTable = () => {
  const columns = React.useMemo(() => ClusterColumns, [])

  const clusters = useCluster()
  const { getClusters } = useClusterApi()
  const { filterPool } = useAuth()

  const { fetchRequest, loading, reloading } = useFetch(getClusters)

  useEffect(() => { fetchRequest() }, [filterPool])

  return (
    <EnhancedTable
      columns={columns}
      data={clusters}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={ClusterRow}
    />
  )
}

export default ClustersTable
