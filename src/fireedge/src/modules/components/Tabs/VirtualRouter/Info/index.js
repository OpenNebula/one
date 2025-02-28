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

import { VrAPI } from '@FeaturesModule'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import {
  Permissions,
  Ownership,
  AttributePanel,
} from '@modules/components/Tabs/Common'
import Information from '@modules/components/Tabs/VirtualRouter/Info/information'
import { getActionsAvailable, jsonToXml } from '@ModelsModule'
import { cloneObject, set } from '@UtilsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const VRouterInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [changePermissions] = VrAPI.useChangeVrPermissionsMutation()
  const [changeOwnership] = VrAPI.useChangeVrOwnershipMutation()
  const [updateVRouterTemplate] = VrAPI.useUpdateVrMutation()

  const { data: vroutertemplate = {} } = VrAPI.useGetVrQuery({ id })
  const { UNAME, UID, GNAME, GID, TEMPLATE, PERMISSIONS = {} } = vroutertemplate

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({
      id,
      ...(newOwnership?.group
        ? { groupId: newOwnership.group }
        : { userId: newOwnership.user }),
    })
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id, ...newPermission })
  }

  const getActions = (actions) => getActionsAvailable(actions)

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)

    await updateVRouterTemplate({ id, template: xml, update: 0 })
  }

  const ATTRIBUTE_FUNCTION = {
    handleAdd: handleAttributeInXml,
    handleEdit: handleAttributeInXml,
    handleDelete: handleAttributeInXml,
  }

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
          template={vroutertemplate}
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
      {attributesPanel?.enabled && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          collapse
          attributes={TEMPLATE || {}}
          actions={getActions(attributesPanel?.actions)}
          title={`${Tr(T.Attributes)}`}
        />
      )}
    </Stack>
  )
}

VRouterInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VRouterInfoTab.displayName = 'VRouterInfoTab'

export default VRouterInfoTab
