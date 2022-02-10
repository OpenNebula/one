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
import { useVRouter, useVRouterApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VRouterColumns from 'client/components/Tables/VRouters/columns'
import VRouterRow from 'client/components/Tables/VRouters/row'

const VRoutersTable = () => {
  const columns = useMemo(() => VRouterColumns, [])

  const vRouters = useVRouter()
  const { getVRouters } = useVRouterApi()

  const { status, fetchRequest, loading, reloading, STATUS } =
    useFetch(getVRouters)
  const { INIT, PENDING } = STATUS

  useEffect(() => {
    fetchRequest()
  }, [])

  if (vRouters?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vRouters}
      isLoading={loading || reloading}
      getRowId={(row) => String(row.ID)}
      RowComponent={VRouterRow}
    />
  )
}

export default VRoutersTable
