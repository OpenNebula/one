import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useCluster, useClusterApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import ClusterColumns from 'client/components/Tables/Clusters/columns'
import ClusterRow from 'client/components/Tables/Clusters/row'

const ClustersTable = () => {
  const columns = React.useMemo(() => ClusterColumns, [])

  const clusters = useCluster()
  const { getClusters } = useClusterApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getClusters)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (clusters?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

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
