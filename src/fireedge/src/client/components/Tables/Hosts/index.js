import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useHost, useHostApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import { HostCard } from 'client/components/Cards'
import Columns from 'client/components/Tables/Hosts/columns'

const HostsTable = () => {
  const columns = React.useMemo(() => Columns, [])

  const hosts = useHost()
  const { getHosts } = useHostApi()
  const { filterPool } = useAuth()

  const { fetchRequest, loading, reloading } = useFetch(getHosts)

  useEffect(() => { fetchRequest() }, [filterPool])

  return (
    <EnhancedTable
      columns={columns}
      data={hosts}
      isLoading={loading || reloading}
      MobileComponentRow={HostCard}
    />
  )
}

export default HostsTable
