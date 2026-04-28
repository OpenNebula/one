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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback } from 'react'

import { OneKsAPI } from '@FeaturesModule'
import Information from '@modules/components/Tabs/OneKs/Info/information'
import { Ownership, Permissions } from '@modules/components/Tabs/Common'
import { getActionsAvailable, permissionsToOctal } from '@ModelsModule'
import { toSnakeCase } from '@UtilsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Information tab
 */
const OneKsInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
  } = tabProps

  const { data: cluster = {} } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })
  const { DOCUMENT } = cluster

  const [changePermissions] =
    OneKsAPI.useChangeOneKsClusterPermissionsMutation()
  const [changeOwnership] = OneKsAPI.useChangeOneKsClusterOwnershipMutation()

  const handleChangePermission = async (newPermission) => {
    const [key, value] = Object.entries(newPermission)[0]
    // transform key to snake case concatenated by the first letter of permission type
    // example: 'OWNER_ADMIN' -> 'OWNER_A'
    const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
    const fullPermissionName = `${member}_${permission[0]}`
    const newPermissions = {
      ...DOCUMENT.PERMISSIONS,
      [fullPermissionName]: value,
    }
    const octet = permissionsToOctal(newPermissions)

    await changePermissions({ id, octet })
  }
  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id, ...newOwnership })
  }

  const { data } = OneKsAPI.useGetEndpointQuery({ id }) || {}
  const endpoint = data?.endpoint ?? ''

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions),
    [getActionsAvailable]
  )

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && (
        <Information
          cluster={DOCUMENT}
          endpoint={endpoint}
          actions={getActions(informationPanel?.actions)}
        />
      )}
      {permissionsPanel?.enabled && (
        <Permissions
          actions={getActions(permissionsPanel?.actions)}
          handleEdit={handleChangePermission}
          ownerUse={DOCUMENT.PERMISSIONS.OWNER_U}
          ownerManage={DOCUMENT.PERMISSIONS.OWNER_M}
          ownerAdmin={DOCUMENT.PERMISSIONS.OWNER_A}
          groupUse={DOCUMENT.PERMISSIONS.GROUP_U}
          groupManage={DOCUMENT.PERMISSIONS.GROUP_M}
          groupAdmin={DOCUMENT.PERMISSIONS.GROUP_A}
          otherUse={DOCUMENT.PERMISSIONS.OTHER_U}
          otherManage={DOCUMENT.PERMISSIONS.OTHER_M}
          otherAdmin={DOCUMENT.PERMISSIONS.OTHER_A}
        />
      )}
      {ownershipPanel?.enabled && (
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          handleEdit={handleChangeOwnership}
          userId={DOCUMENT.UID}
          userName={DOCUMENT.UNAME}
          groupId={DOCUMENT.GID}
          groupName={DOCUMENT.GNAME}
        />
      )}
    </Stack>
  )
}

OneKsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

OneKsInfoTab.displayName = 'OneKsInfoTab'

export default OneKsInfoTab
