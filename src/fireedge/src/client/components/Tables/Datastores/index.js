import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useDatastore, useDatastoreApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import DatastoreColumns from 'client/components/Tables/Datastores/columns'
import DatastoreRow from 'client/components/Tables/Datastores/row'

const DatastoresTable = () => {
  const columns = React.useMemo(() => DatastoreColumns, [])

  const datastores = useDatastore()
  const { getDatastores } = useDatastoreApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getDatastores)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (datastores?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={datastores}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={DatastoreRow}
    />
  )
}

export default DatastoresTable
