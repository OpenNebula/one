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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, LinearProgress, Stack, Tooltip, Typography } from '@mui/material'
import { OneKsAPI } from '@FeaturesModule'
import {
  RenderNodeMetadata,
  StripHtml,
  VmLinks,
} from '@modules/resources/resources/OneKs/Tabs/NodeGroups/NodeGroupRecord'
import RowAction from '@modules/resources/resources/OneKs/Tabs/NodeGroups/rowActions'
import { AddNodeGroupAction } from '@modules/resources/resources/OneKs/Tabs/NodeGroups/Actions'
import {
  getNodeGroupState,
  getVirtualOneKsState,
  showDataByState,
} from '@ModelsModule'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { StatusTag, AlertNotification, Table } from '@ComponentsV2Module'
import Timer from '@modules/resources/Timer'
import { find, isEmpty } from 'lodash'
import { WarningCircle as WarningIcon } from 'iconoir-react'

const EMPTY_VALUE = '-'

const getFamilyData = (families = [], { family, flavour } = {}) => {
  if (!flavour || !family || isEmpty(families)) return null

  const foundFamily = find(families, { family })

  return foundFamily ? find(foundFamily.flavours, { name: flavour }) : null
}

/**
 * Renders Node Groups tab showing the node groups of the cluster.
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab data
 * @returns {ReactElement} Node Groups tab
 */
const NodeGroups = ({ data }) => {
  const { translate } = useTranslation()
  const id = data?.selected?.ID ?? data?.id
  const { data: cluster = {}, isLoading } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })
  const { data: families } = OneKsAPI.useGetOneKsNodegroupFamiliesQuery()

  const { DOCUMENT } = cluster
  const stateOneKs = getVirtualOneKsState(DOCUMENT)

  const tableData = DOCUMENT?.TEMPLATE?.CLUSTER_BODY?.node_groups || []
  const status = showDataByState(stateOneKs.name)
  const columns = useMemo(
    () => [
      {
        header: T.ID,
        id: 'id',
        accessorFn: (node) => node?.id ?? '',
        grow: false,
        cell: ({ row }) => {
          const nodeId = row?.original?.id

          return nodeId ? `#${nodeId}` : EMPTY_VALUE
        },
      },
      {
        header: T.Name,
        id: 'name',
        accessorFn: (node) => node?.name ?? '',
        truncate: true,
        cell: ({ row }) => {
          const node = row?.original ?? {}

          return (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: '8px',
                minWidth: 0,
              }}
            >
              <Typography noWrap component="span">
                {node?.name || EMPTY_VALUE}
              </Typography>
            </Box>
          )
        },
      },
      {
        header: T.State,
        id: 'state',
        accessorFn: (node) =>
          getNodeGroupState(node?.state)?.name ?? node?.state ?? EMPTY_VALUE,
        cell: ({ row }) => {
          const { color, name } = getNodeGroupState(row.original?.state) ?? {}

          return <StatusTag statusColor={color} statusName={name} />
        },
      },
      {
        header: T.Nodes,
        id: 'nodes',
        accessorFn: (node) => node?.vms?.length ?? 0,
      },
      {
        header: T.VMs,
        id: 'vms',
        accessorFn: (node) => [].concat(node?.vms ?? []).join(', '),
        cell: ({ row }) => <VmLinks ids={row?.original?.vms ?? []} />,
      },
      {
        header: T.Flavour,
        id: 'flavour',
        accessorFn: (node) => node?.flavour ?? '',
        cell: ({ row }) => {
          const node = row?.original ?? {}
          const familyData = getFamilyData(families, node)
          const flavour = node?.flavour

          if (!flavour) return EMPTY_VALUE

          return (
            <Box
              sx={{
                alignItems: 'center',
                display: 'inline-flex',
                gap: '4px',
                minWidth: 0,
              }}
            >
              <span>{flavour}</span>
              {!!familyData?.description && (
                <Tooltip
                  arrow
                  placement="bottom"
                  title={
                    <Typography variant="subtitle2">
                      <StripHtml>{familyData.description}</StripHtml>
                    </Typography>
                  }
                >
                  <Box
                    component="span"
                    sx={{ alignItems: 'center', display: 'inline-flex' }}
                  >
                    <WarningIcon />
                  </Box>
                </Tooltip>
              )}
            </Box>
          )
        },
      },
      {
        header: T.UserInputs,
        id: 'user-inputs',
        accessorFn: (node) =>
          Object.values(node?.user_inputs_values ?? {}).join(' '),
        cell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 8px',
            }}
          >
            <RenderNodeMetadata
              dataObj={row?.original?.user_inputs_values ?? {}}
            />
          </Box>
        ),
      },
      {
        header: T.Created,
        id: 'created',
        accessorFn: (node) => node?.registration_time ?? '',
        grow: false,
        cell: ({ row }) => {
          const createdTime = row?.original?.registration_time

          return createdTime ? <Timer initial={+createdTime} /> : EMPTY_VALUE
        },
      },
      {
        header: '',
        id: 'actions',
        grow: false,
        cell: ({ row }) => <RowAction node={row?.original} id={id} />,
      },
    ],
    [families, id]
  )

  if (isLoading) {
    return <LinearProgress />
  }

  return (
    <div>
      <AddNodeGroupAction id={id} disabled={!status} />
      <Stack gap="1em" py="0.8em" data-cy="node-groups">
        {status ? (
          <Table
            columns={columns}
            data={tableData}
            isEnableFilters
            isEnableSearchBar
            isEnableSort
            isRowsSelectable={false}
            getRowId={(row, index) => `${row?.id ?? index}`}
            isLoading={isLoading}
          />
        ) : (
          <AlertNotification
            type="primary"
            status="information"
            description={translate(
              T['oneks.tab.info.nodegroups.help.paragraph']
            )}
            isDismissible={false}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        )}
      </Stack>
    </div>
  )
}

NodeGroups.displayName = 'NodeGroups'
NodeGroups.id = 'nodegroup'
NodeGroups.title = T.NodeGroups
NodeGroups.propTypes = {
  data: PropTypes.object,
}

export default NodeGroups
