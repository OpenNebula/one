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
import { ReactElement, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import {
  useGetSecGroupQuery,
  useChangeSecGroupOwnershipMutation,
  useChangeSecGroupPermissionsMutation,
  useUpdateSecGroupMutation,
} from 'client/features/OneApi/securityGroup'
import {
  Permissions,
  Ownership,
  AttributePanel,
  RulesSecGroupsTable,
} from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/SecurityGroup/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  getActionsAvailable,
  jsonToXml,
  filterAttributes,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_ATTRIBUTES = /^(RULE)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Image id
 * @returns {ReactElement} Information tab
 */
const SecurityGroupInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
    rules_panel: rulesPanel,
  } = tabProps

  const [changeOwnership] = useChangeSecGroupOwnershipMutation()
  const [changePermissions] = useChangeSecGroupPermissionsMutation()
  const [update] = useUpdateSecGroupMutation()
  const { data: securityGroup } = useGetSecGroupQuery({ id })

  const { UNAME, UID, GNAME, GID, PERMISSIONS, TEMPLATE } = securityGroup

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES,
  })

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
          securityGroup={securityGroup}
          actions={getActions(informationPanel?.actions)}
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
      {rulesPanel?.enabled && (
        <RulesSecGroupsTable
          title={Tr(T.SecurityGroup)}
          rules={
            Array.isArray(TEMPLATE?.RULE) ? TEMPLATE?.RULE : [TEMPLATE?.RULE]
          }
        />
      )}
      {attributesPanel?.enabled && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
        />
      )}
    </Stack>
  )
}

SecurityGroupInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

SecurityGroupInfoTab.displayName = 'ImageInfoTab'

export default SecurityGroupInfoTab
