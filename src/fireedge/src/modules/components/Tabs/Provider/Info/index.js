/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { ProviderAPI } from '@FeaturesModule'
import { Permissions, Ownership } from '@modules/components/Tabs/Common'
import Information from '@modules/components/Tabs/Provider/Info/information'
import { getActionsAvailable, permissionsToOctal } from '@ModelsModule'
import { toSnakeCase } from '@UtilsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const ProviderInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
  } = tabProps

  const [changePermissions] = ProviderAPI.useChangeProviderPermissionsMutation()
  const [changeOwnership] = ProviderAPI.useChangeProviderOwnershipMutation()
  const { data: provider = {} } = ProviderAPI.useGetProviderQuery({ id })
  const { UNAME, UID, GNAME, GID, PERMISSIONS = {} } = provider

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id, ...newOwnership })
  }

  const handleChangePermission = async (newPermission) => {
    const [key, value] = Object.entries(newPermission)[0]

    // transform key to snake case concatenated by the first letter of permission type
    // example: 'OWNER_ADMIN' -> 'OWNER_A'
    const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
    const fullPermissionName = `${member}_${permission[0]}`

    const newPermissions = { ...PERMISSIONS, [fullPermissionName]: value }
    const octet = permissionsToOctal(newPermissions)

    await changePermissions({ id, octet })
  }

  const getActions = (actions) => getActionsAvailable(actions)

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && (
        <Information
          actions={getActions(informationPanel?.actions)}
          provider={provider}
        />
      )}
      {permissionsPanel?.enabled && (
        <Permissions
          actions={getActions(permissionsPanel?.actions)}
          handleEdit={handleChangePermission}
          ownerUse={PERMISSIONS.OWNER_U}
          ownerManage={PERMISSIONS.OWNER_M}
          ownerAdmin={PERMISSIONS.OWNER_A}
          groupUse={PERMISSIONS.GROUP_U}
          groupManage={PERMISSIONS.GROUP_M}
          groupAdmin={PERMISSIONS.GROUP_A}
          otherUse={PERMISSIONS.OTHER_U}
          otherManage={PERMISSIONS.OTHER_M}
          otherAdmin={PERMISSIONS.OTHER_A}
        />
      )}
      {ownershipPanel?.enabled && (
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          handleEdit={handleChangeOwnership}
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
        />
      )}
    </Stack>
  )
}

ProviderInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ProviderInfoTab.displayName = 'ProviderInfoTab'

export default ProviderInfoTab
