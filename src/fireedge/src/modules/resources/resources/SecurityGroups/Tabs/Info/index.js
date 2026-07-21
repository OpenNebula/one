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

import { T } from '@ConstantsModule'
import {
  DetailsCard,
  AttributesPanel,
  PermissionsTab,
  OwnershipTab,
} from '@ComponentsV2Module'
import { RulesSecGroups } from '@modules/resources/resources/SecurityGroups/RulesSecGroups'
import { getStyles } from '@modules/resources/resources/SecurityGroups/Tabs/Info/styles'
import { aggregatePermissions, aggregateOwnership } from '@UtilsModule'

import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { isPlainObject } from 'lodash'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - SecGroup info tab
 */
export const Info = ({ data, config }) => {
  const {
    selected,
    secGroupAttributes,
    isLoadingExtended,
    handleChangePermission,
    handleChangeOwnership,
    handleDeleteAttribute,
    handleAddAttribute,
    isActionsDisabled,
  } = data ?? {}

  const {
    attributes_panel: attributesPanel,
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
    rules_panel: rulesPanel,
  } = config || {}

  const aggregatedSelected = [].concat(selected)

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(aggregatedSelected),
    [aggregatedSelected]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(aggregatedSelected),
    [aggregatedSelected]
  )

  const isInformationPanelEnabled =
    informationPanel?.enabled &&
    (isPlainObject(selected) ||
      (Array.isArray(selected) && selected.length === 1))

  const isAttributesPanelEnabled =
    attributesPanel?.enabled &&
    (isPlainObject(selected) ||
      (Array.isArray(selected) && selected.length === 1))

  const isRulesPanelEnabled =
    rulesPanel?.enabled &&
    (isPlainObject(selected) ||
      (Array.isArray(selected) && selected.length === 1))

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="topContainer">
        {isInformationPanelEnabled && (
          <Box className="detailsContainer">
            <DetailsCard
              title={T.SecurityGroupDetails}
              options={[
                [T.ID, selected?.ID],
                [T.Name, selected?.NAME],
              ]}
            />
          </Box>
        )}
        <Box className="permissionsOwnershipContainer">
          {permissionsPanel?.enabled && (
            <Box className="permissionsContainer">
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
                isDisabled={isActionsDisabled}
              />
            </Box>
          )}
          {ownershipPanel?.enabled && (
            <Box className="ownershipContainer">
              <OwnershipTab
                title={T.Ownership}
                actions={ownershipPanel?.actions}
                userId={+aggregatedOwnership?.UID}
                userName={aggregatedOwnership?.UNAME}
                groupId={+aggregatedOwnership?.GID}
                groupName={aggregatedOwnership?.GNAME}
                handleEdit={handleChangeOwnership}
                isDisabled={isActionsDisabled}
                size="small"
              />
            </Box>
          )}
        </Box>
      </Box>
      {isRulesPanelEnabled && (
        <Box className="rulesContainer">
          <RulesSecGroups
            title={T.SecurityGroup}
            rules={
              Array.isArray(selected?.TEMPLATE?.RULE)
                ? selected?.TEMPLATE?.RULE
                : [selected?.TEMPLATE?.RULE]
            }
          />
        </Box>
      )}
      {isAttributesPanelEnabled && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={secGroupAttributes}
            actions={attributesPanel?.actions}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAddAttribute}
            isLoading={isLoadingExtended}
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
