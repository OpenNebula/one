import React, { useEffect, useState, useCallback } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useVm, useVmApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import VmDetail from 'client/components/Tables/Vms/detail'

const INITIAL_ELEMENT = 0
const NUMBER_OF_INTERVAL = 12

const VmsTable = () => {
  const [[start, end], setPage] = useState([INITIAL_ELEMENT, -NUMBER_OF_INTERVAL])

  const columns = React.useMemo(() => VmColumns, [])

  const vms = useVm()
  const { getVms } = useVmApi()
  const { filterPool } = useAuth()

  const { data, fetchRequest, loading, reloading, error } = useFetch(getVms)

  useEffect(() => { fetchRequest({ start, end }) }, [filterPool])

  const fetchMore = useCallback(() => {
    setPage(([prevStart, prevEnd]) => {
      const newStart = prevStart + NUMBER_OF_INTERVAL
      const newEnd = prevEnd - NUMBER_OF_INTERVAL

      fetchRequest({ start: newStart, end: newEnd })

      return [newStart, newEnd]
    })
  }, [start, end])

  const canFetchMore = !error && data?.vms?.length % NUMBER_OF_INTERVAL === 0

  return (
    <EnhancedTable
      columns={columns}
      data={vms}
      pageSize={NUMBER_OF_INTERVAL / 2}
      isLoading={loading || reloading}
      showPageCount={false}
      getRowId={row => String(row.ID)}
      RowComponent={VmRow}
      renderDetail={row => <VmDetail id={row.ID} />}
      canFetchMore={canFetchMore}
      fetchMore={fetchMore}
    />
  )
}

export default VmsTable
