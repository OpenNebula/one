/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useEffect, useMemo } from 'react'
import { Alert } from '@mui/material'
import { Translate } from '@modules/components/HOC'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import DriverColumns from '@modules/components/Tables/Drivers/columns'
import DriverRow from '@modules/components/Tables/Drivers/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, DriverAPI } from '@FeaturesModule'

const DEFAULT_DATA_CY = 'drivers'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Drivers table
 */
const DriversTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    handleRefetch,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
    error,
  } = DriverAPI.useGetDriversQuery()

  useEffect(() => {
    if (handleRefetch && refetch) {
      handleRefetch(refetch)
    }
  }, [handleRefetch, refetch])

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.DRIVER)?.filters,
        columns: DriverColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.Name, id: 'name', accessor: 'name' },
    { header: T.Description, id: 'description', accessor: 'description' },
    { header: T.State, id: 'state', accessor: 'state' },
  ]

  const { component, header } = WrapperRow(DriverRow)

  return (
    <EnhancedTable
      columns={columns}
      data={data}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.name)}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneForm} />
          </Alert>
        )
      }
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.DRIVER}
      {...rest}
    />
  )
}

DriversTable.propTypes = { ...EnhancedTable.propTypes }
DriversTable.displayName = 'DriversTable'

export default DriversTable
