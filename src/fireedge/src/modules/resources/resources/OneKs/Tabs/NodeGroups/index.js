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
import { ReactElement, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, LinearProgress, Stack } from '@mui/material'
import { EmptyContent, List, Table } from '@ComponentsV2Module'
import { T, RESOURCE_NAMES } from '@ConstantsModule'
import { OneKsAPI } from '@FeaturesModule'
import { getVirtualOneKsState, showDataByState, vmsTable } from '@ModelsModule'
import {
  AddNodeGroupAction,
  useAddNodeGroupAction,
} from '@modules/resources/resources/OneKs/Tabs/NodeGroups/Actions'
import { NodeGroupCard } from '@modules/resources/resources/OneKs/Tabs/NodeGroups/NodeGroupCard'
import NodeGroupActions from '@modules/resources/resources/OneKs/Tabs/NodeGroups/rowActions'
import { getStyles } from '@modules/resources/resources/OneKs/Tabs/NodeGroups/styles'

const HIDDEN_VM_COLUMN_IDS = ['ips', 'owner', 'group', 'labels']

/**
 * Renders Node Groups in the same list-and-detail layout as Service Roles.
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab data
 * @returns {ReactElement} Node Groups tab
 */
const NodeGroups = ({ data }) => {
  const cluster = data?.selected ?? {}
  const id = cluster?.ID ?? data?.id
  const { isLoading } = data ?? {}
  const { data: families } = OneKsAPI.useGetOneKsNodegroupFamiliesQuery()
  const tableData = []
    .concat(cluster?.TEMPLATE?.CLUSTER_BODY?.node_groups ?? [])
    .filter(Boolean)
  const state = getVirtualOneKsState(cluster)
  const hasNodeGroups = tableData.length > 0
  const canCreateNodeGroup = showDataByState(state.name)
  const openCreateNodeGroupForm = useAddNodeGroupAction(id, families)
  const [selectedNodeGroupId, setSelectedNodeGroupId] = useState()

  const selectedNodeGroup = useMemo(
    () =>
      tableData.find(
        (nodeGroup) => String(nodeGroup?.id) === String(selectedNodeGroupId)
      ),
    [selectedNodeGroupId, tableData]
  )
  const selectedVmIds = useMemo(
    () => [].concat(selectedNodeGroup?.vms ?? []).map(String),
    [selectedNodeGroup]
  )
  const { data: vms = [], isFetching: isFetchingVms } = vmsTable.useData()
  const selectedVms = useMemo(
    () => vms.filter(({ ID }) => selectedVmIds.includes(String(ID))),
    [selectedVmIds, vms]
  )
  const vmColumns = useMemo(
    () =>
      vmsTable
        .columns()
        .filter(({ id: columnId }) => !HIDDEN_VM_COLUMN_IDS.includes(columnId)),
    []
  )

  const handleSelectNodeGroup = (nodeGroupId) =>
    setSelectedNodeGroupId((selectedId) =>
      String(selectedId) === String(nodeGroupId) ? undefined : nodeGroupId
    )

  if (isLoading) return <LinearProgress />

  if (!hasNodeGroups) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        <EmptyContent
          action={openCreateNodeGroupForm}
          actionProps={{
            dataCy: 'add-node-group',
            isDisabled: !canCreateNodeGroup,
            type: 'secondary',
          }}
          actionTitle={T.CreateNodeGroup}
          size="medium"
          subtitle={
            canCreateNodeGroup
              ? T.NoNodeGroupsDescription
              : T.NoNodeGroupsUntilClusterRunning
          }
          title={T.NoNodeGroups}
        />
      </Box>
    )
  }

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="nodeGroupsContainer">
        <Box className="nodeGroupList">
          <Stack mb={2}>
            <AddNodeGroupAction
              disabled={!canCreateNodeGroup}
              onClick={openCreateNodeGroupForm}
            />
          </Stack>
          <List isRowIndicatorDisabled>
            {tableData.map((nodeGroup, index) => {
              const nodeGroupId = nodeGroup?.id ?? String(index)

              return (
                <NodeGroupCard
                  key={`node-group-${nodeGroupId}`}
                  nodeGroup={nodeGroup}
                  isSelected={
                    String(selectedNodeGroupId) === String(nodeGroupId)
                  }
                  onCheck={() => handleSelectNodeGroup(nodeGroupId)}
                  onClick={() => handleSelectNodeGroup(nodeGroupId)}
                />
              )
            })}
          </List>
        </Box>
        <Box className="nodeGroupVmsTable">
          <Table
            columns={vmColumns}
            data={selectedVms}
            isLoading={isFetchingVms}
            isRowsSelectable={false}
            isEnableSearchBar
            isFullHeight
            size="medium"
            getRowId={(row) => String(row.ID)}
            openRowDetailsOnClick
            rowDetailsResourceId={RESOURCE_NAMES.VM}
            toolbar={<NodeGroupActions id={id} node={selectedNodeGroup} />}
            emptyContentProps={{
              title: T.NoNodeGroupSelected,
              subtitle: T.SelectNodeGroupConcept,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

NodeGroups.displayName = 'NodeGroups'
NodeGroups.id = 'nodegroup'
NodeGroups.title = T.NodeGroups
NodeGroups.propTypes = {
  data: PropTypes.object,
}

export default NodeGroups
