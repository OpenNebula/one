import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useZone, useZoneApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import ZoneColumns from 'client/components/Tables/Zones/columns'
import ZoneRow from 'client/components/Tables/Zones/row'

const ZonesTable = () => {
  const columns = React.useMemo(() => ZoneColumns, [])

  const zones = useZone()
  const { getZones } = useZoneApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getZones)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (zones?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={zones}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={ZoneRow}
    />
  )
}

export default ZonesTable
