import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useDatastore, useDatastoreApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import DatastoreColumns from 'client/components/Tables/Datastores/columns'
import DatastoreRow from 'client/components/Tables/Datastores/row'

const DatastoresTable = () => {
  const columns = React.useMemo(() => DatastoreColumns, [])

  const datastores = useDatastore()
  const { getDatastores } = useDatastoreApi()
  const { filterPool } = useAuth()

  const { fetchRequest, loading, reloading } = useFetch(getDatastores)

  useEffect(() => { fetchRequest() }, [filterPool])

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
