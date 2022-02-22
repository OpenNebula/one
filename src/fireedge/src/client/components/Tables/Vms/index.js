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
import { useState, useEffect, useMemo, ReactElement } from 'react'

import { useViews } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import { RESOURCE_NAMES } from 'client/constants'

const INITIAL_ELEMENT = 0
const INTERVAL_ON_FIRST_RENDER = 2_000

const INITIAL_ARGS = {
  start: INITIAL_ELEMENT,
  end: -INTERVAL_ON_FIRST_RENDER,
  state: -1,
}

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
  const [totalData, setTotalData] = useState(() => [])
  const [args, setArgs] = useState(() => INITIAL_ARGS)
  const { data, isSuccess, refetch, isFetching } = useGetVmsQuery(args, {
    refetchOnMountOrArgChange: true,
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM)?.filters,
        columns: VmColumns,
      }),
    [view]
  )

  useEffect(() => {
    if (!isFetching && isSuccess && data?.length >= +INTERVAL_ON_FIRST_RENDER) {
      setArgs((prev) => ({
        ...prev,
        start: prev.start + INTERVAL_ON_FIRST_RENDER,
      }))
    }
  }, [isFetching])

  useEffect(() => {
    isSuccess &&
      data &&
      setTotalData((prev) => {
        const notDuplicatedData = data.filter(
          ({ ID }) => !prev.find((vm) => vm.ID === ID)
        )

        return prev.concat(notDuplicatedData).sort((a, b) => b.ID - a.ID)
      })
  }, [isSuccess])

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(
        () => totalData?.filter(({ STATE }) => STATE !== '6'),
        [totalData]
      )}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={() => {
        totalData?.length >= +INTERVAL_ON_FIRST_RENDER
          ? setArgs(INITIAL_ARGS)
          : refetch()
      }}
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
