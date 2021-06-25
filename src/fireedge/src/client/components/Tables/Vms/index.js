import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useVm, useVmApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import VmDetail from 'client/components/Tables/Vms/detail'

const INITIAL_ELEMENT = 0
const INTERVAL_ON_FIRST_RENDER = 2_500

const VmsTable = () => {
  const columns = React.useMemo(() => VmColumns, [])

  const vms = useVm()
  const { getVms } = useVmApi()
  const { filterPool } = useAuth()

  const { status, data, fetchRequest, loading, reloading, error } = useFetch(getVms)

  useEffect(() => {
    const requests = {
      INIT: () => fetchRequest({ start: INITIAL_ELEMENT, end: -INTERVAL_ON_FIRST_RENDER }),
      FETCHED: () => {
        const canFetchMore = !error && data?.vms?.length === INTERVAL_ON_FIRST_RENDER

        // fetch the rest of VMs, from 0 to last VM ID fetched
        canFetchMore && fetchRequest({
          start: INITIAL_ELEMENT,
          end: data?.vms[INTERVAL_ON_FIRST_RENDER - 1]?.ID
        })
      }
    }

    requests[status]?.()
  }, [filterPool, status, data])

  return (
    <EnhancedTable
      columns={columns}
      data={vms}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VmRow}
      renderDetail={row => <VmDetail id={row.ID} />}
    />
  )
}

export default VmsTable
