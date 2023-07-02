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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useGetServiceQuery } from 'client/features/OneApi/service'
import { Permissions, Ownership } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Service/Info/information'
import { getActionsAvailable } from 'client/models/Helper'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const ServiceInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    permissions_panel: permissionsPanel,
    ownership_panel: ownershipPanel,
  } = tabProps

  const { data: service = {} } = useGetServiceQuery({ id })
  const { UNAME, UID, GNAME, GID, PERMISSIONS = {} } = service

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
          service={service}
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
        />
      )}
      {ownershipPanel?.enabled && (
        <Ownership
          actions={getActions(ownershipPanel?.actions)}
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
        />
      )}
    </Stack>
  )
}

ServiceInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ServiceInfoTab.displayName = 'ServiceInfoTab'

export default ServiceInfoTab
