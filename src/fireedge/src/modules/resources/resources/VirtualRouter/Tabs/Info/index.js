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
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { ACTIONS, T } from '@ConstantsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  getActionsAvailable,
} from '@UtilsModule'
import {
  getVirtualRouterTotalNics,
  getVirtualRouterTotalVms,
} from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/VirtualRouter/Tabs/Info/styles'

const toActionObject = (actions, supportedActions) =>
  Object.fromEntries(
    getActionsAvailable(actions)
      .filter((action) => !supportedActions || supportedActions[action])
      .map((action) => [action, true])
  )

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Router info tab
 */
export const Info = ({ data, config }) => {
  const {
    vrouter = {},
    selected,
    handleChangePermission,
    handleChangeOwnership,
    handleDeleteAttribute,
    handleEditAttribute,
    handleAddAttribute,
    isLoadingVRouter,
    isActionsDisabled,
    isLocked,
  } = data || {}

  const {
    attributes_panel: attributesPanel,
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
  } = config || {}

  const selectedVRouters = useMemo(
    () => (selected ? [selected].flat() : [vrouter].filter(Boolean)),
    [selected, vrouter]
  )
  const isAggregated = selectedVRouters.length > 1

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(selectedVRouters),
    [selectedVRouters]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(selectedVRouters),
    [selectedVRouters]
  )

  const permissionsActions = toActionObject(permissionsPanel?.actions)
  const ownershipActions = toActionObject(ownershipPanel?.actions)
  const attributeActions = toActionObject(attributesPanel?.actions, {
    [ACTIONS.COPY_ATTRIBUTE]: true,
    [ACTIONS.ADD_ATTRIBUTE]: true,
    [ACTIONS.EDIT_ATTRIBUTE]: true,
    [ACTIONS.DELETE_ATTRIBUTE]: true,
  })

  const permissionsOwnershipPanels = (
    <Box className="permissionsOwnershipContainer">
      {permissionsPanel?.enabled && (
        <PermissionsTab
          title={T.Permissions}
          actions={permissionsActions}
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
          actions={ownershipActions}
          userId={aggregatedOwnership?.UID}
          userName={aggregatedOwnership?.UNAME}
          groupId={aggregatedOwnership?.GID}
          groupName={aggregatedOwnership?.GNAME}
          handleEdit={handleChangeOwnership}
          isDisabled={isActionsDisabled || isLocked}
        />
      )}
    </Box>
  )

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {isAggregated ? (
        permissionsOwnershipPanels
      ) : (
        <Box className="topContainer">
          {informationPanel?.enabled && (
            <Box className="detailsContainer">
              <DetailsCard
                title={T.Information}
                options={[
                  [T.ID, vrouter?.ID],
                  [T.Name, vrouter?.NAME],
                  [T.TemplateID, vrouter?.TEMPLATE?.TEMPLATE_ID],
                  [T.TotalVms, getVirtualRouterTotalVms(vrouter)],
                  [T.NIC, getVirtualRouterTotalNics(vrouter)],
                ]}
              />
            </Box>
          )}
          {permissionsOwnershipPanels}
        </Box>
      )}
      {attributesPanel?.enabled && !isAggregated && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={vrouter?.TEMPLATE ?? {}}
            actions={attributeActions}
            handleDelete={handleDeleteAttribute}
            handleEdit={handleEditAttribute}
            handleAdd={handleAddAttribute}
            isDisabled={isActionsDisabled || isLocked}
            isLoading={isLoadingVRouter}
            isFullHeight={false}
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
