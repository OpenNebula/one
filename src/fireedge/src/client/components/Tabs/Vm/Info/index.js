/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { Permissions, Ownership } from 'client/components/Tabs/Common'
import { TabContext } from 'client/components/Tabs/TabProvider'
import Information from 'client/components/Tabs/Vm/Info/information'

const VmInfoTab = ({ tabProps }) => {
  const { changeOwnership, changePermissions } = useVmApi()
  const { handleRefetch, data } = React.useContext(TabContext)
  const { ID, UNAME, UID, GNAME, GID, PERMISSIONS } = data

  const handleChangeOwnership = async newOwnership => {
    const response = await changeOwnership(ID, newOwnership)

    String(response) === String(ID) && await handleRefetch?.()
  }

  const handleChangePermission = async newPermission => {
    const response = await changePermissions(ID, newPermission)

    String(response) === String(ID) && await handleRefetch?.()
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      padding: '0.8em'
    }}>
      {tabProps?.information_panel?.enabled &&
        <Information {...data} />
      }
      {tabProps?.permissions_panel?.enabled &&
        <Permissions
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
      }
      {tabProps?.ownership_panel?.enabled &&
        <Ownership
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
          handleEdit={handleChangeOwnership}
        />
      }
    </div>
  )
}

VmInfoTab.propTypes = {
  tabProps: PropTypes.object
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
