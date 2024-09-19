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

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import VDCColumns from 'client/components/Tables/VirtualDataCenters/columns'
import VDCRow from 'client/components/Tables/VirtualDataCenters/row'
import { ALL_SELECTED, RESOURCE_NAMES, T } from 'client/constants'
import { useViews } from 'client/features/Auth'
import { useGetVDCsQuery } from 'client/features/OneApi/vdc'

const DEFAULT_DATA_CY = 'vdcs'

const isAllSelected = (resourceArray) =>
  resourceArray.length === 1 && resourceArray[0] === ALL_SELECTED

/**
 * @param {object} props - Props
 * @returns {ReactElement} VM Templates table
 */
const VDCsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetVDCsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VDC)?.filters,
        columns: VDCColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Groups,
      id: 'group',
      accessor: ({ GROUPS }) =>
        useMemo(() => {
          const { ID: groupsIds = [] } = GROUPS
          const groupsArray = Array.isArray(groupsIds) ? groupsIds : [groupsIds]

          return groupsArray.length
        }, [GROUPS.ID]),
    },
    {
      header: T.Clusters,
      id: 'clusters',
      accessor: ({ CLUSTERS }) =>
        useMemo(() => {
          const { CLUSTER: clustersInfo = [] } = CLUSTERS
          const clustersArray = (
            Array.isArray(clustersInfo) ? clustersInfo : [clustersInfo]
          ).map((cluster) => cluster.CLUSTER_ID)

          return isAllSelected(clustersArray) ? T.All : clustersArray.length
        }, [CLUSTERS.CLUSTER]),
    },
    {
      header: T.Hosts,
      id: 'hosts',
      accessor: ({ HOSTS }) =>
        useMemo(() => {
          const { HOST: hostsInfo = [] } = HOSTS
          const hostsArray = (
            Array.isArray(hostsInfo) ? hostsInfo : [hostsInfo]
          ).map((host) => host.HOST_ID)

          return isAllSelected(hostsArray) ? T.All : hostsArray.length
        }, [HOSTS.HOST]),
    },
    {
      header: T.Vnets,
      id: 'vnets',
      accessor: ({ VNETS }) =>
        useMemo(() => {
          const { VNET: vnetsInfo = [] } = VNETS
          const vnetsArray = (
            Array.isArray(vnetsInfo) ? vnetsInfo : [vnetsInfo]
          ).map((vnet) => vnet.VNET_ID)

          return isAllSelected(vnetsArray) ? T.All : vnetsArray.length
        }, [VNETS.VNET]),
    },
    {
      header: T.Datastores,
      id: 'datastores',
      accessor: ({ DATASTORES }) =>
        useMemo(() => {
          const { DATASTORE: datastoresInfo = [] } = DATASTORES
          const datastoresArray = (
            Array.isArray(datastoresInfo) ? datastoresInfo : [datastoresInfo]
          ).map((ds) => ds.DATASTORE_ID)

          return isAllSelected(datastoresArray) ? T.All : datastoresArray.length
        }, [DATASTORES.DATASTORE]),
    },
  ]
  const { component, header } = WrapperRow(VDCRow)

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

VDCsTable.propTypes = { ...EnhancedTable.propTypes }
VDCsTable.displayName = 'VDCsTable'

export default VDCsTable
