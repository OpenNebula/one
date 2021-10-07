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

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useHost, useHostApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable, EnhancedTableProps } from 'client/components/Tables'
import { createColumns } from 'client/components/Tables/Enhanced/Utils'
import HostColumns from 'client/components/Tables/Hosts/columns'
import HostRow from 'client/components/Tables/Hosts/row'

const HostsTable = props => {
  const { view, getResourceView, filterPool } = useAuth()

  const columns = useMemo(() => createColumns({
    filters: getResourceView('HOST')?.filters,
    columns: HostColumns
  }), [view])

  const hosts = useHost()
  const { getHosts } = useHostApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getHosts)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (hosts?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={hosts}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={HostRow}
      {...props}
    />
  )
}

HostsTable.propTypes = EnhancedTableProps
HostsTable.displayName = 'HostsTable'

export default HostsTable
