/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo, useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useUser, useUserApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import UserColumns from 'client/components/Tables/Users/columns'
import UserRow from 'client/components/Tables/Users/row'

const UsersTable = () => {
  const columns = useMemo(() => UserColumns, [])

  const users = useUser()
  const { getUsers } = useUserApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getUsers)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (users?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

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
