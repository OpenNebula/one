/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import {
  useGetMarketplaceAppQuery,
  useChangeAppOwnershipMutation,
  useChangeAppPermissionsMutation,
  useUpdateAppMutation,
} from 'client/features/OneApi/marketplaceApp'
import {
  Permissions,
  Ownership,
  AttributePanel,
} from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/MarketplaceApp/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  getActionsAvailable,
  filterAttributes,
  jsonToXml,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_ATTRIBUTES_REG = /^(VMTEMPLATE64|APPTEMPLATE64)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Marketplace App id
 * @returns {ReactElement} Information tab
 */
const MarketplaceAppInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [changeOwnership] = useChangeAppOwnershipMutation()
  const [changePermissions] = useChangeAppPermissionsMutation()
  const [updateTemplate] = useUpdateAppMutation()
  const { data: app = {} } = useGetMarketplaceAppQuery({ id })
  const { UNAME, UID, GNAME, GID, PERMISSIONS, MARKETPLACE_ID, TEMPLATE } = app
  const isPublic = (MARKETID) => MARKETID === 0

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
    await updateTemplate({ id, template: xml, replace: 0 })
  }

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions),
    [getActionsAvailable]
  )

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && (
        <Information
          app={app}
          actions={getActions(informationPanel?.actions)}
        />
      )}
      {permissionsPanel?.enabled && (
        <Permissions
          actions={getActions(permissionsPanel?.actions)}
          ownerUse={PERMISSIONS.OWNER_U}
          ownerManage={PERMISSIONS.OWNER_M}
          ownerAdmin={PERMISSIONS.OWNER_A}
          groupUse={PERMISSIONS.GROUP_U}
          groupManage={PERMISSIONS.GROUP_M}
          groupAdmin={PERMISSIONS.GROUP_A}
          otherUse={PERMISSIONS.OTHER_U}
          otherManage={PERMISSIONS.OTHER_M}
          otherAdmin={PERMISSIONS.OTHER_A}
          handleEdit={handleChangePermission}
        />
      )}
      {ownershipPanel?.enabled && !isPublic(MARKETPLACE_ID) && (
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
          handleEdit={handleChangeOwnership}
        />
      )}
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
          handleAdd={handleAttributeInXml}
          handleEdit={handleAttributeInXml}
          handleDelete={handleAttributeInXml}
        />
      )}
    </Stack>
  )
}

MarketplaceAppInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

MarketplaceAppInfoTab.displayName = 'MarketplaceAppInfoTab'

export default MarketplaceAppInfoTab
