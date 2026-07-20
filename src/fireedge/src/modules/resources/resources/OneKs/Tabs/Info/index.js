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
import {
  DetailsCard,
  OwnershipTab,
  PermissionsTab,
  ResourceLink,
  StatusTag,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  isValidOneKsResourceId,
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

const getFormattedData = (dataObj) =>
  getValidKeys(dataObj).map((key) => [T[key] || key, dataObj[key] ?? '-'])

const VmLinks = ({ ids = [] }) => {
  const validIds = ids.filter(isValidOneKsResourceId)

  if (!validIds.length) return '-'

  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {validIds.map((id) => (
        <ResourceLink key={id} resource={RESOURCE_NAMES.VM} data={id}>
          {id}
        </ResourceLink>
      ))}
    </Stack>
  )
}

VmLinks.propTypes = {
  ids: PropTypes.array,
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

  const aSelected = [].concat(selected).filter(Boolean)

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(aSelected),
    [aSelected]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(aSelected),
    [aSelected]
  )

  const cluster = aSelected.length === 1 ? aSelected[0] : {}
  const { ID, NAME, TEMPLATE = {} } = cluster
  const { CLUSTER_BODY = {} } = TEMPLATE
  const controlPlane = CLUSTER_BODY?.control_plane ?? {}

  const { color: stateColor, name: stateName } = useMemo(
    () => getVirtualOneKsState(cluster),
    [cluster]
  )

  const { color: cpStateColor, name: cpStateName } = useMemo(
    () => getVirtualOneKsStateControlPlane(cluster),
    [cluster]
  )

  const publicNetwork = CLUSTER_BODY?.public_network ?? ''
  const privateNetwork = CLUSTER_BODY?.private_network ?? ''
  const vms = controlPlane?.vms ?? []
  const userInputs = controlPlane?.user_inputs_values ?? {}

  const info = [
    [T.ID, ID],
    [T.Name, NAME],
    [
      T.State,
      <StatusTag
        key="oneks-state"
        dataCy="oneks-state"
        statusColor={stateColor}
        statusName={stateName}
      />,
    ],
    [T.KubernetesVersion, CLUSTER_BODY?.kubernetes_version ?? '-'],
    [T.CreationTime, formatTime(CLUSTER_BODY?.registration_time)],
    [T.Flavour, controlPlane?.flavour ?? '-'],
    isValidOneKsResourceId(publicNetwork) && [
      T.PublicNetwork,
      <ResourceLink
        key="oneks-public-network"
        resource={RESOURCE_NAMES.VNET}
        data={publicNetwork}
      >
        {publicNetwork}
      </ResourceLink>,
    ],
    isValidOneKsResourceId(privateNetwork) && [
      T.PrivateNetwork,
      <ResourceLink
        key="oneks-private-network"
        resource={RESOURCE_NAMES.VNET}
        data={privateNetwork}
      >
        {privateNetwork}
      </ResourceLink>,
    ],
  ].filter(Boolean)

  const controlPlaneInfo = [
    [
      T.State,
      <StatusTag
        key="oneks-control-plane-state"
        dataCy="oneks-control-plane-state"
        statusColor={cpStateColor}
        statusName={cpStateName}
      />,
    ],
    [T.Endpoint, controlPlane?.endpoint ?? '-'],
    [T.VirtualMachines, <VmLinks key="oneks-vms" ids={vms} />],
    ...getFormattedData(userInputs),
  ]

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="mainContainer">
        <Box className="permsInfoContainer">
          {informationPanel?.enabled && aSelected.length === 1 && (
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
      {informationPanel?.enabled && aSelected.length === 1 && (
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
