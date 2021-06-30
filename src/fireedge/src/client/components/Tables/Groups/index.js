import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useGroup, useGroupApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import GroupColumns from 'client/components/Tables/Groups/columns'
import GroupRow from 'client/components/Tables/Groups/row'

const GroupsTable = () => {
  const columns = React.useMemo(() => GroupColumns, [])

  const groups = useGroup()
  const { getGroups } = useGroupApi()

  const { fetchRequest, loading, reloading } = useFetch(getGroups)

  useEffect(() => { fetchRequest() }, [])

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
