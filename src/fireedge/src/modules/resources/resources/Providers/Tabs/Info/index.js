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

import { DetailsCard, OwnershipTab, PermissionsTab } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { timeToString } from '@UtilsModule'
import { Box } from '@mui/material'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { getStyles } from '@modules/resources/resources/Providers/Tabs/Info/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Providers info tab
 */
export const Info = ({ data, config }) => {
  const {
    selected,
    handleChangePermission,
    handleChangeOwnership,
    isActionsDisabled,
  } = data || {}

  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
  } = config || {}

  const {
    ID,
    NAME,
    UID,
    UNAME,
    GID,
    GNAME,
    PERMISSIONS = {},
    TEMPLATE: {
      PROVIDER_BODY: { description, registration_time: registrationTime } = {},
    } = {},
  } = selected || {}

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {informationPanel?.enabled && (
        <Box className="detailsContainer">
          <DetailsCard
            title="Provider Details"
            options={[
              [T.ID, ID ?? '-'],
              [T.Name, NAME ?? '-'],
              [T.Description, description ?? '-'],
              [T.StartTime, timeToString(registrationTime)],
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
                ownerUse: +PERMISSIONS?.OWNER_U,
                ownerManage: +PERMISSIONS?.OWNER_M,
                ownerAdmin: +PERMISSIONS?.OWNER_A,
                groupUse: +PERMISSIONS?.GROUP_U,
                groupManage: +PERMISSIONS?.GROUP_M,
                groupAdmin: +PERMISSIONS?.GROUP_A,
                otherUse: +PERMISSIONS?.OTHER_U,
                otherManage: +PERMISSIONS?.OTHER_M,
                otherAdmin: +PERMISSIONS?.OTHER_A,
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
              userId={+UID}
              userName={UNAME}
              groupId={+GID}
              groupName={GNAME}
              handleEdit={handleChangeOwnership}
              isDisabled={isActionsDisabled}
              size="small"
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info
