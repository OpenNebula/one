import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useVNetworkTemplate, useVNetworkTemplateApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VNetworkTemplateColumns from 'client/components/Tables/VNetworkTemplates/columns'
import VNetworkTemplateRow from 'client/components/Tables/VNetworkTemplates/row'

const VNetworkTemplatesTable = () => {
  const columns = React.useMemo(() => VNetworkTemplateColumns, [])

  const vNetworkTemplates = useVNetworkTemplate()
  const { getVNetworkTemplates } = useVNetworkTemplateApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getVNetworkTemplates)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (vNetworkTemplates?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vNetworkTemplates}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VNetworkTemplateRow}
    />
  )
}

export default VNetworkTemplatesTable
