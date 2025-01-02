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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import { Tr } from '@modules/components/HOC'
import {
  LinearProgressWithLabel,
  StatusCircle,
} from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import MarketplaceColumns from '@modules/components/Tables/Marketplaces/columns'
import MarketplaceRow from '@modules/components/Tables/Marketplaces/row'
import { MARKET_THRESHOLD, RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, MarketplaceAPI } from '@FeaturesModule'
import { getMarketplaceCapacityInfo, getMarketplaceState } from '@ModelsModule'

const DEFAULT_DATA_CY = 'marketplaces'

/**
 * @param {object} props - Props
 * @param {function():Array} [props.filter] - Function to filter the data
 * @returns {ReactElement} Marketplaces table
 */
const MarketplacesTable = ({ filter, ...props }) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = MarketplaceAPI.useGetMarketplacesQuery,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.MARKETPLACE)?.filters,
        columns: MarketplaceColumns,
      }),
    [view]
  )

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const { color: stateColor, name: stateName } = getMarketplaceState(vm)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Capacity,
      id: 'capacity',
      accessor: (template) => {
        const capacity = useMemo(
          () => getMarketplaceCapacityInfo(template),
          [template]
        )
        const { percentOfUsed, percentLabel } = capacity

        return (
          <LinearProgressWithLabel
            value={percentOfUsed}
            label={percentLabel}
            high={MARKET_THRESHOLD.CAPACITY.high}
            low={MARKET_THRESHOLD.CAPACITY.low}
            title={Tr(T.UsedOfTotal)}
          />
        )
      },
    },
    {
      header: T.Apps,
      id: 'apps',
      accessor: ({ MARKETPLACEAPPS }) =>
        useMemo(
          () => [MARKETPLACEAPPS?.ID ?? []].flat().length || 0,
          [MARKETPLACEAPPS?.ID]
        ),
    },
    { header: T.Zone, id: 'zone', accessor: 'ZONE_ID' },
  ]

  const { component, header } = WrapperRow(MarketplaceRow)

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

MarketplacesTable.propTypes = {
  filter: PropTypes.func,
  ...EnhancedTable.propTypes,
}
MarketplacesTable.displayName = 'MarketplacesTable'

export default MarketplacesTable
