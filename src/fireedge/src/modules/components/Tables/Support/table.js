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
import { ReactElement, useMemo } from 'react'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { useViews, SupportAPI } from '@FeaturesModule'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import SupportColumns from '@modules/components/Tables/Support/columns'
import SupportRow from '@modules/components/Tables/Support/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'

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

  const { data, refetch, isFetching } = SupportAPI.useGetTicketsQuery(
    undefined,
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data ?? [],
      }),
    }
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.SUPPORT)?.filters,
        columns: SupportColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'id' },
    { header: T.Subject, id: 'subject', accessor: 'subject' },
    { header: T.Status, id: 'status', accessor: 'status' },
  ]
  const { component, header } = WrapperRow(SupportRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.id)}
      initialState={initialState}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

SupportTable.displayName = 'SupportTable'

export default SupportTable
