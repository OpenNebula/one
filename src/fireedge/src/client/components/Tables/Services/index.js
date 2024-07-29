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
import { Alert } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetServicesQuery } from 'client/features/OneApi/service'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import ServiceColumns from 'client/components/Tables/Services/columns'
import ServiceRow from 'client/components/Tables/Services/row'
import { Translate } from 'client/components/HOC'
import { T, RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'services'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Service table
 */
const ServicesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch, error } = useGetServicesQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.SERVICE)?.filters,
        columns: ServiceColumns,
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
      RowComponent={ServiceRow}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneFlow} />
          </Alert>
        )
      }
      {...rest}
    />
  )
}

ServicesTable.propTypes = { ...EnhancedTable.propTypes }
ServicesTable.displayName = 'ServicesTable'

export default ServicesTable
