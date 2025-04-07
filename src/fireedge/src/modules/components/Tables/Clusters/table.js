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
import { ReactElement, useMemo } from 'react'

import ClusterColumns from '@modules/components/Tables/Clusters/columns'
import ClusterRow from '@modules/components/Tables/Clusters/row'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, ClusterAPI } from '@FeaturesModule'

const DEFAULT_DATA_CY = 'clusters'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Clusters table
 */
const ClustersTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = ClusterAPI.useGetClustersQuery,
    datastoreId,
    vdcClusters,
    zoneId,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = useQuery(
    { zone: zoneId },
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter((cluster) => {
          if (datastoreId) {
            return cluster?.DATASTORES?.ID?.includes(datastoreId)
          } else if (vdcClusters) {
            return vdcClusters.includes(cluster.ID)
          }

          return true
        }),
      }),
    }
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.CLUSTER)?.filters,
        columns: ClusterColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Hosts,
      id: 'hosts',
      accessor: ({ HOSTS }) => (Array.isArray(HOSTS.ID) ? HOSTS.ID.length : 1),
    },
    {
      header: T.Vnets,
      id: 'vnets',
      accessor: ({ VNETS }) => (Array.isArray(VNETS.ID) ? VNETS.ID.length : 1),
    },
    {
      header: T.Datastore,
      id: 'datastores',
      accessor: ({ DATASTORES }) =>
        Array.isArray(DATASTORES.ID) ? DATASTORES.ID.length : 1,
    },
  ]

  const { component, header } = WrapperRow(ClusterRow)

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
      resourceType={RESOURCE_NAMES.CLUSTER}
      {...rest}
    />
  )
}

ClustersTable.propTypes = { ...EnhancedTable.propTypes }
ClustersTable.displayName = 'ClustersTable'

export default ClustersTable
