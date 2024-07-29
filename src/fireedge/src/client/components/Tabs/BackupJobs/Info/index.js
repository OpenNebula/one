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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { Tr } from 'client/components/HOC'
import Information from 'client/components/Tabs/BackupJobs/Info/information'
import {
  AttributePanel,
  Ownership,
  Permissions,
} from 'client/components/Tabs/Common'
import { T } from 'client/constants'
import {
  useChangeBackupJobOwnershipMutation,
  useChangeBackupJobPermissionsMutation,
  useGetBackupJobQuery,
  useUpdateBackupJobMutation,
} from 'client/features/OneApi/backupjobs'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_BACKUPJOBS_REG = /^(SCHED_ACTION|ERROR)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const BackupJobInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const { data: backupjob = {} } = useGetBackupJobQuery({ id })
  const { UNAME, UID, GNAME, GID, PERMISSIONS, TEMPLATE } = backupjob
  const [changeOwnership] = useChangeBackupJobOwnershipMutation()
  const [changePermissions] = useChangeBackupJobPermissionsMutation()
  const [update] = useUpdateBackupJobMutation()

  const getActions = (actions) => getActionsAvailable(actions)

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_BACKUPJOBS_REG,
  })

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id, ...newPermission })
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id, ...newOwnership })
  }

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await update({ id, template: xml, replace: 0 })
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
          backupjob={backupjob}
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

BackupJobInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

BackupJobInfoTab.displayName = 'BackupJobInfoTab'

export default BackupJobInfoTab
