import React, { useEffect, useState, useCallback } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useVm, useVmApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import { VirtualMachineCard } from 'client/components/Cards'
import Columns from 'client/components/Tables/Vms/columns'

const INITIAL_ELEMENT = 0
const NUMBER_OF_INTERVAL = 6

const VmsTable = () => {
  const [[start, end], setPage] = useState([INITIAL_ELEMENT, -NUMBER_OF_INTERVAL])

  const columns = React.useMemo(() => Columns, [])

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
      canFetchMore={canFetchMore}
      fetchMore={fetchMore}
      MobileComponentRow={VirtualMachineCard}
    />
  )
}

export default VmsTable
