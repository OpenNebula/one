import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useDatastore, useDatastoreApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import { DatastoreCard } from 'client/components/Cards'
import Columns from 'client/components/Tables/Datastores/columns'

const DatastoresTable = () => {
  const columns = React.useMemo(() => Columns, [])

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
      MobileComponentRow={DatastoreCard}
    />
  )
}

export default DatastoresTable
