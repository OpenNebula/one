import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useGroup, useGroupApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import GroupColumns from 'client/components/Tables/Groups/columns'
import GroupRow from 'client/components/Tables/Groups/row'

const GroupsTable = () => {
  const columns = React.useMemo(() => GroupColumns, [])

  const groups = useGroup()
  const { getGroups } = useGroupApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getGroups)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (groups?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={groups}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={GroupRow}
    />
  )
}

export default GroupsTable
