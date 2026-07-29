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
import { OwnershipTab, PermissionsTab } from '@ComponentsV2Module'
import { Stack } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { aggregateOwnership, aggregatePermissions } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Router aggregated info tab
 */
export const AggregatedInfo = ({ data, config }) => {
  const {
    selected,
    handleChangePermission,
    handleChangeOwnership,
    isActionsDisabled,
    isLocked,
  } = data || {}

  const {
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
  } = config || {}

  const selectedVRouters = useMemo(
    () => [].concat(selected).filter(Boolean),
    [selected]
  )

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(selectedVRouters),
    [selectedVRouters]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(selectedVRouters),
    [selectedVRouters]
  )

  return (
    <Stack key={'Aggregated-VRouter-Info-Tab'} sx={{ gap: '16px' }}>
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
          isDisabled={isLocked || isActionsDisabled}
        />
      )}
      {ownershipPanel?.enabled && (
        <OwnershipTab
          title={T.Ownership}
          actions={ownershipPanel?.actions}
          userId={aggregatedOwnership?.UID}
          userName={aggregatedOwnership?.UNAME}
          groupId={aggregatedOwnership?.GID}
          groupName={aggregatedOwnership?.GNAME}
          handleEdit={handleChangeOwnership}
          isDisabled={isLocked || isActionsDisabled}
        />
      )}
    </Stack>
  )
}

AggregatedInfo.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

AggregatedInfo.id = 'info'
AggregatedInfo.title = T.Info
