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
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { MarketplaceAppAPI, useAuth, useViews } from '@FeaturesModule'
import {
  getColorFromString,
  getMarketplaceAppState,
  getMarketplaceAppType,
} from '@ModelsModule'
import MultipleTags from '@modules/components/MultipleTags'
import { StatusCircle } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import MarketplaceAppColumns from '@modules/components/Tables/MarketplaceApps/columns'
import MarketplaceAppRow from '@modules/components/Tables/MarketplaceApps/row'
import { getResourceLabels, prettyBytes } from '@UtilsModule'
import { ReactElement, useMemo } from 'react'

const DEFAULT_DATA_CY = 'apps'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Marketplace Apps table
 */
const MarketplaceAppsTable = (props) => {
  const { labels = {} } = useAuth()
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data: marketplaceApps = [],
    isFetching,
    refetch,
  } = MarketplaceAppAPI.useGetMarketplaceAppsQuery()

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

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(labels, row?.ID, RESOURCE_NAMES.APP, true),
        },
      })),
    [data, labels]
  )

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const { color: stateColor, name: stateName } =
          getMarketplaceAppState(vm)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Size,
      id: 'Size',
      accessor: ({ SIZE }) => prettyBytes(+SIZE, 'MB'),
    },
    {
      header: T.Type,
      id: 'type',
      accessor: (template) =>
        useMemo(() => getMarketplaceAppType(template), [template?.TYPE]),
    },
    {
      header: T.Marketplace,
      id: 'marketplace',
      accessor: 'MARKETPLACE',
    },
    { header: T.Zone, id: 'zone', accessor: 'ZONE_ID' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Hypervisor,
      id: 'hypervisor',
      accessor: ({ TEMPLATE: { HYPERVISOR = '' } }) => HYPERVISOR,
    },
    {
      header: T.Architecture,
      id: 'architecture',
      accessor: ({ TEMPLATE: { ARCHITECTURE = '' } }) => ARCHITECTURE,
    },
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ TEMPLATE: { LABELS = [] } }) => {
        const fmtLabels = LABELS?.map((label) => ({
          text: label,
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
        }))

        return <MultipleTags tags={fmtLabels} truncateText={10} />
      },
    },
  ]

  const { component, header } = WrapperRow(MarketplaceAppRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.APP}
      {...rest}
    />
  )
}

MarketplaceAppsTable.propTypes = { ...EnhancedTable.propTypes }
MarketplaceAppsTable.displayName = 'MarketplaceAppsTable'

export default MarketplaceAppsTable
