import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useUser, useUserApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import UserColumns from 'client/components/Tables/Users/columns'
import UserRow from 'client/components/Tables/Users/row'

const UsersTable = () => {
  const columns = React.useMemo(() => UserColumns, [])

  const users = useUser()
  const { getUsers } = useUserApi()

  const { fetchRequest, loading, reloading } = useFetch(getUsers)

  useEffect(() => { fetchRequest() }, [])

  return (
    <EnhancedTable
      columns={columns}
      data={users}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={UserRow}
    />
  )
}

export default UsersTable
