/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useGetTicketsQuery } from 'client/features/OneApi/support'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import SupportColumns from 'client/components/Tables/Support/columns'
import SupportRow from 'client/components/Tables/Support/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'support'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Support Tickets Table
 */
const SupportTable = (props) => {
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

  const { data, refetch, isFetching } = useGetTicketsQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: result?.data ?? [],
    }),
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.SUPPORT)?.filters,
        columns: SupportColumns,
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
      getRowId={(row) => String(row.id)}
      RowComponent={SupportRow}
      initialState={initialState}
      {...rest}
    />
  )
}

SupportTable.displayName = 'SupportTable'

export default SupportTable
