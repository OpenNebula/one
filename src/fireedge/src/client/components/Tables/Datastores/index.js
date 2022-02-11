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
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import DatastoreColumns from 'client/components/Tables/Datastores/columns'
import DatastoreRow from 'client/components/Tables/Datastores/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'datastores'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Datastores table
 */
const DatastoresTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = useGetDatastoresQuery,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useAuth()
  const { data = [], isFetching, refetch } = useQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.DATASTORE)?.filters,
        columns: DatastoreColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={data}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={DatastoreRow}
      {...rest}
    />
  )
}

DatastoresTable.propTypes = { ...EnhancedTable.propTypes }
DatastoresTable.displayName = 'DatastoresTable'

export default DatastoresTable
