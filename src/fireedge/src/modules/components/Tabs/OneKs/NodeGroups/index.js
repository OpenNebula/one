/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack, LinearProgress, Alert } from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import NodeGroupRecordCard from '@modules/components/Tabs/OneKs/NodeGroups/NodeGroupRecord'
import { AddNodeGroupAction } from '@modules/components/Tabs/OneKs/NodeGroups/Actions'
import { getVirtualOneKsState, showDataByState } from '@ModelsModule'
import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

/**
 * Renders Node Groups tab showing the node groups of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Node Groups tab
 */
const NodeGroups = ({ id }) => {
  const { data: cluster = {}, isLoading } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })
  const { data: families } = OneKsAPI.useGetOneKsNodegroupFamiliesQuery()

  const { DOCUMENT } = cluster
  const stateOneKs = getVirtualOneKsState(DOCUMENT)

  const tableData = DOCUMENT?.TEMPLATE?.CLUSTER_BODY?.node_groups || []

  if (isLoading) {
    return <LinearProgress />
  }

  const status = showDataByState(stateOneKs.name)

  return (
    <div>
      <AddNodeGroupAction id={id} disable={status} />
      <Stack gap="1em" py="0.8em" data-cy="node-groups">
        {status ? (
          tableData.map((row, index) => (
            <NodeGroupRecordCard
              node={row}
              id={id}
              key={index}
              families={families}
            />
          ))
        ) : (
          <Alert severity="error" variant="outlined">
            {Tr(T['oneks.tab.info.nodegroups.help.paragraph'])}
          </Alert>
        )}
      </Stack>
    </div>
  )
}

NodeGroups.displayName = 'NodeGroups'
NodeGroups.label = 'NodeGroup'
NodeGroups.propTypes = {
  id: PropTypes.string,
}

export default NodeGroups
