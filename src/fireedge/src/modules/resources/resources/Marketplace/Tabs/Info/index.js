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
import { ACTIONS, MARKET_THRESHOLD, T } from '@ConstantsModule'
import { getMarketplaceCapacityInfo, getMarketplaceState } from '@ModelsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  getActionsAvailable,
} from '@UtilsModule'
import { getStyles } from '@modules/resources/resources/Marketplace/Tabs/Info/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Marketplace info tab
 */
export const Info = ({ data, config }) => {
  const {
    marketplace = {},
    selected,
    attributes = [],
    handleChangePermission,
    handleChangeOwnership,
    handleDeleteAttribute,
    handleAddAttribute,
    isLoadingMarketplace,
    isActionsDisabled,
  } = data || {}

  const {
    attributes_panel: attributesPanel,
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
  } = config || {}

  const { color: stateColor, name: stateName } =
    getMarketplaceState(marketplace) ?? {}
  const { percentOfUsed, percentLabel } =
    getMarketplaceCapacityInfo(marketplace)
  const apps = [marketplace?.MARKETPLACEAPPS?.ID ?? []].flat().length || 0
  const selectedMarketplaces = useMemo(
    () => (selected ? [selected].flat() : [marketplace].filter(Boolean)),
    [selected, marketplace]
  )
  const isAggregated = selectedMarketplaces.length > 1

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(selectedMarketplaces),
    [selectedMarketplaces]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(selectedMarketplaces),
    [selectedMarketplaces]
  )

  const getActions = (actions, supportedActions) =>
    Object.fromEntries(
      getActionsAvailable(actions)
        .filter((action) => !supportedActions || supportedActions[action])
        .map((action) => [action, true])
    )

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="permsInfoContainer">
        {informationPanel?.enabled && !isAggregated && (
          <Box className="detailsContainer">
            <DetailsCard
              title={T.Information}
              options={[
                [T.ID, marketplace?.ID],
                [T.Name, marketplace?.NAME],
                [
                  T.Driver,
                  <Tag
                    key="driver"
                    title={marketplace?.MARKET_MAD}
                    status="default"
                  />,
                ],
                [
                  T.State,
                  <StatusTag
                    key="state"
                    statusColor={stateColor}
                    statusName={stateName}
                  />,
                ],
                [T.Zone, marketplace?.ZONE_ID],
                [T.Apps, apps],
                [
                  T.Capacity,
                  <ProgressBar
                    key="capacity"
                    value={percentOfUsed}
                    label={percentLabel}
                    isLabelVisible
                    thresholds={[
                      MARKET_THRESHOLD.CAPACITY.low,
                      MARKET_THRESHOLD.CAPACITY.high,
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
              isDisabled={isActionsDisabled}
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
              isDisabled={isActionsDisabled}
            />
          )}
        </Box>
      </Box>
      {attributesPanel?.enabled && !isAggregated && (
        <Box className="attributesTablePanelContainer">
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
            isDisabled={isActionsDisabled}
            isLoading={isLoadingMarketplace}
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
