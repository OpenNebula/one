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

import { useViews } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'vms'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Machines table
 */
const VmsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    initialState = {},
    ...rest
  } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`
  initialState.filters = useMemo(
    () => initialState.filters ?? [],
    [initialState.filters]
  )

  const { view, getResourceView } = useViews()
  const { data, refetch, isFetching } = useGetVmsQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: result?.data?.filter(({ STATE }) => STATE !== '6') ?? [],
    }),
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM)?.filters,
        columns: VmColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={VmRow}
      initialState={initialState}
      {...rest}
    />
  )
}

VmsTable.displayName = 'VmsTable'

export default VmsTable
