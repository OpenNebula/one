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

import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Stack } from '@mui/material'
import { Check as CopiedIcon, Copy as CopyIcon } from 'iconoir-react'
import {
  DetailsCard,
  OwnershipTab,
  PermissionsTab,
  ResourceLink,
  StatusTag,
  Tag,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, T, UNITS } from '@ConstantsModule'
import { ClusterAPI, VmAPI, VnAPI } from '@FeaturesModule'
import { useClipboard } from '@HooksModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  isValidOneKsResourceId,
  prettyBytes,
  timeFromMilliseconds,
} from '@UtilsModule'
import {
  getValidKeys,
  getVirtualOneKsState,
  getVirtualOneKsStateControlPlane,
} from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/OneKs/Tabs/Info/styles'

const formatTime = (time) =>
  +time > 0 ? timeFromMilliseconds(+time).toFormat('ff') : '-'

const getResourceId = (resource) =>
  typeof resource === 'object' ? resource?.id ?? resource?.ID : resource

const getResourceName = (resource) =>
  typeof resource === 'object' ? resource?.name ?? resource?.NAME : undefined

const formatCapacity = (key, value) => {
  if (value === undefined || value === null || value === '') return '-'

  if (key === 'memory' || key === 'disk_size') {
    const numericValue = Number(value)

    return Number.isFinite(numericValue)
      ? prettyBytes(numericValue, UNITS.MB)
      : value
  }

  if (key === 'cpu') return `${value} ${T.CPU}`

  return value
}

const getFormattedCapacityData = (dataObj) =>
  getValidKeys(dataObj)
    .filter((key) => key !== 'vcpu')
    .map((key) => [T[key] || key, formatCapacity(key, dataObj[key])])

const VmLinks = ({ ids = [], vms = [] }) => {
  const vmsById = new Map(vms.map((vm) => [String(vm?.ID), vm?.NAME]))
  const validVms = []
    .concat(ids)
    .filter((vm) => isValidOneKsResourceId(getResourceId(vm)))

  if (!validVms.length) return '-'

  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {validVms.map((vm) => {
        const id = getResourceId(vm)
        const name = vmsById.get(String(id)) ?? getResourceName(vm) ?? '-'

        return (
          <ResourceLink
            key={id}
            resource={RESOURCE_NAMES.VM}
            data={{ ID: id, NAME: name }}
          >
            {`#${id} ${name}`}
          </ResourceLink>
        )
      })}
    </Stack>
  )
}

