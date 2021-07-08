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
