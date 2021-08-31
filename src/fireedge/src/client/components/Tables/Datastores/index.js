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
import { useEffect, useMemo } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useDatastore, useDatastoreApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import DatastoreColumns from 'client/components/Tables/Datastores/columns'
import DatastoreRow from 'client/components/Tables/Datastores/row'

const DatastoresTable = () => {
  const columns = useMemo(() => DatastoreColumns, [])

  const datastores = useDatastore()
  const { getDatastores } = useDatastoreApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getDatastores)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (datastores?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={datastores}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={DatastoreRow}
    />
  )
}

export default DatastoresTable