VmLinks.propTypes = {
  ids: PropTypes.array,
  vms: PropTypes.array,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - OneKs info tab
 */
export const Info = ({ data, config }) => {
  const {
    selected,
    handleChangePermission,
    handleChangeOwnership,
    isActionsDisabled,
    isMutating,
  } = data || {}

  const {
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
  } = config || {}
  const { copy, isCopied } = useClipboard()

  const selectedResources = useMemo(
    () => [].concat(selected).filter(Boolean),
    [selected]
  )

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(selectedResources),
    [selectedResources]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(selectedResources),
    [selectedResources]
  )

  const cluster = selectedResources.length === 1 ? selectedResources[0] : {}
  const { ID, NAME, TEMPLATE = {} } = cluster
  const { CLUSTER_BODY = {} } = TEMPLATE
  const deployment = CLUSTER_BODY?.deployment ?? {}
  const [controlPlane = {}] = [].concat(CLUSTER_BODY?.control_plane ?? [])

  const { color: stateColor, name: stateName } = getVirtualOneKsState(cluster)
  const { color: cpStateColor, name: cpStateName } =
    getVirtualOneKsStateControlPlane(cluster)

  const publicNetwork =
    getResourceId(deployment?.networks?.public) ??
    getResourceId(CLUSTER_BODY?.public_network)
  const privateNetwork =
    getResourceId(deployment?.networks?.private) ??
    getResourceId(CLUSTER_BODY?.private_network)
  const targetClusterId =
    getResourceId(deployment?.cluster) ??
    getResourceId(CLUSTER_BODY?.cluster) ??
    getResourceId(CLUSTER_BODY?.cluster_id)
  const hasTargetCluster = isValidOneKsResourceId(targetClusterId)
  const hasPublicNetwork = isValidOneKsResourceId(publicNetwork)
  const hasPrivateNetwork = isValidOneKsResourceId(privateNetwork)
  const { data: targetCluster = {} } = ClusterAPI.useGetClusterQuery(
    { id: targetClusterId },
    { skip: !hasTargetCluster }
  )
  const { data: publicVnet = {} } = VnAPI.useGetVNetworkQuery(
    { id: publicNetwork },
    { skip: !hasPublicNetwork }
  )
  const { data: privateVnet = {} } = VnAPI.useGetVNetworkQuery(
    { id: privateNetwork },
    { skip: !hasPrivateNetwork }
  )
  const vms = controlPlane?.vms ?? []
  const vmIds = useMemo(
    () => [].concat(vms).map(getResourceId).filter(isValidOneKsResourceId),
    [vms]
  )
  const vmIdsKey = vmIds.join(',')
  const { data: controlPlaneVms = [] } = VmAPI.useGetVmInfosetQuery(
    { ids: vmIdsKey, extended: 0 },
    { skip: !vmIdsKey }
  )
  const userInputs = controlPlane?.user_inputs_values ?? {}
  const endpoint = controlPlane?.endpoint ? String(controlPlane.endpoint) : ''

  const info = [
    [T.ID, ID],
    [T.Name, NAME],
    CLUSTER_BODY?.description && [T.Description, CLUSTER_BODY.description],
    [
      T.State,
      <StatusTag
        key="oneks-state"
        dataCy="oneks-state"
        statusColor={stateColor}
        statusName={stateName}
      />,
    ],
    [
      T.KubernetesVersion,
      <Tag
        key="oneks-kubernetes-version"
        title={CLUSTER_BODY?.kubernetes_version ?? '-'}
        status="default"
      />,
    ],
    [
      T.Endpoint,
      endpoint ? (
        <Box key="oneks-endpoint" className="oneks-endpoint">
          <Tag
            title={endpoint}
            endIcon={isCopied(endpoint) ? <CopiedIcon /> : <CopyIcon />}
            onClick={() => copy(endpoint)}
            type="button"
          />
        </Box>
      ) : (
        '-'
      ),
    ],
    hasTargetCluster && [
      T.Cluster,
      <ResourceLink
        key="oneks-cluster"
        resource={RESOURCE_NAMES.CLUSTER}
        data={{ ID: targetClusterId, NAME: targetCluster?.NAME ?? '-' }}
      >
        {`#${targetClusterId} ${targetCluster?.NAME ?? '-'}`}
      </ResourceLink>,
    ],
    hasPublicNetwork && [
      T.PublicNetwork,
      <ResourceLink
        key="oneks-public-network"
        resource={RESOURCE_NAMES.VNET}
        data={{ ID: publicNetwork, NAME: publicVnet?.NAME ?? '-' }}
      >
        {`#${publicNetwork} ${publicVnet?.NAME ?? '-'}`}
      </ResourceLink>,
    ],
    hasPrivateNetwork && [
      T.PrivateNetwork,
      <ResourceLink
        key="oneks-private-network"
        resource={RESOURCE_NAMES.VNET}
        data={{ ID: privateNetwork, NAME: privateVnet?.NAME ?? '-' }}
      >
        {`#${privateNetwork} ${privateVnet?.NAME ?? '-'}`}
      </ResourceLink>,
    ],
    [T.CreationTime, formatTime(CLUSTER_BODY?.registration_time)],
  ].filter(Boolean)

  const controlPlaneInfo = [
    [T.Name, controlPlane?.name ?? '-'],
    [
      T.Flavour,
      <Tag
        key="oneks-control-plane-flavour"
        title={controlPlane?.flavour ?? '-'}
        status="default"
      />,
    ],
    [
      T.State,
      <StatusTag
        key="oneks-control-plane-state"
        dataCy="oneks-control-plane-state"
        statusColor={cpStateColor}
        statusName={cpStateName}
      />,
    ],
    [T.VmIds, <VmLinks key="oneks-vms" ids={vms} vms={controlPlaneVms} />],
    ...getFormattedCapacityData(userInputs),
  ]

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="mainContainer">
        <Box className="permsInfoContainer">
          {informationPanel?.enabled && selectedResources.length === 1 && (
            <Box className="detailsContainer">
              <DetailsCard title={T.Information} options={info} />
            </Box>
          )}
          <Box className="permissionsOwnershipContainer">
            {permissionsPanel?.enabled && (
              <PermissionsTab
                title={T.Permissions}
                actions={permissionsPanel?.actions}
                options={{
                  ownerUse: aggregatedPermissions?.OWNER_U,
                  ownerManage: aggregatedPermissions?.OWNER_M,
                  ownerAdmin: aggregatedPermissions?.OWNER_A,
                  groupUse: aggregatedPermissions?.GROUP_U,
                  groupManage: aggregatedPermissions?.GROUP_M,
                  groupAdmin: aggregatedPermissions?.GROUP_A,
                  otherUse: aggregatedPermissions?.OTHER_U,
                  otherManage: aggregatedPermissions?.OTHER_M,
                  otherAdmin: aggregatedPermissions?.OTHER_A,
                }}
                handleEdit={handleChangePermission}
                isDisabled={isActionsDisabled || isMutating}
              />
            )}
            {ownershipPanel?.enabled && (
              <OwnershipTab
                title={T.Ownership}
                actions={ownershipPanel?.actions}
                userId={+aggregatedOwnership?.UID}
                userName={aggregatedOwnership?.UNAME}
                groupId={+aggregatedOwnership?.GID}
                groupName={aggregatedOwnership?.GNAME}
                handleEdit={handleChangeOwnership}
                isDisabled={isActionsDisabled || isMutating}
              />
            )}
          </Box>
        </Box>
      </Box>
      {informationPanel?.enabled && selectedResources.length === 1 && (
        <Box className="controlPlaneContainer">
          <DetailsCard title={T.ControlPlane} options={controlPlaneInfo} />
        </Box>
      )}
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info

export default Info
