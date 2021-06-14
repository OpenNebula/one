import React, { useEffect, useState } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useDatastore, useDatastoreApi } from 'client/features/One'

import { VirtualizedTable } from 'client/components/Tables'
import Columns from 'client/components/Tables/Datastores/columns'

const INITIAL_ELEMENT = 0
const NUMBER_OF_INTERVAL = 20

const DatastoresTable = () => {
  const [{ start, end }, setPage] = useState({
    start: INITIAL_ELEMENT,
    end: -NUMBER_OF_INTERVAL
  })

  const columns = React.useMemo(() => Columns, [])

  const datastores = useDatastore()
  const { getDatastores } = useDatastoreApi()
  const { filterPool } = useAuth()

  const { data, fetchRequest, loading, reloading, error } = useFetch(getDatastores)

  useEffect(() => { fetchRequest({ start, end }) }, [filterPool])

  const fetchMore = () => {
    setPage(prevState => {
      const newStart = prevState.start + NUMBER_OF_INTERVAL
      const newEnd = prevState.end - NUMBER_OF_INTERVAL

      fetchRequest({ start: newStart, end: newEnd })

      return { start: newStart, end: newEnd }
    })
  }

  const canFetchMore = error || data?.datastores?.length < NUMBER_OF_INTERVAL

  return (
    <VirtualizedTable
      columns={columns}
      data={datastores}
      isLoading={loading || reloading}
      canFetchMore={canFetchMore}
      fetchMore={fetchMore}
    />
  )
}

export default DatastoresTable
