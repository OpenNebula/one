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

import {
  AttributesPanel,
  DetailsCard,
  OwnershipTab,
  PermissionsTab,
  ProgressBar,
  StatusTag,
  Tag,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { ACTIONS, T, VNET_THRESHOLD } from '@ConstantsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  booleanToString,
  getActionsAvailable,
  stringToBoolean,
} from '@UtilsModule'
import { getLeasesInfo, getVirtualNetworkState } from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/VirtualNetwork/Tabs/Info/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Network info tab
 */
export const Info = ({ data, config }) => {
  const {
    vnet = {},
    selected,
    attributes = [],
    handleChangePermission,
    handleChangeOwnership,
    handleDeleteAttribute,
    handleAddAttribute,
    isLoadingVNet,
    isActionsDisabled,
    isLocked,
  } = data || {}

  // Config
  const {
    attributes_panel: attributesPanel,
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
    qos_panel: qosPanel,
  } = config || {}

  // State
  const selectedVnets = useMemo(
    () => (selected ? [selected].flat() : [vnet].filter(Boolean)),
    [selected, vnet]
  )
  const isAggregated = selectedVnets.length > 1

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(selectedVnets),
    [selectedVnets]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(selectedVnets),
    [selectedVnets]
  )

  const { color: stateColor, name: stateName } =
    getVirtualNetworkState(vnet) ?? {}
  const { percentOfUsed, percentLabel } = getLeasesInfo(vnet)
  const {
    INBOUND_AVG_BW,
    INBOUND_PEAK_BW,
    INBOUND_PEAK_KB,
    OUTBOUND_AVG_BW,
    OUTBOUND_PEAK_BW,
    OUTBOUND_PEAK_KB,
  } = vnet?.TEMPLATE ?? {}

  // Helpers
  const bandwidth = (value) => (value ? `${value} KBytes/s` : '-')
  const burst = (value) => (value ? `${value} KBytes` : '-')

  const getActions = (actions, supportedActions) =>
    Object.fromEntries(
      getActionsAvailable(actions)
        .filter((action) => !supportedActions || supportedActions[action])
        .map((action) => [action, true])
    )

  return (
    <Box className="mainContainer" sx={(theme) => getStyles({ theme })}>
      <Box className="permsInfoContainer">
        {informationPanel?.enabled && !isAggregated && (
          <Box className="detailsContainer">
            <DetailsCard
              title={T.Information}
              options={[
                [T.ID, vnet?.ID],
                [T.Name, vnet?.NAME],
                [
                  T.Driver,
                  vnet?.VN_MAD ? (
                    <Tag key="driver" title={vnet.VN_MAD} status="default" />
                  ) : (
                    '-'
                  ),
                ],
                [
                  T.State,
                  <StatusTag
                    key="state"
                    statusColor={stateColor}
                    statusName={stateName}
                  />,
                ],
                [T.ReservationParent, vnet?.PARENT_NETWORK_ID || '-'],
                [T.PhysicalDevice, vnet?.PHYDEV || '-'],
                [T.Bridge, vnet?.BRIDGE || '-'],
                [T.BridgeType, vnet?.BRIDGE_TYPE || '-'],
                [T.VlanId, vnet?.VLAN_ID || '-'],
                [
                  T.AutomaticVlanId,
                  booleanToString(stringToBoolean(vnet?.VLAN_ID_AUTOMATIC)),
                ],
                [T.OuterVlanId, vnet?.OUTER_VLAN_ID || '-'],
                [
                  T.AutomaticOuterVlanId,
                  booleanToString(
                    stringToBoolean(vnet?.OUTER_VLAN_ID_AUTOMATIC)
                  ),
                ],
                [
                  T.UsedLeases,
                  <ProgressBar
                    key="leases"
                    value={percentOfUsed}
                    label={percentLabel}
                    isLabelVisible
                    thresholds={[
                      VNET_THRESHOLD.LEASES.low,
                      VNET_THRESHOLD.LEASES.high,
                    ]}
                  />,
                ],
              ]}
            />
          </Box>
        )}
        <Box className="permissionsOwnershipContainer">
          {permissionsPanel?.enabled && (
            <PermissionsTab
              title={T.Permissions}
              actions={getActions(permissionsPanel?.actions)}
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
              isDisabled={isActionsDisabled || isLocked}
            />
          )}
          {ownershipPanel?.enabled && (
            <OwnershipTab
              title={T.Ownership}
              actions={getActions(ownershipPanel?.actions)}
              userId={aggregatedOwnership?.UID}
              userName={aggregatedOwnership?.UNAME}
              groupId={aggregatedOwnership?.GID}
              groupName={aggregatedOwnership?.GNAME}
              handleEdit={handleChangeOwnership}
              isDisabled={isActionsDisabled || isLocked}
            />
          )}
        </Box>
      </Box>
      {qosPanel?.enabled && !isAggregated && (
        <Box className="qosContainer">
          <DetailsCard
            title={T.Inbound}
            options={[
              [T.AverageBandwidth, bandwidth(INBOUND_AVG_BW)],
              [T.PeakBandwidth, bandwidth(INBOUND_PEAK_BW)],
              [T.PeakBurst, burst(INBOUND_PEAK_KB)],
            ]}
          />
          <DetailsCard
            title={T.Outbound}
            options={[
              [T.AverageBandwidth, bandwidth(OUTBOUND_AVG_BW)],
              [T.PeakBandwidth, bandwidth(OUTBOUND_PEAK_BW)],
              [T.PeakBurst, burst(OUTBOUND_PEAK_KB)],
            ]}
          />
        </Box>
      )}
      {attributesPanel?.enabled && !isAggregated && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={attributes}
            actions={getActions(attributesPanel?.actions, {
              [ACTIONS.COPY_ATTRIBUTE]: true,
              [ACTIONS.ADD_ATTRIBUTE]: true,
              [ACTIONS.DELETE_ATTRIBUTE]: true,
            })}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAddAttribute}
            isDisabled={isActionsDisabled || isLocked}
            isLoading={isLoadingVNet}
          />
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
