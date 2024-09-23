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
import { Alert } from '@mui/material'
import { Translate } from 'client/components/HOC'
import { StatusCircle } from 'client/components/Status'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import ServiceColumns from 'client/components/Tables/Services/columns'
import ServiceRow from 'client/components/Tables/Services/row'
import Timer from 'client/components/Timer'
import { RESOURCE_NAMES, T } from 'client/constants'
import { useViews } from 'client/features/Auth'
import { useGetServicesQuery } from 'client/features/OneApi/service'
import { timeFromMilliseconds } from 'client/models/Helper'
import { getState } from 'client/models/Service'
import { ReactElement, useMemo } from 'react'

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

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (service) => {
        const { color: stateColor, name: stateName } = getState(service)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.StartTime,
      id: 'start-time',
      accessor: ({ TEMPLATE: { BODY: { start_time: startTime } = {} } }) => {
        const time = useMemo(
          () => timeFromMilliseconds(+startTime),
          [startTime]
        )

        return <Timer translateWord={T.RegisteredAt} initial={time} />
      },
    },
  ]
  const { component, header } = WrapperRow(ServiceRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneFlow} />
          </Alert>
        )
      }
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

ServicesTable.propTypes = { ...EnhancedTable.propTypes }
ServicesTable.displayName = 'ServicesTable'

export default ServicesTable
