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
import * as React from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useVm, useVmApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import { createColumns } from 'client/components/Tables/Enhanced/Utils'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import VmDetail from 'client/components/Tables/Vms/detail'

const INITIAL_ELEMENT = 0
const INTERVAL_ON_FIRST_RENDER = 2_000

const VmsTable = () => {
  const vms = useVm()
  const { getVms } = useVmApi()
  const { view, getResourceView, filterPool } = useAuth()

  const columns = React.useMemo(() => createColumns({
    filters: getResourceView('VM')?.filters,
    columns: VmColumns
  }), [view])

  const { status, data, fetchRequest, loading, reloading, error, STATUS } = useFetch(getVms)
  const { INIT, PENDING } = STATUS

  React.useEffect(() => {
    const requests = {
      INIT: () => fetchRequest({
        start: INITIAL_ELEMENT,
        end: -INTERVAL_ON_FIRST_RENDER,
        state: -1 // Any state, except DONE
      }),
      FETCHED: () => {
        const canFetchMore = !error && data?.vms?.length === INTERVAL_ON_FIRST_RENDER

        // fetch the rest of VMs, from 0 to last VM ID fetched
        canFetchMore && fetchRequest({
          start: INITIAL_ELEMENT,
          end: data?.vms[INTERVAL_ON_FIRST_RENDER - 1]?.ID,
          state: -1 // Any state, except DONE
        })
      }
    }

    requests[status]?.()
  }, [filterPool, status, data])

  if (vms?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vms}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VmRow}
      renderDetail={row => <VmDetail id={row.ID} />}
    />
  )
}

export default VmsTable
