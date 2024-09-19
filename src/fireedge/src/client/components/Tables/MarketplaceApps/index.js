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
import { StatusCircle } from 'client/components/Status'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import MarketplaceAppColumns from 'client/components/Tables/MarketplaceApps/columns'
import MarketplaceAppRow from 'client/components/Tables/MarketplaceApps/row'
import { RESOURCE_NAMES, T } from 'client/constants'
import { useViews } from 'client/features/Auth'
import { useGetMarketplaceAppsQuery } from 'client/features/OneApi/marketplaceApp'
import { getState, getType } from 'client/models/MarketplaceApp'
import { prettyBytes } from 'client/utils'
import { ReactElement, useMemo } from 'react'

const DEFAULT_DATA_CY = 'apps'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Marketplace Apps table
 */
const MarketplaceAppsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data: marketplaceApps = [],
    isFetching,
    refetch,
  } = useGetMarketplaceAppsQuery()

  // Filter data if there is filter function
  const data =
    props?.filterData && typeof props?.filterData === 'function'
      ? props?.filterData(marketplaceApps)
      : marketplaceApps

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.APP)?.filters,
        columns: MarketplaceAppColumns,
      }),
    [view]
  )

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const { color: stateColor, name: stateName } = getState(vm)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Size,
      id: 'Size',
      accessor: ({ SIZE }) => prettyBytes(+SIZE, 'MB'),
    },
    {
      header: T.Type,
      id: 'type',
      accessor: (template) =>
        useMemo(() => getType(template), [template?.TYPE]),
    },
    {
      header: T.Marketplace,
      id: 'marketplace',
      accessor: 'MARKETPLACE',
    },
    { header: T.Zone, id: 'zone', accessor: 'ZONE_ID' },
  ]

  const { component, header } = WrapperRow(MarketplaceAppRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

MarketplaceAppsTable.propTypes = { ...EnhancedTable.propTypes }
MarketplaceAppsTable.displayName = 'MarketplaceAppsTable'

export default MarketplaceAppsTable
