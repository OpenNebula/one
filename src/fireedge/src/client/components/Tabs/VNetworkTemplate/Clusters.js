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

import { Box } from '@mui/material'
import { useHistory } from 'react-router'
import { generatePath } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import { useGetClustersQuery } from 'client/features/OneApi/cluster'
import { useGetVNTemplateQuery } from 'client/features/OneApi/networkTemplate'

import { PATH } from 'client/apps/sunstone/routesOne'
import { ClustersTable } from 'client/components/Tables'
import { RESOURCE_NAMES } from 'client/constants'

const { CLUSTER } = RESOURCE_NAMES

/**
 * Renders the list of clusters from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual Network id
 * @returns {ReactElement} Clusters tab
 */
const ClustersTab = ({ id }) => {
  const { push: redirectTo } = useHistory()
  const { data: vnet } = useGetVNTemplateQuery(
    { id },
    { refetchOnMountOrArgChange: true }
  )

  const { view, hasAccessToResource } = useViews()
  const detailAccess = useMemo(() => hasAccessToResource(CLUSTER), [view])

  const clusters = [vnet?.TEMPLATE?.CLUSTER_IDS?.split(',') ?? []]
    .flat()
    .map((clId) => +clId)

  const redirectToCluster = (row) => {
    const clusterPath = PATH.INFRASTRUCTURE.CLUSTERS.DETAIL
    redirectTo(generatePath(clusterPath, { id: row.ID }))
  }

  const useQuery = () =>
    useGetClustersQuery(undefined, {
      selectFromResult: ({ data: result = [], ...rest }) => ({
        data: result?.filter((cluster) => clusters.includes(+cluster.ID)),
        ...rest,
      }),
    })

  return (
    <Box padding={{ sm: '0.8em', overflow: 'auto' }}>
      <ClustersTable
        disableGlobalSort
        disableRowSelect
        pageSize={5}
        onRowClick={detailAccess ? redirectToCluster : undefined}
        useQuery={useQuery}
      />
    </Box>
  )
}

ClustersTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ClustersTab.displayName = 'ClustersTab'

export default ClustersTab
