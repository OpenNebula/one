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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback } from 'react'

import { ImageAPI } from '@FeaturesModule'
import {
  AttributePanel,
  Ownership,
  Permissions,
} from '@modules/components/Tabs/Common'
import Information from '@modules/components/Tabs/Image/Info/information'
import Serial from '@modules/components/Tabs/Image/Info/serial'

import { T } from '@ConstantsModule'
import { filterAttributes, getActionsAvailable, jsonToXml } from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import { cloneObject, set } from '@UtilsModule'

const HIDDEN_ATTRIBUTES_REG = /^(SERIAL)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Image id
 * @param {object} props.oneConfig - OpenNebula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @param {string} props.resource - Resource type
 * @returns {ReactElement} Information tab
 */
const ImageInfoTab = ({
  tabProps = {},
  id,
  oneConfig,
  adminGroup,
  resource,
}) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [changeOwnership] = ImageAPI.useChangeImageOwnershipMutation()
  const [changePermissions] = ImageAPI.useChangeImagePermissionsMutation()
  const [update] = ImageAPI.useUpdateImageMutation()
  const { data: image } = ImageAPI.useGetImageQuery({ id })

  const { UNAME, UID, GNAME, GID, PERMISSIONS, TEMPLATE } = image

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id, ...newOwnership })
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id, ...newPermission })
  }

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await update({ id, template: xml, replace: 0 })
  }

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions),
    [getActionsAvailable]
  )

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

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
          image={image}
          actions={getActions(informationPanel?.actions)}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
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
      {resource === 'image' && (
        <Serial {...ATTRIBUTE_FUNCTION} value={TEMPLATE?.SERIAL} />
      )}
      {attributesPanel?.enabled && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          filtersSpecialAttributes={false}
          title={Tr(T.Attributes)}
        />
      )}
    </Stack>
  )
}

ImageInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  resource: PropTypes.string,
}

ImageInfoTab.displayName = 'ImageInfoTab'

export default ImageInfoTab
