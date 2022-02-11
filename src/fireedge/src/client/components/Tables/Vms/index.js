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
import { useMemo, ReactElement } from 'react'

import { useAuth } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import { RESOURCE_NAMES } from 'client/constants'

// const INITIAL_ELEMENT = 0
// const INTERVAL_ON_FIRST_RENDER = 2_000

// const INITIAL_ARGS = {
// start: INITIAL_ELEMENT,
// end: -INTERVAL_ON_FIRST_RENDER,
// state: -1,
// }

const DEFAULT_DATA_CY = 'vms'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Machines table
 */
const VmsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useAuth()
  // const [args, setArgs] = useState(() => INITIAL_ARGS)
  const { data = [], isFetching, refetch } = useGetVmsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM)?.filters,
        columns: VmColumns,
      }),
    [view]
  )

  /* useEffect(() => {
    const lastVmId = data[INTERVAL_ON_FIRST_RENDER - 1]?.ID
    const end = isSuccess ? lastVmId : -INTERVAL_ON_FIRST_RENDER

    if (isSuccess && data?.length === INTERVAL_ON_FIRST_RENDER) {
      setArgs({ start: INITIAL_ELEMENT, end, state: -1 })
    }
  }, [isSuccess]) */

  return (
    <EnhancedTable
      columns={columns}
      data={data}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={VmRow}
      {...rest}
    />
  )
}

VmsTable.propTypes = { ...EnhancedTable.propTypes }
VmsTable.displayName = 'VmsTable'

export default VmsTable
