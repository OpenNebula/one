/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { useGetClustersQuery } from 'client/features/OneApi/cluster'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import ClusterColumns from 'client/components/Tables/Clusters/columns'
import ClusterRow from 'client/components/Tables/Clusters/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'clusters'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Clusters table
 */
const ClustersTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = useGetClustersQuery,
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

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={ClusterRow}
      {...rest}
    />
  )
}

ClustersTable.propTypes = { ...EnhancedTable.propTypes }
ClustersTable.displayName = 'ClustersTable'

export default ClustersTable
