/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext } from 'react'
import PropTypes from 'prop-types'

import { useMarketplaceAppApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import {
  Permissions,
  Ownership,
  AttributePanel,
} from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/MarketplaceApp/Info/information'

import { Tr } from 'client/components/HOC'
import {
  getActionsAvailable,
  filterAttributes,
  jsonToXml,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'
import { T } from 'client/constants'

const HIDDEN_ATTRIBUTES_REG = /^(VMTEMPLATE64|APPTEMPLATE64)$/

const MarketplaceAppInfoTab = ({ tabProps = {} }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const { rename, changeOwnership, changePermissions, updateTemplate } =
    useMarketplaceAppApi()
  const { handleRefetch, data: marketplaceApp = {} } = useContext(TabContext)
  const { ID, UNAME, UID, GNAME, GID, PERMISSIONS, TEMPLATE } = marketplaceApp

  const handleChangeOwnership = async (newOwnership) => {
    const response = await changeOwnership(ID, newOwnership)
    String(response) === String(ID) && (await handleRefetch?.())
  }

  const handleChangePermission = async (newPermission) => {
    const response = await changePermissions(ID, newPermission)
    String(response) === String(ID) && (await handleRefetch?.())
  }

  const handleRename = async (_, newName) => {
    const response = await rename(ID, newName)
    String(response) === String(ID) && (await handleRefetch?.())
  }

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)

    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)

    // 0: Replace the whole template
    const response = await updateTemplate(ID, xml, 0)
    String(response) === String(ID) && (await handleRefetch?.())
  }

  const getActions = (actions) => getActionsAvailable(actions)

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  return (
    <div
      style={{
        display: 'grid',
        gap: '1em',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        padding: '0.8em',
      }}
    >
      {informationPanel?.enabled && (
        <Information
          actions={getActions(informationPanel?.actions)}
          handleRename={handleRename}
          marketplaceApp={marketplaceApp}
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
      {ownershipPanel?.enabled && (
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
    </div>
  )
}

MarketplaceAppInfoTab.propTypes = {
  tabProps: PropTypes.object,
}

MarketplaceAppInfoTab.displayName = 'MarketplaceAppInfoTab'

export default MarketplaceAppInfoTab
