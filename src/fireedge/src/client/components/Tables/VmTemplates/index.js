import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useVmTemplate, useVmTemplateApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VmTemplateColumns from 'client/components/Tables/VmTemplates/columns'
import VmTemplateRow from 'client/components/Tables/VmTemplates/row'
import VmTemplateDetail from 'client/components/Tables/VmTemplates/detail'

const VmTemplatesTable = () => {
  const columns = React.useMemo(() => VmTemplateColumns, [])

  const vmTemplates = useVmTemplate()
  const { getVmTemplates } = useVmTemplateApi()

  const { status, fetchRequest, loading, reloading } = useFetch(getVmTemplates)

  useEffect(() => { fetchRequest() }, [])

  if (vmTemplates?.length === 0 && ['INIT', 'PENDING'].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vmTemplates}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VmTemplateRow}
      renderDetail={row => <VmTemplateDetail id={row.ID} />}
    />
  )
}

export default VmTemplatesTable
