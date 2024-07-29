/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import {
  useGetServiceTemplateQuery,
  useChangeServiceTemplatePermissionsMutation,
  useChangeServiceTemplateOwnershipMutation,
} from 'client/features/OneApi/serviceTemplate'
import { Permissions, Ownership } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/ServiceTemplate/Info/information'
import { getActionsAvailable, permissionsToOctal } from 'client/models/Helper'
import { toSnakeCase } from 'client/utils'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const ServiceTemplateInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
  } = tabProps

  const [changePermissions] = useChangeServiceTemplatePermissionsMutation()
  const [changeOwnership] = useChangeServiceTemplateOwnershipMutation()
  const { data: template = {} } = useGetServiceTemplateQuery({ id })
  const { UNAME, UID, GNAME, GID, PERMISSIONS = {} } = template

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
          template={template}
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

ServiceTemplateInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ServiceTemplateInfoTab.displayName = 'ServiceTemplateInfoTab'

export default ServiceTemplateInfoTab
