import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useVRouter, useVRouterApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VRouterColumns from 'client/components/Tables/VRouters/columns'
import VRouterRow from 'client/components/Tables/VRouters/row'

const VRoutersTable = () => {
  const columns = React.useMemo(() => VRouterColumns, [])

  const vRouters = useVRouter()
  const { getVRouters } = useVRouterApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getVRouters)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (vRouters?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vRouters}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VRouterRow}
    />
  )
}

export default VRoutersTable
